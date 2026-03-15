import pdfplumber
import json
import re
import os
from datetime import datetime

# Repo-relative paths (works regardless of current working directory)
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PDF_DIR = os.path.join(REPO_ROOT, "tools", "PDF")
SNAPSHOT_DIR = os.path.join(REPO_ROOT, "tools", "Utility", "snapshots")
UPDATE_META_PATH = os.path.join(REPO_ROOT, "logs", "update_meta.json")

# Basic Regex for Course / Intakes / Footnotes
COURSE_TITLE_PATTERN = re.compile(r'([A-Z]{3,4}\s*\d{4,5}[A-Z]?)\s*-\s*([A-Za-z0-9 &/-]+)')
TIME_PATTERN = re.compile(r'(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})')

class TimetableParser:
    def __init__(self, pdf_files):
        self.pdf_files = pdf_files
        self.database = {}
        self.course_titles = {}
        self.merge_map = {}  # { "footnote_id": [...] } - Now reset per file
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

    def process_all(self):
        """Processes all files, ensuring footnotes are handled per-file."""
        # Pre-pass: Extract all possible course titles across all files
        print("PRE-STEP: Extracting All Course Titles...")
        for filename in self.pdf_files:
            if not os.path.exists(filename): continue
            with pdfplumber.open(filename) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        # Extract course titles only from "CODE - TITLE" patterns to avoid
                        # accidentally capturing timetable labels like "CODE : S8 A".
                        for match in COURSE_TITLE_PATTERN.finditer(text):
                            code = self.normalize_code(match.group(1))
                            title = re.sub(r'\s+', ' ', match.group(2) or '').strip().upper()
                            # Guard against false positives like "S8 A", "S1 K", etc.
                            if not title:
                                continue
                            if re.fullmatch(r'S\d+(?:/\d+)?\s*[KTA](?:/[KTA])?', title):
                                continue
                            if len(title) < 4:
                                continue
                            self.course_titles[code] = title

        # Main Pass
        for filename in self.pdf_files:
            if not os.path.exists(filename): continue
            print(f"Processing {filename}...")
            self.merge_map = {} # Reset footnotes for each file
            
            with pdfplumber.open(filename) as pdf:
                # 1. Extract footnotes for THIS file
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

                # 2. Extract grid for THIS file
                for page in pdf.pages:
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
            
            sec_match = re.search(r'(S\d+(?:/\d+)?)\s*[:\s]*\s*([KTA](?:/[KTA])?)', part)
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

    def _process_cell_content(self, cell_text, day, time_start, duration):
        cell_text = cell_text.replace('\n', ' ')
        v_match = re.search(r'\[([^[\]]+)(?:\]|$)', cell_text)
        if v_match:
            cell_venue = v_match.group(1).strip()
            # Clean venue string
            cell_venue = re.sub(r'\s*\b\d{1,3}\b\s*$', '', cell_venue).strip().rstrip('-').strip()
        else:
            cell_venue = "TBA"

        # Check for footnote ID at the end
        tail_match = re.search(r'\b(\d{1,3})\b\s*$', cell_text)
        if tail_match:
            f_id = tail_match.group(1)
            if f_id in self.merge_map:
                self._deploy_targets(self.merge_map[f_id], day, time_start, duration, cell_venue)
                
        # Pure footnote ID case
        maybe_id = cell_text.replace(' ', '')
        if maybe_id.isdigit() and maybe_id in self.merge_map:
            self._deploy_targets(self.merge_map[maybe_id], day, time_start, duration, cell_venue)
            return
            
        # Direct course string case: Code: Sec Type
        direct_pattern = re.compile(r'([A-Z]{3,4}\s*\d{4,5}[A-Z]?)\s*[:\s]\s*(S\d+)\s*([KTA](?:/[KTA])?)')
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
                self.database[code] = {"name": self.course_titles.get(code, f"SUBJECT {code}"), "sections": {}}
            if sec not in self.database[code]["sections"]:
                self.database[code]["sections"][sec] = []
                
            hash_id = f"{day}_{time_start}_{t['type_char']}"
            exists = False
            for s in self.database[code]["sections"][sec]:
                if s.get("_hash") == hash_id:
                    exists = True
                    # Update venue if TBA
                    if s["venue"] == "TBA" and shared_venue != "TBA":
                        s["venue"] = shared_venue
                    # Supplementary intake info
                    if t["intake"] and t["intake"] not in s.get("intakes", []):
                        if "intakes" not in s: s["intakes"] = []
                        if t["intake"] not in " ".join(s["intakes"]):
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
        # Final pass for sharing lectures across sections (Only for Multi-section courses)
        for code, data in db.items():
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
            
            if clean_sections:
                final_db[code] = {
                    "name": self.course_titles.get(code, data["name"]), # Ensure title is the latest we found
                    "sections": clean_sections,
                    "hasMultipleSections": len(clean_sections.keys()) > 1
                }
        return final_db

    def save_anomalies(self, filepath):
        if not self.anomalies: return
        with open(filepath, 'w', encoding='utf-8') as f:
            for anomaly in self.anomalies:
                f.write(anomaly + "\n")

