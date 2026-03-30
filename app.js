/* ═══════════════════════════════════════════════
   UTHM Timetable Generator — app.js
   ═══════════════════════════════════════════════ */

const TIME_SLOTS = [
  '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
  '12:00 - 01:00',
  '01:00 - 02:00', '02:00 - 03:00', '03:00 - 04:00', '04:00 - 05:00',
  '05:00 - 06:00', '06:00 - 07:00', '07:00 - 08:00',
  '08:00 - 09:00 (eve)', '09:00 - 10:00 (eve)', '10:00 - 11:00 (eve)',
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const COLORS = ['#4f8ef7', '#10b981', '#f59e0b', '#f05252', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#22c55e', '#fbbf24', '#a78bfa'];

// Color palette options for custom picker (20 distinct colors)
const COLOR_PALETTE = [
  '#4f8ef7', '#7c6dfa', '#6366f1', '#8b5cf6', '#a78bfa',
  '#ec4899', '#f05252', '#f97316', '#f59e0b', '#fbbf24',
  '#10b981', '#14b8a6', '#22c55e', '#84cc16', '#06b6d4',
  '#e879f9', '#fb7185', '#34d399', '#60a5fa', '#c084fc'
];

let selected = {}, colorMap = {}, customColors = {}, colorIdx = 0, filtered = [];
let intakeModalCourses = [], intakeModalSelected = new Set();
let savedTimetables = JSON.parse(localStorage.getItem('uthm-tg-saved') || '[]');
let subjectNotes = JSON.parse(localStorage.getItem('uthm-tg-notes') || '{}');
// 'table' | 'cards'  — auto-set per breakpoint, user can override
let viewMode = (window.innerWidth <= 768) ? 'cards' : 'table';
// 'days-top' | 'days-left'
let layoutOrientation = localStorage.getItem('uthm-tg-orientation') || 'days-top';

// Build info (shown in the on-load update popup)
const APP_BUILD_VERSION = 31;

// Latest update payload (from `updates.js`)
let latestUpdate = null;
let updateIndex = null;
let _updatePrevFocus = null;

/* ════ i18n & THEME ════ */
const DICT = {
  en: {
    subtitle: "Select subject & section — timetable generated instantly",
    semester: "Sem 2 | Session 2025/2026",
    subjectList: "Subject List",
    searchPh: "Search code or name...",
    subjectSection: "Subject & Section",
    credit: "credits",
    resetBtn: "Reset Selections",
    timetableTitle: "Timetable",
    hari: "Day",
    days: { Monday: 'Monday', Tuesday: 'Tuesday', Wednesday: 'Wednesday', Thursday: 'Thursday', Friday: 'Friday' },
    stats: { subj: "Subjects", cred: "Total Credits", lec: "Lecture (K)", lab: "Lab (A)", conf: "Conflicts" },
    legendCode: "Subject:",
    legendNight: "★=Night",
    legendType: "K=Lecture A=Lab T=Tutorial",
    noSchedule: "No Schedule in System",
    savedTimetables: "Saved Timetables",
    saveBtn: "Save",
    saveModalTitle: "Save Timetable",
    saveModalDesc: "Enter a name for this timetable (e.g. 'Draft 1', 'Final').",
    cancelBtn: "Cancel",
    saveConfirmBtn: "Save",
    loadBtn: "Edit",
    delBtn: "Delete",
    noSaved: "No saved timetables yet.",
    dtSection: "Sec",
    dtType: "Type",
    dtTime: "Time",
    dtVenue: "Venue",
    dtLecturer: "Lecturer",
    uploadBtn: "Upload Slip",
    parsingPdfText: "Parsing PDF...",
    parsingOCRText: "Analyzing Image (OCR)...",
    uploadErrText: "Please upload a PDF or Image file.",
    uploadFailText: "Failed to extract text. Please try a clearer file.",
    uploadNoSubjText: "No subjects found. Please try a clearer file.",
    uploadSuccessText: "Upload successful! Found {count} subjects.",
    exportCal: "Export to Calendar",
    exportStartLabel: "Semester Start Date:",
    exportEndLabel: "End Date (Generated):",
    exportEndDesc: "Automatically set to 15 weeks from the start date.",
    exportDisclaimerTitle: "⚠️ Disclaimer",
    exportDisclaimerText: "This will generate a .ICS file. Please note:",
    exportDisclaimerItem1: "Tested and works on <b>Outlook Calendar</b>. Google Calendar may behave differently.",
    exportDisclaimerItem2: "This export cannot be automatically reversed. You will need to manually delete events if needed.",
    exportGuideTitle: "ℹ️ How to Use",
    exportGuideStep1: "Select the semester start date (Monday).",
    exportGuideStep2: "Download the <b>.ics</b> file.",
    exportGuideStep3: "Open your calendar app (e.g., Outlook, Apple Calendar).",
    exportGuideStep4: "Import the file into your preferred calendar.",
    feedbackBtn: "Report Issue / Give Feedback",
    feedbackTitle: "Report Issue / Feedback",
    feedbackDesc: "Help us improve! Please describe the issue/suggestion below.",
    feedbackTypeLabel: "Issue Type:",
    feedbackMsgLabel: "Description:",
    optMissing: "Missing Subject",
    optWrong: "Wrong Timing/Venue",
    optSuggestion: "Suggestion",
    optOther: "Other",
    submitFeedback: "Submit Feedback",
    submitSuccess: "Terima kasih! Feedback has been sent.",
    submitFail: "Error sending feedback. Please try again later.",
    intakePanelTitle: "Suggest by Intake",
    intakeNewBadge: "New",
    intakeSuggestBtn: "Suggest Timetable",
    intakePlaceholder: "-- Select your intake --",
    intakeNoneFound: "No matching courses found for this intake.",
    dtNotes: "Notes",
    disclaimerTitle: "How to Use",
    downloadEmptyWarn: "No subjects selected. Please select at least one subject before downloading.",
    downloadTitle: "Download Timetable",
    downloadDesc: "Choose your timetable orientation.",
    layoutFormatLabel: "Layout Format:",
    dlLandscape: "Landscape",
    dlLandscapeHint: "Clearer",
    dlPortrait: "Portrait",
    dlPortraitHint: "Phone-friendly",
    downloadPngBtn: "Download PNG",
    downloadXlsxBtn: "Download XLSX",
    downloadPdfBtn: "Download PDF",
    emptyNoSubjectTitle: "No subjects selected",
    emptyNoSubjectDesc: "Pick subjects from the list and choose a section.",
    conflictLabel: "Time conflict",
    removeBtn: "Remove Subject",
    intakeSelectTitle: "Select Subjects for {intake}",
    totalCredits: "Total Selected Credits:",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    generateBtn: "Generate Timetable",
    discPrev: "Back",
    discNext: "Next",
    discClose: "Close",
    printBtn: "Print / Download",
    viewTable: "Table",
    viewCards: "Cards",
    autoFixBtn: "Auto-Fix Timetable",
    solvingLabel: "Finding best schedule...",
    noSolutionFound: "No conflict-free schedule found for all selected subjects.",
    removalSuggestion: "We suggest removing: {subjects}",
    autoFixSuccess: "Timetable reconfigured successfully!",
    resModalTitle: "Conflict Resolution",
    resModalDesc: "To resolve conflicts, the following subjects are suggested for removal:",
    btnDeleteAll: "Delete All",
    btnFindAlt: "Find Alternative",
    btnApply: "Apply Changes",
    altModalTitle: "Alternative Suggestions",
    closeBtn: "Close",
  },
  ms: {
    subtitle: "Pilih subjek & section — jadual dijana serta-merta",
    semester: "Sem 2 | Sesi 2025/2026",
    subjectList: "Senarai Subjek",
    searchPh: "Cari kod atau nama...",
    subjectSection: "Subjek & Seksyen",
    credit: "kredit",
    resetBtn: "Set Semula",
    timetableTitle: "Jadual Waktu",
    hari: "Hari",
    days: { Monday: 'Isnin', Tuesday: 'Selasa', Wednesday: 'Rabu', Thursday: 'Khamis', Friday: 'Jumaat' },
    stats: { subj: "Subjek", cred: "Jumlah Kredit", lec: "Kuliah (K)", lab: "Amali (A)", conf: "Konflik" },
    legendCode: "Subjek:",
    legendNight: "★=Malam",
    legendType: "K=Kuliah A=Amali T=Tutorial",
    noSchedule: "Tiada Jadual Dalam Sistem",
    savedTimetables: "Jadual Disimpan",
    saveBtn: "Simpan",
    saveModalTitle: "Simpan Jadual",
    saveModalDesc: "Masukkan nama untuk jadual ini (cth: 'Draf 1', 'Jadual Penuh').",
    cancelBtn: "Batal",
    saveConfirmBtn: "Simpan",
    loadBtn: "Edit",
    delBtn: "Padam",
    noSaved: "Tiada jadual disimpan.",
    dtSection: "Seksyen",
    dtType: "Jenis",
    dtTime: "Masa",
    dtVenue: "Lokasi",
    dtLecturer: "Pensyarah",
    uploadBtn: "Muat Naik Slip",
    parsingPdfText: "Membaca PDF...",
    parsingOCRText: "Menganalisis Imej (OCR)...",
    uploadErrText: "Sila muat naik fail PDF atau Imej.",
    uploadFailText: "Gagal membaca teks. Sila cuba fail lain.",
    uploadNoSubjText: "Tiada subjek ditemui. Sila cuba fail lain.",
    uploadSuccessText: "Berjaya! Menemui {count} subjek.",
    exportCal: "Eksport Kalendar",
    exportStartLabel: "Tarikh Mula Semester:",
    exportEndLabel: "Tarikh Tamat (Dijana):",
    exportEndDesc: "Ditetapkan secara automatik kepada 15 minggu dari tarikh mula.",
    exportDisclaimerTitle: "⚠️ Disclaimer",
    exportDisclaimerText: "Ini akan menghasilkan fail .ICS. Sila ambil perhatian:",
    exportDisclaimerItem1: "Telah diuji dan berfungsi pada <b>Outlook Calendar</b>. Google Calendar mungkin mempunyai tingkah laku berbeza.",
    exportDisclaimerItem2: "Eksport ini tidak boleh dibatalkan secara automatik. Anda perlu memadam acara secara manual jika perlu.",
    exportGuideTitle: "ℹ️ Cara Penggunaan",
    exportGuideStep1: "Pilih tarikh mula semester (Isnin).",
    exportGuideStep2: "Muat turun fail <b>.ics</b>.",
    exportGuideStep3: "Buka aplikasi kalendar anda (cth: Outlook, Apple Calendar).",
    exportGuideStep4: "Import fail tersebut ke dalam kalendar pilihan anda.",
    feedbackBtn: "Lapor Masalah / Maklum Balas",
    feedbackTitle: "Lapor Masalah / Maklum Balas",
    feedbackDesc: "Bantu kami bertambah baik! Sila jelaskan masalah atau cadangan anda di bawah.",
    feedbackTypeLabel: "Jenis Masalah:",
    feedbackMsgLabel: "Penerangan:",
    optMissing: "Subjek Hilang",
    optWrong: "Masa/Lokasi Salah",
    optSuggestion: "Cadangan",
    optOther: "Lain-lain",
    submitFeedback: "Hantar Maklum Balas",
    submitSuccess: "Terima kasih! Maklum balas anda telah dihantar.",
    submitFail: "Ralat menghantar maklum balas. Sila cuba sebentar lagi.",
    intakePanelTitle: "Cadangan Mengikut Ambilan",
    intakeNewBadge: "Baru",
    intakeSuggestBtn: "Cadang Jadual",
    intakePlaceholder: "-- Pilih ambilan anda --",
    intakeNoneFound: "Tiada kursus yang sepadan ditemui untuk ambilan ini.",
    dtNotes: "Nota",
    disclaimerTitle: "Cara Penggunaan",
    downloadEmptyWarn: "Tiada subjek dipilih. Sila pilih sekurang-kurangnya satu subjek sebelum muat turun.",
    downloadTitle: "Muat Turun Jadual",
    downloadDesc: "Pilih orientasi jadual anda.",
    layoutFormatLabel: "Format Layout:",
    dlLandscape: "Lanskap",
    dlLandscapeHint: "Lebih Jelas",
    dlPortrait: "Potret",
    dlPortraitHint: "Sesuai Telefon",
    downloadPngBtn: "Muat Turun PNG",
    downloadXlsxBtn: "Muat Turun XLSX",
    downloadPdfBtn: "Muat Turun PDF",
    emptyNoSubjectTitle: "Tiada Subjek Dipilih",
    emptyNoSubjectDesc: "Pilih subjek dari senarai dan tetapkan seksyen.",
    conflictLabel: "Konflik Masa",
    removeBtn: "Buang Subjek",
    intakeSelectTitle: "Pilih Subjek untuk {intake}",
    totalCredits: "Jumlah Kredit Dipilih:",
    selectAll: "Pilih Semua",
    deselectAll: "Nyahpilih Semua",
    generateBtn: "Jana Jadual",
    discPrev: "Sebelum",
    discNext: "Seterus",
    discClose: "Tutup",
    printBtn: "Cetak / Muat Turun",
    viewTable: "Jadual",
    viewCards: "Kad",
    autoFixBtn: "Baiki Jadual Automatik",
    solvingLabel: "Mencari jadual terbaik...",
    noSolutionFound: "Tiada jadual tanpa konflik ditemui untuk semua subjek.",
    removalSuggestion: "Kami cadangkan buang: {subjects}",
    autoFixSuccess: "Jadual berjaya disusun semula!",
    resModalTitle: "Penyelesaian Konflik",
    resModalDesc: "Untuk menyelesaikan konflik, subjek berikut dicadangkan untuk dibuang:",
    btnDeleteAll: "Buang Semua",
    btnFindAlt: "Cari Alternatif",
    btnApply: "Terapkan Perubahan",
    altModalTitle: "Cadangan Alternatif",
    closeBtn: "Tutup",
  }
};

let currentLang = localStorage.getItem('uthm-tg-lang') || 'ms';

function _refreshViewToggleButton() {
  const t = DICT[currentLang] || DICT.ms;
  const tableLabel = t.viewTable || (currentLang === 'ms' ? 'Jadual' : 'Table');
  const cardsLabel = t.viewCards || (currentLang === 'ms' ? 'Kad' : 'Cards');

  document.querySelectorAll('.btn-view-toggle[data-view]').forEach(btn => {
    // Keep dataset in sync so the click handler toggles correctly even after JS-driven changes.
    btn.dataset.view = viewMode;
    btn.classList.add('active');
    btn.innerHTML = viewMode === 'table'
      ? `<span class="tt-btn-ico" aria-hidden="true">≡</span> ${tableLabel}`
      : `<span class="tt-btn-ico" aria-hidden="true">⊞</span> ${cardsLabel}`;
  });
}

function _refreshOrientationButtonLabel() {
  const btn = document.getElementById('btn-orient');
  if (!btn) return;
  btn.innerHTML = layoutOrientation === 'days-top'
    ? (currentLang === 'ms'
      ? '<span class="tt-btn-ico" aria-hidden="true">▤</span> Hari Kiri'
      : '<span class="tt-btn-ico" aria-hidden="true">▤</span> Days Left')
    : (currentLang === 'ms'
      ? '<span class="tt-btn-ico" aria-hidden="true">▦</span> Hari Atas'
      : '<span class="tt-btn-ico" aria-hidden="true">▦</span> Days Top');
  btn.title = layoutOrientation === 'days-top'
    ? (currentLang === 'ms' ? 'Tukar: Hari di kiri, Masa di atas' : 'Switch: Days on left, Time on top')
    : (currentLang === 'ms' ? 'Tukar: Hari di atas, Masa di kiri' : 'Switch: Days on top, Time on left');
}

function applyLang() {
  const t = DICT[currentLang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.innerHTML = t[key];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t[el.getAttribute('data-i18n-ph')] || el.placeholder;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t[el.getAttribute('data-i18n-title')] || el.title;
  });
  const btn = document.getElementById('btn-lang');
  if (btn) btn.textContent = currentLang === 'ms' ? 'EN' : 'MS';

  _refreshViewToggleButton();
  _refreshOrientationButtonLabel();

  if (filtered.length) {
    renderList(filtered);
    renderSelArea();
    renderTimetable();
  }
}

function toggleLang() {
  currentLang = currentLang === 'ms' ? 'en' : 'ms';
  localStorage.setItem('uthm-tg-lang', currentLang);
  applyLang();
}

function initTheme() {
  const saved = localStorage.getItem('uthm-tg-theme') || 'dark';
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
}

function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  if (isLight) {
    html.removeAttribute('data-theme');
    localStorage.setItem('uthm-tg-theme', 'dark');
  } else {
    html.setAttribute('data-theme', 'light');
    localStorage.setItem('uthm-tg-theme', 'light');
  }
}

initTheme();

/* ════ VIEW MODE (table / card toggle) ════ */
function setViewMode(mode) {
  viewMode = mode;
  _refreshViewToggleButton();
  renderTimetable();
}

/* ════ ORIENTATION (days-top / days-left) ════ */
function setOrientation(orient) {
  layoutOrientation = orient;
  localStorage.setItem('uthm-tg-orientation', orient);
  _refreshOrientationButtonLabel();
  renderTimetable();
}

function toggleOrientation() {
  setOrientation(layoutOrientation === 'days-top' ? 'days-left' : 'days-top');
}

// Auto-switch when viewport crosses the 768px threshold
let _lastBreakpoint = window.innerWidth <= 768 ? 'mobile' : 'desktop';
window.addEventListener('resize', () => {
  const nowMobile = window.innerWidth <= 768;
  const bp = nowMobile ? 'mobile' : 'desktop';
  if (bp !== _lastBreakpoint) {
    _lastBreakpoint = bp;
    setViewMode(nowMobile ? 'cards' : 'table');
  }
});


