import pdfplumber
import json
import re
import os

PDF_FILES = [
    "by_course_11032026.pdf"
]
OUTPUT_FILE = "data.js"

# Basic Regex for Course / Intakes / Footnotes
COURSE_TITLE_PATTERN = re.compile(r'([A-Z]{3,4}\s*\d{4,5}[A-Z]?)\s*-\s*([A-Za-z0-9 &/-]+)')
MERGE_ITEM_PATTERN = re.compile(r'([A-Z]{3,4}\s*\d{4,5}[A-Z]?)\s*(?:\(([^)]+)\))?\s*(?:<([^>]+)>)?\s*(S\d+)\s*:\s*([KTA](?:/[KTA])?)')
TIME_PATTERN = re.compile(r'(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})')

# Global datasets
database = {}
course_titles = {}
merge_map = {}  # { "footnote_id": [{"code", "lecturer", "intake", "section", "type_char", "type_full"}, ...]}

# Reset intake anomalies log
open('intake_anomalies.txt', 'w', encoding='utf-8').close()

def normalize_code(code):
    return code.replace(" ", "").upper()

def parse_class_type(type_char):
    mapping = {"K": "Lecture", "T": "Tutorial", "A": "Lab/Amali"}
    return mapping.get(type_char, "Unknown")

def parse_duration(time_str):
    """Calculates duration in hours based on time strings like '08:00 - 10:00' or '10:00 - 01:00'"""
    try:
        start_t, end_t = time_str.split('-')
        sh, sm = map(int, start_t.strip().split(':'))
        eh, em = map(int, end_t.strip().split(':'))
        
        # 12-hour clock fix for PM transitions (e.g. 01:00 is 13:00)
        # Assuming classes start at 8AM and end by 10PM.
        if sh < 8: sh += 12
        if eh < 8: eh += 12
        if eh < sh and eh == 12: eh = 12 # Edge case if eh is 12:00 PM
            
        return (eh + em/60.0) - (sh + sm/60.0)
    except:
        return 1  # Default fallback 1 hr

def extract_intakes(text):
    """Extracts intakes from `< >`, strips trailing 'S1 K 01', and validates format."""
    angle_matches = re.findall(r'<([^>]+)>', text)
    clean_tags = []
    
    for tag in angle_matches:
        tag = tag.strip()
        if not tag: continue
        
        # Clean section suffix: e.g. " S1 K 01" or " S7 K"
        cleaned = re.sub(r'\s*S\d+(?:/\d+)?\s*[KTA](?:\s*\d+)?\s*$', '', tag).strip()
        
        # Repair OCR/manual PDF spacing anomalies: "FSKTM- 1BIW" -> "FSKTM-1BIW"
        cleaned = re.sub(r'([A-Z]+)-\s+(\d[A-Z]{3})', r'\1-\2', cleaned)
        
        # Validate pattern: Faculty-Year[Program] e.g. FSKTM-1BIM
        pattern = r'^[A-Z]+-\d[A-Z]{3}'
        if not re.match(pattern, cleaned):
            with open('intake_anomalies.txt', 'a', encoding='utf-8') as f:
                f.write(f"Anomalous Intake Format: '{cleaned}' from original '{tag}'\n")
                
        if cleaned and cleaned not in clean_tags:
            clean_tags.append(cleaned)
            
    return " | ".join(clean_tags)

# --- PASS 1: EXTRACT FOOTNOTES ---

def extract_footnotes():
    """Scans the bottom of all PDFs to build the Merge Map."""
    print("STEP 1: Extracting Footnotes...")
    for filename in PDF_FILES:
        if not os.path.exists(filename): continue
        with pdfplumber.open(filename) as pdf:
            full_text = ""
            for page in pdf.pages:
                res = page.search(r'Footnote[:\s]', regex=True)
                if not res: continue
                
                # Crop the page from the Y-coordinate of "Footnote:" to the bottom
                y0 = res[0]['top'] - 2
                cropped = page.crop((0, max(0, y0), page.width, page.height))
                
                # Extract text using default tolerances since we've cleanly isolated the footer
                footnote_text = cropped.extract_text()
                if not footnote_text: continue
                
                current_id = None
                current_text = ""
                
                for line in footnote_text.split('\n'):
                    line = line.strip()
                    if not line or "INI ADALAH CETAKAN" in line or "PAGE" in line or "Footnote" in line: continue
                        
                    # Use search to find the ID at the beginning of the line, allowing for various unicode dashes
                    id_match = re.search(r'^\s*(\d{1,3})\s*[-–—]+', line)
                    if id_match:
                        if current_id and current_text:
                            _parse_footnote_line(current_id, current_text)
                        current_id = id_match.group(1)
                        # We extract everything after the dash
                        current_text = line[id_match.end():]
                    else:
                        if current_id:
                            current_text += " " + line
                            
                if current_id and current_text:
                    _parse_footnote_line(current_id, current_text)