def _normalize_duration(d):
    try:
        v = float(d)
        if abs(v - round(v)) < 1e-6:
            return int(round(v))
        return round(v, 2)
    except Exception:
        return d

def _slot_key(section, slot):
    return (
        section,
        slot.get("type", ""),
        slot.get("day", ""),
        slot.get("time_start", ""),
        _normalize_duration(slot.get("duration", 0)),
    )

def _deepcopy_json(obj):
    return json.loads(json.dumps(obj))

def _load_courses_from_data_js(path):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    marker = "const COURSES ="
    idx = text.find(marker)
    if idx == -1:
        return {}
    start = text.find("{", idx)
    end = text.rfind("};")
    if start == -1 or end == -1 or end <= start:
        return {}
    return json.loads(text[start : end + 1])

def _diff_dbs(old_db, new_db):
    old_codes = set(old_db.keys())
    new_codes = set(new_db.keys())

    diff = {
        "courses": {
            "added": sorted(list(new_codes - old_codes)),
            "removed": sorted(list(old_codes - new_codes)),
            "name_changed": [],
        },
        "sections": {"added": {}, "removed": {}},
        "slots": {"structural": {"added": {}, "removed": {}}, "detail_only_changed": {}},
    }

    common = sorted(list(old_codes & new_codes))
    for code in common:
        o = old_db.get(code) or {}
        n = new_db.get(code) or {}

        if (o.get("name") or "") != (n.get("name") or ""):
            diff["courses"]["name_changed"].append({"code": code, "old": o.get("name"), "new": n.get("name")})

        o_secs = set((o.get("sections") or {}).keys())
        n_secs = set((n.get("sections") or {}).keys())
        add_secs = sorted(list(n_secs - o_secs))
        rem_secs = sorted(list(o_secs - n_secs))
        if add_secs:
            diff["sections"]["added"][code] = add_secs
        if rem_secs:
            diff["sections"]["removed"][code] = rem_secs

        for sec in sorted(list(o_secs & n_secs)):
            o_slots = ((o.get("sections") or {}).get(sec)) or []
            n_slots = ((n.get("sections") or {}).get(sec)) or []

            def sk(s):
                return (
                    sec,
                    s.get("type", ""),
                    s.get("day", ""),
                    s.get("time_start", ""),
                    _normalize_duration(s.get("duration", 0)),
                )

            o_struct = {sk(s) for s in o_slots}
            n_struct = {sk(s) for s in n_slots}
            add_struct = sorted(list(n_struct - o_struct))
            rem_struct = sorted(list(o_struct - n_struct))
            if add_struct:
                diff["slots"]["structural"]["added"].setdefault(code, {}).setdefault(sec, []).extend(add_struct)
            if rem_struct:
                diff["slots"]["structural"]["removed"].setdefault(code, {}).setdefault(sec, []).extend(rem_struct)

            if not add_struct and not rem_struct and o_struct:
                # compare detail-only changes
                def dk(s):
                    return (
                        *sk(s),
                        s.get("venue", ""),
                        s.get("lecturer", ""),
                        tuple(s.get("intakes") or []),
                    )
                o_by = {}
                n_by = {}
                for s in o_slots:
                    o_by.setdefault(sk(s), set()).add(dk(s))
                for s in n_slots:
                    n_by.setdefault(sk(s), set()).add(dk(s))
                changed = [k for k in (o_struct & n_struct) if o_by.get(k, set()) != n_by.get(k, set())]
                if changed:
                    diff["slots"]["detail_only_changed"].setdefault(code, {}).setdefault(sec, []).extend(sorted(changed))

    return diff

