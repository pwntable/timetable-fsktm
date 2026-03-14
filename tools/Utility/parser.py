import pdfplumber
import json
import re
import os

# Basic Regex for Course / Intakes / Footnotes
COURSE_TITLE_PATTERN = re.compile(r'([A-Z]{3,4}\s*\d{4,5}[A-Z]?)\s*-\s*([A-Za-z0-9 &/-]+)')
TIME_PATTERN = re.compile(r'(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})')

class TimetableParser:
    def __init__(self, pdf_files):
        self.pdf_files = pdf_files
        self.database = {}
        self.course_titles = {}
        self.merge_map = {}  # { "footnote_id": [{"code", "lecturer", "intake", "section", "type_char", "type_full"}, ...]}
        self.anomalies = []

    def normalize_code(self, code):
        return code.replace(" ", "").upper()

    def parse_class_type(self, type_char):
        mapping = {"K": "Lecture", "T": "Tutorial", "A": "Lab/Amali"}
        return mapping.get(type_char, "Unknown")

    def parse_duration(self, time_str):
        try:
            start_t, end_t = time_str.split('-')
            sh, sm = map(int, start_t.strip().split(':'))
            eh, em = map(int, end_t.strip().split(':'))
            
            if sh < 8: sh += 12
            if eh < 8: eh += 12
            if eh < sh and eh == 12: eh = 12
                
            return (eh + em/60.0) - (sh + sm/60.0)
        except:
            return 1

    def extract_intakes(self, text):
        angle_matches = re.findall(r'<([^>]+)>', text)
        clean_tags = []
        
        for tag in angle_matches:
            tag = tag.strip()
            if not tag: continue
            
            cleaned = re.sub(r'\s*S\d+(?:/\d+)?\s*[KTA](?:\s*\d+)?\s*$', '', tag).strip()
            cleaned = re.sub(r'([A-Z]+)-\s+(\d[A-Z]{3})', r'\1-\2', cleaned)
            
            pattern = r'^[A-Z]+-\d[A-Z]{3}'
            if not re.match(pattern, cleaned):
                self.anomalies.append(f"Anomalous Intake Format: '{cleaned}' from original '{tag}'")
                    
            if cleaned and cleaned not in clean_tags:
                clean_tags.append(cleaned)
                
        return " | ".join(clean_tags)

    def extract_footnotes(self):
        print(f"STEP 1: Extracting Footnotes from {len(self.pdf_files)} files...")
        for filename in self.pdf_files:
            if not os.path.exists(filename): continue
            with pdfplumber.open(filename) as pdf:
                for page in pdf.pages:
                    res = page.search(r'Footnote[:\s]', regex=True)
                    if not res: continue
                    
                    y0 = res[0]['top'] - 2
                    cropped = page.crop((0, max(0, y0), page.width, page.height))
                    footnote_text = cropped.extract_text()
                    if not footnote_text: continue
                    
                    current_id = None
                    current_text = ""
                    
                    for line in footnote_text.split('\n'):
                        line = line.strip()
                        if not line or "INI ADALAH CETAKAN" in line or "PAGE" in line or "Footnote" in line: continue
                            
                        id_match = re.search(r'^\s*(\d{1,3})\s*[-–—]+', line)
                        if id_match:
                            if current_id and current_text:
                                self._parse_footnote_line(current_id, current_text)
                            current_id = id_match.group(1)
                            current_text = line[id_match.end():]
                        else:
                            if current_id:
                                current_text += " " + line
                                
                    if current_id and current_text:
                        self._parse_footnote_line(current_id, current_text)

    def _parse_footnote_line(self, m_id, text):
        if m_id not in self.merge_map:
            self.merge_map[m_id] = []
            
        parts = text.split(',')
        last_code = None
        last_lec = "Unknown"
        last_intake = []
        
        for part in parts:
            part = part.strip()
            if not part: continue
            
            code_match = re.search(r'([A-Z]{3,4}\s*\d{4,5}[A-Z]?)', part)
            if code_match:
                c_code = self.normalize_code(code_match.group(1))
                last_code = c_code
            else:
                c_code = last_code
                
            if not c_code: continue
            
            sec_match = re.search(r'(S\d+(?:/\d+)?)\s*:\s*([KTA](?:/[KTA])?)', part)
            if not sec_match: continue
            c_sec = sec_match.group(1).replace(' ', '')
            c_type_char = sec_match.group(2)
            c_type_full = self.parse_class_type(c_type_char.split('/')[0])
            
            lec_match = re.search(r'\(([^)]+)\)', part)
            if lec_match:
                c_lecturer = lec_match.group(1).strip()
                last_lec = c_lecturer
            else:
                c_lecturer = last_lec
            
            extracted_intakes = self.extract_intakes(part)
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
            
            found_existing = False
            for t in self.merge_map[m_id]:
                if t["code"] == target["code"] and t["section"] == target["section"] and t["type_char"] == target["type_char"]:
                    found_existing = True
                    if target["intake"]:
                        if not t["intake"]:
                            t["intake"] = target["intake"]
                        elif target["intake"] not in t["intake"]:
                            t["intake"] += " | " + target["intake"]
                    break
                    
            if not found_existing:
                self.merge_map[m_id].append(target)

    def extract_grid(self):
        print(f"STEP 2: Processing Table Grids from {len(self.pdf_files)} files...")
        for filename in self.pdf_files:
            if not os.path.exists(filename): continue
            with pdfplumber.open(filename) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        for match in COURSE_TITLE_PATTERN.finditer(text):
                            code = self.normalize_code(match.group(1))
                            title = match.group(2).strip().upper()
                            if len(title) > 3:
                                self.course_titles[code] = title
                                if code not in self.database:
                                    self.database[code] = {"name": title, "sections": {}, "hasMultipleSections": False}

                    tables = page.find_tables()
                    if not tables: continue
                    
                    for table in tables:
                        cells = table.extract()
                        if not cells or len(cells) < 2: continue
                        
                        headers = cells[1] if len(cells) > 1 and "08:00" in str(cells[1]) else cells[0]
                        start_row_idx = 2 if headers == cells[1] else 1
                        clean_headers = [str(h).replace('\n', ' ') if h else "" for h in headers]

                        for row_idx in range(start_row_idx, len(cells)):
                            row = cells[row_idx]
                            if not row or not row[0]: continue
                            
                            day = str(row[0]).replace('\n', '').strip()
                            if day not in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
                                continue
                            
                            for col_idx in range(1, len(row)):
                                cell_raw = row[col_idx]
                                if cell_raw is None: continue
                                    
                                cell_text = str(cell_raw).strip() if cell_raw else ""
                                if not cell_text or "REHAT" in cell_text.upper(): continue
                                
                                time_header = clean_headers[col_idx] if col_idx < len(clean_headers) else ""
                                if not time_header: continue
                                
                                time_match = TIME_PATTERN.search(time_header)
                                if not time_match: continue
                                
                                time_start = time_match.group(1)
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
                                    duration = self.parse_duration(f"{start_time_str}-{end_time_str}")
                                    
                                if duration <= 0 or duration > 10: duration = 1
                                
                                self._process_cell_content(cell_text, day, time_start, duration)

    def _process_cell_content(self, cell_text, day, time_start, duration):
        cell_text = cell_text.replace('\n', ' ')
        v_match = re.search(r'\[([^[\]]+)(?:\]|$)', cell_text)
        if v_match:
            cell_venue = v_match.group(1).strip()
            tail_num = re.search(r'\b\d{1,3}\b\s*$', cell_venue)
            if tail_num:
                cell_venue = cell_venue[:tail_num.start()].strip().rstrip('-').strip()
        else:
            cell_venue = "TBA"

        tail_match = re.search(r'\b(\d{1,3})\b\s*$', cell_text)
        if tail_match:
            f_id = tail_match.group(1)
            if f_id in self.merge_map:
                self._deploy_targets(self.merge_map[f_id], day, time_start, duration, cell_venue)
                
        maybe_id = cell_text.replace(' ', '')
        if maybe_id.isdigit() and maybe_id in self.merge_map:
            self._deploy_targets(self.merge_map[maybe_id], day, time_start, duration, cell_venue)
            return
            
        direct_pattern = re.compile(r'([A-Z]{3,4}\s*\d{4,5}[A-Z]?)\s*:\s*(S\d+)\s*([KTA](?:/[KTA])?)')
        matches = list(direct_pattern.finditer(cell_text))
        
        if matches:
            for m in matches:
                code = self.normalize_code(m.group(1))
                sec = m.group(2)
                type_char = m.group(3)
                lecturer = "Unknown"
                l_match = re.search(r'\((I-[^)]+)\)', cell_text)
                if l_match: lecturer = l_match.group(1).strip()
                
                target = {
                    "code": code,
                    "section": sec,
                    "type_char": type_char,
                    "type": self.parse_class_type(type_char.split('/')[0]),
                    "lecturer": lecturer,
                    "intake": self.extract_intakes(cell_text)
                }
                self._deploy_targets([target], day, time_start, duration, cell_venue)

    def _deploy_targets(self, targets, day, time_start, duration, shared_venue):
        for t in targets:
            code = t["code"]
            sec = t["section"]
            
            if code not in self.database:
                self.database[code] = {"name": self.course_titles.get(code, f"SUBJECT {code}"), "sections": {}, "hasMultipleSections": False}
            if sec not in self.database[code]["sections"]:
                self.database[code]["sections"][sec] = []
                
            hash_id = f"{day}_{time_start}_{t['type_char']}"
            exists = False
            for s in self.database[code]["sections"][sec]:
                if s.get("_hash") == hash_id:
                    exists = True
                    if s["venue"] == "TBA" and shared_venue != "TBA":
                        s["venue"] = shared_venue
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
                self.database[code]["sections"][sec].append(new_slot)

    def get_final_data(self):
        db = self.database
        for code, data in db.items():
            if code == "": continue
            has_multi = len(data["sections"].keys()) > 1
            if has_multi:
                shared_lectures = []
                for sec, slots in data["sections"].items():
                    for slot in slots:
                        if slot["type"] == "Lecture":
                            already_has = any(l["day"] == slot["day"] and l["time_start"] == slot["time_start"] for l in shared_lectures)
                            if not already_has:
                                shared_lectures.append(slot.copy())

                if shared_lectures:
                    for sec, slots in data["sections"].items():
                        has_lecture = any(s["type"] == "Lecture" for s in slots)
                        if not has_lecture:
                            for l in shared_lectures:
                                new_l = l.copy()
                                new_l["section"] = f"{sec} {new_l['type_char']}" if "type_char" in new_l else f"{sec} K"
                                if "_hash" in new_l:
                                    new_l["_hash"] = f"{new_l['day']}_{new_l['time_start']}_K_shared_{sec}"
                                data["sections"][sec].append(new_l)

        final_db = {}
        for code, data in db.items():
            if code == "": continue
            clean_sections = {}
            for sec, slots in data["sections"].items():
                clean_slots = []
                for slot in slots:
                    s = slot.copy()
                    s.pop("_hash", None)
                    s.pop("type_char", None)
                    clean_slots.append(s)
                if clean_slots:
                    clean_sections[sec] = clean_slots
            has_multi = len(clean_sections.keys()) > 1
            if clean_sections:
                final_db[code] = {
                    "name": data["name"],
                    "sections": clean_sections,
                    "hasMultipleSections": has_multi
                }
        return final_db

    def save_anomalies(self, filepath):
        with open(filepath, 'w', encoding='utf-8') as f:
            for anomaly in self.anomalies:
                f.write(anomaly + "\n")

def run_parser(pdf_files, output_file):
    parser = TimetableParser(pdf_files)
    parser.extract_footnotes()
    parser.extract_grid()
    final_db = parser.get_final_data()
    
    js_content = f"""/* ═══════════════════════════════════════════════
   UTHM Timetable Generator — data.js
   Automatically Generated via Python Parser
   Total courses: {len(final_db)}
═══════════════════════════════════════════════ */

const COURSES = {json.dumps(final_db, indent=2)};
"""
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print(f"✅ Successfully extracted {len(final_db)} courses to {output_file}.")
    parser.save_anomalies("intake_anomalies.txt")

if __name__ == "__main__":
    PDF_FILES = ["tools/PDF/by_course_14032026.pdf"]
    run_parser(PDF_FILES, "data.js")