/* ════ INIT ════ */
function init() {
  applyLang();
  setOrientation(layoutOrientation);
  initLatestUpdate();
  filtered = Object.keys(COURSES).sort();
  renderList(filtered);
  renderSavedList();
  document.getElementById('cnt-all').textContent = filtered.length;
  renderTimetable();
  buildIntakeList();
  _setupSelectedCourseDetails();
  showUpdatePopup();
}

/* ════ COURSE LIST ════ */
function filterList() {
  const q = document.getElementById('srch').value.toLowerCase();
  filtered = Object.keys(COURSES)
    .filter(c => c.toLowerCase().includes(q) || COURSES[c].name.toLowerCase().includes(q))
    .sort();
  renderList(filtered);
  document.getElementById('cnt-all').textContent = filtered.length;
}

function renderList(codes) {
  const el = document.getElementById('clist');
  el.innerHTML = '';
  const sorted = [...codes].sort((a, b) => {
    const aH = Object.keys(COURSES[a].sections || {}).length > 0;
    const bH = Object.keys(COURSES[b].sections || {}).length > 0;
    if (aH && !bH) return -1; if (!aH && bH) return 1;
    return a.localeCompare(b);
  });
  let divShown = false;
  sorted.forEach(code => {
    const c = COURSES[code];
    const secCount = Object.keys(c.sections || {}).length;
    const isSel = code in selected, noSec = secCount === 0;
    if (noSec && !divShown) {
      divShown = true;
      const d = document.createElement('div');
      d.className = 'clist-divider'; d.textContent = DICT[currentLang].noSchedule;
      el.appendChild(d);
    }
    const item = document.createElement('div');
    item.className = `citem${isSel ? ' sel' : ''}${noSec ? ' no-sec' : ''}`;
    const tag = getCourseUpdateTag(code);
    const tagHtml = tag ? ` <span class="pill ${tag.cls}">${tag.label}</span>` : '';
    item.innerHTML = `<div class="cbox"></div><div class="cinfo"><div class="ccode">${code}</div><div class="cname">${c.name}${tagHtml}</div></div><div class="csec-count">${noSec ? '—' : secCount > 1 ? secCount + ' sec' : '1 sec'}</div>`;
    if (!noSec) item.onclick = () => toggleCourse(code);
    el.appendChild(item);
  });
}

function toggleCourse(code) {
  if (code in selected) {
    delete selected[code]; delete colorMap[code]; delete customColors[code];
  } else {
    const secs = sortSections(Object.keys(COURSES[code].sections || {}));
    selected[code] = secs[0] || null;
    colorMap[code] = colorIdx % COLORS.length;
    customColors[code] = COLORS[colorMap[code]];
    colorIdx++;
  }
  renderList(filtered); renderSelArea(); renderTimetable();
}

function removeSelected(code) {
  delete selected[code]; delete colorMap[code]; delete customColors[code];
  renderList(filtered); renderSelArea(); renderTimetable();
}

/* ════ UTILS ════ */
function getCredits(code) {
  // Typical UTHM format: BIT21503 -> 3 credits
  // Extract last digit of the numeric part
  const match = code.match(/\d+$/);
  return match ? parseInt(match[0].slice(-1)) : 0;
}

function getSubjectColor(code) {
  return customColors[code] || COLORS[colorMap[code]] || COLORS[0];
}

function openColorPicker(code) {
  // Remove any existing picker
  document.querySelectorAll('.color-picker-popup').forEach(p => p.remove());

  const usedColors = new Set(
    Object.keys(customColors).filter(k => k !== code).map(k => customColors[k])
  );

  const popup = document.createElement('div');
  popup.className = 'color-picker-popup';
  popup.innerHTML = `
    <div class="cp-title">${currentLang === 'ms' ? 'Pilih Warna' : 'Pick Color'} <span class="cp-code">${code}</span></div>
    <div class="cp-grid">
      ${COLOR_PALETTE.map(c => {
    const taken = usedColors.has(c);
    const active = customColors[code] === c;
    return `<div class="cp-swatch${active ? ' active' : ''}${taken ? ' taken' : ''}"
          style="background:${c}"
          title="${taken ? (currentLang === 'ms' ? 'Warna digunakan subjek lain' : 'Used by another subject') : c}"
          onclick="${taken ? '' : `pickColor('${code}','${c}')`}">
          ${active ? '<span class="cp-check">✓</span>' : ''}
          ${taken ? '<span class="cp-x">✕</span>' : ''}
        </div>`;
  }).join('')}
    </div>`;

  // Position near the swatch button
  const btn = document.querySelector(`.color-swatch-btn[data-code="${code}"]`);
  if (btn) {
    const rect = btn.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.top = (rect.bottom + 6) + 'px';
    popup.style.left = Math.min(rect.left, window.innerWidth - 210) + 'px';
  }

  document.body.appendChild(popup);

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!popup.contains(e.target) && !e.target.classList.contains('color-swatch-btn')) {
        popup.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 10);
}

function pickColor(code, color) {
  customColors[code] = color;
  // Update colorMap to point to a matching index (for legacy .c0/.c1 slot classes, we override inline)
  document.querySelectorAll('.color-picker-popup').forEach(p => p.remove());
  renderSelArea();
  renderTimetable();
}

/* ════ SELECTION AREA ════ */
function pickSection(code, sec) {
  selected[code] = sec; renderSelArea(); renderTimetable();
}

function renderSelArea() {
  const area = document.getElementById('sel-area');
  const panel = document.getElementById('sel-panel');
  const codes = Object.keys(selected);
  if (codes.length === 0) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  document.getElementById('cnt-sel').textContent = codes.length;
  const cred = totalCredits();
  const credEl = document.getElementById('cnt-credits');
  if (credEl) {
    credEl.textContent = `${cred} ${DICT[currentLang].credit || (currentLang === 'ms' ? 'kredit' : 'credits')}`;
    credEl.style.color = cred > 20 ? '#f87171' : cred >= 12 ? '#34d399' : '#fcd34d';
  }
  area.innerHTML = '';
  codes.forEach(code => {
    const c = COURSES[code], secs = sortSections(Object.keys(c.sections || {}));
    const chosen = selected[code], col = getSubjectColor(code);
    const credits = getCredits(code);
    const tag = getCourseUpdateTag(code);
    const tagHtml = tag ? `<span class="pill ${tag.cls}" style="margin-left:6px">${tag.label}</span>` : '';
    const pillsHTML = secs.map(s => {
      const isActive = chosen === s, hasConflict = isConflictSection(code, s);
      let style = '';
      if (isActive && !hasConflict) style = ` style="background:${col}; border-color:${col}; color:#fff; font-weight:600;"`;
      return `<div class="sec-pill${isActive ? ' active' : ''}${hasConflict ? ' conflict' : ''}"${style} onclick="pickSection('${code}','${s}')">${s}${hasConflict && !isActive ? ' ⚠' : isActive && hasConflict ? ' ⚠' : ''}</div>`;
    }).join('');
    const block = document.createElement('div');
    block.className = 'sel-course-block';
    block.dataset.code = code;
    block.tabIndex = 0;
    block.setAttribute('role', 'button');
    block.setAttribute('aria-label', `${code} — ${c.name}`);
    block.style.borderLeft = `3px solid ${col}`; block.style.paddingLeft = '14px';
    const colorLabel = currentLang === 'ms' ? 'Warna' : 'Color';
    block.innerHTML = `
      <div class="sel-top">
        <span style="display:flex;align-items:center;gap:7px">
          <button class="color-swatch-btn" data-code="${code}" onclick="openColorPicker('${code}')" title="${colorLabel}" style="background:${col};border-color:${col}"></button>
          <span class="sel-code" style="color:${col}">${code}</span>${tagHtml}
        </span>
        <span style="display:flex;align-items:center;gap:8px">
          <span class="${subjectNotes[code] && subjectNotes[code].trim() ? 'btn-notes active' : 'btn-notes'}" onclick="event.stopPropagation(); openCourseDetailModal('${code}')" title="${currentLang === 'ms' ? 'Nota' : 'Notes'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </span>
          <span class="credit-badge">${credits} ${DICT[currentLang].credit || (currentLang === 'ms' ? 'kredit' : 'credits')}</span>
          <span class="sel-remove" onclick="removeSelected('${code}')">×</span>
        </span>
      </div>
      <div class="sel-name">${c.name}</div>
      <div class="sec-pills">${pillsHTML}</div>`;
    area.appendChild(block);
  });

  // Render sub-panel conflict hint
  const panelHtml = document.getElementById('sel-panel');
  const foot = document.getElementById('sidebar-foot');
  if (foot) {
    const cnf = checkConflicts();
    const hint = document.getElementById('conflict-hint');
    if (cnf.length) {
      hint.style.display = 'block';
      hint.innerHTML = `⚠ Konflik: ${cnf.join('<br>')}`;
    } else {
      hint.style.display = 'none';
      hint.innerHTML = '';
    }
  }
}

function _setupSelectedCourseDetails() {
  const area = document.getElementById('sel-area');
  if (!area || area.dataset.courseDetailBound === '1') return;
  area.dataset.courseDetailBound = '1';

  const shouldIgnore = (target) =>
    !!target.closest('.sec-pill, .sel-remove, .color-swatch-btn');

  area.addEventListener('click', (e) => {
    const block = e.target.closest('.sel-course-block');
    if (!block) return;
    if (shouldIgnore(e.target)) return;
    const code = block.dataset.code;
    if (!code) return;
    openCourseDetailModal(code);
  });

  area.addEventListener('keydown', (e) => {
    const block = e.target.closest && e.target.closest('.sel-course-block');
    if (!block) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const code = block.dataset.code;
    if (!code) return;
    openCourseDetailModal(code);
  });
}

function openCourseDetailModal(code) {
  const course = (typeof COURSES !== 'undefined') ? COURSES[code] : null;
  if (!course) return;
  const chosenSec = selected[code] || (sortSections(Object.keys(course.sections || {}))[0] || '');
  const slots = (course.sections && course.sections[chosenSec]) ? course.sections[chosenSec] : [];
  const t = DICT[currentLang] || DICT.ms;

  const typeLabel = (ty) => {
    if (ty === 'Lecture') return currentLang === 'ms' ? 'Kuliah' : 'Lecture';
    if (ty === 'Lab/Amali') return currentLang === 'ms' ? 'Amali' : 'Lab';
    return currentLang === 'ms' ? 'Tutorial' : 'Tutorial';
  };

  const endTime = (start, dur) => {
    const s = String(start || '').replace('.', ':');
    const si = TIME_SLOTS.findIndex(x => x.startsWith(s));
    const d = Math.max(1, Math.round(Number(dur) || 1));
    const ei = si >= 0 ? Math.min(TIME_SLOTS.length - 1, si + d - 1) : -1;
    if (ei < 0) return '';
    return TIME_SLOTS[ei].split(' - ')[1].replace(' (eve)', '');
  };

  const venueShort = (v) => String(v || '-').replace('I-', '');
  const lectShort = (l) => String(l || '-').replace('I-', '');

  const dayIdx = (day) => {
    const i = DAYS.indexOf(day);
    return i === -1 ? 99 : i;
  };
  const timeIdx = (start) => {
    const s = String(start || '').replace('.', ':');
    const i = TIME_SLOTS.findIndex(x => x.startsWith(s));
    return i === -1 ? 999 : i;
  };

  const grouped = { Lecture: [], 'Lab/Amali': [], Tutorial: [] };
  (slots || []).forEach(s => {
    (grouped[s.type] || (grouped[s.type] = [])).push(s);
  });

  for (const k of Object.keys(grouped)) {
    grouped[k].sort((a, b) => {
      const da = dayIdx(a.day); const db = dayIdx(b.day);
      if (da !== db) return da - db;
      return timeIdx(a.time_start) - timeIdx(b.time_start);
    });
  }

  let overlay = document.getElementById('course-detail-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'course-detail-modal';
    overlay.innerHTML = `
      <div class="modal-box course-detail-box" role="dialog" aria-modal="true" aria-labelledby="cd-title">
        <div class="cd-hdr">
          <div class="cd-hdr-left">
            <div class="cd-code" id="cd-code"></div>
            <div class="cd-name" id="cd-name"></div>
          </div>
          <button class="btn-sm cd-close" id="cd-close" type="button">✕</button>
        </div>
        <div class="cd-sub">
          <span class="cd-chip" id="cd-sec"></span>
          <span class="cd-chip" id="cd-cred"></span>
        </div>
        <div class="cd-notes-wrap">
          <div class="cd-notes-hdr">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span id="cd-notes-label"></span>
          </div>
          <textarea class="cd-notes-input" id="cd-notes-input" placeholder="..."></textarea>
        </div>
        <div class="cd-body" id="cd-body"></div>
      </div>
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCourseDetailModal(); });
    document.addEventListener('keydown', (e) => {
      const m = document.getElementById('course-detail-modal');
      if (!m || !m.classList.contains('open')) return;
      if (e.key === 'Escape') closeCourseDetailModal();
    });
    document.body.appendChild(overlay);
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const titleText = `${code}`;
  overlay.querySelector('#cd-code').textContent = titleText;
  overlay.querySelector('#cd-name').textContent = course.name || '';
  overlay.querySelector('#cd-sec').textContent = `${currentLang === 'ms' ? 'Seksyen' : 'Section'}: ${chosenSec || '-'}`;
  overlay.querySelector('#cd-cred').textContent = `${getCredits(code)} ${currentLang === 'ms' ? 'kredit' : 'credits'}`;
  overlay.querySelector('#cd-notes-label').textContent = currentLang === 'ms' ? 'Nota' : 'Notes';
  
  const notesInput = overlay.querySelector('#cd-notes-input');
  if (notesInput) {
    notesInput.value = subjectNotes[code] || '';
    notesInput.oninput = () => {
      subjectNotes[code] = notesInput.value;
      localStorage.setItem('uthm-tg-notes', JSON.stringify(subjectNotes));
    };
  }

  const mkItem = (s) => {
    const st = String(s.time_start || '');
    const en = endTime(st, s.duration);
    const timeStr = `${t.days[s.day] || s.day} • ${format12Hour(st)}${en ? ' – ' + format12Hour(en) : ''}`;
    const intakes = (s.intakes && s.intakes.length) ? s.intakes.join(' | ') : '';
    const badge = String((s.section || '').split(' ')[1] || '').trim();
    return `
      <div class="cd-item">
        <div class="cd-item-top">
          <div class="cd-type">${esc(typeLabel(s.type))}${badge ? ` <span class="cd-badge">${esc(badge)}</span>` : ''}</div>
          <div class="cd-time">${esc(timeStr)}</div>
        </div>
        <div class="cd-item-kv">
          <div>${currentLang === 'ms' ? 'Lokasi' : 'Venue'}</div><div><b>${esc(venueShort(s.venue))}</b></div>
          <div>${currentLang === 'ms' ? 'Pensyarah' : 'Lecturer'}</div><div><b>${esc(lectShort(s.lecturer))}</b></div>
        </div>
        ${intakes ? `<div class="cd-intakes">${esc(intakes)}</div>` : ''}
      </div>
    `;
  };

  const bodyParts = [];
  const order = ['Lecture', 'Lab/Amali', 'Tutorial'];
  order.forEach(ty => {
    const arr = grouped[ty] || [];
    if (!arr.length) return;
    bodyParts.push(`
      <div class="cd-group">
        <div class="cd-group-title">${esc(typeLabel(ty))}</div>
        <div class="cd-group-items">${arr.map(mkItem).join('')}</div>
      </div>
    `);
  });

  if (!bodyParts.length) {
    bodyParts.push(`<div class="update-empty">${currentLang === 'ms' ? 'Tiada jadual untuk seksyen ini.' : 'No schedule for this section.'}</div>`);
  }

  overlay.querySelector('#cd-body').innerHTML = bodyParts.join('');
  overlay.querySelector('#cd-close').onclick = closeCourseDetailModal;

  requestAnimationFrame(() => overlay.classList.add('open'));
  const closeBtn = overlay.querySelector('#cd-close');
  if (closeBtn) closeBtn.focus();
}

function closeCourseDetailModal() {
  const overlay = document.getElementById('course-detail-modal');
  if (overlay) overlay.classList.remove('open');
}

/* ════ RESET MODAL ════ */
function resetAll() {
  const isMalay = currentLang === 'ms';
  const title = isMalay ? 'Set Semula Jadual?' : 'Reset Timetable?';
  const desc = isMalay
    ? 'Semua subjek dan section yang dipilih akan dipadam. Tindakan ini tidak boleh dibatalkan.'
    : 'All selected subjects and sections will be cleared. This action cannot be undone.';
  const cancelLbl = isMalay ? 'Batal' : 'Cancel';
  const confirmLbl = isMalay ? 'Set Semula' : 'Reset';

  let overlay = document.getElementById('reset-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'reset-modal';
	    overlay.innerHTML = `
	      <div class="modal-box" role="dialog" aria-modal="true">
	        <div class="modal-icon">🗑</div>
	        <div class="modal-title"   id="modal-title"></div>
	        <div class="modal-desc"    id="modal-desc"></div>
	        <div class="modal-actions">
	          <button class="modal-btn confirm" id="modal-confirm"></button>
	          <button class="modal-btn cancel"  id="modal-cancel"></button>
	        </div>
	      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) closeResetModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeResetModal(); });
    document.body.appendChild(overlay);
  }

  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-desc').textContent = desc;
  document.getElementById('modal-cancel').textContent = cancelLbl;
  document.getElementById('modal-confirm').textContent = confirmLbl;

  document.getElementById('modal-cancel').onclick = closeResetModal;
  document.getElementById('modal-confirm').onclick = () => { closeResetModal(); doReset(); };

  requestAnimationFrame(() => overlay.classList.add('open'));
  document.getElementById('modal-cancel').focus();
}

