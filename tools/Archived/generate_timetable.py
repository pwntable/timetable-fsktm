import pdfplumber
import re
import json
import os

# 1. Configuration
# NOTE: Kept for backwards compatibility; prefer `tools/Utility/parser.py` as the main generator.
# We intentionally use ONLY `by_course` as the canonical time-grid source to avoid duplicate/shifted
# slots introduced by other timetable views (notably `by_batch`).
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PDF_DIR = os.path.join(REPO_ROOT, "tools", "PDF")

def _find_latest_by_course_date(pdf_dir):
    dates = []
    if not os.path.isdir(pdf_dir):
        return None
    for name in os.listdir(pdf_dir):
        m = re.match(r"^by_course_(\d{8})\.pdf$", name)
        if m:
            dates.append(m.group(1))
    return max(dates) if dates else None

LATEST_DATE = _find_latest_by_course_date(PDF_DIR)

PDF_FILES = [
    os.path.join(PDF_DIR, f"by_course_{LATEST_DATE}.pdf") if LATEST_DATE else os.path.join(PDF_DIR, "by_course.pdf"),
]

OUTPUT_FILE = os.path.join(REPO_ROOT, "data.js")

# 2. Regex Patterns
CLASS_PATTERN = re.compile(r'([A-Z]{3,4}\s*\d{4,5}[A-Z]?)\s*:\s*(S\d+)\s*([KTA])')
LECTURER_PATTERN = re.compile(r'\((I-[^)]+)\)')
VENUE_PATTERN = re.compile(r'\[([^\]]+)\]')
COURSE_TITLE_PATTERN = re.compile(r'([A-Z]{3,4}\s*\d{4,5}[A-Z]?)\s*-\s*([A-Za-z0-9 &/-]+)')

# UPGRADED FOOTNOTE PATTERN: Captures Code, [Venue], (Lecturer), Section, Type
MERGE_ITEM_PATTERN = re.compile(r'([A-Z]{3,4}\s*\d{4,5}[A-Z]?)\s*(?:\[([^\]]+)\])?\s*(?:\(([^)]+)\))?\s*(S\d+)\s*:\s*([KTA])')

database = {}
course_titles = {}
merge_map = {} # { "135": [("BIS33403", "S9", "Lecture", "K", "I-AUDITORIUM", "I-feresa"), ...] }

def normalize_code(code):
    return code.replace(" ", "").upper()

def parse_class_type(type_char):
    mapping = {"K": "Lecture", "T": "Tutorial", "A": "Lab/Amali"}
    return mapping.get(type_char, "Unknown")

def parse_footnote_items(m_id, text):
    """Extracts shared sections, including specific venues and lecturers if provided."""
    if m_id not in merge_map:
        merge_map[m_id] = []
    for item_match in MERGE_ITEM_PATTERN.finditer(text):
        c_code = normalize_code(item_match.group(1))
        c_venue = item_match.group(2).strip() if item_match.group(2) else None
        c_lecturer = item_match.group(3).strip() if item_match.group(3) else None
        c_sec = item_match.group(4)
        c_type_char = item_match.group(5)
        c_type = parse_class_type(c_type_char)
        
        target = (c_code, c_sec, c_type, c_type_char, c_venue, c_lecturer)
        if target not in merge_map[m_id]:
            merge_map[m_id].append(target)

def extract_all_footnotes():
    """Scans the bottom of all PDFs to build the Merge Map."""
    for filename in PDF_FILES:
        if not os.path.exists(filename): continue
        with pdfplumber.open(filename) as pdf:
            full_text = ""
            for page in pdf.pages:
                text = page.extract_text()
                if text: full_text += text + "\n"
            
            parts = re.split(r'Footnote:\s*Sections in Merge Slots', full_text, flags=re.IGNORECASE)
            if len(parts) > 1:
                footnote_text = parts[-1]
                current_id = None
                current_text = ""
                
                for line in footnote_text.split('\n'):
                    line = line.strip()
                    if not line or "INI ADALAH CETAKAN" in line or "PAGE" in line: continue
                        
                    id_match = re.match(r'^(\d+)\s*(?:-\s*)?(?=[A-Z]{3,4})', line)
                    if id_match:
                        if current_id and current_text:
                            parse_footnote_items(current_id, current_text)
                        current_id = id_match.group(1)
                        current_text = line[id_match.end():]
                    else:
                        if current_id:
                            current_text += " " + line
                            
                if current_id and current_text:
                    parse_footnote_items(current_id, current_text)

