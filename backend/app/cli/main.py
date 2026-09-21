import asyncio
import click
from datetime import datetime, timezone
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.tree import Tree

from app.database import SessionLocal, Base, engine
from app.models.target import Target
from app.models.scan import Scan
from app.models.finding import Finding
from app.core.scope_validator import ScopeValidator, ScopedHttpClient, OutOfScopeError
from app.core.crawler import Crawler
from app.core.scan_engine import ScanEngine
from app.reports.generator import ReportGenerator

console = Console()


def init_db():
    Base.metadata.create_all(bind=engine)


@click.group()
def cli():
    """VulnScan - Modular DAST Security Scanner (OWASP Top 10:2025)"""
    init_db()


@cli.command("add-target")
@click.argument("base_url")
@click.option("--notes", "-n", default="", help="Description or notes for this target.")
def add_target(base_url: str, notes: str):
    """Registers an authorized target in the database."""
    db = SessionLocal()
    try:
        existing = db.query(Target).filter(Target.base_url == base_url).first()
        if existing:
            if notes:
                existing.notes = notes
                db.commit()
            console.print(f"[bold yellow]Target already registered with ID {existing.id}:[/bold yellow] {existing.base_url}")
            return existing.id

        new_target = Target(base_url=base_url, notes=notes)
        db.add(new_target)
        db.commit()
        db.refresh(new_target)
        console.print(f"[bold green]Added target with ID {new_target.id}:[/bold green] {new_target.base_url}")
        return new_target.id
    finally:
        db.close()


@cli.command("check-scope")
@click.option("--allowed", "-a", multiple=True, required=True, help="Allowed host/domain.")
@click.option("--target", "-t", required=True, help="URL to test scope against.")
@click.option("--subdomains/--no-subdomains", default=False, help="Allow subdomains.")
def check_scope(allowed: tuple[str, ...], target: str, subdomains: bool):
    """Verifies whether a target URL is permitted by the Scope Validator."""
    validator = ScopeValidator(allowed_hosts=list(allowed), allow_subdomains=subdomains)
    is_allowed = validator.is_in_scope(target)

    status_style = "bold green" if is_allowed else "bold red"
    status_text = "PERMITTED (In Scope)" if is_allowed else "REJECTED (Out of Scope)"

    table = Table(title="Scope Evaluation Result", show_header=True)
    table.add_column("Target URL", style="cyan")
    table.add_column("Allowed Domains", style="magenta")
    table.add_column("Subdomains Enabled", style="yellow")
    table.add_column("Status", style=status_style)

    table.add_row(target, ", ".join(allowed), str(subdomains), status_text)
    console.print(table)


@cli.command("probe")
@click.option("--allowed", "-a", multiple=True, required=True, help="Allowed host/domain.")
@click.option("--url", "-u", required=True, help="Target URL to fetch.")
@click.option("--rate-limit", "-r", default=5.0, help="Requests per second.")
def probe(allowed: tuple[str, ...], url: str, rate_limit: float):
    """Safely dispatches a single GET request through ScopedHttpClient."""
    validator = ScopeValidator(allowed_hosts=list(allowed), rate_limit_per_sec=rate_limit)

    async def _execute():
        async with ScopedHttpClient(scope=validator) as client:
            try:
                response = await client.get(url)
                console.print(
                    Panel(
                        f"[bold green]Success[/bold green]\n"
                        f"URL: {url}\n"
                        f"Status Code: {response.status_code}\n"
                        f"Server: {response.headers.get('server', 'N/A')}",
                        title="Scoped Request Dispatched",
                        border_style="green",
                    )
                )
            except OutOfScopeError as e:
                console.print(
                    Panel(
                        f"[bold red]Scope Violation Prevented[/bold red]\n{str(e)}",
                        title="Blocked by ScopeValidator",
                        border_style="red",
                    )
                )
            except Exception as e:
                console.print(f"[bold yellow]Request failed due to network error:[/bold yellow] {e}")

    asyncio.run(_execute())


@cli.command("crawl")
@click.option("--target", "-t", required=True, help="Seed URL to start crawling.")
@click.option("--allowed", "-a", multiple=True, help="Allowed hosts (defaults to target host).")
@click.option("--max-depth", "-d", default=2, help="Maximum crawl depth.")
@click.option("--max-pages", "-p", default=20, help="Maximum pages to crawl.")
@click.option("--rate-limit", "-r", default=5.0, help="Requests per second limit.")
@click.option("--ignore-robots", is_flag=True, default=False, help="Bypass robots.txt checks.")
@click.option("--spa", is_flag=True, default=False, help="Enable Playwright headless browser for SPAs.")
def crawl(
    target: str,
    allowed: tuple[str, ...],
    max_depth: int,
    max_pages: int,
    rate_limit: float,
    ignore_robots: bool,
    spa: bool,
):
    """Crawls an authorized target and outputs discovered surfaces."""
    allowed_list = list(allowed) if allowed else [target]
    validator = ScopeValidator(allowed_hosts=allowed_list, rate_limit_per_sec=rate_limit)

    async def _run_crawl():
        console.print(f"[bold blue]Starting {'SPA (Headless)' if spa else 'Static HTTP'} crawl on:[/bold blue] {target}")
        async with ScopedHttpClient(scope=validator) as client:
            crawler = Crawler(
                client=client,
                max_depth=max_depth,
                max_pages=max_pages,
                respect_robots=not ignore_robots,
                use_spa=spa,
            )
            pages = await crawler.crawl(target)

            tree = Tree(f"[bold green]Crawl Summary ({len(pages)} pages discovered)[/bold green]")
            for page in pages:
                page_node = tree.add(f"[cyan]{page.url}[/cyan] [dim]({page.status_code})[/dim]")
                if page.query_params:
                    page_node.add(f"[yellow]Parameters:[/yellow] {', '.join(page.query_params)}")
                if page.forms:
                    forms_node = page_node.add(f"[magenta]Forms/Inputs ({len(page.forms)}):[/magenta]")
                    for form in page.forms:
                        field_names = [f"{f.name} ({f.field_type})" for f in form.fields]
                        forms_node.add(f"[dim]{form.method}[/dim] -> {form.action} | Inputs: {field_names}")

            console.print(tree)

    asyncio.run(_run_crawl())


