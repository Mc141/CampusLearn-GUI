"""
combine_knowledge_base.py
---------------------------------
Combine Belgium Campus programme + module data into a single
clean JSONL file suitable for AI knowledge bases or vector DBs.

Input:
  - kb_output/programmes.json
  - kb_output/modules.json
Output:
  - kb_output/knowledge_base.jsonl

Each JSONL line is a small knowledge chunk with:
  {
    "id": "...",
    "title": "...",
    "text": "...",
    "url": "..."
  }

Usage:
  python combine_knowledge_base.py
"""

import json
from pathlib import Path
import re
from colorama import Fore, Style, init as colorama_init

# Setup
colorama_init()
OUTDIR = Path("kb_output")
PROG_FILE = OUTDIR / "programmes.json"
MOD_FILE = OUTDIR / "modules.json"
OUT_FILE = OUTDIR / "knowledge_base.jsonl"

def clean_text(text: str) -> str:
    """Normalize whitespace and strip control chars."""
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def make_doc(doc_id: str, title: str, text: str, url: str = "") -> dict:
    """Standard doc schema."""
    return {
        "id": doc_id,
        "title": clean_text(title),
        "text": clean_text(text),
        "url": url,
    }

def combine(programmes_path: Path, modules_path: Path, output_path: Path):
    print(Fore.CYAN + "\n[Stage 1] Reading input files..." + Style.RESET_ALL)
    programmes = json.load(open(programmes_path, "r", encoding="utf-8"))
    modules = json.load(open(modules_path, "r", encoding="utf-8"))
    print(Fore.GREEN + f"Loaded {len(programmes)} programmes, {len(modules)} modules." + Style.RESET_ALL)

    combined = []
    seen_ids = set()

    print(Fore.CYAN + "[Stage 2] Adding programme entries..." + Style.RESET_ALL)
    for prog in programmes:
        doc_id = prog.get("source_url") or f"programme_{hash(prog.get('programme_title'))}"
        text_parts = []
        for key in ["overview", "duration", "nqf_level", "credits", "campuses"]:
            if prog.get(key):
                text_parts.append(f"{key.replace('_',' ').title()}: {prog[key]}")
        text = "\n".join(text_parts)
        combined.append(make_doc(doc_id, prog.get("programme_title", ""), text, prog.get("source_url", "")))
        seen_ids.add(doc_id)

    print(Fore.CYAN + "[Stage 3] Adding module entries..." + Style.RESET_ALL)
    for m in modules:
        title = f"{m.get('module_name','')} ({m.get('module_code','')}) - {m.get('programme_title','')}"
        url = m.get("pdf_url") or m.get("programme_url", "")
        text_parts = [
            f"Programme: {m.get('programme_title','')}",
            f"Group/Year: {m.get('year_or_group','')}",
            f"Module: {m.get('module_name','')} ({m.get('module_code','')})",
            f"NQF: {m.get('nqf_level','')}, Credits: {m.get('credits','')}",
        ]
        # Optional PDF text
        if "pdf_text" in m and m["pdf_text"]:
            text_parts.append(f"Syllabus:\n{m['pdf_text']}")
        text = "\n".join(text_parts)
        doc_id = f"{url}#{m.get('module_code','')}"
        if doc_id in seen_ids:
            continue
        combined.append(make_doc(doc_id, title, text, url))
        seen_ids.add(doc_id)

    print(Fore.CYAN + f"[Stage 4] Writing output → {output_path}" + Style.RESET_ALL)
    with open(output_path, "w", encoding="utf-8") as f:
        for doc in combined:
            f.write(json.dumps(doc, ensure_ascii=False) + "\n")

    print(Fore.GREEN + f"\n✅ Knowledge base built: {len(combined)} entries" + Style.RESET_ALL)
    print(f"File saved to: {output_path.resolve()}")
    print("You can now import this into Flowise or any RAG/Vector DB system.")

if __name__ == "__main__":
    combine(PROG_FILE, MOD_FILE, OUT_FILE)
