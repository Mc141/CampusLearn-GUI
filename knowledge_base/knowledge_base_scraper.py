# scrape_belgiumcampus_modules_debug.py
import re
import time
import json
import csv
import sys
import hashlib
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from tqdm import tqdm
from pdfminer.high_level import extract_text as pdf_extract_text
from colorama import Fore, Style, init as colorama_init

# ---------------------------
# Setup
# ---------------------------
colorama_init()
parser = argparse.ArgumentParser()
parser.add_argument("--verbose", action="store_true", help="Enable detailed debug output")
args, _ = parser.parse_known_args()
VERBOSE = args.verbose

def debug(msg: str):
    if VERBOSE:
        print(Fore.CYAN + "[DEBUG]" + Style.RESET_ALL, msg)

def info(msg: str):
    print(Fore.GREEN + "[INFO]" + Style.RESET_ALL, msg)

def warn(msg: str):
    print(Fore.YELLOW + "[WARN]" + Style.RESET_ALL, msg)

def error(msg: str):
    print(Fore.RED + "[ERROR]" + Style.RESET_ALL, msg)

# ---------------------------
# Constants
# ---------------------------
BASE = "https://www.belgiumcampus.ac.za/"
START_URLS = [
    "https://www.belgiumcampus.ac.za/qualifications/",
    "https://www.belgiumcampus.ac.za/bachelor-of-information-technology/",
    "https://www.belgiumcampus.ac.za/bachelor-of-computing/",
    "https://www.belgiumcampus.ac.za/diploma-in-information-technology/",
    "https://www.belgiumcampus.ac.za/certificate-in-it/",
    "https://www.belgiumcampus.ac.za/diploma-for-deaf-students/",
    "https://www.belgiumcampus.ac.za/part-time-bachelor-of-information-technology/",
    "https://www.belgiumcampus.ac.za/admission-requirements/",
]

ALLOW_PATTERNS = [
    r"/qualifications/?$",
    r"/bachelor-of-",
    r"/diploma-",
    r"/certificate-",
    r"/admission-requirements/?$",
]

HEADERS = {
    "User-Agent": "CampusLearnKBBuilder/2.1 (+student project; contact: student@example.com)"
}
TIMEOUT = 20
SLEEP = 1.0
RETRIES = 2

OUTDIR = Path("kb_output")
PDFDIR = OUTDIR / "pdfs"
OUTDIR.mkdir(parents=True, exist_ok=True)
PDFDIR.mkdir(parents=True, exist_ok=True)

# ---------------------------
# Helpers
# ---------------------------
def allowed(url: str) -> bool:
    u = urlparse(url)
    if u.netloc and "belgiumcampus.ac.za" not in u.netloc:
        return False
    path = u.path.lower() if u.path else ""
    return any(re.search(p, path, re.I) for p in ALLOW_PATTERNS)

def get(url: str) -> Optional[BeautifulSoup]:
    for i in range(RETRIES + 1):
        try:
            debug(f"Fetching {url}")
            r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
            if r.status_code == 200 and "text/html" in r.headers.get("Content-Type", ""):
                return BeautifulSoup(r.text, "html.parser")
            warn(f"Non-HTML or failed request ({r.status_code}) for {url}")
            time.sleep(0.7)
        except requests.RequestException as e:
            warn(f"Request failed for {url}: {e}")
            time.sleep(0.7)
    return None

