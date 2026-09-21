# VulnScan Web Interface

This directory contains the user interface for the VulnScan automated DAST platform, built with React 19, Vite, Tailwind CSS, and shadcn/ui.

---

## Directory Layout

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── api/                # Axios HTTP client endpoints connecting to FastAPI
│   ├── components/         # Reusable UI primitives (Button, Badge, Table, Modal, Navbar, Sidebar)
│   ├── context/            # ThemeContext (Light & Dark theme state with localStorage persistence)
│   ├── features/
│   │   ├── dashboard/      # Command Center, telemetry stat cards, severity donut chart
│   │   │   └── widgets/    # LiveRadarScanner, LiveSecurityEventStream, SecurityPostureGauge
│   │   ├── findings/       # Findings table and detailed vulnerability advisory view
│   │   ├── reports/        # Integrated multi-format report viewer (HTML, JSON, SARIF)
│   │   ├── scans/          # New scan configuration form, execution progress, scan history
│   │   └── targets/        # Registered targets management
│   ├── App.jsx             # Route definitions and application layout shell
│   ├── globals.css         # Theme design tokens, keyframe animations, typography rules
│   └── main.jsx            # React root mount entrypoint
├── package.json            # Node.js dependencies and build scripts
└── vite.config.js          # Vite configuration and build rules
```

---

## Design System and Theme Architecture

- **Theme Palette**: Configured with a default White Light Theme (pure white card surfaces `#ffffff` over a soft slate canvas `#f9fafb`) and an obsidian dark mode.
- **Color Consistency**: Destructive red is strictly reserved for Critical/High vulnerabilities and system errors. Status badges utilize soft pastel variants for optimal readability.
- **Typography**: Inter / Geist Sans for user interface typography; Geist Mono for technical artifacts (URLs, HTTP headers, CVSS metrics, evidence blocks, and code snippets).
- **Interactive Widgets**:
  - `LiveRadarScanner`: 360-degree rotating radar beam with glowing active targets and roundtrip latency test.
  - `LiveSecurityEventStream`: Real-time streaming audit event log with severity filtering.
  - `SecurityPostureGauge`: Circular SVG risk gauge with automated letter grading.

For comprehensive system documentation, architecture diagrams, and the developer guide, refer to the root [README.md](../README.md).
