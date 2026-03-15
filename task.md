# Task List: Two-Pass PDF Timetable Parser

- [x] Write `implementation_plan.md` and await user approval ✅
- [x] Install required Python dependencies (`pdfplumber`, `pandas`)
- [x] Create `parser.py` covering features:
  - Extracting footnotes mappings from PDF
  - Extracting dynamic time headers from PDF
  - Linking footnotes back to the timetable grid
  - Outputting formatted `data.js`
- [x] Run parser and verify the new `data.js` output
- [x] Archive legacy `parse_all.js` to `parse_all_archive.js`
- [x] Manually verify logic against credit hours (K and A slots)

# Task List: Footnote Enhancement & Validation Logging
- [x] Update `parser.py` regex to handle varying bracket types (`<Batch>`, `[Location]`, `[Batch...]`, `(Lecturer)`) and comma separation in footprints.
- [x] Update `validate_credits.py` to output a log file of discrepancies for manual review.

# Task List: Duration Bug & Missing Sections Fix
- [x] Fix footnote extraction regex to successfully split out ALL sections in footnote `54`.
- [x] Implement cell-width/colspan detection to correctly assign 2 or 3-hour durations instead of defaulting to 1 hour.

# Task List: Formatting & Deduplication Fixes
- [x] Prevent duplicate conflicting classes by strictly deriving schedule from `by_course.pdf` only.
- [x] Enforce accurate durations by preventing non-native PDF footprint injections from creating large empty slot durations.
- [x] Filter and sanitize `< >` intake patterns (e.g. removing `S1 K 01` suffixes).
- [x] Output regex anomalies in `Faculty-Year[Program]` format to `intake_anomalies.txt`.

# Task List: Calendar Export Enhancement
- [x] Write `implementation_plan.md` and await user approval
- [x] Implement disclaimer message in export modal (Outlook/Google, irreversibility)
- [x] Add quick guide / instructions for `.ics` file usage in export modal
- [x] Add necessary styles for disclaimer and guide sections
- [x] Verify modal look and feel on desktop/mobile

# Task List: User Feedback Form
- [x] Write `implementation_plan_feedback.md` and await user approval
- [x] Add "Report Issue" button to the UI
- [x] Implement feedback modal in `index.html`
- [x] Add styling for the feedback form and success states
- [x] Implement submission logic in `app.js`
- [x] Add localization for the feedback form

# Task List: Analyzing Recent Updates
- [x] Analyze `Intake Suggestion` system
- [x] Analyze `parser.py` improvements
- [x] Verify `DICT` translations for new features

# Task List: Conflict Mechanism Fixes
- [x] Analyze `colspan` HTML Table push bug during overlap
- [x] Refactor `buildTableDaysTop` to use CSS Grid tracks for overlap stacking
- [x] Refactor `buildTableDaysLeft` to use CSS Grid tracks 
- [x] Update `buildCardsHTML` for flat `daySlots` array
- [x] Verify conflict strips and visual conflict indicators

# Task List: Git Conflict Resolution
- [x] Resolve Git conflicts in `parser.py`, `index.html`, and PDFs
- [x] Fix `data.js` corruption by regenerating it
- [x] Verify clean `git status`
- [x] Install `gdown` for auto-fetching
- [/] Reorganize project structure
    - [ ] Move data files to `data/`
    - [ ] Move logo to `images/`
    - [ ] Move reports and utilities
    - [ ] Update `index.html` references
    - [ ] Update `parser.py` path constants
- [x] Regenerate `data.js` via parser
- [x] Verify clean `git status`
