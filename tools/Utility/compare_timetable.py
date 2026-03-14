import sys
import os
import json

# Add current directory to path so we can import parser
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from parser import TimetableParser

def get_data(version_suffix):
    pdf_files = [
        f"tools/PDF/by_course_{version_suffix}.pdf"
    ]
    parser = TimetableParser(pdf_files)
    parser.extract_footnotes()
    parser.extract_grid()
    return parser.get_final_data()

def compare_data(old_data, new_data):
    report = {
        "added_courses": [],
        "deleted_courses": [],
        "modified_courses": {}
    }

    old_codes = set(old_data.keys())
    new_codes = set(new_data.keys())

    report["added_courses"] = sorted(list(new_codes - old_codes))
    report["deleted_courses"] = sorted(list(old_codes - new_codes))

    common_codes = old_codes & new_codes
    for code in common_codes:
        old_course = old_data[code]
        new_course = new_data[code]
        
        modifications = {
            "added_sections": [],
            "deleted_sections": [],
            "modified_sections": {}
        }

        old_sections = set(old_course["sections"].keys())
        new_sections = set(new_course["sections"].keys())

        modifications["added_sections"] = sorted(list(new_sections - old_sections))
        modifications["deleted_sections"] = sorted(list(old_sections - new_sections))

        common_sections = old_sections & new_sections
        for sec in common_sections:
            if old_course["sections"][sec] != new_course["sections"][sec]:
                modifications["modified_sections"][sec] = {
                    "old": old_course["sections"][sec],
                    "new": new_course["sections"][sec]
                }

        if modifications["added_sections"] or modifications["deleted_sections"] or modifications["modified_sections"]:
            report["modified_courses"][code] = {
                "name": new_course["name"],
                "changes": modifications
            }

    return report

def print_report(report):
    print("=" * 50)
    print("TIMETABLE COMPARISON REPORT")
    print("=" * 50)

    print(f"\n[+] Added Courses ({len(report['added_courses'])}):")
    for code in report["added_courses"]:
        print(f"  - {code}")

    print(f"\n[-] Deleted Courses ({len(report['deleted_courses'])}):")
    for code in report["deleted_courses"]:
        print(f"  - {code}")

    print(f"\n[*] Modified Courses ({len(report['modified_courses'])}):")
    for code, details in report["modified_courses"].items():
        print(f"  {code}: {details['name']}")
        changes = details["changes"]
        if changes["added_sections"]:
            print(f"    + Added Sections: {', '.join(changes['added_sections'])}")
        if changes["deleted_sections"]:
            print(f"    - Deleted Sections: {', '.join(changes['deleted_sections'])}")
        if changes["modified_sections"]:
            print(f"    ~ Modified Sections: {', '.join(changes['modified_sections'].keys())}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        # Default to the versions mentioned by the user
        old_ver = "12032026"
        new_ver = "14032026"
    else:
        old_ver = sys.argv[1]
        new_ver = sys.argv[2]

    print(f"Parsing Old Data ({old_ver})...")
    old_data = get_data(old_ver)
    
    print(f"Parsing New Data ({new_ver})...")
    new_data = get_data(new_ver)

    print("Comparing data...")
    report = compare_data(old_data, new_data)
    
    print_report(report)
    
    # Save report to a file for later review
    with open("comparison_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print("\n✅ Full report saved to comparison_report.json")