def _find_latest_timetable_date(pdf_dir):
    """Finds the latest YYYYMMDD suffix from files like by_course_YYYYMMDD.pdf."""
    if not os.path.isdir(pdf_dir):
        return None
    dates = []
    for name in os.listdir(pdf_dir):
        m = re.match(r"^by_course_(\d{8})\.pdf$", name)
        if m:
            dates.append(m.group(1))
    return max(dates) if dates else None

def _build_pdf_list_for_date(pdf_dir, date_str):
    """Returns all existing timetable PDFs for a given date, in preferred priority order."""
    if not date_str:
        return []
    preferred = [
        f"by_course_{date_str}.pdf",
        f"by_lecturer_{date_str}.pdf",
        f"by_room_{date_str}.pdf",
        f"by_batch_{date_str}.pdf",
    ]
    out = []
    for fname in preferred:
        path = os.path.join(pdf_dir, fname)
        if os.path.exists(path):
            out.append(path)
    return out

def _reconcile_sources(source_dbs, source_files):
    """
    Uses `by_course` as the canonical schedule source, then *enriches* missing details
    (venue/lecturer/intakes) from other sources *only when the slot matches exactly*.
    Also produces a report of disagreements/unmatched slots for debugging.
    """
    if not source_dbs:
        return {}, {"error": "no_sources"}

    def _is_by_course(path):
        return "by_course_" in os.path.basename(path)

    base_idx = 0
    for i, f in enumerate(source_files):
        if _is_by_course(f):
            base_idx = i
            break

    base_db = _deepcopy_json(source_dbs[base_idx] or {})
    report = {
        "base": os.path.basename(source_files[base_idx]),
        "sources": [os.path.basename(p) for p in source_files],
        "enriched": {"venue": 0, "lecturer": 0, "intakes": 0},
        "unmatched_slots": {},   # per source -> count
        "disagreements": {},     # per source -> count
        "unmatched_samples": {},     # per source -> [sample]
        "disagreement_samples": {},  # per source -> [sample]
        "missing_courses_in_base": {},  # per source -> count
        "missing_sections_in_base": {}, # per source -> count
        "missing_courses_samples": {},  # per source -> [codes]
        "missing_sections_samples": {}, # per source -> [sample]
    }

    # Index base slots for exact matching and for disagreement detection.
    base_exact = {}   # (code, slot_key) -> slot_ref
    base_coarse = {}  # (code, section, type, day) -> set of (time_start, duration)

    for code, c in base_db.items():
        for sec, slots in (c.get("sections") or {}).items():
            for slot in slots:
                k = (code, _slot_key(sec, slot))
                base_exact[k] = slot
                ck = (code, sec, slot.get("type", ""), slot.get("day", ""))
                base_coarse.setdefault(ck, set()).add((slot.get("time_start", ""), _normalize_duration(slot.get("duration", 0))))

    # Enrich from other sources.
    for idx, (src_db, src_file) in enumerate(zip(source_dbs, source_files)):
        if idx == base_idx:
            continue
        src_name = os.path.basename(src_file)
        unmatched = 0
        disagreements = 0
        missing_courses = 0
        missing_sections = 0
        unmatched_samples = []
        disagreement_samples = []
        missing_courses_samples = []
        missing_sections_samples = []
        sample_cap = 40

        for code, c in (src_db or {}).items():
            if code not in base_db:
                missing_courses += 1
                if len(missing_courses_samples) < sample_cap:
                    missing_courses_samples.append(code)
                continue
            base_sections = base_db[code].get("sections") or {}
            for sec, slots in (c.get("sections") or {}).items():
                if sec not in base_sections:
                    missing_sections += 1
                    if len(missing_sections_samples) < sample_cap:
                        missing_sections_samples.append({"code": code, "section": sec})
                    continue
                for slot in slots:
                    sk = _slot_key(sec, slot)
                    exact_key = (code, sk)
                    if exact_key in base_exact:
                        dst = base_exact[exact_key]

                        # Venue
                        src_venue = slot.get("venue")
                        if (not dst.get("venue") or dst.get("venue") == "TBA") and src_venue and src_venue != "TBA":
                            dst["venue"] = src_venue
                            report["enriched"]["venue"] += 1

                        # Lecturer
                        src_lec = slot.get("lecturer")
                        if (not dst.get("lecturer") or dst.get("lecturer") == "Unknown") and src_lec and src_lec != "Unknown":
                            dst["lecturer"] = src_lec
                            report["enriched"]["lecturer"] += 1

                        # Intakes (union)
                        src_intakes = slot.get("intakes") or []
                        if src_intakes:
                            dst.setdefault("intakes", [])
                            before = set(dst["intakes"])
                            for it in src_intakes:
                                if it and it not in before:
                                    dst["intakes"].append(it)
                            if set(dst["intakes"]) != before:
                                report["enriched"]["intakes"] += 1
                    else:
                        # Check if this looks like a time-shift disagreement for the same class.
                        ck = (code, sec, slot.get("type", ""), slot.get("day", ""))
                        if ck in base_coarse:
                            disagreements += 1
                            if len(disagreement_samples) < sample_cap:
                                disagreement_samples.append({
                                    "code": code,
                                    "section": sec,
                                    "type": slot.get("type", ""),
                                    "day": slot.get("day", ""),
                                    "source_time_start": slot.get("time_start", ""),
                                    "source_duration": _normalize_duration(slot.get("duration", 0)),
                                    "base_candidates": sorted(list(base_coarse.get(ck) or [])),
                                })
                        else:
                            unmatched += 1
                            if len(unmatched_samples) < sample_cap:
                                unmatched_samples.append({
                                    "code": code,
                                    "section": sec,
                                    "type": slot.get("type", ""),
                                    "day": slot.get("day", ""),
                                    "time_start": slot.get("time_start", ""),
                                    "duration": _normalize_duration(slot.get("duration", 0)),
                                })

        report["unmatched_slots"][src_name] = unmatched
        report["disagreements"][src_name] = disagreements
        report["unmatched_samples"][src_name] = unmatched_samples
        report["disagreement_samples"][src_name] = disagreement_samples
        report["missing_courses_in_base"][src_name] = missing_courses
        report["missing_sections_in_base"][src_name] = missing_sections
        report["missing_courses_samples"][src_name] = missing_courses_samples
        report["missing_sections_samples"][src_name] = missing_sections_samples

    # Ensure flags remain correct after enrichment.
    for code, c in base_db.items():
        secs = c.get("sections") or {}
        c["hasMultipleSections"] = len(secs.keys()) > 1

    return base_db, report