@cli.command("run")
@click.option("--target-id", "-i", type=int, help="Target ID from database.")
@click.option("--target", "-t", type=str, help="Target URL (used if --target-id is not provided).")
@click.option("--max-depth", "-d", default=3, help="Maximum crawl depth.")
@click.option("--max-pages", "-p", default=50, help="Maximum pages to crawl.")
@click.option("--rate-limit", "-r", default=5.0, help="Requests per second limit.")
@click.option("--spa", is_flag=True, default=False, help="Enable Playwright for SPAs.")
def run(target_id: int | None, target: str | None, max_depth: int, max_pages: int, rate_limit: float, spa: bool):
    """Executes a full DAST scan against an authorized target."""
    _execute_scan(target_id, target, max_depth, max_pages, rate_limit, spa)


@cli.command("scan")
@click.option("--target-id", "-i", type=int, help="Target ID from database.")
@click.option("--target", "-t", type=str, help="Target URL.")
@click.option("--max-depth", "-d", default=3, help="Maximum crawl depth.")
@click.option("--max-pages", "-p", default=50, help="Maximum pages to crawl.")
@click.option("--rate-limit", "-r", default=5.0, help="Requests per second limit.")
@click.option("--spa", is_flag=True, default=False, help="Enable Playwright for SPAs.")
def scan(target_id: int | None, target: str | None, max_depth: int, max_pages: int, rate_limit: float, spa: bool):
    """Executes a full DAST scan (alias for 'run')."""
    _execute_scan(target_id, target, max_depth, max_pages, rate_limit, spa)


def _execute_scan(target_id: int | None, target: str | None, max_depth: int, max_pages: int, rate_limit: float, spa: bool):
    db = SessionLocal()
    try:
        if target_id is not None:
            target_obj = db.query(Target).filter(Target.id == target_id).first()
            if not target_obj:
                console.print(f"[bold red]Target with ID {target_id} not found.[/bold red]")
                return
        elif target:
            target_obj = db.query(Target).filter(Target.base_url == target).first()
            if not target_obj:
                target_obj = Target(base_url=target)
                db.add(target_obj)
                db.commit()
                db.refresh(target_obj)
        else:
            console.print("[bold red]Please specify either --target-id or --target.[/bold red]")
            return

        new_scan = Scan(target_id=target_obj.id, status="queued", pages_crawled=0)
        db.add(new_scan)
        db.commit()
        db.refresh(new_scan)
        scan_id = int(new_scan.id)

        console.print(f"[bold blue]Starting scan #{scan_id} on:[/bold blue] {target_obj.base_url}")

        engine = ScanEngine(
            target_url=target_obj.base_url,
            db_session=db,
            use_spa=spa,
            max_depth=max_depth,
            max_pages=max_pages,
            rate_limit=rate_limit,
        )

        with console.status("[bold green]Scanning in progress...[/bold green]"):
            asyncio.run(engine.run(scan_id=scan_id))

        db.refresh(new_scan)
        findings = db.query(Finding).filter(Finding.scan_id == scan_id).all()

        console.print(f"\n[bold green]Scan Complete: Status = {new_scan.status}[/bold green]")
        console.print(f"Pages Crawled: {new_scan.pages_crawled}")
        console.print(f"Total Findings: {len(findings)}\n")

        if findings:
            table = Table(title="Vulnerability Summary", show_header=True)
            table.add_column("Severity", style="bold")
            table.add_column("Vulnerability", style="cyan")
            table.add_column("URL", style="dim")
            table.add_column("Parameter", style="magenta")

            for f in findings:
                sev_color = "red" if f.severity in ("critical", "high") else "yellow" if f.severity == "medium" else "blue"
                table.add_row(
                    f"[{sev_color}]{f.severity.upper()}[/{sev_color}]",
                    f.check_id,
                    f.url,
                    f.parameter or "N/A"
                )

            console.print(table)
    finally:
        db.close()


@cli.command("report")
@click.option("--scan-id", "-s", required=True, type=int, help="Scan ID to generate report for.")
@click.option("--format", "-f", "fmt", default="html", type=click.Choice(["html", "sarif", "json"], case_sensitive=False), help="Report format.")
@click.option("--output", "-o", required=True, help="Output file path.")
def report(scan_id: int, fmt: str, output: str):
    """Generates an HTML, SARIF, or JSON report for a completed scan."""
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            console.print(f"[bold red]Scan {scan_id} not found.[/bold red]")
            return

        target = db.query(Target).filter(Target.id == scan.target_id).first()
        target_url = target.base_url if target else f"Target #{scan.target_id}"
        findings = db.query(Finding).filter(Finding.scan_id == scan_id).all()

        generator = ReportGenerator(target_url=target_url, findings=findings)
        fmt_lower = fmt.lower()

        if fmt_lower == "html":
            generator.to_html(output)
        elif fmt_lower == "sarif":
            with open(output, "w", encoding="utf-8") as f:
                f.write(generator.to_sarif())
        elif fmt_lower == "json":
            with open(output, "w", encoding="utf-8") as f:
                f.write(generator.to_json())

        console.print(f"[bold green]Report saved successfully to:[/bold green] {output}")
    finally:
        db.close()


if __name__ == "__main__":
    cli()