function closeResetModal() {
  const overlay = document.getElementById('reset-modal');
  if (overlay) overlay.classList.remove('open');
}

function doReset() {
  for (let key in selected) delete selected[key];
  for (let key in colorMap) delete colorMap[key];
  for (let key in customColors) delete customColors[key];
  for (let key in subjectNotes) delete subjectNotes[key];
  localStorage.removeItem('uthm-tg-notes');
  colorIdx = 0;
  const srch = document.getElementById('srch');
  if (srch) srch.value = '';
  filterList();
  renderSelArea();
  renderTimetable();
}

/* ════ CONFLICT DETECTION ════ */
function getOccupiedSlots(slot) {
  const keys = [];
  const startTime = (slot.time_start || '').replace('.', ':');
  const startIdx = TIME_SLOTS.findIndex(t => t.startsWith(startTime));
  if (startIdx === -1) return keys;
  for (let i = 0; i < (slot.duration || 1); i++) {
    if (startIdx + i < TIME_SLOTS.length) keys.push(`${slot.day}|${startIdx + i}`);
  }
  return keys;
}

function isConflictSection(targetCode, targetSec) {
  const targetSlots = COURSES[targetCode].sections[targetSec] || [];
  const targetKeys = new Set(targetSlots.flatMap(s => getOccupiedSlots(s)));
  for (const [code, sec] of Object.entries(selected)) {
    if (code === targetCode) continue;
    for (const slot of (COURSES[code].sections[sec] || [])) {
      for (const k of getOccupiedSlots(slot)) { if (targetKeys.has(k)) return true; }
    }
  }
  return false;
}

function checkConflicts() {
  const timeMap = {}, conflicts = [];
  for (const [code, sec] of Object.entries(selected)) {
    (COURSES[code].sections[sec] || []).forEach(slot => {
      getOccupiedSlots(slot).forEach(key => {
        if (!timeMap[key]) timeMap[key] = [];
        timeMap[key].push(code);
      });
    });
  }
  const seen = new Set();
  for (const [key, codes] of Object.entries(timeMap)) {
    if (codes.length > 1) {
      const uniq = [...new Set(codes)];
      const msg = `${DICT[currentLang].days[key.split('|')[0]]} ${TIME_SLOTS[+key.split('|')[1]]}: ${uniq.join(' & ')}`;
      if (!seen.has(msg)) { seen.add(msg); conflicts.push(msg); }
    }
  }
  return conflicts;
}

/** 
 * ════ SMART RESOLVER (AUTO-CONFIGURE) ════ 
 * Backtracking algorithm to find a conflict-free combination of sections.
 */

function solveRecursive(courseCodes, index, currentMapping) {
  if (index === courseCodes.length) return currentMapping;

  const code = courseCodes[index];
  const course = COURSES[code];
  const sections = sortSections(Object.keys(course.sections || {}));

  // Prioritize intake-matched sections if we can find them
  const intakeMatched = sections.filter(sec => {
    const slots = course.sections[sec] || [];
    const sel = document.getElementById('intake-select');
    const chosen = sel ? sel.value : '';
    return slots.some(slot =>
      (slot.intakes || []).some(intakeStr =>
        intakeStr.split(' | ').some(part => part.trim() === chosen)
      )
    );
  });

  // Reorder sections: intakeMatched first, then others
  const orderedSections = [...new Set([...intakeMatched, ...sections])];

  for (const sec of orderedSections) {
    if (!hasConflictWithCurrent(code, sec, currentMapping)) {
      currentMapping[code] = sec;
      const result = solveRecursive(courseCodes, index + 1, currentMapping);
      if (result) return result;
      delete currentMapping[code];
    }
  }

  return null;
}

function hasConflictWithCurrent(targetCode, targetSec, mapping) {
  const targetSlots = COURSES[targetCode].sections[targetSec] || [];
  const targetKeys = new Set(targetSlots.flatMap(s => getOccupiedSlots(s)));

  for (const [code, sec] of Object.entries(mapping)) {
    if (code === targetCode) continue;
    for (const slot of (COURSES[code].sections[sec] || [])) {
      for (const k of getOccupiedSlots(slot)) {
        if (targetKeys.has(k)) return true;
      }
    }
  }
  return false;
}

function findBestConfiguration(courseCodes) {
  return solveRecursive(courseCodes, 0, {});
}

function suggestResolutionOptions(courseCodes, maxOptions = 3) {
  const options = [];
  const minRemovedSets = []; // To keep track of minimal sets found

  // Try removing 1, then 2, then 3 courses...
  for (let r = 1; r <= 3 && options.length < maxOptions; r++) {
    const combinations = getCombinations(courseCodes, courseCodes.length - r);
    
    for (const subCourseCodes of combinations) {
      if (options.length >= maxOptions) break;
      
      const removed = courseCodes.filter(c => !subCourseCodes.includes(c));
      const removedSet = new Set(removed);
      
      // Check if this set is a superset of something we already found
      // (e.g. if {A} is a solution, {A, B} is redundant)
      let isSuperset = false;
      for (const existingSet of minRemovedSets) {
        let containsAll = true;
        for (const item of existingSet) {
          if (!removedSet.has(item)) { containsAll = false; break; }
        }
        if (containsAll) { isSuperset = true; break; }
      }
      if (isSuperset) continue;

      const solution = findBestConfiguration(subCourseCodes);
      if (solution) {
        options.push({ solution, removed });
        minRemovedSets.push(new Set(removed));
      }
    }
  }
  return options;
}

function getCombinations(arr, k) {
  const results = [];
  function helper(start, current) {
    if (current.length === k) {
      results.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      helper(i + 1, current);
      current.pop();
    }
  }
  helper(0, []);
  return results;
}

