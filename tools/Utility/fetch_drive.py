"""
fetch_drive.py — Auto-download timetable PDFs from Google Drive
================================================================
Usage:
    python tools/Utility/fetch_drive.py           # download PDFs
    python tools/Utility/fetch_drive.py --dry-run # preview only, no files written

Uses gdown's internal folder-listing API (no API key required for public folders).

Folder detection priority (when subfolders exist):
    1. Subfolder name contains "LATEST" (case-insensitive)
    2. Subfolder name contains a DDMMYYYY date → picks the most recent
    3. Neither found → warns and aborts (existing PDFs preserved)
"""

import os
import re
import sys
from datetime import datetime

try:
    import gdown
    from gdown.download import _get_session
    from gdown.download_folder import _download_and_parse_google_drive_link
except ImportError:
    print("❌ gdown not installed. Run: pip install gdown")
    sys.exit(1)

# ─── CONFIG ────────────────────────────────────────────────────────────────────
DRIVE_FOLDER_ID = "1TLZ0NklKZqmgy2UCmkgTLTSVHFgbyNpY"
OUTPUT_DIR      = "tools/PDF"
LOG_DIR         = "tools/logs"

FOLDER_URL = "https://drive.google.com/drive/folders/{id}"
TYPE_FOLDER = "application/vnd.google-apps.folder"

# ─── LOGGING ───────────────────────────────────────────────────────────────────
_log_lines = []
_log_path  = None