def text_norm(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()

# ---------------------------
# Extractors
# ---------------------------
def extract_title(soup: BeautifulSoup) -> str:
    h1 = soup.find("h1")
    if h1:
        return text_norm(h1.get_text(" "))
    title = soup.find("title")
    return text_norm(title.get_text(" ")) if title else ""

def extract_overview(soup: BeautifulSoup) -> str:
    h1 = soup.find("h1")
    section = (h1.find_parent(["section", "div", "main"]) if h1 else None) or soup
    first_p = section.find("p")
    if first_p:
        return text_norm(first_p.get_text(" "))
    md = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
    if md and md.get("content"):
        return text_norm(md["content"])
    p = soup.find("p")
    return text_norm(p.get_text(" ")) if p else ""

def extract_key_value_blocks(soup: BeautifulSoup) -> Dict[str, str]:
    info = {}
    labels = ["Duration", "NQF", "Credits", "SAQA", "SAQA ID", "Location", "Campuses"]
    text = " ".join(soup.stripped_strings)
    for lab in labels:
        m = re.search(rf"\b{lab}\b\s*:\s*([^•\n\r]+)", text, re.I)
        if m and lab not in info:
            info[lab] = text_norm(m.group(1))
    if "SAQA" in info and "SAQA ID" not in info:
        m = re.search(r"(\d{5,})", info["SAQA"])
        if m:
            info["SAQA ID"] = m.group(1)
    return info

# ---------------------------
# Table Parsing
# ---------------------------
def parse_module_tables(soup: BeautifulSoup) -> List[Dict]:
    results: List[Dict] = []
    tables = soup.find_all("table")
    debug(f"Found {len(tables)} tables on page")
    for tbl in tables:
        group = find_group_label_for_table(tbl)
        headers, rows = table_to_rows(tbl)
        colmap = map_headers(headers)
        for r in rows:
            row = [text_norm(td.get_text(" ")) for td in r.find_all(["td", "th"])]
            if not any(row):
                continue
            module = {
                "module_name": pick_cell(row, colmap, ["module", "subject", "course", "name"]),
                "module_code": pick_cell(row, colmap, ["code", "module code"]),
                "nqf_level": pick_cell(row, colmap, ["nqf", "nqf level"]),
                "credits": pick_cell(row, colmap, ["credits", "credit"]),
                "year_or_group": group,
                "pdf_url": "",
            }
            link = r.find("a", href=True)
            if link and link["href"].lower().endswith(".pdf"):
                module["pdf_url"] = urljoin(BASE, link["href"])
            if not module["pdf_url"]:
                for a in r.find_all("a", href=True):
                    if "view" in (a.get_text() or "").lower() and a["href"].lower().endswith(".pdf"):
                        module["pdf_url"] = urljoin(BASE, a["href"])
                        break
            if module["module_name"] or module["module_code"] or module["credits"]:
                results.append(module)
    return results

def find_group_label_for_table(tbl) -> str:
    lab = ""
    prev = tbl
    for _ in range(8):
        prev = prev.find_previous(["h2", "h3", "h4"])
        if not prev:
            break
        txt = text_norm(prev.get_text(" "))
        if re.search(r"(core|elective|year|semester|specialisation|first|second|third)", txt, re.I):
            lab = txt
            break
    return lab

def table_to_rows(tbl) -> Tuple[List[str], List[BeautifulSoup]]:
    headers = []
    thead = tbl.find("thead")
    if thead:
        hrow = thead.find("tr")
        if hrow:
            headers = [text_norm(th.get_text(" ")) for th in hrow.find_all(["th", "td"])]
    else:
        first = tbl.find("tr")
        if first:
            headers = [text_norm(th.get_text(" ")) for th in first.find_all(["th", "td"])]
    body_rows = []
    for tr in tbl.find_all("tr"):
        cells = [text_norm(c.get_text(" ")) for c in tr.find_all(["th", "td"])]
        if cells == headers or len(cells) <= 1:
            continue
        if tr.find_parent("thead"):
            continue
        body_rows.append(tr)
    return headers, body_rows

def map_headers(headers: List[str]) -> Dict[str, int]:
    colmap: Dict[str, int] = {}
    for i, h in enumerate(headers):
        lower = h.lower()
        if re.search(r"module|subject|course|name", lower):
            colmap["module"] = i
        elif re.search(r"code", lower):
            colmap["code"] = i
        elif re.search(r"\bnqf\b|nqf level", lower):
            colmap["nqf"] = i
        elif re.search(r"credit", lower):
            colmap["credits"] = i
    return colmap

def pick_cell(row: List[str], colmap: Dict[str, int], keys: List[str]) -> str:
    for k in keys:
        if k in colmap and colmap[k] < len(row):
            return row[colmap[k]].strip()
    return row[0].strip() if row else ""

# ---------------------------
# PDF Handling
# ---------------------------
def safe_filename_from_url(url: str) -> str:
    h = hashlib.md5(url.encode("utf-8")).hexdigest()[:12]
    name = urlparse(url).path.split("/")[-1] or f"module_{h}.pdf"
    if not name.lower().endswith(".pdf"):
        name = f"{name}_{h}.pdf"
    return name

def download_pdf(url: str, dest: Path) -> Optional[Path]:
    for i in range(RETRIES + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
            if r.status_code == 200 and "application/pdf" in r.headers.get("Content-Type", "").lower():
                with dest.open("wb") as f:
                    f.write(r.content)
                return dest
            time.sleep(0.7)
        except requests.RequestException as e:
            warn(f"Failed PDF request ({i+1}/{RETRIES}): {e}")
            time.sleep(0.7)
    return None

def extract_pdf_text(path: Path, max_chars: int = 40000) -> str:
    try:
        txt = pdf_extract_text(str(path)) or ""
        txt = re.sub(r"\s+", " ", txt).strip()
        if len(txt) > max_chars:
            txt = txt[:max_chars] + " ..."
        return txt
    except Exception as e:
        error(f"Failed to extract text from {path.name}: {e}")
        return ""

# ---------------------------
# Crawling + Processing
# ---------------------------
def crawl_programmes(start_urls: List[str]) -> Dict[str, Dict]:
    seen = set()
    programme_pages: Dict[str, Dict] = {}
    queue = list(start_urls)

    pbar = tqdm(total=0, desc="Discovering pages", unit="page")
    while queue:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        soup = get(url)
        if not soup:
            warn(f"Skipping {url}")
            continue
        title = extract_title(soup)
        if re.search(r"(bachelor|diploma|certificate|qualification)", title, re.I):
            info(f"Found programme page: {title} ({url})")
            programme_pages[url] = {"url": url, "soup": soup}
        for nxt in [urljoin(url, a["href"]) for a in soup.find_all("a", href=True)]:
            if nxt not in seen and allowed(nxt):
                queue.append(nxt)
        pbar.total = len(seen)
        pbar.update(0)
        time.sleep(SLEEP)
    pbar.close()
    return programme_pages

def extract_programme_record(url: str, soup: BeautifulSoup) -> Dict:
    title = extract_title(soup)
    overview = extract_overview(soup)
    info_dict = extract_key_value_blocks(soup)
    return {
        "programme_title": title,
        "overview": overview,
        "duration": info_dict.get("Duration", ""),
        "nqf_level": info_dict.get("NQF", ""),
        "credits": info_dict.get("Credits", ""),
        "saqa_id": info_dict.get("SAQA ID", info_dict.get("SAQA", "")),
        "campuses": info_dict.get("Location", info_dict.get("Campuses", "")),
        "source_url": url,
    }

def process_programmes(programme_pages: Dict[str, Dict]) -> Tuple[List[Dict], List[Dict]]:
    programmes, modules = [], []
    for url, entry in tqdm(programme_pages.items(), desc="Parsing programmes", unit="page"):
        info(f"Parsing programme: {url}")
        soup: BeautifulSoup = entry["soup"]
        prog = extract_programme_record(url, soup)
        programmes.append(prog)
        mod_rows = parse_module_tables(soup)
        info(f" → Found {len(mod_rows)} module rows for {prog['programme_title']}")
        if VERBOSE and mod_rows:
            for m in mod_rows[:3]:
                debug(f"Sample: {m['module_name']} ({m['module_code']})")
        for m in mod_rows:
            m["programme_title"] = prog["programme_title"]
            m["programme_url"] = url
            modules.append(m)
    return programmes, modules

def enrich_modules_with_pdfs(modules: List[Dict]) -> List[Dict]:
    enriched = []
    for m in tqdm(modules, desc="Downloading PDFs & extracting text", unit="pdf"):
        pdf_url = m.get("pdf_url") or ""
        pdf_path = None
        pdf_text = ""
        if pdf_url and pdf_url.lower().endswith(".pdf"):
            fname = safe_filename_from_url(pdf_url)
            dest = PDFDIR / fname
            if not dest.exists():
                info(f"Downloading PDF: {pdf_url}")
                saved = download_pdf(pdf_url, dest)
                pdf_path = saved if saved else None
            else:
                debug(f"Using cached PDF: {fname}")
                pdf_path = dest
            if pdf_path:
                pdf_text = extract_pdf_text(pdf_path)
                info(f" ✓ Extracted {len(pdf_text)} chars from {pdf_path.name}")
            else:
                warn(f"Could not download PDF: {pdf_url}")
        m["pdf_local_path"] = str(pdf_path) if pdf_path else ""
        m["pdf_text"] = pdf_text
        enriched.append(m)
        time.sleep(0.2)
    return enriched

# ---------------------------
# Output Writing
# ---------------------------
def write_outputs(programmes: List[Dict], modules: List[Dict], outdir: Path):
    with (outdir / "programmes.json").open("w", encoding="utf-8") as f:
        json.dump(programmes, f, ensure_ascii=False, indent=2)
    with (outdir / "modules.json").open("w", encoding="utf-8") as f:
        json.dump(modules, f, ensure_ascii=False, indent=2)

    cols = ["programme_title", "programme_url", "year_or_group", "module_name", "module_code", "nqf_level", "credits", "pdf_url", "pdf_local_path"]
    with (outdir / "modules.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols)
        for r in modules:
            w.writerow([r.get(c, "") for c in cols])

    with (outdir / "modules.jsonl").open("w", encoding="utf-8") as f:
        for r in modules:
            text_parts = [
                r.get("programme_title", ""),
                f"Group/Year: {r.get('year_or_group','')}",
                f"Module: {r.get('module_name','')} ({r.get('module_code','')})",
                f"NQF: {r.get('nqf_level','')}, Credits: {r.get('credits','')}",
            ]
            if r.get("pdf_text"):
                text_parts.append("Syllabus:\n" + r["pdf_text"])
            doc = {
                "id": f"{r.get('programme_url','')}#{r.get('module_code','')}",
                "title": f"{r.get('module_name','')} ({r.get('module_code','')}) - {r.get('programme_title','')}",
                "url": r.get("pdf_url") or r.get("programme_url"),
                "text": "\n".join([p for p in text_parts if p]).strip()
            }
            f.write(json.dumps(doc, ensure_ascii=False) + "\n")

    info(f"Wrote JSON: {outdir/'programmes.json'} ({len(programmes)} programmes)")
    info(f"Wrote JSON: {outdir/'modules.json'} ({len(modules)} modules)")
    info(f"Wrote CSV & JSONL outputs")

# ---------------------------
# Main
# ---------------------------
def main():
    info(">>> Stage 1: Discover programme pages")
    programme_pages = crawl_programmes(START_URLS)
    info(f"Found {len(programme_pages)} candidate programme pages")

    info("\n>>> Stage 2: Parse programmes & module tables")
    programmes, modules = process_programmes(programme_pages)
    info(f"Parsed {len(programmes)} programmes; {len(modules)} module entries found")

    info("\n>>> Stage 3: Download PDFs & extract text")
    modules = enrich_modules_with_pdfs(modules)

    info("\n>>> Stage 4: Write outputs")
    write_outputs(programmes, modules, OUTDIR)
    info(f"All done. Files in {OUTDIR.resolve()}")

if __name__ == "__main__":
    main()