def process_pdf(filename):
    """Parses table grids and applies the Merge Map to spawn concurrent classes."""
    if not os.path.exists(filename): return
    print(f"Processing {filename}...")
    
    with pdfplumber.open(filename) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            
            if text:
                for match in COURSE_TITLE_PATTERN.finditer(text):
                    code = normalize_code(match.group(1))
                    title = match.group(2).strip().upper()
                    if len(title) > 3:
                        course_titles[code] = title
                        if code not in database:
                            database[code] = {"sections": {}}

            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2: continue
                headers = table[0]
                
                for row in table[1:]:
                    if not row[0]: continue
                    day = row[0].replace('\n', '').strip()
                    if day not in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
                        continue 
                    
                    for col_idx, cell in enumerate(row[1:], start=1):
                        if not cell or col_idx >= len(headers): continue
                        time_raw = headers[col_idx]
                        if not time_raw: continue
                        time_start = time_raw.split('-')[0].strip().replace('\n', '')
                        
                        matches = list(CLASS_PATTERN.finditer(cell))
                        for i, match in enumerate(matches):
                            raw_code = match.group(1)
                            code = normalize_code(raw_code)
                            section = match.group(2)
                            type_char = match.group(3)
                            class_type = parse_class_type(type_char)
                            
                            start_idx = match.end()
                            end_idx = matches[i+1].start() if i+1 < len(matches) else len(cell)
                            block_text = cell[start_idx:end_idx]
                            
                            lecturer_match = LECTURER_PATTERN.search(block_text)
                            venue_match = VENUE_PATTERN.search(block_text)
                            base_lecturer = lecturer_match.group(1).strip() if lecturer_match else "TBA"
                            base_venue = venue_match.group(1).strip() if venue_match else "TBA"
                            
                            # Find hidden Merge ID 
                            clean_block = LECTURER_PATTERN.sub('', block_text)
                            clean_block = VENUE_PATTERN.sub('', clean_block)
                            merge_id_match = re.search(r'\b(\d{1,3})\b', clean_block)
                            
                            # Default target
                            targets = [(code, section, class_type, type_char, None, None)]
                            
                            if merge_id_match:
                                m_id = merge_id_match.group(1)
                                if m_id in merge_map:
                                    targets = merge_map[m_id]
                                    
                            # Inject slots based on targets (handling footnote specific venues)
                            for t_code, t_sec, t_type, t_type_char, t_venue_ft, t_lect_ft in targets:
                                final_venue = t_venue_ft if t_venue_ft else base_venue
                                final_lecturer = t_lect_ft if t_lect_ft else base_lecturer
                                
                                if t_code not in database:
                                    database[t_code] = {"sections": {}}
                                if t_sec not in database[t_code]["sections"]:
                                    database[t_code]["sections"][t_sec] = []
                                    
                                slot_hash = f"{day}_{time_start}_{t_type}"
                                exists = False
                                
                                for existing_slot in database[t_code]["sections"][t_sec]:
                                    if existing_slot.get("_hash") == slot_hash:
                                        exists = True
                                        if existing_slot["venue"] == "TBA" and final_venue != "TBA":
                                            existing_slot["venue"] = final_venue
                                        if existing_slot["lecturer"] == "TBA" and final_lecturer != "TBA":
                                            existing_slot["lecturer"] = final_lecturer
                                        break
                                
                                if not exists:
                                    database[t_code]["sections"][t_sec].append({
                                        "_hash": slot_hash,
                                        "day": day,
                                        "time_start": time_start,
                                        "duration": 2,
                                        "section": f"{t_sec} {t_type_char}",
                                        "type": t_type,
                                        "lecturer": final_lecturer,
                                        "venue": final_venue
                                    })

# Execute
print("Step 1: Extracting Merge Footnotes...")
extract_all_footnotes()

print("Step 2: Processing Table Grids...")
for f in PDF_FILES:
    process_pdf(f)

# Hardcode catch-for missing titles
missing_courses = {"KIT11103": "RESEARCH METHODOLOGY", "PIT11103": "RESEARCH METHODOLOGY"}
for code, title in missing_courses.items():
    if code not in database:
        database[code] = {"sections": {}}
        course_titles[code] = title

# Clean up & Export
final_courses = {}
for code, data in sorted(database.items()):
    name = course_titles.get(code, f"SUBJECT {code}")
    
    clean_sections = {}
    for sec, slots in data["sections"].items():
        clean_slots = []
        for slot in slots:
            slot.pop("_hash", None)
            clean_slots.append(slot)
        clean_sections[sec] = clean_slots
        
    has_multiple = len(clean_sections.keys()) > 1

    final_courses[code] = {
        "name": name,
        "sections": clean_sections,
        "hasMultipleSections": has_multiple
    }

js_content = f"""/* ═══════════════════════════════════════════════
   UTM Timetable Generator — data.js
   Automatically Generated via Python Parser
   Total courses: {len(final_courses)}
═══════════════════════════════════════════════ */

const COURSES = {json.dumps(final_courses, indent=2)};
"""

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"\n✅ Successfully parsed and deduplicated schedules!")
print(f"✅ Extracted {len(merge_map)} Merge Footnotes.")
print(f"✅ Data exported to {OUTPUT_FILE}")
