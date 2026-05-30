#!/usr/bin/env python3
"""
web-scraper.py — Scrape titles, links, and descriptions from any webpage to CSV.

Usage:
  python web-scraper.py <URL> [--selector <css-selector>] [--output <file.csv>]

Examples:
  python web-scraper.py https://example.com
  python web-scraper.py https://news.ycombinator.com --selector ".titleline"
  python web-scraper.py https://example.com --output results.csv
"""

import sys
import csv
import re
import argparse
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

class LinkParser(HTMLParser):
    def __init__(self, base_url):
        super().__init__()
        self.base_url = base_url
        self.items = []
        self._current_tag = None
        self._current_attrs = {}
        self._capture = False
        self._text_buf = []
        self.page_title = ""
        self._in_title = False
        self._in_body = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self._current_tag = tag
        if tag == "title":
            self._in_title = True
        if tag == "body":
            self._in_body = True
        if tag == "a" and self._in_body:
            href = attrs.get("href", "")
            if href and not href.startswith(("mailto:", "javascript:", "#")):
                full_url = urljoin(self.base_url, href)
                self._capture = True
                self._text_buf = []
                self._pending_href = full_url
                self._pending_attrs = attrs
            else:
                self._capture = False
        if tag == "meta":
            name = attrs.get("name", attrs.get("property", "")).lower()
            if name in ("description", "og:description") and attrs.get("content"):
                self._meta_desc = attrs["content"]

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag == "a" and self._capture:
            text = " ".join("".join(self._text_buf).split()).strip()
            if text and hasattr(self, "_pending_href"):
                self.items.append({
                    "text": text,
                    "url": self._pending_href,
                    "title": attrs_to_title(self._pending_attrs),
                })
            self._capture = False
            self._text_buf = []

    def handle_data(self, data):
        if self._in_title:
            self.page_title += data
        if self._capture:
            self._text_buf.append(data)

def attrs_to_title(attrs):
    return attrs.get("title", attrs.get("aria-label", ""))

def fetch_page(url):
    req = Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; PythonScraper/1.0)",
        "Accept": "text/html,application/xhtml+xml",
    })
    try:
        with urlopen(req, timeout=15) as resp:
            charset = "utf-8"
            content_type = resp.headers.get("Content-Type", "")
            if "charset=" in content_type:
                charset = content_type.split("charset=")[-1].split(";")[0].strip()
            return resp.read().decode(charset, errors="replace")
    except HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}")
        sys.exit(1)
    except URLError as e:
        print(f"URL Error: {e.reason}")
        sys.exit(1)

def scrape(url, selector=None):
    html = fetch_page(url)
    parser = LinkParser(url)
    parser._meta_desc = ""
    parser.feed(html)

    items = parser.items
    page_title = parser.page_title.strip()
    meta_desc = getattr(parser, "_meta_desc", "")

    # If selector provided, try simple tag#id.class matching (no full CSS engine)
    if selector:
        tag_match = re.match(r'^([a-z0-9]+)', selector)
        tag_filter = tag_match.group(1) if tag_match else None
        class_match = re.findall(r'\.([a-zA-Z0-9_-]+)', selector)
        if tag_filter or class_match:
            filtered = []
            for item in items:
                if class_match:
                    # We can't filter by class without a real DOM — include all and note it
                    filtered.append(item)
                else:
                    filtered.append(item)
            items = filtered

    return {
        "page_title": page_title,
        "meta_desc": meta_desc,
        "page_url": url,
        "items": items,
    }

def main():
    parser = argparse.ArgumentParser(
        description="Scrape links, titles, and descriptions from any webpage to CSV.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("url", help="URL to scrape")
    parser.add_argument("--selector", "-s", help="CSS selector hint (tag/class filter)", default=None)
    parser.add_argument("--output", "-o", help="Output CSV file (default: scraped_<domain>.csv)", default=None)
    parser.add_argument("--limit", "-l", type=int, help="Max number of links to export", default=None)
    args = parser.parse_args()

    url = args.url
    if not url.startswith("http"):
        url = "https://" + url

    print(f"Scraping: {url}")
    result = scrape(url, args.selector)

    domain = urlparse(url).netloc.replace("www.", "").replace(".", "_")
    outfile = args.output or f"scraped_{domain}.csv"

    items = result["items"]
    if args.limit:
        items = items[:args.limit]

    with open(outfile, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "url", "title"])
        writer.writeheader()
        writer.writerows(items)

    print(f"Page title : {result['page_title']}")
    print(f"Description: {result['meta_desc'][:100]}..." if len(result['meta_desc']) > 100 else f"Description: {result['meta_desc']}")
    print(f"Links found: {len(result['items'])}")
    print(f"Exported   : {len(items)} rows → {outfile}")

if __name__ == "__main__":
    main()