def _parse_footnote_line(m_id, text):
    """Parses a single footnote line into the merge_map."""
    if m_id not in merge_map:
        merge_map[m_id] = []
        
    # Split by comma to handle multiple courses per footnote
    parts = text.split(',')
    
    # Keep track of the last seen metadata, because grouped footnotes omit them
    # E.g. "BIS10103 (I-zubaile) <FSKTM...> S2 : A, S1 : K"
    last_code = None
    last_lec = "Unknown"
    last_intake = []
    
    for part in parts:
        part = part.strip()
        if not part: continue
        
        # 1. Course Code (starts at the beginning of the part usually)
        code_match = re.search(r'([A-Z]{3,4}\s*\d{4,5}[A-Z]?)', part)
        if code_match:
            c_code = normalize_code(code_match.group(1))
            last_code = c_code
        else:
            c_code = last_code
            
        if not c_code: continue # If we still don't have a code, we can't do anything
        
        # 2. Section & Mode (always at the end: S1 : K or S1 : K/T)
        sec_match = re.search(r'(S\d+(?:/\d+)?)\s*:\s*([KTA](?:/[KTA])?)', part)
        if not sec_match: continue
        c_sec = sec_match.group(1).replace(' ', '')
        c_type_char = sec_match.group(2)
        c_type_full = parse_class_type(c_type_char.split('/')[0]) # Use primary component for mapping
        
        # 3. Find Lecturer (inside parentheses)
        lec_match = re.search(r'\(([^)]+)\)', part)
        if lec_match:
            c_lecturer = lec_match.group(1).strip()
            last_lec = c_lecturer
        else:
            c_lecturer = last_lec
        
        # 4. Find Batch/Intake/Location tags from angle and square brackets
        extracted_intakes = extract_intakes(part)
        if extracted_intakes:
            c_intake = extracted_intakes
            last_intake = extracted_intakes
        else:
            c_intake = last_intake
        
        target = {
            "code": c_code,
            "lecturer": c_lecturer,
            "intake": c_intake,
            "section": c_sec,
            "type_char": c_type_char,
            "type": c_type_full
        }
        
        # Handle duplicate sections representing multiple intakes
        found_existing = False
        for t in merge_map[m_id]:
            if t["code"] == target["code"] and t["section"] == target["section"] and t["type_char"] == target["type_char"]:
                found_existing = True
                if target["intake"]:
                    if not t["intake"]:
                        t["intake"] = target["intake"]
                    elif target["intake"] not in t["intake"]:
                        t["intake"] += " | " + target["intake"]
                break
                
        if not found_existing:
            merge_map[m_id].append(target)