def _init_log():
    global _log_path
    os.makedirs(LOG_DIR, exist_ok=True)
    stamp     = datetime.now().strftime("%d%m%Y_%H%M%S")
    _log_path = os.path.join(LOG_DIR, f"fetch_drive_{stamp}.txt")
    _log(f"fetch_drive.py — run started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    _log(f"Drive Folder ID : {DRIVE_FOLDER_ID}")
    _log(f"Output Dir      : {OUTPUT_DIR}")
    _log("-" * 60)

def _log(msg=""):
    print(msg)
    _log_lines.append(str(msg))

def _flush_log():
    if _log_path:
        with open(_log_path, "w", encoding="utf-8") as f:
            f.write("\n".join(_log_lines) + "\n")
        print(f"\n📄 Log saved to: {_log_path}")

# ─── DRIVE LISTING ─────────────────────────────────────────────────────────────
def _get_session_quiet():
    """Return a gdown session with a browser-like user agent."""
    return _get_session(
        proxy=None,
        use_cookies=False,
        user_agent=(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/98.0.4758.102 Safari/537.36"
        ),
    )


def _list_folder(folder_id: str):
    """
    List the direct children of a public Google Drive folder.
    Returns:
        files   : list of {"name": str, "id": str}
        folders : list of {"name": str, "id": str}
    """
    url  = FOLDER_URL.format(id=folder_id)
    sess = _get_session_quiet()

    _log(f"  → Fetching folder: {url}")
    is_ok, gdrive_file = _download_and_parse_google_drive_link(
        sess, url, quiet=True, remaining_ok=True
    )

    if not is_ok or gdrive_file is None:
        _log("  ❌ gdown could not parse the Drive folder.")
        return [], []

    files   = []
    folders = []
    for child in gdrive_file.children:
        entry = {"name": child.name, "id": child.id}
        if child.is_folder():
            folders.append(entry)
        else:
            files.append(entry)

    return files, folders

# ─── FOLDER DETECTION ──────────────────────────────────────────────────────────
DATE_PAT = re.compile(r"\b(\d{2})(\d{2})(\d{4})\b")

def _parse_date(name: str):
    dates = []
    for m in DATE_PAT.finditer(name):
        try:
            dates.append(datetime(int(m.group(3)), int(m.group(2)), int(m.group(1))))
        except ValueError:
            pass
    return max(dates) if dates else None


def _pick_best_folder(folders):
    # Priority 1: LATEST keyword
    for f in folders:
        if "latest" in f["name"].lower():
            _log(f"  ✅ 'LATEST' keyword → '{f['name']}'")
            return f
    # Priority 2: most recent DDMMYYYY date
    dated = [(dt, f) for f in folders if (dt := _parse_date(f["name"])) is not None]
    if dated:
        for dt, f in dated:
            _log(f"  📅 Date {dt.strftime('%d/%m/%Y')} parsed from: '{f['name']}'")
        dated.sort(key=lambda x: x[0], reverse=True)
        best_dt, best_f = dated[0]
        _log(f"  ✅ Most recent ({best_dt.strftime('%d/%m/%Y')}) → '{best_f['name']}'")
        return best_f
    return None

# ─── DOWNLOAD ──────────────────────────────────────────────────────────────────
def _is_pdf(entry):
    return bool(re.search(r"\.pdf\b", entry["name"], re.IGNORECASE))


def _safe_name(name):
    m = re.search(r"(.+?\.pdf)", name, re.IGNORECASE)
    name = m.group(1) if m else name
    return re.sub(r'[<>:"/\\|?*]', "_", name).strip()


def _download(entry, dest_dir, dry_run):
    name = _safe_name(entry["name"])
    dest = os.path.join(dest_dir, name)

    if dry_run:
        _log(f"    [DRY-RUN] Would download: {name}")
        return

    _log(f"    ⬇️  {name} …")
    try:
        result = gdown.download(
            url=f"https://drive.google.com/uc?id={entry['id']}",
            output=dest,
            quiet=False,
            fuzzy=True,
        )
        if result and os.path.exists(result):
            _log(f"    ✅ Saved → {result}  ({os.path.getsize(result)//1024} KB)")
        else:
            _log(f"    ❌ Download returned no file for: {name}")
    except Exception as exc:
        _log(f"    ❌ FAILED: {name} — {exc}")

# ─── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    dry_run = "--dry-run" in sys.argv
    _init_log()
    if dry_run:
        _log("⚙️  DRY-RUN mode — no files will be written")
    _log()

    # STEP 1 — list root
    _log("STEP 1: Listing root Drive folder …")
    try:
        files, folders = _list_folder(DRIVE_FOLDER_ID)
    except Exception as exc:
        _log(f"❌ Failed to reach Drive: {exc}")
        _flush_log(); sys.exit(1)

    _log(f"  Found {len(files)} file(s), {len(folders)} subfolder(s)")

    # STEP 2 — choose target
    _log()
    target_files = []

    if not folders:
        _log("STEP 2: Flat layout — downloading root PDFs directly")
        target_files = [f for f in files if _is_pdf(f)]
    else:
        _log("STEP 2: Versioned layout — selecting best subfolder …")
        for sf in folders:
            _log(f"    • {sf['name']}  (id={sf['id']})")
        _log()
        best = _pick_best_folder(folders)
        if not best:
            _log("  ⚠️  No LATEST or date-tagged folder found — aborting.")
            _flush_log(); sys.exit(0)
        _log()
        _log(f"STEP 2b: Listing subfolder '{best['name']}' …")
        sub_files, _ = _list_folder(best["id"])
        target_files = [f for f in sub_files if _is_pdf(f)]

    # STEP 3 — delete old PDFs
    _log()
    _log("STEP 3: Removing old PDFs from output directory …")
    if not dry_run and os.path.isdir(OUTPUT_DIR):
        deleted = 0
        for fname in os.listdir(OUTPUT_DIR):
            if re.search(r"\.pdf$", fname, re.IGNORECASE):
                fpath = os.path.join(OUTPUT_DIR, fname)
                try:
                    os.remove(fpath)
                    _log(f"    🗑️  Deleted: {fname}")
                    deleted += 1
                except Exception as exc:
                    _log(f"    ⚠️  Could not delete {fname}: {exc}")
        if deleted == 0:
            _log("    (no old PDFs found)")
    elif dry_run:
        _log("    [DRY-RUN] Skipping deletion")

    # STEP 4 — download
    _log()
    _log(f"STEP 4: {len(target_files)} PDF(s) queued for download")
    if not target_files:
        _log("  ⚠️  No PDFs found.")
        _flush_log(); sys.exit(0)

    for f in target_files:
        _log(f"    • {f['name']}")
    _log()

    if not dry_run:
        os.makedirs(OUTPUT_DIR, exist_ok=True)

    for entry in target_files:
        _download(entry, OUTPUT_DIR, dry_run)

    _log()
    _log("─" * 60)
    if dry_run:
        _log(f"✅ Dry-run — {len(target_files)} PDF(s) identified, nothing written.")
    else:
        _log(f"✅ Done — {len(target_files)} PDF(s) downloaded to '{OUTPUT_DIR}'")
    _flush_log()


if __name__ == "__main__":
    main()
