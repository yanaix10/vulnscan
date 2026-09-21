import asyncio
from datetime import datetime, timezone
import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.core.crawler import Crawler, DiscoveredPage
from app.core.session_manager import AuthConfig, AuthSessionManager
from app.checks import ALL_CHECKS, Finding as CheckFinding, ScanCheck
from app.models.scan import Scan
from app.models.finding import Finding
from app.models.target import Target

logger = logging.getLogger("vulnscan.scan_engine")


class ScanEngine:
    """
    Orchestrates the crawling, concurrent check execution, and live storage of findings.
    """

    def __init__(
        self,
        target_url: str,
        db_session: Session,
        use_spa: bool = False,
        max_depth: int = 3,
        max_pages: int = 50,
        rate_limit: float = 5.0,
        auth_config: Optional[AuthConfig] = None,
    ):
        self.target_url = target_url
        self.db = db_session
        self.use_spa = use_spa
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.rate_limit = rate_limit
        self.auth_config = auth_config
        self.checks: list[ScanCheck] = [check_cls() for check_cls in ALL_CHECKS]

    async def run(self, scan_id: int) -> None:
        """Executes full scan lifecycle against an authorized target."""
        logger.info(f"ScanEngine starting scan {scan_id} on {self.target_url}")

        scan_record = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan_record:
            logger.error(f"Scan {scan_id} not found in database.")
            return

        # 1. Scope Verification: Ensure target URL is on the allowlist
        validator = ScopeValidator(
            allowed_hosts=[self.target_url],
            rate_limit_per_sec=self.rate_limit,
        )

        if not validator.is_allowed(self.target_url):
            logger.warning(f"Target URL '{self.target_url}' is not in allowed scope.")
            scan_record.status = "failed"
            scan_record.finished_at = datetime.now(timezone.utc)
            self.db.commit()
            return

        scan_record.status = "running"
        self.db.commit()

        try:
            custom_headers = {}
            if self.auth_config:
                if self.auth_config.bearer_token:
                    t = self.auth_config.bearer_token.strip()
                    if not t.lower().startswith("bearer "):
                        t = f"Bearer {t}"
                    custom_headers["Authorization"] = t
                if self.auth_config.session_cookie:
                    custom_headers["Cookie"] = self.auth_config.session_cookie

            async with ScopedHttpClient(scope=validator, custom_headers=custom_headers) as client:
                # Pre-flight reachability probe
                try:
                    await client.get(self.target_url)
                except Exception as probe_err:
                    logger.error(f"Target reachability probe failed for {self.target_url}: {probe_err}")
                    scan_record = self.db.query(Scan).filter(Scan.id == scan_id).first()
                    if scan_record:
                        scan_record.status = "failed"
                        scan_record.finished_at = datetime.now(timezone.utc)
                        self.db.commit()
                    return

                # Apply full login flow (cookies/form/bearer)
                if self.auth_config:
                    auth_manager = AuthSessionManager(self.auth_config, client)
                    await auth_manager.login()

                # 2. Crawl the authorized target
                crawler = Crawler(
                    client=client,
                    max_depth=self.max_depth,
                    max_pages=self.max_pages,
                    respect_robots=False,
                    use_spa=self.use_spa,
                )
                pages = await crawler.crawl(self.target_url)

                if not pages:
                    logger.warning(f"No reachable pages discovered on target: {self.target_url}")
                    scan_record = self.db.query(Scan).filter(Scan.id == scan_id).first()
                    if scan_record:
                        scan_record.status = "failed"
                        scan_record.finished_at = datetime.now(timezone.utc)
                        self.db.commit()
                    return

                # Update live page count in DB
                scan_record = self.db.query(Scan).filter(Scan.id == scan_id).first()
                if scan_record:
                    scan_record.pages_crawled = len(pages)
                    self.db.commit()

                # 3. Execute Checks Concurrently and write findings live
                seen_findings: set[tuple[str, str, Optional[str]]] = set()

                async def _run_single_check(check: ScanCheck, page: DiscoveredPage):
                    try:
                        results = await check.run(page, client)
                        if results:
                            for f in results:
                                key = (f.check_id, f.url, f.parameter)
                                if key not in seen_findings:
                                    seen_findings.add(key)
                                    db_finding = Finding(
                                        scan_id=scan_id,
                                        check_id=f.check_id,
                                        url=f.url,
                                        parameter=f.parameter,
                                        severity=f.severity,
                                        evidence=f.evidence,
                                        remediation=f.remediation,
                                    )
                                    self.db.add(db_finding)
                                    self.db.commit()
                    except Exception as err:
                        logger.error(f"Check {check.id} failed on {page.url}: {err}")

                tasks = []
                for page in pages:
                    for check in self.checks:
                        if check.applies_to(page):
                            tasks.append(_run_single_check(check, page))

                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)

                # 4. Mark scan completed
                scan_record = self.db.query(Scan).filter(Scan.id == scan_id).first()
                if scan_record:
                    scan_record.status = "completed"
                    scan_record.finished_at = datetime.now(timezone.utc)
                    self.db.commit()
                    logger.info(f"ScanEngine completed scan {scan_id} successfully.")

        except Exception as e:
            logger.error(f"Critical error executing scan {scan_id}: {e}")
            scan_record = self.db.query(Scan).filter(Scan.id == scan_id).first()
            if scan_record:
                scan_record.status = "failed"
                scan_record.finished_at = datetime.now(timezone.utc)
                self.db.commit()