async function smartResolve() {
  const codes = Object.keys(selected);
  if (codes.length === 0) return;

  const btn = document.querySelector('.btn-autofix');
  const t = DICT[currentLang];
  
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner"></div> <span>${t.solvingLabel}</span>`;
  }

  showToast(t.solvingLabel, 2000);

  try {
    // Small delay to allow UI to show toast/spinner
    await new Promise(r => setTimeout(r, 300));

    console.time('smartResolve');
    console.log('[AutoFix] Starting solver for:', codes);

    let result = findBestConfiguration(codes);
    let removed = [];

    if (!result) {
      console.log('[AutoFix] No perfect solution, searching for multi-options...');
      const suggestions = suggestResolutionOptions(codes);
      if (suggestions && suggestions.length > 0) {
        showResolutionModal(suggestions);
      } else {
        showToast(t.noSolutionFound, 4000);
      }
    } else {
      // Perfect match
      for (const code of codes) {
        selected[code] = result[code];
      }
      renderList(filtered);
      renderSelArea();
      renderTimetable();
      showToast(t.autoFixSuccess, 3000);
    }
  } catch (err) {
    console.error('[AutoFix] Error during resolution:', err);
    showToast("An unexpected error occurred.", 4000);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span style="font-size:14px">✨</span> <span data-i18n="autoFixBtn">${t.autoFixBtn}</span>`;
    }
  }
}

let pendingSuggestions = [];
let selectedSuggestionIdx = 0;

function showResolutionModal(suggestions) {
  console.log('[AutoFix] showResolutionModal started', { suggestions });
  pendingSuggestions = suggestions;
  selectedSuggestionIdx = 0;
  
  const optionsContainer = document.getElementById('res-options-container');
  if (optionsContainer) {
    optionsContainer.innerHTML = '';
    suggestions.forEach((s, idx) => {
      const btn = document.createElement('button');
      btn.className = `btn-sm res-option-chip ${idx === 0 ? 'active' : ''}`;
      btn.style.padding = '6px 12px';
      btn.style.borderRadius = '20px';
      btn.style.fontSize = '11px';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'all 0.2s';
      
      // Styling for chips
      const updateChipStyle = (isActive) => {
        btn.style.background = isActive ? 'var(--accent)' : 'var(--s2)';
        btn.style.color = isActive ? 'white' : 'var(--muted2)';
        btn.style.border = isActive ? 'none' : '1px solid var(--border)';
      };
      updateChipStyle(idx === 0);

      const dropCount = s.removed.length;
      btn.innerText = `Option ${idx + 1} (${dropCount} drop${dropCount > 1 ? 's' : ''})`;
      
      btn.onclick = () => {
        selectedSuggestionIdx = idx;
        document.querySelectorAll('.res-option-chip').forEach((b, i) => {
           const isSelf = i === idx;
           b.style.background = isSelf ? 'var(--accent)' : 'var(--s2)';
           b.style.color = isSelf ? 'white' : 'var(--muted2)';
           b.style.border = isSelf ? 'none' : '1px solid var(--border)';
        });
        renderResolutionOption(idx);
      };
      optionsContainer.appendChild(btn);
    });
  }

  renderResolutionOption(0);

  const modal = document.getElementById('resolution-modal');
  if (modal) {
    modal.classList.add('show');
    console.log('[AutoFix] Added .show to #resolution-modal');
  } else {
    console.error('[AutoFix] Element #resolution-modal not found!');
  }
}

function renderResolutionOption(idx) {
  const suggestion = pendingSuggestions[idx];
  if (!suggestion) return;

  const list = document.getElementById('res-removed-list');
  if (!list) return;
  list.innerHTML = '';

  const t = DICT[currentLang];
  suggestion.removed.forEach(code => {
    const course = COURSES[code];
    const div = document.createElement('div');
    div.className = 'res-item';
    div.style.borderRadius = '12px';
    div.style.border = '1px solid var(--border)';
    div.style.padding = '12px';
    div.style.marginBottom = '8px';
    div.style.background = 'var(--s2)';
    div.innerHTML = `
      <div class="res-item-info" style="display:flex;flex-direction:column;gap:4px">
        <div class="res-item-code" style="font-weight:700;color:var(--accent);font-size:13px">${code}</div>
        <div class="res-item-name" style="font-size:12px;color:var(--text)">${course ? course.name : 'Unknown Subject'}</div>
      </div>
      <div style="margin-top:10px">
        <button class="btn-sm" onclick="handleFindAlternative('${code}')" style="background:var(--s1);color:var(--accent);border-color:var(--accent);font-size:11px;padding:6px 12px;border-radius:6px;cursor:pointer">
          ${t.btnFindAlt}
        </button>
      </div>
    `;
    list.appendChild(div);
  });
}

function closeResolutionModal() {
  document.getElementById('resolution-modal').classList.remove('show');
  pendingSuggestions = [];
}

function applyResolution() {
  const suggestion = pendingSuggestions[selectedSuggestionIdx];
  if (!suggestion) return;
  const { solution, removed } = suggestion;

  // Apply changes
  const oldCodes = Object.keys(selected);
  for (const code of oldCodes) {
    if (solution[code]) {
      selected[code] = solution[code];
    } else {
      delete selected[code];
      delete colorMap[code];
      delete customColors[code];
    }
  }

  renderList(filtered);
  renderSelArea();
  renderTimetable();
  
  closeResolutionModal();
  showToast(DICT[currentLang].autoFixSuccess, 3000);
}

function handleFindAlternative(targetCode) {
  const alternatives = findAlternatives(targetCode);
  showAlternativeModal(targetCode, alternatives);
}

function findAlternatives(targetCode) {
  const currentCodes = Object.keys(pendingResolution.solution);
  const targetCredits = getCredits(targetCode);
  const alts = [];

  for (const [code, course] of Object.entries(COURSES)) {
    if (currentCodes.includes(code)) continue;
    if (code === targetCode) continue;

    // Filter by similar credits or just show available ones that fit
    // For now, let's just find any course that fits the existing schedule
    const solution = findBestConfiguration([...currentCodes, code]);
    if (solution) {
      alts.push(code);
    }
  }
  return alts;
}

function showAlternativeModal(sourceCode, alternatives) {
  const list = document.getElementById('alt-course-list');
  list.innerHTML = '';
  const desc = document.getElementById('alt-modal-desc');
  desc.textContent = `Alternatif untuk ${sourceCode} (${COURSES[sourceCode].name})`;

  if (alternatives.length === 0) {
    list.innerHTML = `<div class="empty" style="padding:20px;color:var(--muted)">Tiada alternatif yang sesuai ditemui.</div>`;
  } else {
    alternatives.forEach(code => {
      const course = COURSES[code];
      const div = document.createElement('div');
      div.className = 'intake-item';
      div.onclick = () => addAlternativeCourse(code);
      div.innerHTML = `
        <div class="intake-item-info">
          <div class="intake-item-code">${code}</div>
          <div class="intake-item-name">${course.name}</div>
        </div>
        <div class="intake-item-credits">${getCredits(code)} CR</div>
      `;
      list.appendChild(div);
    });
  }

  document.getElementById('alternative-modal').classList.add('show');
}

function closeAlternativeModal() {
  document.getElementById('alternative-modal').classList.remove('show');
}

function addAlternativeCourse(code) {
  // Add to selected and re-run solver
  const currentCodes = Object.keys(pendingResolution.solution);
  const newCodes = [...currentCodes, code];
  
  const solution = findBestConfiguration(newCodes);
  if (solution) {
    // Update pending resolution
    pendingResolution.solution = solution;
    // Remove from 'removed' list if it was a suggestion? 
    // Actually, we just need to update the UI/State.
    // Let's just apply it immediately for simplicity or refresh the resolution modal.
    closeAlternativeModal();
    applyResolution(); 
  }
}

/* ════ REALTIME TIMETABLE ════ */
function renderTimetable() {
  const body = document.getElementById('tt-body');
  const t = DICT[currentLang] || DICT.ms;
  if (Object.keys(selected).length === 0) {
    body.innerHTML = `<div class="empty"><div class="empty-ico">📋</div><h3>${t.emptyNoSubjectTitle || (currentLang === 'ms' ? 'Tiada Subjek Dipilih' : 'No subjects selected')}</h3><p>${t.emptyNoSubjectDesc || (currentLang === 'ms' ? 'Pilih subjek dari senarai dan tetapkan seksyen.' : 'Pick subjects from the list and choose a section.')}</p></div>`;
    document.getElementById('tt-title').textContent = t.timetableTitle || (currentLang === 'ms' ? 'Jadual Waktu' : 'Timetable');
    document.getElementById('conflict-strip').style.display = 'none';
    return;
  }

  const conflicts = checkConflicts();
  const n = Object.keys(selected).length;
  const prefix = currentLang === 'ms' ? 'Jadual' : 'Timetable';
  const subjWord = currentLang === 'ms' ? 'Subjek' : (n === 1 ? 'Subject' : 'Subjects');
  document.getElementById('tt-title').textContent = `${prefix} — ${n} ${subjWord}`;
  const strip = document.getElementById('conflict-strip');
  if (conflicts.length) {
    const label = t.conflictLabel || (currentLang === 'ms' ? 'Konflik Masa' : 'Time conflict');
    strip.style.display = 'block';
    strip.innerHTML = `⚠ <strong>${label}:</strong> ${conflicts.join(' · ')}`;
  }
  else strip.style.display = 'none';

  // Build grid data (slots organized directly by day)
  const daySlots = {};
  DAYS.forEach(d => daySlots[d] = []);

  let lectures = 0, labs = 0;
  for (const [code, sec] of Object.entries(selected)) {
    (COURSES[code].sections[sec] || []).forEach(slot => {
      if (slot.type === 'Lecture') lectures++; else if (slot.type === 'Lab/Amali') labs++;

      const startTime = (slot.time_start || '').replace('.', ':');
      const si = TIME_SLOTS.findIndex(t => t.startsWith(startTime));
      if (si === -1) return;

      const dur = slot.duration || 1;
      let endTime = "Unknown";
      const endSi = si + dur - 1;
      if (endSi >= 0 && endSi < TIME_SLOTS.length) {
        endTime = TIME_SLOTS[endSi].split(' - ')[1].replace(' (eve)', '');
      }

      daySlots[slot.day].push({
        code, sec, ...slot,
        time_end: endTime,
        ci: colorMap[code],
        colspan: dur,
        startIdx: si,
        updateTag: getSlotUpdateTag(code, sec, slot)
      });
    });
  }

  // Pre-calculate isConflict property and tracks for overlaps
  DAYS.forEach(day => {
    // Determine isConflict (any overlap)
    daySlots[day].forEach((s1, i) => {
      s1.isConflict = false;
      daySlots[day].forEach((s2, j) => {
        if (i !== j) {
          if (s1.startIdx < s2.startIdx + s2.colspan && s1.startIdx + s1.colspan > s2.startIdx) {
            s1.isConflict = true;
          }
        }
      });
    });

    // Group into connected overlapping components for dynamic height splitting
    const sorted = [...daySlots[day]].sort((a, b) => a.startIdx - b.startIdx);
    let clusters = [];
    sorted.forEach(s => {
      let added = false;
      for (let cluster of clusters) {
        if (s.startIdx < cluster.maxEnd) {
          cluster.slots.push(s);
          cluster.maxEnd = Math.max(cluster.maxEnd, s.startIdx + s.colspan);
          added = true;
          break;
        }
      }
      if (!added) clusters.push({ maxEnd: s.startIdx + s.colspan, slots: [s] });
    });

    // Assign tracks per cluster
    clusters.forEach(cluster => {
      const tracks = [];
      cluster.slots.forEach(s => {
        let placed = false;
        for (let i = 0; i < tracks.length; i++) {
          if (tracks[i] <= s.startIdx) {
            s.track = i;
            tracks[i] = s.startIdx + s.colspan;
            placed = true;
            break;
          }
        }
        if (!placed) {
          s.track = tracks.length;
          tracks.push(s.startIdx + s.colspan);
        }
      });
      cluster.slots.forEach(s => s.overlapCount = tracks.length);
    });
  });

  if (viewMode === 'cards') {
    body.innerHTML = buildCardsHTML(daySlots) + buildStatsHTML(lectures, labs, conflicts.length) + buildLegendHTML();
  } else {
    body.innerHTML = buildTableHTML(daySlots) + buildStatsHTML(lectures, labs, conflicts.length) + buildLegendHTML();
  }
}

function buildTableHTML(daySlots) {
  const t = DICT[currentLang];
  if (layoutOrientation === 'days-left') {
    return buildTableDaysLeft(daySlots, t);
  }
  return buildTableDaysTop(daySlots, t);
}

function renderSlotContent(e, ts, col, venue, durLabel, isTransposed = false) {
  let isCompact = (e.overlapCount || 1) > 1;
  const uCls = e.updateTag ? ` update-${e.updateTag}` : '';
  const uBadge = e.updateTag
    ? `<span class="slot-update-badge${e.updateTag === 'changed' ? ' changed' : ''}">${e.updateTag === 'new' ? (currentLang === 'ms' ? 'BARU' : 'NEW') : (currentLang === 'ms' ? 'KEMAS KINI' : 'UPDATED')}</span>`
    : '';
  const courseName = escHtml((COURSES[e.code] && COURSES[e.code].name) ? COURSES[e.code].name : '');

  if (isCompact) {
    let tStart = e.time_start || '', tEnd = e.time_end || '';
    let confDurLabel = `<div class="slot-dur desktop-hide" style="font-size:7px;margin-top:1px">${format12Hour(tStart)} - ${format12Hour(tEnd)}</div>`;

    let pct = 100 / e.overlapCount;
    let offset = e.track * pct;

    let posStyles = isTransposed
      ? `inset:auto; top:2px; bottom:2px; left:calc(${offset}% + 2px); width:calc(${pct}% - 4px); min-height:0;`
      : `inset:auto; left:2px; right:2px; top:calc(${offset}% + 2px); height:calc(${pct}% - 4px); min-height:0;`;

    let contentInner = `
       <div class="slot-code" style="font-size:8px; margin-bottom:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.code}</div>
       ${courseName ? `<div class="slot-name">${courseName}</div>` : ''}
       <div style="font-size:7px; opacity:.8; line-height:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ts}·${e.sec}</div>
    `;

    if (e.isConflict) {
      contentInner = `
         <div class="slot-code" style="font-size:8px; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:2px;">
            <span style="color:#f87171;">⚠</span><b>${e.code}</b>
            <span style="opacity:0.8; font-size: 7px;">· ${ts} ${e.sec}</span>
         </div>
         ${courseName ? `<div class="slot-name">${courseName}</div>` : ''}
      `;
    }

    // Dynamic padding base on conflict to use flex-start effectively
    let conflictPadding = e.isConflict ? '3px 4px 2px 4px' : '2px 4px';
    let conflictJustify = e.isConflict ? 'flex-start' : 'center';

    return `<div class="slot type-${ts}${uCls}" style="position:absolute; ${posStyles} border-left:3px solid ${e.isConflict ? '#f87171' : col}; background:${e.isConflict ? 'rgba(240,82,82,0.15)' : col + '22'}; color:${e.isConflict ? '#f87171' : col}; padding: ${conflictPadding}; display:flex; flex-direction:column; justify-content:${conflictJustify}; overflow:hidden; pointer-events:auto; z-index:${(e.track || 0) + 10};" 
         title="${e.code} ${e.sec}&#10;${e.type}&#10;${e.day} ${format12Hour(e.time_start)}–${format12Hour(e.time_end)}&#10;${e.venue}&#10;${e.lecturer}" 
         onclick="showDetailModal(this)" data-info="${encodeURIComponent(JSON.stringify(e))}">
         ${contentInner}
         ${uBadge}
         ${confDurLabel}
      </div>`;
  }

  // Full Layout
  let inner = `
    <div class="slot-code">${e.code}${uBadge}</div>
    ${courseName ? `<div class="slot-name">${courseName}</div>` : ''}
    <div class="slot-meta">${e.sec} <span class="slot-type-badge" style="background:${col}33">${ts}</span></div>
    ${venue ? `<div class="slot-venue">${venue}</div>` : ''}
    ${durLabel}
  `;
  if (e.isConflict) {
    inner = `
      <div class="slot-code" style="display:flex; align-items:center; gap:4px; margin-bottom: 2px;">
        <span style="color:#f87171">⚠</span>
        <span>${e.code}</span>
        <span style="font-size:8px; opacity:0.8; font-weight:normal; letter-spacing:0;">${ts} ${e.sec}</span>
      </div>
      ${courseName ? `<div class="slot-name">${courseName}</div>` : ''}
      ${durLabel}
    `;
  }
  return `
    <div class="slot type-${ts}${uCls}" style="position:absolute; inset:2px; background:${col}22;border-left:3px solid ${e.isConflict ? '#f87171' : col};color:${e.isConflict ? '#f87171' : col}; ${e.isConflict ? 'background:rgba(240,82,82,0.1)' : ''}; pointer-events:auto; z-index: 10;" 
         title="${e.code} ${e.sec}&#10;${e.type}&#10;${e.day} ${format12Hour(e.time_start)}–${format12Hour(e.time_end)}&#10;${e.venue}&#10;${e.lecturer}" 
         onclick="showDetailModal(this)" data-info="${encodeURIComponent(JSON.stringify(e))}">
      ${inner}
    </div>`;
}

function buildTableDaysTop(daySlots, t) {
  // Original layout: days as rows, time as columns
  let html = `<div class="tt-scroll"><table class="tt-table"><thead><tr><th class="day-th">${t.hari}</th>`;
  TIME_SLOTS.forEach((ts) => {
    const parts = ts.replace(' (eve)', '★').split(' - ');
    const label = `<div style="line-height:1.2">${parts[0]}<br><span style="opacity:0.6;font-size:8px">${parts[1] || ''}</span></div>`;
    html += `<th>${label}</th>`;
  });
  html += `</tr></thead><tbody>`;

  DAYS.forEach(day => {
    html += `<tr><td class="day-td">${t.days[day]}</td>`;

    if (daySlots[day].length === 0) {
      for (let i = 0; i < TIME_SLOTS.length; i++) html += `<td></td>`;
    } else {
      html += `<td colspan="${TIME_SLOTS.length}" style="padding:0; position:relative; vertical-align:top;">`;
      html += `<div style="display: grid; grid-template-columns: repeat(${TIME_SLOTS.length}, 1fr); grid-auto-rows: minmax(58px, auto); position:relative; min-height: 58px;">`;

      html += `<div style="grid-column: 1 / -1; grid-row: 1 / -1; display: grid; grid-template-columns: repeat(${TIME_SLOTS.length}, 1fr); pointer-events: none; position: absolute; inset: 0; z-index: 0;">`;
      for (let i = 0; i < TIME_SLOTS.length; i++) html += `<div style="border-right: 1px solid var(--grid-line);"></div>`;
      html += `</div>`;

      daySlots[day].forEach(e => {
        const col = getSubjectColor(e.code);
        const ts = typeLabel(e.type);
        const venue = (e.venue || '').replace('I-', '').substring(0, 16);
        let durLabel = e.colspan > 1
          ? `<div class="slot-dur">${format12Hour(e.time_start)} - ${format12Hour(e.time_end)}</div>`
          : `<div class="slot-dur desktop-hide">${format12Hour(e.time_start)} - ${format12Hour(e.time_end)}</div>`;

        const startCol = e.startIdx + 1;
        html += `<div style="grid-column: ${startCol} / span ${e.colspan}; grid-row: 1; position: relative; z-index: 1; pointer-events: none;">
            ${renderSlotContent(e, ts, col, venue, durLabel, false)}
         </div>`;
      });
      html += `</div></td>`;
    }
    html += `</tr>`;
  });
  return html + `</tbody></table></div>`;
}

function buildTableDaysLeft(daySlots, t) {
  // Transposed: time as rows, days as columns. Uses CSS Grid purely to avoid rowspan HTML Table bugs.
  let html = `<div class="tt-scroll"><table class="tt-table tt-table-dl"><thead><tr><th class="day-th time-th" style="width:80px">${currentLang === 'ms' ? 'Masa' : 'Time'}</th>`;
  DAYS.forEach(day => {
    html += `<th class="day-col-th">${t.days[day]}</th>`;
  });
  html += `</tr></thead><tbody><tr>`;

  // Time labels column
  html += `<td style="padding:0; vertical-align:top;"><div style="display: grid; grid-template-rows: repeat(${TIME_SLOTS.length}, 58px);">`;
  TIME_SLOTS.forEach((ts) => {
    const parts = ts.replace(' (eve)', '★').split(' - ');
    const label = `<div style="line-height:1.3;text-align:center;padding:10px 0;font-size:10px;font-weight:bold;color:var(--text);border-bottom: 1px solid var(--grid-line);">${parts[0]}<br><span style="opacity:0.6;font-size:8px">${parts[1] || ''}</span></div>`;
    html += `<div>${label}</div>`;
  });
  html += `</div></td>`;

  DAYS.forEach(day => {
    html += `<td style="padding:0; position:relative; vertical-align:top; border-right: 1px solid var(--border);">`;
    html += `<div style="display: grid; grid-template-rows: repeat(${TIME_SLOTS.length}, 58px); grid-auto-columns: minmax(60px, auto); position:absolute; inset:0; min-width: 100%;">`;

    html += `<div style="grid-column: 1 / -1; grid-row: 1 / -1; display: grid; grid-template-rows: repeat(${TIME_SLOTS.length}, 58px); pointer-events: none; position: absolute; inset: 0; z-index: 0;">`;
    for (let i = 0; i < TIME_SLOTS.length; i++) html += `<div style="border-bottom: 1px solid var(--grid-line);"></div>`;
    html += `</div>`;

    daySlots[day].forEach(e => {
      const col = getSubjectColor(e.code);
      const ts = typeLabel(e.type);
      const venue = (e.venue || '').replace('I-', '').substring(0, 16);
      let durLabel = e.colspan > 1
        ? `<div class="slot-dur">${format12Hour(e.time_start)} - ${format12Hour(e.time_end)}</div>`
        : `<div class="slot-dur desktop-hide">${format12Hour(e.time_start)} - ${format12Hour(e.time_end)}</div>`;

      const startRow = e.startIdx + 1;
      html += `<div style="grid-row: ${startRow} / span ${e.colspan}; grid-column: 1; position: relative; z-index: 1; min-height: 58px; pointer-events: none;">
          ${renderSlotContent(e, ts, col, venue, durLabel, true)}
       </div>`;
    });

    html += `</div></td>`;
  });

  return html + `</tr></tbody></table></div>`;
}


/* ════ CARD VIEW (mobile / tablet) ════ */
function buildCardsHTML(daySlots) {
  const t = DICT[currentLang];
  const DAY_COLORS = ['#4f8ef7', '#10b981', '#f59e0b', '#f05252', '#8b5cf6'];
  let html = '<div class="cards-view">';

  DAYS.forEach((day, di) => {
    // Collect all slots for this day, sort by start time
    const entries = [...daySlots[day]].sort((a, b) => a.startIdx - b.startIdx);

    html += `<div class="day-section">
      <div class="day-section-hdr">
        <span class="day-pip" style="background:${DAY_COLORS[di]}"></span>
        <span class="day-label">${t.days[day]}</span>
      </div>`;

    if (entries.length === 0) {
      html += `<div class="day-empty">—</div>`;
    } else {
      html += `<div class="day-slots">`;
      entries.forEach(e => {
        const col = getSubjectColor(e.code);
        const ts = typeLabel(e.type);
        const name = (COURSES[e.code] && COURSES[e.code].name) ? COURSES[e.code].name : '';
        const venue = (e.venue || '').replace('I-', '').trim();
        const tStart = e.time_start || '';
        const tEnd = e.time_end || '';
        const timeStr = format12Hour(tStart) + (tEnd ? ' – ' + format12Hour(tEnd) : '');
        const typeFull = ts === 'K' ? 'Kuliah' : ts === 'A' ? 'Amali' : 'Tutorial';
        const confTag = e.isConflict ? `<span class="sc-tag is-conflict">⚠ KONFLIK</span>` : '';
        const venueTag = venue ? `<span class="sc-tag">${venue.substring(0, 22)}</span>` : '';
        const uCls = e.updateTag ? ` update-${e.updateTag}` : '';
        const uBadge = e.updateTag
          ? `<span class="slot-update-badge${e.updateTag === 'changed' ? ' changed' : ''}">${e.updateTag === 'new' ? (currentLang === 'ms' ? 'BARU' : 'NEW') : (currentLang === 'ms' ? 'KEMAS KINI' : 'UPDATED')}</span>`
          : '';

        html += `<div class="slot-card${uCls}" style="border-left-color:${col};background:${col}12; ${e.isConflict ? 'border-color:#f87171; background:rgba(240,82,82,0.1)' : ''}" onclick="showDetailModal(this)" data-info="${encodeURIComponent(JSON.stringify(e))}">
          <div class="sc-code" style="color:${e.isConflict ? '#f87171' : col}">${e.isConflict ? '⚠ ' : ''}${e.code}${uBadge}</div>
          <div class="sc-time">${timeStr}</div>
          <div class="sc-name">${name}</div>
          <div class="sc-tags">
            <span class="sc-tag">${e.sec}</span>
            <span class="sc-tag type-${ts}">${typeFull}</span>
            ${venueTag}
            ${confTag}
          </div>
        </div>`;
      });
      html += `</div>`;
    }
    html += `</div>`; // .day-section
  });

  return html + '</div>';
}


function buildStatsHTML(lectures, labs, conflictCount) {
  const cc = conflictCount > 0 ? 'var(--red)' : 'var(--green)';
  const cr = totalCredits();
  const crc = cr > 20 ? 'var(--red)' : cr >= 12 ? 'var(--green)' : 'var(--yellow)';
  const t = DICT[currentLang].stats;
  return `<div class="stat-row">
    <div class="stat"><div class="stat-n" style="color:var(--accent)">${Object.keys(selected).length}</div><div class="stat-l">${t.subj}</div></div>
    <div class="stat"><div class="stat-n" style="color:${crc}">${cr}</div><div class="stat-l">${t.cred}</div></div>
    <div class="stat"><div class="stat-n" style="color:#93c5fd">${lectures}</div><div class="stat-l">${t.lec}</div></div>
    <div class="stat"><div class="stat-n" style="color:#6ee7b7">${labs}</div><div class="stat-l">${t.lab}</div></div>
    <div class="stat"><div class="stat-n" style="color:${cc}">${conflictCount}</div><div class="stat-l">${t.conf}</div></div>
  </div>`;
}

function buildLegendHTML() {
  const t = DICT[currentLang];
  let html = `<div class="legend"><span class="legend-t">${t.legendCode}</span>`;
  Object.keys(selected).forEach(code => {
    html += `<div class="legend-item"><div class="legend-dot" style="background:${getSubjectColor(code)}"></div>${code} (${selected[code]})</div>`;
  });
  return html + `<div class="legend-sep"></div><div class="legend-item" style="color:var(--muted)">${t.legendNight}</div><div class="legend-item" style="color:var(--muted)">${t.legendType}</div></div>`;
}

/* ════ UTILITY ════ */
function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function typeLabel(type) {
  return type === 'Lecture' ? 'K' : type === 'Lab/Amali' ? 'A' : 'T';
}
function getCredits(code) { const m = code.match(/(\d{2})$/); return m ? parseInt(m[1], 10) : 0; }
function totalCredits() { return Object.keys(selected).reduce((s, c) => s + getCredits(c), 0); }

function _parseSectionNumber(sec) {
  // Supports "S1", "1", and "S1/2" (sorted by the first number).
  const m = String(sec || '').trim().match(/^S?\s*(\d+)(?:\s*\/\s*(\d+))?$/i);
  if (!m) return null;
  return { primary: parseInt(m[1], 10), secondary: m[2] ? parseInt(m[2], 10) : null };
}

function sortSections(sections) {
  return [...(sections || [])].sort((a, b) => {
    const pa = _parseSectionNumber(a);
    const pb = _parseSectionNumber(b);
    if (pa && pb) {
      if (pa.primary !== pb.primary) return pa.primary - pb.primary;
      const sa = pa.secondary === null ? -1 : pa.secondary;
      const sb = pb.secondary === null ? -1 : pb.secondary;
      if (sa !== sb) return sa - sb;
      return String(a).localeCompare(String(b), undefined, { numeric: true });
    }
    if (pa) return -1;
    if (pb) return 1;
    return String(a).localeCompare(String(b), undefined, { numeric: true });
  });
}

function _normDur(d) {
  const v = Number(d);
  if (!Number.isFinite(v)) return d;
  return Math.abs(v - Math.round(v)) < 1e-6 ? Math.round(v) : Math.round(v * 100) / 100;
}

function _slotUpdateKey(code, sec, slotLike) {
  return [
    code,
    sec,
    slotLike.type || '',
    slotLike.day || '',
    (slotLike.time_start || '').replace('.', ':'),
    _normDur(slotLike.duration || 0),
  ].join('|');
}

function initLatestUpdate() {
  latestUpdate = (typeof window !== 'undefined' && window.LATEST_UPDATE) ? window.LATEST_UPDATE : null;
  if (!latestUpdate || !latestUpdate.changes) {
    updateIndex = null;
    return;
  }

  const changes = latestUpdate.changes || {};
  const addedCourses = new Set((changes.courses && changes.courses.added) || []);
  const removedCourses = new Set((changes.courses && changes.courses.removed) || []);

  const changedCourses = new Set();
  const slotAdded = new Set();
  const slotChanged = new Set();

  const secAdded = (changes.sections && changes.sections.added) || {};
  const secRemoved = (changes.sections && changes.sections.removed) || {};
  Object.keys(secAdded).forEach(c => changedCourses.add(c));
  Object.keys(secRemoved).forEach(c => changedCourses.add(c));

  const sAdded = (changes.slots && changes.slots.structural && changes.slots.structural.added) || {};
  const sRemoved = (changes.slots && changes.slots.structural && changes.slots.structural.removed) || {};
  const dOnly = (changes.slots && changes.slots.detail_only_changed) || {};
  const _slotArr = (k) => {
    if (Array.isArray(k)) return k;
    if (k && typeof k === 'object' && Array.isArray(k.slot)) return k.slot;
    return null;
  };

  for (const [code, secs] of Object.entries(sAdded)) {
    changedCourses.add(code);
    for (const [sec, keys] of Object.entries(secs || {})) {
      (keys || []).forEach(k => {
        // k format: [sec,type,day,time,dur]
        slotAdded.add([code, k[0], k[1], k[2], k[3], _normDur(k[4])].join('|'));
      });
    }
  }
  for (const [code, secs] of Object.entries(sRemoved)) {
    changedCourses.add(code);
    for (const [sec, keys] of Object.entries(secs || {})) {
      (keys || []).forEach(k => {
        slotChanged.add([code, k[0], k[1], k[2], k[3], _normDur(k[4])].join('|'));
      });
    }
  }
  for (const [code, secs] of Object.entries(dOnly)) {
    changedCourses.add(code);
    for (const [sec, keys] of Object.entries(secs || {})) {
      (keys || []).forEach(k => {
        const a = _slotArr(k);
        if (!a) return;
        slotChanged.add([code, a[0], a[1], a[2], a[3], _normDur(a[4])].join('|'));
      });
    }
  }

  updateIndex = { addedCourses, removedCourses, changedCourses, slotAdded, slotChanged };
}

function getCourseUpdateTag(code) {
  if (!updateIndex) return null;
  if (updateIndex.addedCourses.has(code)) return { cls: 'tag-new', label: currentLang === 'ms' ? 'BARU' : 'NEW' };
  if (updateIndex.changedCourses.has(code)) return { cls: 'tag-upd', label: currentLang === 'ms' ? 'KEMAS KINI' : 'UPDATED' };
  return null;
}

function getSlotUpdateTag(code, sec, slot) {
  if (!updateIndex) return null;
  const key = _slotUpdateKey(code, sec, slot);
  if (updateIndex.slotAdded.has(key)) return 'new';
  if (updateIndex.slotChanged.has(key)) return 'changed';
  return null;
}

function _countNestedKeys(obj) {
  let n = 0;
  for (const v of Object.values(obj || {})) for (const arr of Object.values(v || {})) n += (arr || []).length;
  return n;
}

function showUpdatePopup() {
  if (!latestUpdate || !latestUpdate.timetable) {
    return;
  }

  _updatePrevFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;

  // Always show on load (as requested).
  let modal = document.getElementById('update-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal update-modal';
    modal.id = 'update-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.onclick = (e) => { if (e.target === modal) closeUpdatePopup(); };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeUpdatePopup(); });
    document.body.appendChild(modal);
  }
  // Ensure it can show again even after we set display:none on close.
  modal.style.display = 'flex';
  modal.removeAttribute('inert');

  const c = latestUpdate.changes || {};
  const coursesAddedArr = (c.courses && c.courses.added) || [];
  const coursesRemovedArr = (c.courses && c.courses.removed) || [];
  const namesChangedArr = (c.courses && c.courses.name_changed) || [];
  const sectionsAddedObj = (c.sections && c.sections.added) || {};
  const sectionsRemovedObj = (c.sections && c.sections.removed) || {};
  const detailOnlyObj = (c.slots && c.slots.detail_only_changed) || {};

  const slotAddedCount = _countNestedKeys((c.slots && c.slots.structural && c.slots.structural.added) || {});
  const slotRemovedCount = _countNestedKeys((c.slots && c.slots.structural && c.slots.structural.removed) || {});
  const slotDetailChangedCount = _countNestedKeys((c.slots && c.slots.detail_only_changed) || {});

  const title = currentLang === 'ms' ? 'Kemaskini Terkini' : 'Latest Update';
  const closeLbl = currentLang === 'ms' ? 'Tutup' : 'Close';
  const ttDate = latestUpdate.timetable.latestId || latestUpdate.timetable.latestDate || '-';
  const prevDate = latestUpdate.timetable.previousId || latestUpdate.timetable.previousDate || '-';
  const genAt = latestUpdate.generatedAt || '-';
  const base = latestUpdate.timetable.base || '-';
  const sourcesArr = latestUpdate.timetable.sourcesUsed || [];
  const sourcesShort = sourcesArr.length
    ? `${sourcesArr[0]}${sourcesArr.length > 1 ? ` (+${sourcesArr.length - 1})` : ''}`
    : '-';
  const diffBase = latestUpdate.timetable.diffBase || '-';
  const appMod = (document && document.lastModified) ? document.lastModified : '-';
  const fmt12 = (d, withSeconds = true) => {
    const pad2 = (n) => String(n).padStart(2, '0');
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    const yyyy = d.getFullYear();
    let hh = d.getHours();
    const ap = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    if (hh === 0) hh = 12;
    const hh12 = pad2(hh);
    const mi = pad2(d.getMinutes());
    const ss = pad2(d.getSeconds());
    return `${mm}/${dd}/${yyyy} ${hh12}:${mi}${withSeconds ? `:${ss}` : ''} ${ap}`;
  };
  const parseLastModified = (s) => {
    if (!s || s === '-') return null;
    const str = String(s).trim();
    const direct = new Date(str);
    if (!isNaN(direct)) return direct;
    const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,)?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!m) return null;
    let month = parseInt(m[1], 10);
    let day = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    let hour = parseInt(m[4], 10);
    const minute = parseInt(m[5], 10);
    const second = parseInt(m[6] || '0', 10);
    const ap = (m[7] || '').toUpperCase();
    if (ap) {
      if (ap === 'PM' && hour < 12) hour += 12;
      if (ap === 'AM' && hour === 12) hour = 0;
    }
    if (!month || !day || !year) return null;
    // Basic safety clamp
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (hour < 0 || hour > 23) return null;
    if (minute < 0 || minute > 59) return null;
    if (second < 0 || second > 59) return null;
    return new Date(year, month - 1, day, hour, minute, second);
  };
  const appModPretty = (() => {
    try {
      const d = parseLastModified(appMod);
      return d ? fmt12(d, true) : String(appMod || '-');
    } catch {
      return String(appMod || '-');
    }
  })();
  const genAtPretty = (() => {
    try {
      const d = new Date(genAt);
      if (isNaN(d)) return genAt;
      return fmt12(d, false);
    } catch {
      return genAt;
    }
  })();
  const sourcesFull = sourcesArr.length ? sourcesArr.join(', ') : sourcesShort;

  const fmtKey = (k) => `<code>${k}</code>`;
  const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const getCourseName = (code) => {
    try {
      const n = (typeof COURSES !== 'undefined' && COURSES[code] && COURSES[code].name) ? COURSES[code].name : '';
      return n ? escHtml(n) : '';
    } catch {
      return '';
    }
  };

  const slotAdded = (c.slots && c.slots.structural && c.slots.structural.added) || {};
  const slotRemoved = (c.slots && c.slots.structural && c.slots.structural.removed) || {};
  const detailChanged = (c.slots && c.slots.detail_only_changed) || {};

  function slotListHTML(slotObj, marker = '') {
    const rows = [];
    for (const [code, secs] of Object.entries(slotObj || {})) {
      for (const [sec, keys] of Object.entries(secs || {})) {
        for (const k of (keys || [])) {
          // k = [sec,type,day,time,dur]
          const cname = getCourseName(code);
          const meta = `${k[1]} • ${k[2]} ${k[3]} (${k[4]}h)`;
          rows.push(`
            <div class="update-item-top">${marker ? marker + ' ' : ''}${fmtKey(code)} ${fmtKey(k[0])}</div>
            ${cname ? `<div class="update-course-name">${cname}</div>` : ''}
            <div class="update-meta">${escHtml(meta)}</div>
          `.trim());
        }
      }
    }
    if (!rows.length) return `<div class="update-empty">—</div>`;
    const shown = rows.map(r => `<div class="update-item">${r}</div>`).join('');
    return `<div class="update-items">${shown}</div>`;
  }

  function codeListHTML(arr, marker = '') {
    if (!arr || !arr.length) return `<div class="update-empty">—</div>`;
    const prefix = marker ? marker + ' ' : '';
    const rows = arr.map(c => {
      const name = getCourseName(c);
      return `
        <div class="update-item-top">${prefix}${fmtKey(c)}</div>
        ${name ? `<div class="update-course-name">${name}</div>` : ''}
      `.trim();
    });
    const shown = rows.map(r => `<div class="update-item">${r}</div>`).join('');
    return `<div class="update-items">${shown}</div>`;
  }

  function sectionsListHTML(obj, marker = '') {
    const rows = [];
    const prefix = marker ? marker + ' ' : '';
    for (const [code, secs] of Object.entries(obj || {})) {
      const name = getCourseName(code);
      rows.push(`
        <div class="update-item-top">${prefix}${fmtKey(code)}: ${(secs || []).map(s => fmtKey(s)).join(' ')}</div>
        ${name ? `<div class="update-course-name">${name}</div>` : ''}
      `.trim());
    }
    if (!rows.length) return `<div class="update-empty">—</div>`;
    const shown = rows.map(r => `<div class="update-item">${r}</div>`).join('');
    return `<div class="update-items">${shown}</div>`;
  }

  function detailOnlyListHTML(obj, marker = '') {
    const rows = [];
    const labelLect = currentLang === 'ms' ? 'Pensyarah' : 'Lecturer';
    const labelVenue = currentLang === 'ms' ? 'Lokasi' : 'Venue';
    const labelIntakes = currentLang === 'ms' ? 'Ambilan' : 'Intakes';
    const _fmtVal = (v) => {
      if (Array.isArray(v)) return v.join(' | ');
      return String(v ?? '');
    };
    for (const [code, secs] of Object.entries(obj || {})) {
      for (const [sec, entries] of Object.entries(secs || {})) {
        for (const entry of (entries || [])) {
          const slot = Array.isArray(entry) ? entry : (entry && Array.isArray(entry.slot) ? entry.slot : null);
          if (!slot) continue;
          const cname = getCourseName(code);
          const meta = `${slot[1]} • ${slot[2]} ${slot[3]} (${slot[4]}h)`;
          const changes = (entry && typeof entry === 'object') ? (entry.changes || {}) : {};
          const lines = [];
          if (changes.lecturer) lines.push(`${labelLect}: ${escHtml(_fmtVal(changes.lecturer.from))} → ${escHtml(_fmtVal(changes.lecturer.to))}`);
          if (changes.venue) lines.push(`${labelVenue}: ${escHtml(_fmtVal(changes.venue.from))} → ${escHtml(_fmtVal(changes.venue.to))}`);
          if (changes.intakes) lines.push(`${labelIntakes}: ${escHtml(_fmtVal(changes.intakes.from))} → ${escHtml(_fmtVal(changes.intakes.to))}`);
          if (changes.rows) lines.push(`${currentLang === 'ms' ? 'Butiran' : 'Details'}: ${currentLang === 'ms' ? 'dikemaskini' : 'updated'}`);

          rows.push(`
            <div class="update-item-top">${marker ? marker + ' ' : ''}${fmtKey(code)} ${fmtKey(slot[0])}</div>
            ${cname ? `<div class="update-course-name">${cname}</div>` : ''}
            <div class="update-meta">${escHtml(meta)}</div>
            ${lines.length ? `<div class="update-meta">${lines.join('<br>')}</div>` : ''}
          `.trim());
        }
      }
    }
    if (!rows.length) return `<div class="update-empty">—</div>`;
    const shown = rows.map(r => `<div class="update-item">${r}</div>`).join('');
    return `<div class="update-items">${shown}</div>`;
  }

  const hasAnyChange =
    coursesAddedArr.length || coursesRemovedArr.length ||
    Object.keys(sectionsAddedObj).length || Object.keys(sectionsRemovedObj).length ||
    slotAddedCount || slotRemovedCount || namesChangedArr.length || slotDetailChangedCount;

  const addedHdr = currentLang === 'ms' ? 'Ditambah' : 'Added';
  const removedHdr = currentLang === 'ms' ? 'Dibuang' : 'Removed';
  const changedHdr = currentLang === 'ms' ? 'Berubah' : 'Changed';
  const coursesLbl = currentLang === 'ms' ? 'Kursus' : 'Courses';
  const sectionsLbl = currentLang === 'ms' ? 'Seksyen' : 'Sections';
  const classesLbl = currentLang === 'ms' ? 'Kelas' : 'Classes';

  modal.innerHTML = `
    <div class="modal-content update-content" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <div class="update-hdr">
        <div class="update-hdr-left">
          <h3 id="update-title" class="update-title">${title}</h3>
	          <div class="update-sub">
	            <span class="update-chip">${currentLang === 'ms' ? 'Versi' : 'Version'}: <b>${prevDate}</b> → <b>${ttDate}</b></span>
	            <span class="update-chip">${currentLang === 'ms' ? 'Dijana' : 'Generated'}: ${genAtPretty}</span>
	          </div>
	        </div>
	        <button class="btn-sm update-close" id="update-close" onclick="closeUpdatePopup()">${closeLbl}</button>
	      </div>

      ${hasAnyChange ? '' : `
        <div class="update-note">
          <b>${currentLang === 'ms' ? 'Tiada Perubahan' : 'No changes'}</b>
          <div style="margin-top:4px;opacity:.9">${currentLang === 'ms' ? `Tiada perubahan berbanding ${fmtKey(diffBase)}.` : `No changes compared to ${fmtKey(diffBase)}.`}</div>
        </div>
      `}

      ${coursesAddedArr.length || Object.keys(sectionsAddedObj).length || slotAddedCount ? `
        <section class="update-section is-added">
          <div class="update-section-title">🟢 ${addedHdr}</div>
          ${coursesAddedArr.length ? `<div class="update-block"><div class="update-block-title">${coursesLbl}</div>${codeListHTML(coursesAddedArr, '🟢')}</div>` : ''}
          ${Object.keys(sectionsAddedObj).length ? `<div class="update-block"><div class="update-block-title">${sectionsLbl}</div>${sectionsListHTML(sectionsAddedObj, '🟢')}</div>` : ''}
          ${slotAddedCount ? `<div class="update-block"><div class="update-block-title">${classesLbl}</div>${slotListHTML(slotAdded, '🟢')}</div>` : ''}
        </section>
      ` : ''}

      ${coursesRemovedArr.length || Object.keys(sectionsRemovedObj).length || slotRemovedCount ? `
        <section class="update-section is-removed">
          <div class="update-section-title">🔴 ${removedHdr}</div>
          ${coursesRemovedArr.length ? `<div class="update-block"><div class="update-block-title">${coursesLbl}</div>${codeListHTML(coursesRemovedArr, '🔴')}</div>` : ''}
          ${Object.keys(sectionsRemovedObj).length ? `<div class="update-block"><div class="update-block-title">${sectionsLbl}</div>${sectionsListHTML(sectionsRemovedObj, '🔴')}</div>` : ''}
          ${slotRemovedCount ? `<div class="update-block"><div class="update-block-title">${classesLbl}</div>${slotListHTML(slotRemoved, '🔴')}</div>` : ''}
        </section>
      ` : ''}

      ${namesChangedArr.length || slotDetailChangedCount ? `
        <section class="update-section is-changed">
          <div class="update-section-title">🟠 ${changedHdr}</div>
          ${namesChangedArr.length ? `<div class="update-block"><div class="update-block-title">${currentLang === 'ms' ? 'Nama kursus' : 'Course names'}</div><div class="update-items">${namesChangedArr.map(x => `<div class="update-item">${fmtKey(x.code)}: ${String(x.old || '').toUpperCase()} → ${String(x.new || '').toUpperCase()}</div>`).join('')}</div></div>` : ''}
          ${slotDetailChangedCount ? `<div class="update-block"><div class="update-block-title">${currentLang === 'ms' ? 'Butiran kelas' : 'Class details'}</div>${detailOnlyListHTML(detailChanged, '🟠')}</div>` : ''}
        </section>
      ` : ''}

      <details class="update-tech">
        <summary>${currentLang === 'ms' ? 'Info teknikal' : 'Technical info'}</summary>
        <div class="update-tech-body">
          <div class="update-tech-row"><span>${currentLang === 'ms' ? 'Sumber (Base)' : 'Base source'}</span><b>${base}</b></div>
          <div class="update-tech-row"><span>${currentLang === 'ms' ? 'PDF Diguna' : 'PDF used'}</span><span>${sourcesFull}</span></div>
          <div class="update-tech-row"><span>${currentLang === 'ms' ? 'Diff dari' : 'Diff base'}</span><span>${fmtKey(diffBase)}</span></div>
          <div class="update-tech-row"><span>${currentLang === 'ms' ? 'Aplikasi' : 'App'}</span><span>v${APP_BUILD_VERSION} • ${appModPretty}</span></div>
        </div>
      </details>
    </div>
  `;

  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('show');
  const closeBtn = document.getElementById('update-close');
  if (closeBtn) closeBtn.focus();
}

function closeUpdatePopup() {
  const modal = document.getElementById('update-modal');
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  modal.setAttribute('inert', '');
  // After transition ends, fully remove it from layout so it can't block any interaction.
  setTimeout(() => {
    if (modal && !modal.classList.contains('show')) modal.style.display = 'none';
  }, 220);
  const fb = document.getElementById('fab-feedback');
  if (fb) return fb.focus();
  if (_updatePrevFocus && document.contains(_updatePrevFocus)) _updatePrevFocus.focus();
}

function format12Hour(t) {
  if (!t || t === "Unknown") return t;
  const parts = t.replace('.', ':').replace('(eve)', '').trim().split(':');
  if (parts.length < 2) return t;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return t;

  let isPM = false;
  if (h === 12 || (h >= 1 && h <= 7)) isPM = true;
  if (t.includes('(eve)')) isPM = true;

  const ampm = isPM ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}${ampm}`;
}

