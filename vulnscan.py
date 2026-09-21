#!/usr/bin/env python
"""
VulnScan CLI wrapper entrypoint.
Allows running CLI commands directly from workspace root:
    python vulnscan.py check-scope --allowed localhost --target http://localhost:3000
    python vulnscan.py crawl --target http://localhost:3000
    python vulnscan.py run --target-id 1
    python vulnscan.py scan --target http://localhost:3000
    python vulnscan.py report --scan-id 1 --format html --output report.html
"""
import os
import sys

# Ensure backend/ is in sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.cli.main import cli

if __name__ == "__main__":
    cli()