# --- PASS 2: EXTRACT TIMETABLE GRID ---
def extract_grid():
    print("STEP 2: Processing Table Grids...")
    for filename in PDF_FILES:
        if not os.path.exists(filename): continue
        with pdfplumber.open(filename) as pdf:
            for page in pdf.pages:
                
                # Extract course titles
                text = page.extract_text()
                if text:
                    for match in COURSE_TITLE_PATTERN.finditer(text):
                        code = normalize_code(match.group(1))
                        title = match.group(2).strip().upper()
                        if len(title) > 3:
                            course_titles[code] = title
                            if code not in database:
                                database[code] = {"name": title, "sections": {}, "hasMultipleSections": False}

                # Extract Table Coordinates
                tables = page.find_tables()
                if not tables: continue
                
                for table in tables:
                    cells = table.extract()
                    if not cells or len(cells) < 2: continue
                    
                    # Row 0 usually has the Day, Row 1 has the time headers
                    headers = cells[1] if len(cells) > 1 and "08:00" in str(cells[1]) else cells[0]
                    start_row_idx = 2 if headers == cells[1] else 1
                    
                    # Clean headers to single string
                    clean_headers = [str(h).replace('\n', ' ') if h else "" for h in headers]

                    for row_idx in range(start_row_idx, len(cells)):
                        row = cells[row_idx]
                        if not row or not row[0]: continue
                        
                        day = str(row[0]).replace('\n', '').strip()
                        if day not in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
                            continue
                        
                        # Process cells
                        for col_idx in range(1, len(row)):
                            cell_raw = row[col_idx]
                            
                            # Skip if this is a continuation of a previous merged cell
                            if cell_raw is None:
                                continue
                                
                            cell_text = str(cell_raw).strip() if cell_raw else ""
                            if not cell_text or "REHAT" in cell_text.upper(): continue
                            
                            time_header = clean_headers[col_idx] if col_idx < len(clean_headers) else ""
                            if not time_header: continue
                            
                            time_match = TIME_PATTERN.search(time_header)
                            if not time_match: continue
                            
                            time_start = time_match.group(1)
                            
                            # Calculate exact hours by evaluating the absolute start and end time of spanned headers
                            raw_dur_cols = 1
                            for n_idx in range(col_idx + 1, len(row)):
                                if row[n_idx] is None:
                                    raw_dur_cols += 1
                                else:
                                    break
                            
                            start_time_str = time_start
                            end_time_str = None
                            
                            for offset in range(raw_dur_cols):
                                h_idx = col_idx + offset
                                if h_idx < len(clean_headers):
                                    hd = clean_headers[h_idx]
                                    m = re.search(r'\d{2}:\d{2}\s*-\s*(\d{2}:\d{2})', hd)
                                    if m:
                                        end_time_str = m.group(1)
                            
                            duration = 1
                            if end_time_str:
                                duration = parse_duration(f"{start_time_str}-{end_time_str}")
                                
                            if duration <= 0 or duration > 10: duration = 1 # Fallback safeguard
                            
                            _process_cell_content(cell_text, day, time_start, duration)

def _process_cell_content(cell_text, day, time_start, duration):
    """
    Looks at the content of a grid cell.
    If it's a simple integer, it's a Footnote ID -> lookup in merge_map.
    If it's a direct course definition like 'BIC10403: S1 K', parse it directly.
    """
    cell_text = cell_text.replace('\n', ' ')
    
    # Extract global venue for this cell if it exists (allows unclosed brackets like '[I-C12- 121')
    v_match = re.search(r'\[([^[\]]+)(?:\]|$)', cell_text)
    if v_match:
        cell_venue = v_match.group(1).strip()
        tail_num = re.search(r'\b\d{1,3}\b\s*$', cell_venue)
        if tail_num:
            cell_venue = cell_venue[:tail_num.start()].strip().rstrip('-').strip()
    else:
        cell_venue = "TBA"

    # Check if a footnote ID is embedded at the end of the text (e.g. "BIS10103: S2 K ... 121")
    # This grabs any standalone 1-3 digit number floating at the tail end
    tail_match = re.search(r'\b(\d{1,3})\b\s*$', cell_text)
    if tail_match:
        f_id = tail_match.group(1)
        if f_id in merge_map:
            _deploy_targets(merge_map[f_id], day, time_start, duration, cell_venue)
            # We don't return here! We still want to parse the explicit course on top of the footnote!
            
    # Check if purely a footnote ID (legacy catch-all)
    maybe_id = cell_text.replace(' ', '')
    if maybe_id.isdigit() and maybe_id in merge_map:
        _deploy_targets(merge_map[maybe_id], day, time_start, duration, cell_venue)
        return
        
    # Check if it contains a Course string directly
    # E.g. "BIC20404: S3 K (I-zanes) [I-FSKTM-BS1]"
    # Simple regex for direct matches:
    direct_pattern = re.compile(r'([A-Z]{3,4}\s*\d{4,5}[A-Z]?)\s*:\s*(S\d+)\s*([KTA](?:/[KTA])?)')
    matches = list(direct_pattern.finditer(cell_text))
    
    if matches:
        for m in matches:
            code = normalize_code(m.group(1))
            sec = m.group(2)
            type_char = m.group(3)
            
            # Simple grab for lecturer/venue in the proximity
            lecturer = "Unknown"
            
            l_match = re.search(r'\((I-[^)]+)\)', cell_text)
            if l_match: lecturer = l_match.group(1).strip()
            
            target = {
                "code": code,
                "section": sec,
                "type_char": type_char,
                "type": parse_class_type(type_char.split('/')[0]),
                "lecturer": lecturer,
                "intake": extract_intakes(cell_text)
            }
            _deploy_targets([target], day, time_start, duration, cell_venue)
            