/* ════ SAVED TIMETABLES (HISTORY) ════ */
function renderSavedList() {
  const t = DICT[currentLang];
  const container = document.getElementById('saved-panel');
  const area = document.getElementById('saved-area');
  const count = document.getElementById('cnt-saved');

  if (savedTimetables.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  count.textContent = savedTimetables.length;

  let html = '';
  // Show newest first
  for (let i = savedTimetables.length - 1; i >= 0; i--) {
    const s = savedTimetables[i];
    const dateStr = new Date(s.timestamp).toLocaleString(currentLang === 'ms' ? 'ms-MY' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const subjs = Object.keys(s.selected).length;

    html += `<div class="saved-card" onclick="loadTimetable('${s.id}')">
      <div style="flex:1;min-width:0;padding-right:10px">
        <div class="saved-name" id="name-${s.id}">${s.name}</div>
        <input type="text" class="rename-input" id="input-${s.id}" value="${s.name}" 
               onclick="event.stopPropagation()"
               onkeydown="if(event.key==='Enter') finishRename('${s.id}'); if(event.key==='Escape') cancelRename('${s.id}')"
               onblur="finishRename('${s.id}')">
        <div class="saved-meta">${subjs} ${t.stats.subj} • ${dateStr}</div>
      </div>
      <div class="saved-actions">
        <button class="btn-rename" onclick="event.stopPropagation(); startRename('${s.id}')" title="Rename">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn-edit" onclick="event.stopPropagation(); loadTimetable('${s.id}')" title="Edit">${currentLang === 'ms' ? 'Pilih' : 'Select'}</button>
        <button class="btn-del" onclick="event.stopPropagation(); deleteTimetable('${s.id}')" title="${t.delBtn}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>`;
  }
  area.innerHTML = html;
}

function startRename(id) {
  const nameEl = document.getElementById(`name-${id}`);
  const inputEl = document.getElementById(`input-${id}`);
  if (!nameEl || !inputEl) return;
  nameEl.classList.add('editing');
  inputEl.classList.add('active');
  inputEl.focus();
  inputEl.select();
}

function cancelRename(id) {
  const nameEl = document.getElementById(`name-${id}`);
  const inputEl = document.getElementById(`input-${id}`);
  if (!nameEl || !inputEl) return;
  const originalName = savedTimetables.find(t => t.id === id)?.name || '';
  inputEl.value = originalName;
  nameEl.classList.remove('editing');
  inputEl.classList.remove('active');
}

function finishRename(id) {
  const inputEl = document.getElementById(`input-${id}`);
  if (!inputEl || !inputEl.classList.contains('active')) return;
  const newName = inputEl.value.trim();
  if (newName) {
    const draft = savedTimetables.find(t => t.id === id);
    if (draft) {
      draft.name = newName;
      localStorage.setItem('uthm-tg-saved', JSON.stringify(savedTimetables));
    }
  }
  renderSavedList();
}

function promptSaveTimetable() {
  if (Object.keys(selected).length === 0) return;
  const input = document.getElementById('save-name-input');
  // Default name: current date
  const defaultName = new Date().toLocaleString(currentLang === 'ms' ? 'ms-MY' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  input.value = currentLang === 'ms' ? `Jadual ${defaultName}` : `Draft ${defaultName}`;
  document.getElementById('save-modal').classList.add('show');
  input.focus();
}

function closeSaveModal() {
  document.getElementById('save-modal').classList.remove('show');
}

function confirmSaveTimetable() {
  const name = document.getElementById('save-name-input').value.trim() || 'Untitled Timetable';

  const newSave = {
    id: 'tt_' + Date.now(),
    name: name,
    timestamp: Date.now(),
    selected: JSON.parse(JSON.stringify(selected)), // deep copy
    colorMap: JSON.parse(JSON.stringify(colorMap)),
    customColors: JSON.parse(JSON.stringify(customColors)),
    colorIdx: colorIdx
  };

  savedTimetables.push(newSave);
  localStorage.setItem('uthm-tg-saved', JSON.stringify(savedTimetables));

  closeSaveModal();
  renderSavedList();
}

function loadTimetable(id) {
  const found = savedTimetables.find(s => s.id === id);
  if (!found) return;

  selected = JSON.parse(JSON.stringify(found.selected));
  colorMap = JSON.parse(JSON.stringify(found.colorMap || {}));
  customColors = JSON.parse(JSON.stringify(found.customColors || {}));
  colorIdx = found.colorIdx || 0;

  // Clear search and refresh lists
  document.getElementById('srch').value = '';
  filterList();
  renderSelArea();
  renderTimetable();

  // Flash effect on timetable
  const ttWrap = document.querySelector('.tt-wrap');
  ttWrap.style.transition = 'none';
  ttWrap.style.opacity = '0.4';
  setTimeout(() => {
    ttWrap.style.transition = 'opacity 0.3s ease';
    ttWrap.style.opacity = '1';
  }, 50);
}

function deleteTimetable(id) {
  const isMalay = currentLang === 'ms';
  const title = isMalay ? 'Padam Jadual?' : 'Delete Timetable?';
  const desc = isMalay
    ? 'Jadual yang disimpan ini akan dipadam. Tindakan ini tidak boleh dibatalkan.'
    : 'This saved timetable will be permanently deleted. This action cannot be undone.';
  const cancelLbl = isMalay ? 'Batal' : 'Cancel';
  const confirmLbl = isMalay ? 'Padam' : 'Delete';

  let overlay = document.getElementById('delete-timetable-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'delete-timetable-modal';
	    overlay.innerHTML = `
	      <div class="modal-box" role="dialog" aria-modal="true">
	        <div class="modal-icon">🗑</div>
	        <div class="modal-title"  id="del-modal-title"></div>
	        <div class="modal-desc"   id="del-modal-desc"></div>
	        <div class="modal-actions">
	          <button class="modal-btn confirm danger" id="del-modal-confirm"></button>
	          <button class="modal-btn cancel"  id="del-modal-cancel"></button>
	        </div>
	      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) closeDeleteModal(); });
    document.addEventListener('keydown', function delEsc(e) {
      if (e.key === 'Escape') closeDeleteModal();
    });
    document.body.appendChild(overlay);
  }

  document.getElementById('del-modal-title').textContent = title;
  document.getElementById('del-modal-desc').textContent = desc;
  document.getElementById('del-modal-cancel').textContent = cancelLbl;
  document.getElementById('del-modal-confirm').textContent = confirmLbl;

  document.getElementById('del-modal-cancel').onclick = closeDeleteModal;
  document.getElementById('del-modal-confirm').onclick = () => {
    closeDeleteModal();
    savedTimetables = savedTimetables.filter(s => s.id !== id);
    localStorage.setItem('uthm-tg-saved', JSON.stringify(savedTimetables));
    renderSavedList();
  };

  requestAnimationFrame(() => overlay.classList.add('open'));
  document.getElementById('del-modal-cancel').focus();
}

function closeDeleteModal() {
  const overlay = document.getElementById('delete-timetable-modal');
  if (overlay) overlay.classList.remove('open');
}

/* ════ MODALS ════ */
function showDetailModal(el) {
  const e = JSON.parse(decodeURIComponent(el.dataset.info));
  const t = DICT[currentLang];

  // Handle Highlights
  let isNewSlot = false;
  let isCourseNameUpd = false;
  let chgLect = false;
  let chgVenue = false;
  let chgTime = false;

  if (latestUpdate && latestUpdate.changes) {
    const code = e.code;
    const sec = e.sec;
    const c = latestUpdate.changes;

    if (c.courses && c.courses.added && c.courses.added.includes(code)) isNewSlot = true;
    if (c.sections && c.sections.added && c.sections.added[code] && c.sections.added[code].includes(sec)) isNewSlot = true;
    if (!isNewSlot && c.slots && c.slots.structural && c.slots.structural.added && c.slots.structural.added[code] && c.slots.structural.added[code][sec]) {
      const added = c.slots.structural.added[code][sec];
      if (added.some(s => s[1] === e.type && s[2] === e.day && String(s[3]).replace('.', ':') === String(e.time_start).replace('.', ':'))) {
        isNewSlot = true;
      }
    }
    if (c.names && c.names.changed && c.names.changed.some(n => n.code === code)) isCourseNameUpd = true;

    if (!isNewSlot && c.slots && c.slots.detail_only_changed && c.slots.detail_only_changed[code] && c.slots.detail_only_changed[code][sec]) {
      const detailSlots = c.slots.detail_only_changed[code][sec];
      const match = detailSlots.find(d => {
        const s = Array.isArray(d) ? d : (d.slot || []);
        return s[1] === e.type && s[2] === e.day && String(s[3]).replace('.', ':') === String(e.time_start).replace('.', ':');
      });
      if (match && match.changes) {
        if (match.changes.lecturer) chgLect = true;
        if (match.changes.venue) chgVenue = true;
        if (match.changes.rows || match.changes.intakes || (!match.changes.lecturer && !match.changes.venue)) chgTime = true;
      }
    }
  }

  const getBadge = (type) => {
    if (type === 'new') return `<span style="background:#10b981;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;margin-left:6px;display:inline-block;line-height:1;vertical-align:middle;font-weight:600">${currentLang === 'ms' ? 'Baru' : 'New'}</span>`;
    if (type === 'upd') return `<span style="background:#f59e0b;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;margin-left:6px;display:inline-block;line-height:1;vertical-align:middle;font-weight:600">${currentLang === 'ms' ? 'Dikemaskini' : 'Updated'}</span>`;
    return '';
  };

  document.getElementById('detail-code').innerHTML = e.code + (isNewSlot ? getBadge('new') : '');
  const name = (COURSES[e.code] && COURSES[e.code].name) ? COURSES[e.code].name : '';
  document.getElementById('detail-name').innerHTML = name + (isCourseNameUpd ? getBadge('upd') : '');

  document.getElementById('detail-sec').innerHTML = e.sec;

  const typeFull = e.type === 'Lecture' ? (currentLang === 'ms' ? 'Kuliah' : 'Lecture')
    : e.type === 'Lab/Amali' ? (currentLang === 'ms' ? 'Amali' : 'Lab')
      : (currentLang === 'ms' ? 'Tutorial' : 'Tutorial');
  document.getElementById('detail-type').innerHTML = typeFull;

  const tStart = e.time_start || '';
  const tEnd = e.time_end || '';
  const timeStr = `${t.days[e.day]} • ${format12Hour(tStart)}${tEnd ? ' – ' + format12Hour(tEnd) : ''}`;
  document.getElementById('detail-time').innerHTML = timeStr + (chgTime ? getBadge('upd') : '');

  document.getElementById('detail-venue').innerHTML = (e.venue || '-').replace('I-', '') + (chgVenue ? getBadge('upd') : '');
  document.getElementById('detail-lecturer').innerHTML = (e.lecturer || '-').replace('I-', '') + (chgLect ? getBadge('upd') : '');

  // Handle Remove Button
  const actionsWrap = document.getElementById('detail-actions');
  const removeBtn = document.getElementById('detail-remove-btn');
  if (actionsWrap && removeBtn) {
    if (e.code in selected) {
      actionsWrap.style.display = 'block';
      removeBtn.onclick = () => {
        removeSelected(e.code);
        closeDetailModal();
      };
    } else {
      actionsWrap.style.display = 'none';
    }
  }
  
  // Handle Notes
  const notesArea = document.getElementById('detail-notes');
  if (notesArea) {
    notesArea.value = subjectNotes[e.code] || '';
    notesArea.oninput = () => {
      subjectNotes[e.code] = notesArea.value;
      localStorage.setItem('uthm-tg-notes', JSON.stringify(subjectNotes));
    };
  }

  document.getElementById('detail-modal').classList.add('show');
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.remove('show');
}

document.addEventListener('DOMContentLoaded', init);

/* ════ REGISTRATION SLIP PARSING (PDF & OCR) ════ */
function setLoaderText(text) {
  const el = document.getElementById('loader-text');
  if (el) el.textContent = text;
}

function showLoader() {
  document.getElementById('upload-loader').style.display = 'flex';
}

function hideLoader() {
  document.getElementById('upload-loader').style.display = 'none';
  document.getElementById('slip-upload').value = '';
}

async function handleSlipUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const t = DICT[currentLang];
  showLoader();

  try {
    let extractedText = '';
    if (file.type === 'application/pdf') {
      extractedText = await parsePdfSlip(file);
    } else if (file.type.startsWith('image/')) {
      extractedText = await parseImageSlip(file);
    } else {
      alert(t.uploadErrText);
      return hideLoader();
    }

    if (!extractedText || !extractedText.trim()) {
      alert(t.uploadFailText);
      return hideLoader();
    }

    processExtractedText(extractedText);
  } catch (err) {
    console.error(err);
    alert('Error: ' + err.message);
  }

  hideLoader();
}

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function parsePdfSlip(file) {
  const t = DICT[currentLang];
  setLoaderText(t.parsingPdfText);
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    text += strings.join(' ') + '\n';
  }
  return text;
}

async function parseImageSlip(file) {
  const t = DICT[currentLang];
  setLoaderText(t.parsingOCRText);
  await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

  const worker = await Tesseract.createWorker('eng');
  const ret = await worker.recognize(file);
  await worker.terminate();
  return ret.data.text;
}

function processExtractedText(text) {
  const normalizedText = text.replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ');
  const foundSubjects = {};

  // Clean OCR common mistakes in course codes (e.g. B1T10703 -> BIT10703, U0I -> UQI)
  let cleanText = normalizedText;

  // Try matching directly from database to be fuzzy-proof
  Object.keys(COURSES).forEach(code => {
    // Attempt exact match first
    let hasMatch = false;
    let matchIndex = -1;

    if (cleanText.includes(code)) {
      hasMatch = true;
      matchIndex = cleanText.indexOf(code);
    } else {
      // Create a regex allowing for 1 or l or I swaps, or 0/O swaps in the code
      let looseRegexStr = code.split('').map(c => {
        if (['1', 'I', 'i', 'l', 'L'].includes(c)) return '[1IiL]';
        if (['0', 'O', 'o'].includes(c)) return '[0Oo]';
        return c;
      }).join('');
      const looseRegex = new RegExp(looseRegexStr, 'g');
      const fuzzyMatches = [...cleanText.matchAll(looseRegex)];
      if (fuzzyMatches.length > 0) {
        hasMatch = true;
        matchIndex = fuzzyMatches[0].index;
      }
    }

    if (hasMatch) {
      // We found the course code. Now look ahead for the section number.
      // E.g: "BIT10703 DATA STRUCTURE AND ALGORITHM 1 DT 3"
      const afterCode = cleanText.substring(matchIndex + code.length, matchIndex + code.length + 100);

      const availableSections = sortSections(Object.keys(COURSES[code].sections || {}));

      // Look for the first standalone number word (1, 2, 31, etc)
      const numberMatches = [...afterCode.matchAll(/\b(\d+)\b/g)];

      let matchedSection = null;
      for (const numMatch of numberMatches) {
        const num = numMatch[1];
        if (availableSections.includes('S' + num) || availableSections.includes(num)) {
          matchedSection = 'S' + num;
          break; // First matching valid section
        }
      }

      // Fallback
      if (!matchedSection && availableSections.length > 0) {
        if (availableSections.length === 1) matchedSection = availableSections[0];
        else if (availableSections.includes('S1')) matchedSection = 'S1';
        else matchedSection = availableSections[0];
      }

      if (matchedSection) {
        foundSubjects[code] = matchedSection;
      }
    }
  });

  const count = Object.keys(foundSubjects).length;
  const t = DICT[currentLang];
  if (count === 0) {
    alert(t.uploadNoSubjText);
    return;
  }

  // Clear and Populate
  selected = foundSubjects;
  colorMap = {};
  customColors = {};
  colorIdx = 0;

  // Shuffle indices so each upload gets a random color order
  const shuffledIndices = [...Array(COLORS.length).keys()].sort(() => 0.5 - Math.random());

  Object.keys(selected).forEach((code, i) => {
    const idx = shuffledIndices[i % shuffledIndices.length];
    colorMap[code] = idx;              // index (matches toggleCourse pattern)
    customColors[code] = COLORS[idx];  // hex so getSubjectColor() picks it up
    colorIdx++;
  });

  localStorage.setItem('uthm-tg-sel', JSON.stringify(selected));
  localStorage.setItem('uthm-tg-colors', JSON.stringify(colorMap));

  renderSelArea();
  filterList();
  renderTimetable();

  alert(t.uploadSuccessText.replace('{count}', count));
}

/* ════ CALENDAR EXPORT LOGIC ════ */

function openExportModal() {
  if (Object.keys(selected).length === 0) {
    alert(currentLang === 'ms' ? 'Sila pilih subjek dahulu!' : 'Please select subjects first!');
    return;
  }

  const modal = document.getElementById('export-modal');
  const startInput = document.getElementById('export-start');

  // Set default start date to the upcoming Monday
  const today = new Date();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));

  startInput.value = nextMonday.toISOString().split('T')[0];
  updateEndDate(); // Trigger the 15-week calculation immediately

  // Listen for changes so if the user picks a new start date, the end date updates
  startInput.addEventListener('change', updateEndDate);

  document.getElementById('export-title').textContent = currentLang === 'ms' ? 'Eksport ke Kalendar' : 'Export to Calendar';

  requestAnimationFrame(() => modal.classList.add('open'));
}

function updateEndDate() {
  const startInput = document.getElementById('export-start').value;
  if (!startInput) return;

  const startDate = new Date(startInput);
  // Add exactly 15 weeks (105 days)
  startDate.setDate(startDate.getDate() + (15 * 7));

  document.getElementById('export-end').value = startDate.toISOString().split('T')[0];
}

function closeExportModal() {
  document.getElementById('export-modal').classList.remove('open');
}

function generateICS() {
  const startInput = document.getElementById('export-start').value;
  const endInput = document.getElementById('export-end').value;

  if (!startInput || !endInput) return;

  closeExportModal();

  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//UTHM Timetable Generator//EN\n";
  const semesterStart = new Date(startInput);

  // Format the 'UNTIL' date string for the calendar (Must be UTC format: YYYYMMDDTHHMMSSZ)
  const endDateObj = new Date(endInput);
  endDateObj.setUTCHours(23, 59, 59);
  const untilStr = endDateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const dayMap = { 'Monday': 'MO', 'Tuesday': 'TU', 'Wednesday': 'WE', 'Thursday': 'TH', 'Friday': 'FR' };
  const dayNumMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5 };

  for (const [code, sec] of Object.entries(selected)) {
    const c = COURSES[code];
    const slots = c.sections[sec] || [];

    slots.forEach(slot => {
      const startTimeStr = (slot.time_start || '').replace('.', ':');
      const startIdx = TIME_SLOTS.findIndex(t => t.startsWith(startTimeStr));
      if (startIdx === -1) return;

      const dur = slot.duration || 1;

      // Base 24-hour calculation
      let startHour = parseInt(TIME_SLOTS[startIdx].split(':')[0], 10);
      const isPM = (startHour >= 1 && startHour <= 7) || TIME_SLOTS[startIdx].includes('(eve)') || startHour === 12;
      let h24 = startHour % 12;
      if (isPM) h24 += 12;
      let endHour = h24 + dur;

      const formatTime = (h) => `${h.toString().padStart(2, '0')}0000`;

      // Calculate the very first date this specific class occurs on or after the chosen Semester Start Date
      const classDate = new Date(semesterStart);
      let daysToAdd = dayNumMap[slot.day] - classDate.getDay();
      if (daysToAdd < 0) daysToAdd += 7; // If class day is behind start day, push to next week
      classDate.setDate(classDate.getDate() + daysToAdd);

      const formatDate = (d) => {
        return `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
      };

      const dateStr = formatDate(classDate);
      const icsStart = `${dateStr}T${formatTime(h24)}`;
      const icsEnd = `${dateStr}T${formatTime(endHour)}`;

      ics += `BEGIN:VEVENT\n`;
      ics += `UID:${code}-${sec}-${slot.day}-${h24}@uthm-timetable\n`;
      ics += `SUMMARY:${code} - ${c.name}\n`;
      ics += `DESCRIPTION:Section: ${sec} | Type: ${typeLabel(slot.type)} | Lecturer: ${slot.lecturer || 'Unknown'}\n`;
      ics += `LOCATION:${(slot.venue || '').trim()}\n`;
      ics += `DTSTART;TZID=Asia/Kuala_Lumpur:${icsStart}\n`;
      ics += `DTEND;TZID=Asia/Kuala_Lumpur:${icsEnd}\n`;
      // Instead of COUNT, we now use UNTIL
      ics += `RRULE:FREQ=WEEKLY;UNTIL=${untilStr};BYDAY=${dayMap[slot.day]}\n`;
      ics += `END:VEVENT\n`;
    });
  }

  ics += "END:VCALENDAR";

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Jadual_UTHM.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ════ FEEDBACK MODAL LOGIC ════ */
function openFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  if (modal) modal.classList.add('open');
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  if (modal) modal.classList.remove('open');
}

