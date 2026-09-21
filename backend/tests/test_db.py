from datetime import datetime, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.target import Target
from app.models.scan import Scan
from app.models.finding import Finding


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_add_target(db_session):
    target = Target(base_url="http://target.local", notes="Test environment")
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)

    assert target.id is not None
    assert target.id > 0
    assert target.base_url == "http://target.local"
    assert target.notes == "Test environment"


def test_create_and_update_scan(db_session):
    target = Target(base_url="http://target.local")
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)

    scan = Scan(target_id=target.id, status="queued")
    db_session.add(scan)
    db_session.commit()
    db_session.refresh(scan)
    assert scan.id > 0

    scan.status = "completed"
    scan.pages_crawled = 15
    scan.finished_at = datetime.now(timezone.utc)
    db_session.commit()

    reloaded = db_session.query(Scan).filter(Scan.id == scan.id).first()
    assert reloaded.status == "completed"
    assert reloaded.pages_crawled == 15
    assert reloaded.finished_at is not None


def test_save_finding(db_session):
    target = Target(base_url="http://target.local")
    db_session.add(target)
    db_session.commit()

    scan = Scan(target_id=target.id, status="running")
    db_session.add(scan)
    db_session.commit()

    finding = Finding(
        scan_id=scan.id,
        check_id="security-headers",
        url="http://target.local/about",
        parameter=None,
        severity="low",
        evidence="Missing CSP header",
        remediation="Add CSP"
    )
    db_session.add(finding)
    db_session.commit()
    db_session.refresh(finding)

    assert finding.id is not None
    assert finding.id > 0
    assert finding.check_id == "security-headers"
    assert finding.url == "http://target.local/about"
    assert finding.severity == "low"
    assert finding.scan.target.base_url == "http://target.local"