def _deploy_targets(targets, day, time_start, duration, shared_venue):
    """Pushes a list of mapped classes into the database."""
    for t in targets:
        code = t["code"]
        sec = t["section"]
        
        if code not in database:
            database[code] = {"name": course_titles.get(code, f"SUBJECT {code}"), "sections": {}, "hasMultipleSections": False}
        if sec not in database[code]["sections"]:
            database[code]["sections"][sec] = []
            
        # Avoid duplicate pushes
        hash_id = f"{day}_{time_start}_{t['type_char']}"
        exists = False
        for s in database[code]["sections"][sec]:
            if s.get("_hash") == hash_id:
                exists = True
                if s["venue"] == "TBA" and shared_venue != "TBA":
                    s["venue"] = shared_venue
                # If we now know the intake tag, append it
                if t["intake"] and t["intake"] not in s.get("intakes", []):
                    if "intakes" not in s: s["intakes"] = []
                    s["intakes"].append(t["intake"])
                break
                
        if not exists:
            new_slot = {
                "_hash": hash_id,
                "day": day,
                "time_start": time_start,
                "duration": duration,
                "section": f"{sec} {t['type_char']}",
                "type": t["type"],
                "lecturer": t["lecturer"],
                "venue": shared_venue,
            }
            if t["intake"]:
                new_slot["intakes"] = [t["intake"]]
            database[code]["sections"][sec].append(new_slot)


# --- EXPORT ---
def export_data():
    print("STEP 3: Cleaning and Exporting Data...")
    
    # POST-PROCESSING: Share missing 'Lecture' slots across multiple sections
    for code, data in database.items():
        if code == "": continue
        
        has_multi = len(data["sections"].keys()) > 1
        
        if has_multi:
            shared_lectures = []
            # Collect all unique lectures
            for sec, slots in data["sections"].items():
                for slot in slots:
                    if slot["type"] == "Lecture":
                        # Check if we already have this exact lecture time
                        already_has = any(l["day"] == slot["day"] and l["time_start"] == slot["time_start"] for l in shared_lectures)
                        if not already_has:
                            shared_lectures.append(slot.copy())

            # Distribute lectures to sections missing them
            if shared_lectures:
                for sec, slots in data["sections"].items():
                    has_lecture = any(s["type"] == "Lecture" for s in slots)
                    if not has_lecture:
                        for l in shared_lectures:
                            new_l = l.copy()
                            new_l["section"] = f"{sec} {new_l['type_char']}" if "type_char" in new_l else f"{sec} K"
                            # Ensure we don't duplicate _hash if it's there
                            if "_hash" in new_l:
                                new_l["_hash"] = f"{new_l['day']}_{new_l['time_start']}_K_shared_{sec}"
                            data["sections"][sec].append(new_l)

    # Cleanup hash fields and compute multiple sections
    final_db = {}
    for code, data in database.items():
        if code == "": continue
        
        clean_sections = {}
        for sec, slots in data["sections"].items():
            clean_slots = []
            for slot in slots:
                slot.pop("_hash", None)
                slot.pop("type_char", None) # remove internal tracking var
                clean_slots.append(slot)
            
            if clean_slots:
                clean_sections[sec] = clean_slots
            
        has_multi = len(clean_sections.keys()) > 1
        
        if clean_sections:
            final_db[code] = {
                "name": data["name"],
                "sections": clean_sections,
                "hasMultipleSections": has_multi
            }
            
    js_content = f"""/* ═══════════════════════════════════════════════
   UTHM Timetable Generator — data.js
   Automatically Generated via Python Parser
   Total courses: {len(final_db)}
═══════════════════════════════════════════════ */

const COURSES = {json.dumps(final_db, indent=2)};
"""
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"✅ Successfully extracted {len(final_db)} courses.")
    print(f"✅ Data exported to {OUTPUT_FILE}")

if __name__ == "__main__":
    extract_footnotes()
    extract_grid()
    export_data()