// 1. Store the encoded string (Discord Webhook)
const secretKey = "aHR0cHM6Ly9kaXNjb3JkYXBwLmNvbS9hcGkvd2ViaG9va3MvMTQ4MTU4NTY2MDIwNzk2MDE0Ni9MaV95YnBHM25CSWFSR1FNZE5FNFcxb3VhWk8tSFlnWUl6ampzU1l6RHE4TjBNdFVXRDRXOFRSSHd0cjdNd2RSclZCeA==";

async function submitFeedback(event) {
  event.preventDefault(); // Prevent page reload

  const feedbackText = document.getElementById('feedbackInput').value;
  const feedbackType = document.getElementById('feedbackType').value;
  const submitBtn = document.getElementById('submitBtn');
  const t = DICT[currentLang];

  // 2. Decode the URL at the moment of submission
  // Using atob directly as requested
  const target = atob(secretKey);

  const payload = {
    username: "Timetable Feedback Bot",
    embeds: [{
      title: `📌 New Feedback: ${feedbackType}`,
      description: feedbackText,
      color: 3447003, // A nice blue color
      timestamp: new Date().toISOString(),
      footer: { text: "FSKTM Timetable System" }
    }]
  };

  try {
    submitBtn.disabled = true;
    submitBtn.innerText = currentLang === 'ms' ? "Menghantar..." : "Sending...";

    const response = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      alert(t.submitSuccess);
      document.getElementById('feedbackForm').reset();
      closeFeedbackModal();
    } else {
      throw new Error("Failed to send");
    }
  } catch (error) {
    alert(t.submitFail);
    console.error(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span data-i18n="submitFeedback">${t.submitFeedback}</span>`;
  }
}

/* ════ INTAKE SUGGESTION ════ */

function buildIntakeList() {
  // INTAKE_COURSES is loaded from intake_courses.js — authoritative map from by_batch PDF
  const sel = document.getElementById('intake-select');
  if (!sel || typeof INTAKE_COURSES === 'undefined') return;

  sel.innerHTML = `<option value="">${DICT[currentLang].intakePlaceholder}</option>`;
  for (const [intake, codes] of Object.entries(INTAKE_COURSES)) {
    if (codes.length === 0) continue;
    const opt = document.createElement('option');
    opt.value = intake;
    opt.textContent = intake;
    sel.appendChild(opt);
  }
}

function closeIntakeSelectionModal() {
  document.getElementById('intake-selection-modal').classList.remove('show');
}

function suggestByIntake() {
  const sel = document.getElementById('intake-select');
  const chosenIntake = sel ? sel.value : '';
  if (!chosenIntake) return;

  // Get the definitive course list for this intake from INTAKE_COURSES
  const courseCodes = (typeof INTAKE_COURSES !== 'undefined' && INTAKE_COURSES[chosenIntake]) || [];
  if (courseCodes.length === 0) {
    alert(DICT[currentLang].intakeNoneFound);
    return;
  }

  // Filter out courses that don't exist in data.js
  intakeModalCourses = courseCodes.filter(code => COURSES[code]);
  if (intakeModalCourses.length === 0) {
    alert(DICT[currentLang].intakeNoneFound);
    return;
  }

  // Pre-select all by default
  intakeModalSelected = new Set(intakeModalCourses);
  
  // Update Title
  const titleEl = document.getElementById('intake-sel-title');
  if (titleEl) {
    titleEl.textContent = DICT[currentLang].intakeSelectTitle.replace('{intake}', chosenIntake);
  }

  // Reset Search
  document.getElementById('intake-srch').value = '';
  
  renderIntakeModal();
  updateIntakeCreditCount();
  document.getElementById('intake-selection-modal').classList.add('show');
}

function renderIntakeModal(filterText = '') {
  const listEl = document.getElementById('intake-course-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const query = filterText.toLowerCase().trim();

  intakeModalCourses.forEach(code => {
    const c = COURSES[code];
    if (query && !code.toLowerCase().includes(query) && !c.name.toLowerCase().includes(query)) return;

    const item = document.createElement('div');
    const isSelected = intakeModalSelected.has(code);
    item.className = `intake-item${isSelected ? ' selected' : ''}`;
    item.onclick = () => toggleIntakeCourse(code);

    const credits = getCredits(code);

    item.innerHTML = `
      <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); toggleIntakeCourse('${code}')">
      <div class="intake-item-info">
        <div class="intake-item-code">${code}</div>
        <div class="intake-item-name">${c.name}</div>
      </div>
      <div class="intake-item-credits">${credits} ${DICT[currentLang].credit}</div>
    `;
    listEl.appendChild(item);
  });
}

function toggleIntakeCourse(code) {
  if (intakeModalSelected.has(code)) {
    intakeModalSelected.delete(code);
  } else {
    intakeModalSelected.add(code);
  }
  renderIntakeModal(document.getElementById('intake-srch').value);
  updateIntakeCreditCount();
}

function toggleIntakeAll(selectAll) {
  if (selectAll) {
    intakeModalSelected = new Set(intakeModalCourses);
  } else {
    intakeModalSelected.clear();
  }
  renderIntakeModal(document.getElementById('intake-srch').value);
  updateIntakeCreditCount();
}

function filterIntakeModalList() {
  const val = document.getElementById('intake-srch').value;
  renderIntakeModal(val);
}

function updateIntakeCreditCount() {
  let total = 0;
  intakeModalSelected.forEach(code => {
    total += getCredits(code);
  });
  const valEl = document.getElementById('intake-cred-val');
  if (valEl) {
    valEl.textContent = total;
    valEl.style.color = total > 25 ? 'var(--red)' : (total > 20 ? 'var(--yellow)' : 'var(--muted2)');
  }
}

function confirmIntakeSuggestion() {
  if (intakeModalSelected.size === 0) {
    alert(DICT[currentLang].intakeNoneFound);
    return;
  }

  const sel = document.getElementById('intake-select');
  const chosenIntake = sel ? sel.value : '';

  // Clear existing selections
  for (const key in selected) delete selected[key];
  for (const key in colorMap) delete colorMap[key];
  for (const key in customColors) delete customColors[key];
  colorIdx = 0;

  let foundAny = false;
  intakeModalSelected.forEach(code => {
    const secs = sortSections(Object.keys(COURSES[code].sections || {}));
    if (secs.length === 0) return;

    let bestSection = secs[0];
    for (const sec of secs) {
      const slots = COURSES[code].sections[sec] || [];
      const matchesIntake = slots.some(slot =>
        (slot.intakes || []).some(intakeStr =>
          intakeStr.split(' | ').some(part => part.trim() === chosenIntake)
        )
      );
      if (matchesIntake) { bestSection = sec; break; }
    }

    selected[code] = bestSection;
    colorMap[code] = colorIdx % COLORS.length;
    customColors[code] = COLORS[colorMap[code]];
    colorIdx++;
    foundAny = true;
  });

  closeIntakeSelectionModal();
  renderList(filtered); 
  renderSelArea(); 
  renderTimetable();

  // Clear search so all selected courses show in the list
  const srch = document.getElementById('srch');
  if (srch) srch.value = '';
  filterList();
  renderSelArea();
  renderTimetable();

  // Smooth flash effect on timetable grid
  const ttWrap = document.querySelector('.tt-wrap');
  if (ttWrap) {
    ttWrap.style.transition = 'none';
    ttWrap.style.opacity = '0.3';
    setTimeout(() => {
      ttWrap.style.transition = 'opacity 0.35s ease';
      ttWrap.style.opacity = '1';
    }, 60);
  }
}

/* ════ DOWNLOAD / PRINT MODAL ════ */
let downloadOrientation = 'landscape';
let isExporting = false; // Flag to prevent rapid double-clicks

function showToast(message, duration = 3000) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #323232; color: #fff; padding: 12px 20px; border-radius: 8px;
      font-size: 14px; z-index: 99999; opacity: 0; transition: opacity 0.25s;
      max-width: 90vw; text-align: center; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => { toast.style.opacity = '0'; }, duration);
}

function openDownloadModal() {
  if (Object.keys(selected).length === 0) {
    const lang = (typeof currentLang !== 'undefined') ? currentLang : 'ms';
    showToast(DICT[lang].downloadEmptyWarn);
    return;
  }
  document.getElementById('download-modal').classList.add('open');
  setDownloadOrientation(downloadOrientation); // re-trigger to draw preview
}

function closeDownloadModal() {
  document.getElementById('download-modal').classList.remove('open');
}

function setDownloadOrientation(mode) {
  downloadOrientation = mode;
  document.getElementById('dl-btn-landscape').classList.remove('active');
  document.getElementById('dl-btn-portrait').classList.remove('active');
  document.getElementById(`dl-btn-${mode}`).classList.add('active');
  updateDownloadPreview();
}

function _buildDownloadPaper(targetW, targetH) {
  const ttWrap = document.querySelector('.tt-wrap');
  if (!ttWrap) return null;

  const clone = ttWrap.cloneNode(true);

  // Clean up exactly what is rendered
  const actions = clone.querySelector('.tt-actions');
  if (actions) actions.remove();

  // Avoid scroll/cropping in exports: expand the table inside the paper.
  const scroll = clone.querySelector('.tt-scroll');
  if (scroll) {
    scroll.style.overflow = 'visible';
    scroll.style.maxWidth = 'none';
    scroll.style.width = '100%';
  }
  const table = clone.querySelector('.tt-table');
  if (table) {
    table.style.minWidth = '0';
    table.style.width = '100%';
  }

  // Remove outer chrome so it looks like a clean export.
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.overflow = 'visible';
  clone.style.width = 'auto';
  clone.style.height = 'auto';
  clone.style.background = 'transparent';

  // Force all slots to render their desktop size (avoid hover transforms, etc).
  clone.querySelectorAll('.slot').forEach(s => {
    s.style.transition = 'none';
    s.style.transform = 'none';
  });

  const paper = document.createElement('div');
  paper.style.width = `${targetW}px`;
  paper.style.height = `${targetH}px`;
  paper.style.boxSizing = 'border-box';
  paper.style.position = 'relative';
  paper.style.overflow = 'hidden';
  paper.style.background = document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#0f141e';

  const content = document.createElement('div');
  content.style.position = 'absolute';
  content.style.top = '0';
  content.style.left = '0';
  content.style.transformOrigin = 'top left';
  content.appendChild(clone);

  paper.appendChild(content);
  return { paper, content, clone };
}

function _fitDownloadPaperContent(content, clone, targetW, targetH) {
  const pad = 28;
  const innerW = Math.max(1, targetW - pad * 2);
  const innerH = Math.max(1, targetH - pad * 2);

  // Use scroll sizes so we fit the full content, not just the visible viewport.
  const naturalW = Math.max(1, clone.scrollWidth);
  const naturalH = Math.max(1, clone.scrollHeight);

  const scale = Math.min(innerW / naturalW, innerH / naturalH, 1);
  const x = pad + (innerW - naturalW * scale) / 2;
  const y = pad + (innerH - naturalH * scale) / 2;
  content.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  return scale;
}

function updateDownloadPreview() {
  const previewContainer = document.getElementById('download-preview-container');
  previewContainer.innerHTML = ''; // clear

  // Set dimensions based on orientation to mimic A4 paper ratio (1:1.414)
  const isLandscape = downloadOrientation === 'landscape';
  const targetW = isLandscape ? 1131 : 800;
  const targetH = isLandscape ? 800 : 1131;

  const built = _buildDownloadPaper(targetW, targetH);
  if (!built) return;

  // Calculate scale to fit inside our 260px tall wrapper box
  const parentW = previewContainer.parentElement.clientWidth;
  const parentH = 260;

  const scaleW = (parentW - 40) / targetW;
  const scaleH = (parentH - 40) / targetH;
  const finalScale = Math.min(scaleW, scaleH);

  previewContainer.style.width = targetW + 'px';
  previewContainer.style.height = targetH + 'px';
  previewContainer.style.transform = `scale(${finalScale})`;

  previewContainer.appendChild(built.paper);
  // Fit content after it has been attached (needs layout to measure scroll sizes).
  requestAnimationFrame(() => {
    _fitDownloadPaperContent(built.content, built.clone, targetW, targetH);
  });
}

async function executeDownload(format, btnNode) {
  if (isExporting) return; // Prevent double click loop

  // Safely grab the button reference whether passed via 'this' or window.event
  const btn = (btnNode && btnNode.tagName === 'BUTTON') ? btnNode :
    (window.event && window.event.currentTarget && window.event.currentTarget.tagName === 'BUTTON' ? window.event.currentTarget : null);

  let prevText = '';
  if (btn) {
    prevText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner" style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;"></div>`;
    btn.style.pointerEvents = 'none';
  }

  isExporting = true;
  const filename = `Jadual_UTHM_${new Date().getTime()}`;
  const isLandscape = downloadOrientation === 'landscape';
  const targetW = isLandscape ? 1131 : 800;
  const targetH = isLandscape ? 800 : 1131;

  let renderBox = null;
  let built = null;

  try {
    if (format === 'xlsx') {
      exportTimetableXLSX(`${filename}.xlsx`);
      return;
    }

    // Build a fresh "paper" and auto-fit the timetable into the A4 ratio box.
    built = _buildDownloadPaper(targetW, targetH);
    if (!built) throw new Error('Failed to build download paper');

    renderBox = built.paper;
    renderBox.style.position = 'fixed';
    renderBox.style.top = '0px';
    renderBox.style.left = '-9999px'; // Push it safely off-screen
    renderBox.style.zIndex = '-9999';
    renderBox.style.opacity = '1';    // IMPORTANT: Must be 1 so html2canvas renders it
    document.body.appendChild(renderBox);

    // Fit after insertion so scrollWidth/scrollHeight are correct.
    _fitDownloadPaperContent(built.content, built.clone, targetW, targetH);

    // Wait a bit to ensure the DOM physically paints the appended block
    await new Promise(r => setTimeout(r, 100));

    // Wrap in Promise.race with a 15s timeout to guarantee UI won't hang forever
    const canvas = await Promise.race([
      html2canvas(renderBox, {
        scale: 2,
        useCORS: true,
        width: targetW,
        height: targetH,
        backgroundColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#0f141e'
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('html2canvas timed out')), 15000))
    ]);

    const imgData = canvas.toDataURL('image/png', 1.0);

    // Improved fallback detection for corrupted/empty blocks
    if (imgData === 'data:,' || imgData.length < 100) {
      throw new Error("Canvas is empty. Rendering issue occurred.");
    }

    if (format === 'png') {
      const a = document.createElement('a');
      a.href = imgData;
      a.download = `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (format === 'pdf') {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${filename}.pdf`);
    }

  } catch (err) {
    console.error("Error generating export:", err);
    alert(currentLang === 'ms' ? 'Maaf, ralat berlaku semasa muat turun jadual. Pastikan browser anda menyokong ciri ini.' : 'Error generating timetable download. Please try again.');
  } finally {
    isExporting = false;
    if (renderBox && document.body.contains(renderBox)) document.body.removeChild(renderBox);
    if (btn) {
      btn.innerHTML = prevText;
      btn.style.pointerEvents = 'auto';
    }
    closeDownloadModal();
  }
}