def run_parser(pdf_files, output_file, reconcile=False, reconcile_report_path=None):
    pdf_files = [p for p in (pdf_files or []) if p and os.path.exists(p)]
    if not pdf_files:
        raise FileNotFoundError("No PDF files found to parse.")

    if reconcile and len(pdf_files) > 1:
        source_dbs = []
        for f in pdf_files:
            p = TimetableParser([f])
            p.process_all()
            source_dbs.append(p.get_final_data())
        final_db, rep = _reconcile_sources(source_dbs, pdf_files)
        if reconcile_report_path:
            os.makedirs(os.path.dirname(reconcile_report_path), exist_ok=True)
            with open(reconcile_report_path, "w", encoding="utf-8") as fp:
                json.dump(rep, fp, indent=2, ensure_ascii=False)
    else:
        parser = TimetableParser(pdf_files)
        parser.process_all()
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
    # Only available in single-parser mode; in reconcile mode, anomalies are per-source.
    if not (reconcile and len(pdf_files) > 1):
        parser.save_anomalies(os.path.join(REPO_ROOT, "intake_anomalies.txt"))

if __name__ == "__main__":
    latest = _find_latest_timetable_date(PDF_DIR)
    PDF_FILES = _build_pdf_list_for_date(PDF_DIR, latest)
    if not PDF_FILES:
        raise SystemExit(f"No timetable PDFs found in: {PDF_DIR}")

    # Capture previous parsed data (for on-load update popup).
    # Prefer comparing against the previous timetable *version* (stored in `logs/update_meta.json`)
    # and snapshots, not just "whatever data.js currently is".
    data_path = os.path.join(REPO_ROOT, "data.js")
    prev_date = None
    try:
        if os.path.exists(UPDATE_META_PATH):
            with open(UPDATE_META_PATH, "r", encoding="utf-8") as f:
                prev_date = (json.load(f) or {}).get("latestDate")
    except Exception:
        prev_date = None

    old_source = "data.js"
    old_db = _load_courses_from_data_js(data_path) if os.path.exists(data_path) else {}
    if prev_date and prev_date != latest:
        snap_path = os.path.join(SNAPSHOT_DIR, f"data_{prev_date}.js")
        if os.path.exists(snap_path):
            old_db = _load_courses_from_data_js(snap_path)
            old_source = os.path.basename(snap_path)

    # Generate from multiple sources safely:
    # - `by_course` is treated as canonical for (day/time/duration/type/section)
    # - other PDFs only enrich details when the slot matches exactly
    out_path = os.path.join(REPO_ROOT, "data.js")
    rep_path = os.path.join(REPO_ROOT, "logs", f"reconcile_report_{latest}.json")
    run_parser(PDF_FILES, out_path, reconcile=True, reconcile_report_path=rep_path)

    # Build/update `updates.js` so the website can show "what changed" on load (no fetch needed).
    new_db = _load_courses_from_data_js(out_path)
    diff = _diff_dbs(old_db, new_db)
    try:
        with open(rep_path, "r", encoding="utf-8") as f:
            rec = json.load(f)
    except Exception:
        rec = {}

    updates = {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "timetable": {
            "latestDate": latest,
            "previousDate": prev_date,
            "diffBase": old_source,
            "base": rec.get("base"),
            "sourcesUsed": rec.get("sources") or [os.path.basename(p) for p in PDF_FILES],
        },
        "changes": diff,
    }

    # JSON copy (for dev) + JS global (for browser)
    os.makedirs(os.path.join(REPO_ROOT, "logs"), exist_ok=True)
    with open(os.path.join(REPO_ROOT, "logs", f"latest_update_{latest}.json"), "w", encoding="utf-8") as f:
        json.dump(updates, f, indent=2, ensure_ascii=False)

    # Persist snapshot + meta for next run.
    os.makedirs(SNAPSHOT_DIR, exist_ok=True)
    try:
        with open(out_path, "r", encoding="utf-8") as src, open(os.path.join(SNAPSHOT_DIR, f"data_{latest}.js"), "w", encoding="utf-8") as dst:
            dst.write(src.read())
    except Exception:
        pass
    with open(UPDATE_META_PATH, "w", encoding="utf-8") as f:
        json.dump({"latestDate": latest, "generatedAt": updates["generatedAt"]}, f, indent=2, ensure_ascii=False)

    with open(os.path.join(REPO_ROOT, "updates.js"), "w", encoding="utf-8") as f:
        f.write("/* Auto-generated. Do not edit by hand. */\n")
        f.write("window.LATEST_UPDATE = ")
        f.write(json.dumps(updates, ensure_ascii=False, indent=2))
        f.write(";\n")
