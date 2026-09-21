import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.target import Target
from app.models.scan import Scan
from app.models.finding import Finding

# Use StaticPool so the in-memory SQLite DB is shared across threads and connections
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


def test_create_and_get_target(client):
    res = client.post("/api/targets/", json={"base_url": "http://test.local", "notes": "Test environment"})
    assert res.status_code == 200
    data = res.json()
    assert data["base_url"] == "http://test.local"
    assert data["notes"] == "Test environment"
    target_id = data["id"]

    # Duplicate target should return existing
    res2 = client.post("/api/targets/", json={"base_url": "http://test.local"})
    assert res2.status_code == 200
    assert res2.json()["id"] == target_id

    # List targets
    list_res = client.get("/api/targets/")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


def test_create_and_get_scan(client):
    target_res = client.post("/api/targets/", json={"base_url": "http://test.local"})
    target_id = target_res.json()["id"]

    scan_res = client.post("/api/scans/", json={"target_id": target_id, "max_depth": 1, "max_pages": 5})
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert scan_data["target_id"] == target_id
    assert scan_data["status"] == "queued"

    get_scan_res = client.get(f"/api/scans/{scan_data['id']}")
    assert get_scan_res.status_code == 200
    assert get_scan_res.json()["id"] == scan_data["id"]


def test_scan_not_found(client):
    res = client.get("/api/scans/9999")
    assert res.status_code == 404


def test_findings_and_reports(client):
    db = TestingSessionLocal()
    target = Target(base_url="http://report-test.local")
    db.add(target)
    db.commit()
    db.refresh(target)
    target_id = target.id

    scan = Scan(target_id=target_id, status="completed", pages_crawled=3)
    db.add(scan)
    db.commit()
    db.refresh(scan)
    scan_id = int(scan.id)

    finding = Finding(
        scan_id=scan_id,
        check_id="reflected-xss",
        url="http://report-test.local/search?q=test",
        parameter="q",
        severity="high",
        evidence="Reflected payload",
        remediation="Output encode"
    )
    db.add(finding)
    db.commit()
    db.close()

    # Get findings by scan
    findings_res = client.get(f"/api/findings/scan/{scan_id}")
    assert findings_res.status_code == 200
    assert len(findings_res.json()) == 1
    assert findings_res.json()[0]["check_id"] == "reflected-xss"

    # Report in JSON format
    json_report = client.get(f"/api/reports/{scan_id}/download?format=json")
    assert json_report.status_code == 200
    assert "findings_count" in json_report.json()

    # Report in HTML format
    html_report = client.get(f"/api/reports/{scan_id}/download?format=html")
    assert html_report.status_code == 200
    assert "VulnScan Security Report" in html_report.text

    # Report in SARIF format
    sarif_report = client.get(f"/api/scans/{scan_id}/report?format=sarif")
    assert sarif_report.status_code == 200
    assert "sarif-schema-2.1.0" in sarif_report.text