function exportTimetableXLSX(filename) {
  const XLSX = (typeof window !== 'undefined') ? window.XLSX : null;
  if (!XLSX || !XLSX.utils) {
    alert(currentLang === 'ms'
      ? 'Modul XLSX belum dimuat. Sila cuba semula atau pastikan anda mempunyai sambungan internet.'
      : 'XLSX module not loaded. Please try again (internet required).');
    return;
  }

  if (!selected || Object.keys(selected).length === 0) {
    alert((DICT[currentLang] && DICT[currentLang].downloadEmptyWarn) || 'No subjects selected.');
    return;
  }

  const dayLabel = (d) => {
    try {
      const m = (DICT[currentLang] && DICT[currentLang].days) ? DICT[currentLang].days : null;
      return m && m[d] ? m[d] : d;
    } catch {
      return d;
    }
  };

  const norm24 = (t) => {
    const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return String(t || '');
    let h = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    if (h >= 1 && h <= 7) h += 12; // timetable uses 01:00–07:00 for 1pm–7pm
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  const addHours = (t, dur) => {
    const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return '';
    let h = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    if (h >= 1 && h <= 7) h += 12;
    const total = h * 60 + mm + Math.round((Number(dur) || 0) * 60);
    const hh2 = Math.floor(total / 60) % 24;
    const mm2 = total % 60;
    return `${String(hh2).padStart(2, '0')}:${String(mm2).padStart(2, '0')}`;
  };

  const venueShort = (v) => String(v || '').replace(/^I-/, '');
  const lecturerShort = (l) => String(l || '').replace(/^I-/, '');

  const uniq = new Set();
  const rows = [];
  for (const [code, sec] of Object.entries(selected)) {
    const course = (typeof COURSES !== 'undefined' && COURSES[code]) ? COURSES[code] : null;
    const cname = course && course.name ? course.name : '';
    const slots = (course && course.sections && course.sections[sec]) ? course.sections[sec] : [];
    for (const s of (slots || [])) {
      const start = String(s.time_start || '');
      const dur = Number(s.duration || 0);
      const key = [
        code, sec, s.section || '', s.type || '', s.day || '', start,
        String(dur), s.venue || '', s.lecturer || '', (s.intakes || []).join('|')
      ].join('||');
      if (uniq.has(key)) continue;
      uniq.add(key);

      rows.push({
        Code: code,
        Course: cname,
        Section: sec,
        Group: s.section || '',
        Type: s.type || '',
        Day: dayLabel(s.day || ''),
        Start: norm24(start),
        End: addHours(start, dur),
        'Duration (h)': dur || '',
        Venue: venueShort(s.venue || ''),
        Lecturer: lecturerShort(s.lecturer || ''),
        Intakes: (s.intakes || []).join(' | ')
      });
    }
  }

  if (!rows.length) {
    alert(currentLang === 'ms' ? 'Tiada kelas dijumpai untuk pilihan semasa.' : 'No classes found for the current selection.');
    return;
  }

  const dayOrder = new Map(DAYS.map((d, i) => [dayLabel(d), i]));
  rows.sort((a, b) => {
    const da = dayOrder.has(a.Day) ? dayOrder.get(a.Day) : 99;
    const db = dayOrder.has(b.Day) ? dayOrder.get(b.Day) : 99;
    if (da !== db) return da - db;
    if (a.Start !== b.Start) return String(a.Start).localeCompare(String(b.Start));
    if (a.Code !== b.Code) return String(a.Code).localeCompare(String(b.Code));
    return String(a.Section).localeCompare(String(b.Section));
  });

  const sheetName = currentLang === 'ms' ? 'Jadual' : 'Timetable';
  const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  ws['!autofilter'] = { ref: ws['!ref'] };

  // Best-effort column sizing
  const headers = Object.keys(rows[0] || {});
  ws['!cols'] = headers.map((h) => {
    let maxLen = h.length;
    for (let i = 0; i < Math.min(rows.length, 200); i++) {
      const v = rows[i][h];
      maxLen = Math.max(maxLen, String(v ?? '').length);
    }
    return { wch: Math.min(48, Math.max(10, maxLen + 2)) };
  });

  const metaAOA = [
    ['Generated At', new Date().toISOString()],
    ['App Build', `v${APP_BUILD_VERSION}`],
    ['Timetable Version', (latestUpdate && latestUpdate.timetable && (latestUpdate.timetable.latestId || latestUpdate.timetable.latestDate)) ? (latestUpdate.timetable.latestId || latestUpdate.timetable.latestDate) : '—'],
    ['Base PDF', (latestUpdate && latestUpdate.timetable && latestUpdate.timetable.base) ? latestUpdate.timetable.base : '—'],
    ['Sources Used', (latestUpdate && latestUpdate.timetable && Array.isArray(latestUpdate.timetable.sourcesUsed)) ? latestUpdate.timetable.sourcesUsed.join(', ') : '—'],
    ['Selected Courses', Object.keys(selected).length],
    ['Selected Slots', rows.length],
  ];
  const wsMeta = XLSX.utils.aoa_to_sheet(metaAOA);
  wsMeta['!cols'] = [{ wch: 18 }, { wch: 60 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Info');

  XLSX.writeFile(wb, filename);
}

// Close download modal when clicking outside the box
const dlModal = document.getElementById('download-modal');
if (dlModal) {
  dlModal.addEventListener('click', (e) => {
    if (e.target === dlModal) closeDownloadModal();
  });
}

/* ════ DISCLAIMER / TUTORIAL MODAL ════ */
let disclaimerCurrentSlide = 0;
const DISCLAIMER_TOTAL = 3;

// Bilingual descriptions for each slide. Key = slide index.
const DISC_DESCRIPTIONS = {
  ms: [
    // Slide 1 — log in and navigate to Course Registration
    [
      { text: 'Buka portal <a href="https://smap.uthm.edu.my" target="_blank" rel="noopener">SMAP UTHM</a> dan log masuk ke akaun anda.' },
      { text: 'Pergi ke bahagian <strong>Registration</strong> → <strong>Course Registration</strong>.' },
    ],
    // Slide 2 — click Slip & download
    [
      { text: 'Setelah halaman dimuatkan, klik butang <strong>Slip</strong>.' },
      { text: 'Muat turun atau ambil tangkapan skrin slip pendaftaran anda. Format yang disokong: <strong>PNG</strong> dan <strong>PDF</strong>.' },
    ],
    // Slide 3 — shows the actual slip format
    [
      { text: 'Ini adalah contoh <strong>Slip Pendaftaran Kursus</strong> yang perlu anda muat naik ke dalam aplikasi ini.' },
    ],
  ],
  en: [
    // Slide 1
    [
      { text: 'Open the <a href="https://smap.uthm.edu.my" target="_blank" rel="noopener">SMAP UTHM portal</a> and log in to your account.' },
      { text: 'Navigate to the <strong>Registration</strong> section and select <strong>Course Registration</strong>.' },
    ],
    // Slide 2
    [
      { text: 'Once the page loads, click the <strong>Slip</strong> button.' },
      { text: 'Download or take a screenshot of your Course Registration Slip. Supported formats: <strong>PNG</strong> and <strong>PDF</strong>.' },
    ],
    // Slide 3
    [
      { text: 'This is an example of the <strong>Course Registration Slip</strong> you need to upload into this app.' },
    ],
  ],
};

function openDisclaimerModal() {
  disclaimerCurrentSlide = 0;
  _disclaimerRender();
  const modal = document.getElementById('disclaimer-modal');
  if (modal) modal.classList.add('open');
}

function closeDisclaimerModal() {
  const modal = document.getElementById('disclaimer-modal');
  if (modal) modal.classList.remove('open');
}

function changeSlide(dir) {
  const next = disclaimerCurrentSlide + dir;
  if (next < 0) return;
  if (next >= DISCLAIMER_TOTAL) {
    closeDisclaimerModal();
    return;
  }
  disclaimerCurrentSlide = next;
  _disclaimerRender();
}

function goToSlide(index) {
  if (index < 0 || index >= DISCLAIMER_TOTAL) return;
  disclaimerCurrentSlide = index;
  _disclaimerRender();
}

function _disclaimerRender() {
  // Move slide strip
  const slides = document.getElementById('disclaimer-slides');
  if (slides) slides.style.transform = `translateX(-${disclaimerCurrentSlide * 100}%)`;

  // Update page label (bilingual)
  const label = document.getElementById('disclaimer-page-label');
  const pageWord = currentLang === 'ms' ? 'Halaman' : 'Page';
  if (label) label.textContent = `${pageWord} ${disclaimerCurrentSlide + 1} / ${DISCLAIMER_TOTAL}`;

  // Update dot indicators
  document.querySelectorAll('.disc-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === disclaimerCurrentSlide);
  });

  // Update prev/next button states
  const prev = document.getElementById('disc-prev');
  const next = document.getElementById('disc-next');
  if (prev) {
    prev.style.opacity = disclaimerCurrentSlide === 0 ? '0.35' : '1';
    prev.style.pointerEvents = disclaimerCurrentSlide === 0 ? 'none' : 'auto';
  }
  
  if (next) {
    const isLast = disclaimerCurrentSlide === DISCLAIMER_TOTAL - 1;
    const t = DICT[currentLang] || DICT.ms;
    
    // Change text and icon for last slide
    if (isLast) {
      next.innerHTML = `
        <span>${t.discClose || 'Close'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      next.style.background = 'var(--text)';
      next.style.borderColor = 'var(--text)';
      next.style.color = 'var(--bg)';
    } else {
      next.innerHTML = `
        <span data-i18n="discNext">${t.discNext}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      `;
      next.style.background = '#6366f1';
      next.style.borderColor = '#6366f1';
      next.style.color = 'white';
    }
    
    // Always show next/close button on last slide instead of disabling it
    next.style.opacity = '1';
    next.style.pointerEvents = 'auto';
  }

  // Inject bilingual description
  const descEl = document.getElementById('disclaimer-desc');
  if (descEl) {
    const lang = (typeof currentLang !== 'undefined') ? currentLang : 'ms';
    const steps = (DISC_DESCRIPTIONS[lang] || DISC_DESCRIPTIONS['ms'])[disclaimerCurrentSlide] || [];
    if (steps.length === 0) {
      descEl.innerHTML = '';
    } else {
      descEl.innerHTML = steps.map((s, i) =>
        `<div class="disclaimer-step"><span class="disc-step-num">${i + 1}</span><span class="disc-step-text">${s.text}</span></div>`
      ).join('');
    }
  }
}

// Click overlay to close
const discModal = document.getElementById('disclaimer-modal');
if (discModal) {
  discModal.addEventListener('click', (e) => {
    if (e.target === discModal) closeDisclaimerModal();
  });
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  const discModal = document.getElementById('disclaimer-modal');
  if (!discModal || !discModal.classList.contains('open')) return;
  if (e.key === 'ArrowRight') changeSlide(1);
  if (e.key === 'ArrowLeft') changeSlide(-1);
  if (e.key === 'Escape') closeDisclaimerModal();
});

// Swipe / drag navigation for touch devices (and touch-enabled laptops).
(function _setupDisclaimerSwipe() {
  const modal = document.getElementById('disclaimer-modal');
  const carousel = document.getElementById('disclaimer-carousel');
  const slides = document.getElementById('disclaimer-slides');
  if (!modal || !carousel || !slides) return;

  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let startTime = 0;
  let isDragging = false;
  let hasLockedAxis = false;
  let wheelAccumX = 0;
  let wheelResetTimer = 0;
  let wheelCooldownUntil = 0;

  const _isOpen = () => modal.classList.contains('open');
  const _width = () => carousel.getBoundingClientRect().width || 1;

  const _setDragTransform = (dxPx) => {
    let dx = dxPx;
    if ((disclaimerCurrentSlide === 0 && dx > 0) || (disclaimerCurrentSlide === DISCLAIMER_TOTAL - 1 && dx < 0)) {
      dx *= 0.35; // resistance at edges
    }
    const pct = (dx / _width()) * 100;
    slides.style.transform = `translateX(${-(disclaimerCurrentSlide * 100) + pct}%)`;
  };

  const _start = (x, y) => {
    startX = lastX = x;
    startY = lastY = y;
    startTime = Date.now();
    isDragging = false;
    hasLockedAxis = false;
  };

  const _move = (x, y, ev) => {
    lastX = x;
    lastY = y;
    const dx = x - startX;
    const dy = y - startY;

    if (!hasLockedAxis) {
      // Lock once the intent is clear.
      if (Math.abs(dx) >= 8 || Math.abs(dy) >= 8) {
        hasLockedAxis = true;
        if (Math.abs(dx) > Math.abs(dy)) {
          isDragging = true;
          carousel.classList.add('is-dragging');
        }
      }
    }

    if (!isDragging) return;
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    _setDragTransform(dx);
  };

  const _end = () => {
    if (!isDragging) return;
    carousel.classList.remove('is-dragging');

    const dx = lastX - startX;
    const dt = Math.max(1, Date.now() - startTime);
    const width = _width();
    const distanceThreshold = width * 0.18;
    const flickVelocity = Math.abs(dx) / dt; // px per ms

    const shouldChange =
      Math.abs(dx) > distanceThreshold ||
      (flickVelocity > 0.65 && Math.abs(dx) > 30);

    if (shouldChange) {
      const dir = dx < 0 ? 1 : -1;
      const next = disclaimerCurrentSlide + dir;
      if (next < 0 || next >= DISCLAIMER_TOTAL) {
        _disclaimerRender(); // can't go further, snap back
      } else {
        disclaimerCurrentSlide = next;
        _disclaimerRender();
      }
    } else {
      _disclaimerRender(); // snap back
    }
  };

  if ('PointerEvent' in window) {
    carousel.addEventListener('pointerdown', (e) => {
      if (!_isOpen()) return;
      if (e.button != null && e.button !== 0) return;
      activePointerId = e.pointerId;
      _start(e.clientX, e.clientY);
      try { carousel.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    });

    carousel.addEventListener('pointermove', (e) => {
      if (!_isOpen()) return;
      if (activePointerId == null || e.pointerId !== activePointerId) return;
      _move(e.clientX, e.clientY, e);
    });

    const _pointerEnd = (e) => {
      if (activePointerId == null) return;
      if (e.pointerId !== activePointerId) return;
      _end();
      activePointerId = null;
    };

    carousel.addEventListener('pointerup', _pointerEnd);
    carousel.addEventListener('pointercancel', _pointerEnd);
  } else {
    // Touch fallback for older browsers.
    let touchActive = false;

    carousel.addEventListener('touchstart', (e) => {
      if (!_isOpen()) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      touchActive = true;
      _start(t.clientX, t.clientY);
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
      if (!_isOpen() || !touchActive) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      _move(t.clientX, t.clientY, e);
    }, { passive: false });

    carousel.addEventListener('touchend', () => {
      if (!touchActive) return;
      _end();
      touchActive = false;
    });

    carousel.addEventListener('touchcancel', () => {
      if (!touchActive) return;
      _end();
      touchActive = false;
    });
  }

  // Prevent the browser's default drag image behavior (mouse dragging images).
  carousel.addEventListener('dragstart', (e) => {
    if (!_isOpen()) return;
    e.preventDefault();
  });

  // MacBook trackpad 2-finger horizontal swipe => wheel event with deltaX.
  // We treat it as "next/prev slide" once a threshold is crossed.
  carousel.addEventListener('wheel', (e) => {
    if (!_isOpen()) return;
    if (e.ctrlKey) return; // pinch-zoom on trackpad
    if (Date.now() < wheelCooldownUntil) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

    if (e.cancelable) e.preventDefault();

    wheelAccumX += e.deltaX;
    clearTimeout(wheelResetTimer);
    wheelResetTimer = setTimeout(() => { wheelAccumX = 0; }, 180);

    const threshold = Math.max(40, _width() * 0.12);
    if (wheelAccumX >= threshold) {
      wheelAccumX = 0;
      wheelCooldownUntil = Date.now() + 300;
      changeSlide(1);
    } else if (wheelAccumX <= -threshold) {
      wheelAccumX = 0;
      wheelCooldownUntil = Date.now() + 300;
      changeSlide(-1);
    }
  }, { passive: false });
})();
