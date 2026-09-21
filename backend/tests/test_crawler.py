import pytest
import respx
import httpx
from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.core.crawler import Crawler, DiscoveredPage


def test_crawler_extract_page_data():
    html = """
    <html>
        <body>
            <a href="/about">About</a>
            <a href="https://otherdomain.com/outside">Out of scope</a>
            <form action="/login" method="POST">
                <input type="text" name="username" value="" />
                <input type="password" name="password" value="" />
                <input type="hidden" name="csrf_token" value="abc" />
            </form>
        </body>
    </html>
    """
    validator = ScopeValidator(allowed_hosts=["target.local"])
    client = ScopedHttpClient(scope=validator)
    crawler = Crawler(client=client)

    links, query_params, forms = crawler._extract_page_data("http://target.local/home?page=1", html)

    assert "http://target.local/about" in links
    assert "https://otherdomain.com/outside" not in links
    assert "page" in query_params
    assert len(forms) == 1
    assert forms[0].method == "POST"
    assert forms[0].action == "http://target.local/login"
    field_names = [f.name for f in forms[0].fields]
    assert "username" in field_names
    assert "password" in field_names
    assert "csrf_token" in field_names


def test_crawler_url_normalization():
    validator = ScopeValidator(allowed_hosts=["target.local"])
    client = ScopedHttpClient(scope=validator)
    crawler = Crawler(client=client)

    # Valid link
    assert crawler._normalize_url("http://target.local/", "contact") == "http://target.local/contact"
    # Strips fragments
    assert crawler._normalize_url("http://target.local/", "/faq#section1") == "http://target.local/faq"
    # Ignores static image
    assert crawler._normalize_url("http://target.local/", "logo.png") is None
    # Ignores zip
    assert crawler._normalize_url("http://target.local/", "archive.zip") is None


@pytest.mark.asyncio
@respx.mock
async def test_crawler_crawl_flow():
    respx.get("http://target.local/robots.txt").respond(404)
    respx.get("http://target.local/").respond(
        200,
        headers={"content-type": "text/html"},
        text="""
        <html>
            <body>
                <a href="/page1">Page 1</a>
                <a href="/page2">Page 2</a>
            </body>
        </html>
        """
    )
    respx.get("http://target.local/page1").respond(
        200,
        headers={"content-type": "text/html"},
        text="<html><body><h1>Page 1</h1><a href='/page3'>Page 3</a></body></html>"
    )
    respx.get("http://target.local/page2").respond(
        200,
        headers={"content-type": "text/html"},
        text="<html><body><h1>Page 2</h1></body></html>"
    )
    respx.get("http://target.local/page3").respond(
        200,
        headers={"content-type": "text/html"},
        text="<html><body><h1>Page 3</h1></body></html>"
    )

    validator = ScopeValidator(allowed_hosts=["target.local"])
    async with ScopedHttpClient(scope=validator) as client:
        crawler = Crawler(client=client, max_depth=2, max_pages=10)
        pages = await crawler.crawl("http://target.local/")

    urls = [p.url for p in pages]
    assert "http://target.local/" in urls
    assert "http://target.local/page1" in urls
    assert "http://target.local/page2" in urls
    assert "http://target.local/page3" in urls
    assert len(pages) == 4
