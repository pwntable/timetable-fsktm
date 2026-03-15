import argparse
import json
import os
import re
from collections import defaultdict


def load_courses_from_data_js(path):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    marker = "const COURSES ="
    idx = text.find(marker)
    if idx == -1:
        raise ValueError(f"Could not find `{marker}` in {path}")

    start = text.find("{", idx)
    end = text.rfind("};")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"Could not locate JSON object bounds in {path}")

    obj_str = text[start : end + 1]
    return json.loads(obj_str)


def norm_duration(d):
    try:
        v = float(d)
        if abs(v - round(v)) < 1e-6:
            return int(round(v))
        return round(v, 2)
    except Exception:
        return d


def slot_struct_key(sec, slot):
    return (
        sec,
        slot.get("type", ""),
        slot.get("day", ""),
        slot.get("time_start", ""),
        norm_duration(slot.get("duration", 0)),
    )


def slot_detail_key(sec, slot):
    return (
        *slot_struct_key(sec, slot),
        slot.get("venue", ""),
        slot.get("lecturer", ""),
        tuple(slot.get("intakes") or []),
    )


def compare(old_db, new_db):
    old_codes = set(old_db.keys())
    new_codes = set(new_db.keys())

    report = {
        "courses": {
            "added": sorted(new_codes - old_codes),
            "removed": sorted(old_codes - new_codes),
            "name_changed": [],
        },
        "sections": {
            "added": {},   # code -> [sections]
            "removed": {}, # code -> [sections]
        },
        "slots": {
            "structural": {
                "added": defaultdict(lambda: defaultdict(list)),   # code -> sec -> [keys]
                "removed": defaultdict(lambda: defaultdict(list)),
            },
            "detail_only_changed": defaultdict(lambda: defaultdict(list)),  # code -> sec -> [struct_key]
        },
    }

    common_codes = sorted(old_codes & new_codes)
    for code in common_codes:
        o = old_db[code]
        n = new_db[code]

        if (o.get("name") or "") != (n.get("name") or ""):
            report["courses"]["name_changed"].append(
                {"code": code, "old": o.get("name"), "new": n.get("name")}
            )

        o_secs = set((o.get("sections") or {}).keys())
        n_secs = set((n.get("sections") or {}).keys())
        added_secs = sorted(n_secs - o_secs)
        removed_secs = sorted(o_secs - n_secs)
        if added_secs:
            report["sections"]["added"][code] = added_secs
        if removed_secs:
            report["sections"]["removed"][code] = removed_secs

        # Slot comparisons for common sections
        for sec in sorted(o_secs & n_secs):
            o_slots = (o.get("sections") or {}).get(sec) or []
            n_slots = (n.get("sections") or {}).get(sec) or []

            o_struct = {slot_struct_key(sec, s) for s in o_slots}
            n_struct = {slot_struct_key(sec, s) for s in n_slots}

            added_struct = sorted(n_struct - o_struct)
            removed_struct = sorted(o_struct - n_struct)
            if added_struct:
                report["slots"]["structural"]["added"][code][sec].extend(added_struct)
            if removed_struct:
                report["slots"]["structural"]["removed"][code][sec].extend(removed_struct)

            # Detail-only changes: structure unchanged but venue/lecturer/intakes changed
            if not added_struct and not removed_struct and o_struct:
                # Compare details per struct key
                o_by_struct = defaultdict(set)
                n_by_struct = defaultdict(set)
                for s in o_slots:
                    o_by_struct[slot_struct_key(sec, s)].add(slot_detail_key(sec, s))
                for s in n_slots:
                    n_by_struct[slot_struct_key(sec, s)].add(slot_detail_key(sec, s))
                for k in o_struct & n_struct:
                    if o_by_struct[k] != n_by_struct[k]:
                        report["slots"]["detail_only_changed"][code][sec].append(k)

    # Convert defaultdicts to plain dicts for JSON
    report["slots"]["structural"]["added"] = {
        code: dict(secs) for code, secs in report["slots"]["structural"]["added"].items()
    }
    report["slots"]["structural"]["removed"] = {
        code: dict(secs) for code, secs in report["slots"]["structural"]["removed"].items()
    }
    report["slots"]["detail_only_changed"] = {
        code: dict(secs) for code, secs in report["slots"]["detail_only_changed"].items()
    }

    return report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--old", required=True, help="Old data.js path")
    ap.add_argument("--new", required=True, help="New data.js path")
    ap.add_argument("--out", required=True, help="Output report JSON path")
    args = ap.parse_args()

    old_db = load_courses_from_data_js(args.old)
    new_db = load_courses_from_data_js(args.new)
    rep = compare(old_db, new_db)

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(rep, f, indent=2, ensure_ascii=False)

    # Minimal console summary
    print("Courses added:", len(rep["courses"]["added"]))
    print("Courses removed:", len(rep["courses"]["removed"]))
    print("Course names changed:", len(rep["courses"]["name_changed"]))
    print("Courses w/ sections added:", len(rep["sections"]["added"]))
    print("Courses w/ sections removed:", len(rep["sections"]["removed"]))


if __name__ == "__main__":
    main()

