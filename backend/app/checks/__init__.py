from app.checks.base import Finding, ScanCheck
from app.checks.xss import ReflectedXSSCheck
from app.checks.sqli import SQLInjectionCheck
from app.checks.csrf import CSRFCheck
from app.checks.open_redirect import OpenRedirectCheck
from app.checks.security_headers import SecurityHeadersCheck
from app.checks.sensitive_files import SensitiveFileExposureCheck
from app.checks.insecure_cookies import InsecureCookiesCheck
from app.checks.ssrf import SSRFCheck
from app.checks.outdated_deps import OutdatedDepsCheck
from app.checks.command_injection import CommandInjectionCheck
from app.checks.path_traversal import PathTraversalCheck
from app.checks.waf_detect import WafDetectCheck

ALL_CHECKS: list[type[ScanCheck]] = [
    WafDetectCheck,
    SecurityHeadersCheck,
    InsecureCookiesCheck,
    SensitiveFileExposureCheck,
    ReflectedXSSCheck,
    SQLInjectionCheck,
    CommandInjectionCheck,
    PathTraversalCheck,
    CSRFCheck,
    OpenRedirectCheck,
    SSRFCheck,
    OutdatedDepsCheck,
]

__all__ = [
    "Finding",
    "ScanCheck",
    "ReflectedXSSCheck",
    "SQLInjectionCheck",
    "CommandInjectionCheck",
    "PathTraversalCheck",
    "WafDetectCheck",
    "CSRFCheck",
    "OpenRedirectCheck",
    "SecurityHeadersCheck",
    "SensitiveFileExposureCheck",
    "InsecureCookiesCheck",
    "SSRFCheck",
    "OutdatedDepsCheck",
    "ALL_CHECKS",
]
