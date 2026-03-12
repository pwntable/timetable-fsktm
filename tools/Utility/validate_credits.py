import json
import re

print("Validating data.js against credit hour rules...")

with open("data.js", "r", encoding="utf-8") as f:
    content = f.read()
    
# Extract the JSON part
json_str = content[content.find("const COURSES = ") + 16:]
json_str = json_str.strip().rstrip(";")
data = json.loads(json_str)

errors = []

for code, info in data.items():
    if len(code) < 8: continue
    # Extract credit from the last character of the course code
    # e.g. BIC10403 -> 3
    # e.g. BIE20404 -> 4
    try:
        credit = int(code[-1])
    except ValueError:
        continue
        
    for sec_name, slots in info["sections"].items():
        has_k = any(s["type"] == "Lecture" for s in slots)
        has_a = any(s["type"] == "Lab/Amali" for s in slots)
        
        # Rule 1: Every course/section MUST have a K slot
        if not has_k:
            errors.append(f"[{code} {sec_name}] Missing 'K' (Lecture) slot.")
            
        # Rule 2: 3-credit (or 4-credit) courses must have BOTH K and A
        if credit >= 3 and not has_a:
            # Some 3 credit courses might use 'T' (Tutorial) instead of A, check that
            has_t = any(s["type"] == "Tutorial" for s in slots)
            if not has_t:
                errors.append(f"[{code} {sec_name}] {credit}-credit course is missing 'A' or 'T' slot.")

if errors:
    print(f"Found {len(errors)} validation anomalies. Writing to validation_log.txt for manual review...")
    with open("validation_log.txt", "w", encoding="utf-8") as out:
        out.write("Timetable Validation Log\n")
        out.write("========================\n")
        out.write(f"Found {len(errors)} anomalies (Courses that don't match typical K/A credit logic):\n\n")
        for e in errors:
            out.write(e + "\n")
else:
    print("✅ All courses pass the Credit Hour K/A slot validation rules!")
    with open("validation_log.txt", "w", encoding="utf-8") as out:
        out.write("Timetable Validation Log\n========================\n✅ No anomalies found!\n")
