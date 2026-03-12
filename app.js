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
let savedTimetables = JSON.parse(localStorage.getItem('uthm-tg-saved') || '[]');
// 'table' | 'cards'  — auto-set per breakpoint, user can override
let viewMode = (window.innerWidth <= 768) ? 'cards' : 'table';
// 'days-top' | 'days-left'
let layoutOrientation = localStorage.getItem('uthm-tg-orientation') || 'days-top';

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
    submitFail: "Error sending feedback. Please try again later."
  },
  ms: {
    subtitle: "Pilih subjek & section — jadual dijana serta-merta",
    semester: "Sem 2 | Sesi 2025/2026",
    subjectList: "Senarai Subjek",
    searchPh: "Cari kod atau nama...",
    subjectSection: "Subjek & Section",
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
    submitFail: "Ralat menghantar maklum balas. Sila cuba sebentar lagi."
  }
};

let currentLang = localStorage.getItem('uthm-tg-lang') || 'ms';

function applyLang() {
  const t = DICT[currentLang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.innerHTML = t[key];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t[el.getAttribute('data-i18n-ph')];
  });
  const btn = document.getElementById('btn-lang');
  if (btn) btn.textContent = currentLang === 'ms' ? 'EN' : 'MS';

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
  // Sync toggle button visual state
  document.querySelectorAll('.btn-view-toggle[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === mode);
    btn.textContent = mode === 'table' ? '≡ Table' : '⊞ Cards';
  });
  renderTimetable();
}

/* ════ ORIENTATION (days-top / days-left) ════ */
function setOrientation(orient) {
  layoutOrientation = orient;
  localStorage.setItem('uthm-tg-orientation', orient);
  const btn = document.getElementById('btn-orient');
  if (btn) {
    btn.innerHTML = orient === 'days-top'
      ? (currentLang === 'ms' ? '<span style="font-size:12px;margin-right:4px">▤</span> Hari Kiri' : '<span style="font-size:12px;margin-right:4px">▤</span> Days Left')
      : (currentLang === 'ms' ? '<span style="font-size:12px;margin-right:4px">▦</span> Hari Atas' : '<span style="font-size:12px;margin-right:4px">▦</span> Days Top');
    btn.title = orient === 'days-top'
      ? (currentLang === 'ms' ? 'Tukar: Hari di kiri, Masa di atas' : 'Switch: Days on left, Time on top')
      : (currentLang === 'ms' ? 'Tukar: Hari di atas, Masa di kiri' : 'Switch: Days on top, Time on left');
  }
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
    viewMode = nowMobile ? 'cards' : 'table';
    document.querySelectorAll('.btn-view-toggle[data-view]').forEach(btn => {
      btn.textContent = viewMode === 'table' ? '≡ Table' : '⊞ Cards';
    });
    renderTimetable();
  }
});


/* ════ INIT ════ */
function init() {
  applyLang();
  setOrientation(layoutOrientation);
  filtered = Object.keys(COURSES).sort();
  renderList(filtered);
  renderSavedList();
  document.getElementById('cnt-all').textContent = filtered.length;
  renderTimetable();
  buildIntakeList();
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
    item.innerHTML = `<div class="cbox"></div><div class="cinfo"><div class="ccode">${code}</div><div class="cname">${c.name}</div></div><div class="csec-count">${noSec ? '—' : secCount > 1 ? secCount + ' sec' : '1 sec'}</div>`;
    if (!noSec) item.onclick = () => toggleCourse(code);
    el.appendChild(item);
  });
}

function toggleCourse(code) {
  if (code in selected) {
    delete selected[code]; delete colorMap[code]; delete customColors[code];
  } else {
    const secs = Object.keys(COURSES[code].sections || {});
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

/* ════ CUSTOM COLOR PICKER ════ */
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
    credEl.textContent = cred + ' kredit';
    credEl.style.color = cred > 20 ? '#f87171' : cred >= 12 ? '#34d399' : '#fcd34d';
  }
  area.innerHTML = '';
  codes.forEach(code => {
    const c = COURSES[code], secs = Object.keys(c.sections || {});
    const chosen = selected[code], col = getSubjectColor(code);
    const credits = getCredits(code);
    const pillsHTML = secs.map(s => {
      const isActive = chosen === s, hasConflict = isConflictSection(code, s);
      let style = '';
      if (isActive && !hasConflict) style = ` style="background:${col}; border-color:${col}; color:#fff; font-weight:600;"`;
      return `<div class="sec-pill${isActive ? ' active' : ''}${hasConflict ? ' conflict' : ''}"${style} onclick="pickSection('${code}','${s}')">${s}${hasConflict && !isActive ? ' ⚠' : isActive && hasConflict ? ' ⚠' : ''}</div>`;
    }).join('');
    const block = document.createElement('div');
    block.className = 'sel-course-block';
    block.style.borderLeft = `3px solid ${col}`; block.style.paddingLeft = '14px';
    const colorLabel = currentLang === 'ms' ? 'Warna' : 'Color';
    block.innerHTML = `
      <div class="sel-top">
        <span style="display:flex;align-items:center;gap:7px">
          <button class="color-swatch-btn" data-code="${code}" onclick="openColorPicker('${code}')" title="${colorLabel}" style="background:${col};border-color:${col}"></button>
          <span class="sel-code" style="color:${col}">${code}</span>
        </span>
        <span style="display:flex;align-items:center;gap:8px">
          <span class="credit-badge">${credits} kredit</span>
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
          <button class="modal-btn cancel"  id="modal-cancel"></button>
          <button class="modal-btn confirm" id="modal-confirm"></button>
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

/* ════ REALTIME TIMETABLE ════ */
function renderTimetable() {
  const body = document.getElementById('tt-body');
  if (Object.keys(selected).length === 0) {
    body.innerHTML = `<div class="empty"><div class="empty-ico">📋</div><h3>Tiada Subjek Dipilih</h3><p>Pilih subjek dari senarai dan tetapkan section</p></div>`;
    document.getElementById('tt-title').textContent = 'Jadual Waktu';
    document.getElementById('conflict-strip').style.display = 'none';
    return;
  }

  const conflicts = checkConflicts();
  document.getElementById('tt-title').textContent = `Jadual — ${Object.keys(selected).length} Subjek`;
  const strip = document.getElementById('conflict-strip');
  if (conflicts.length) { strip.style.display = 'block'; strip.innerHTML = `⚠ <strong>Konflik Masa:</strong> ${conflicts.join(' · ')}`; }
  else strip.style.display = 'none';

  // Build grid
  const grid = {};
  DAYS.forEach(d => { grid[d] = {}; TIME_SLOTS.forEach((_, i) => { grid[d][i] = null; }); });

  for (const [code, sec] of Object.entries(selected)) {
    (COURSES[code].sections[sec] || []).forEach(slot => {
      const startTime = (slot.time_start || '').replace('.', ':');
      const si = TIME_SLOTS.findIndex(t => t.startsWith(startTime));
      if (si === -1) return;
      const dur = slot.duration || 1;

      let endTime = "Unknown";
      const endSi = si + dur - 1;
      if (endSi >= 0 && endSi < TIME_SLOTS.length) {
        endTime = TIME_SLOTS[endSi].split(' - ')[1].replace(' (eve)', '');
      }

      if (grid[slot.day][si] === null) {
        grid[slot.day][si] = { code, sec, ...slot, time_end: endTime, ci: colorMap[code], colspan: dur };
      } else {
        if (!Array.isArray(grid[slot.day][si])) grid[slot.day][si] = [grid[slot.day][si]];
        grid[slot.day][si].push({ code, sec, ...slot, time_end: endTime, ci: colorMap[code], colspan: 1 });
      }
      for (let i = 1; i < dur; i++) {
        if (si + i < TIME_SLOTS.length && grid[slot.day][si + i] === null)
          grid[slot.day][si + i] = 'skip';
      }
    });
  }

  let lectures = 0, labs = 0;
  for (const [code, sec] of Object.entries(selected)) {
    (COURSES[code].sections[sec] || []).forEach(s => {
      if (s.type === 'Lecture') lectures++; else if (s.type === 'Lab/Amali') labs++;
    });
  }

  if (viewMode === 'cards') {
    body.innerHTML = buildCardsHTML(grid) + buildStatsHTML(lectures, labs, conflicts.length) + buildLegendHTML();
  } else {
    body.innerHTML = buildTableHTML(grid) + buildStatsHTML(lectures, labs, conflicts.length) + buildLegendHTML();
  }
}

function buildTableHTML(grid) {
  const t = DICT[currentLang];
  if (layoutOrientation === 'days-left') {
    return buildTableDaysLeft(grid, t);
  }
  return buildTableDaysTop(grid, t);
}

function buildTableDaysTop(grid, t) {
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
    TIME_SLOTS.forEach((time, i) => {
      html += renderTableCell(grid[day][i], false); // <-- Add false here
    });
    html += `</tr>`;
  });
  return html + `</tbody></table></div>`;
}

function buildTableDaysLeft(grid, t) {
  // Transposed: time as rows, days as columns
  let html = `<div class="tt-scroll"><table class="tt-table tt-table-dl"><thead><tr><th class="day-th time-th">${currentLang === 'ms' ? 'Masa' : 'Time'}</th>`;
  DAYS.forEach(day => {
    html += `<th class="day-col-th">${t.days[day]}</th>`;
  });
  html += `</tr></thead><tbody>`;
  TIME_SLOTS.forEach((ts, i) => {
    const parts = ts.replace(' (eve)', '★').split(' - ');
    const timeLabel = `<div style="line-height:1.3;text-align:right">${parts[0]}<br><span style="opacity:0.6;font-size:8px">${parts[1] || ''}</span></div>`;
    html += `<tr><td class="day-td time-td">${timeLabel}</td>`;
    DAYS.forEach(day => {
      html += renderTableCell(grid[day][i], true); // <-- Add true here
    });
    html += `</tr>`;
  });
  return html + `</tbody></table></div>`;
}

function renderTableCell(cell, isTransposed = false) {
  if (cell === 'skip') return '';
  if (cell === null) return `<td></td>`;
  if (Array.isArray(cell)) {
    const h = Math.floor(54 / cell.length);
    let inner = cell.map((e, idx) => {
      const col = getSubjectColor(e.code);
      let tStart = e.time_start || '', tEnd = e.time_end || '';
      let confDurLabel = `<div class="slot-dur desktop-hide" style="font-size:7px;margin-top:1px">${format12Hour(tStart)} - ${format12Hour(tEnd)}</div>`;
      return `<div class="conflict-inner" style="height:${h}px;top:${idx * (h + 2) + 2}px;border-color:${col}40;background:${col}18" onclick="showDetailModal(this)" data-info="${encodeURIComponent(JSON.stringify(e))}"><div class="slot-code" style="color:${col}">⚠ ${e.code}</div><div style="font-size:8px;opacity:.7">${typeLabel(e.type)}·${e.sec}</div>${confDurLabel}</div>`;
    }).join('');
    return `<td class="conflict-cell">${inner}</td>`;
  }
  const e = cell, ts = typeLabel(e.type);
  const col = getSubjectColor(e.code);
  const venue = (e.venue || '').replace('I-', '').substring(0, 16);
  // FIX: Dynamically switch between rowspan and colspan
  const spanAttr = isTransposed ? 'rowspan' : 'colspan';
  const cs = e.colspan > 1 ? ` ${spanAttr}="${e.colspan}"` : '';
  let tStart = e.time_start || '', tEnd = e.time_end || '';
  let durLabel = e.duration > 1
    ? `<div class="slot-dur">${format12Hour(tStart)} - ${format12Hour(tEnd)}</div>`
    : `<div class="slot-dur desktop-hide">${format12Hour(tStart)} - ${format12Hour(tEnd)}</div>`;
  return `<td${cs}><div class="slot type-${ts}" style="background:${col}22;border-left:3px solid ${col};color:${col}" title="${e.code} ${e.sec}&#10;${e.type}&#10;${e.day} ${e.time_start}–${e.time_end || ''}&#10;${e.venue}&#10;${e.lecturer}" onclick="showDetailModal(this)" data-info="${encodeURIComponent(JSON.stringify(e))}">
    <div class="slot-code">${e.code}</div>
    <div class="slot-meta">${e.sec} <span class="slot-type-badge" style="background:${col}33">${ts}</span></div>
    ${venue ? `<div class="slot-venue">${venue}</div>` : ''}
    ${durLabel}
  </div></td>`;
}

/* ════ CARD VIEW (mobile / tablet) ════ */
function buildCardsHTML(grid) {
  const t = DICT[currentLang];
  const DAY_COLORS = ['#4f8ef7', '#10b981', '#f59e0b', '#f05252', '#8b5cf6'];
  let html = '<div class="cards-view">';

  DAYS.forEach((day, di) => {
    // Collect all non-null, non-skip cells for this day
    const entries = [];
    TIME_SLOTS.forEach((timeLabel, i) => {
      const cell = grid[day][i];
      if (!cell || cell === 'skip') return;
      if (Array.isArray(cell)) {
        // Conflict: multiple entries in the same slot
        cell.forEach(e => entries.push({ ...e, timeIdx: i, timeLabel, isConflict: true }));
      } else {
        entries.push({ ...cell, timeIdx: i, timeLabel, isConflict: false });
      }
    });

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

        html += `<div class="slot-card" style="border-left-color:${col};background:${col}12" onclick="showDetailModal(this)" data-info="${encodeURIComponent(JSON.stringify(e))}">
          <div class="sc-code" style="color:${col}">${e.code}</div>
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
function typeLabel(type) {
  return type === 'Lecture' ? 'K' : type === 'Lab/Amali' ? 'A' : 'T';
}
function getCredits(code) { const m = code.match(/(\d{2})$/); return m ? parseInt(m[1], 10) : 0; }
function totalCredits() { return Object.keys(selected).reduce((s, c) => s + getCredits(c), 0); }

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
        <div class="saved-name">${s.name}</div>
        <div class="saved-meta">${subjs} ${t.stats.subj} • ${dateStr}</div>
      </div>
      <div class="saved-actions">
        <button class="btn-sm btn-load" onclick="event.stopPropagation(); loadTimetable('${s.id}')" title="${t.loadBtn}">${t.loadBtn}</button>
        <button class="btn-sm btn-del" onclick="event.stopPropagation(); deleteTimetable('${s.id}')" title="${t.delBtn}">✕</button>
      </div>
    </div>`;
  }
  area.innerHTML = html;
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
  if (!confirm(currentLang === 'ms' ? 'Pasti memadam jadual ini?' : 'Delete this saved timetable?')) return;
  savedTimetables = savedTimetables.filter(s => s.id !== id);
  localStorage.setItem('uthm-tg-saved', JSON.stringify(savedTimetables));
  renderSavedList();
}

/* ════ MODALS ════ */
function showDetailModal(el) {
  const e = JSON.parse(decodeURIComponent(el.dataset.info));
  const t = DICT[currentLang];

  document.getElementById('detail-code').textContent = e.code;
  const name = (COURSES[e.code] && COURSES[e.code].name) ? COURSES[e.code].name : '';
  document.getElementById('detail-name').textContent = name;

  document.getElementById('detail-sec').textContent = e.sec;

  const typeFull = e.type === 'Lecture' ? (currentLang === 'ms' ? 'Kuliah' : 'Lecture')
    : e.type === 'Lab/Amali' ? (currentLang === 'ms' ? 'Amali' : 'Lab')
      : (currentLang === 'ms' ? 'Tutorial' : 'Tutorial');
  document.getElementById('detail-type').textContent = typeFull;

  const tStart = e.time_start || '';
  const tEnd = e.time_end || '';
  const timeStr = `${t.days[e.day]} • ${format12Hour(tStart)}${tEnd ? ' – ' + format12Hour(tEnd) : ''}`;
  document.getElementById('detail-time').textContent = timeStr;

  document.getElementById('detail-venue').textContent = (e.venue || '-').replace('I-', '');
  document.getElementById('detail-lecturer').textContent = (e.lecturer || '-').replace('I-', '');

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

      const availableSections = Object.keys(COURSES[code].sections);

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
  if (!sel || typeof INTAKE_COURSES === 'Please Select Your Intake (Optional)') return;

  sel.innerHTML = `<option value="">${DICT[currentLang].intakePlaceholder}</option>`;
  for (const [intake, codes] of Object.entries(INTAKE_COURSES)) {
    if (codes.length === 0) continue;
    const opt = document.createElement('option');
    opt.value = intake;
    opt.textContent = intake;
    sel.appendChild(opt);
  }
}

function suggestByIntake() {
  const sel = document.getElementById('intake-select');
  const chosenIntake = sel ? sel.value : '';
  if (!chosenIntake) return;

  // Get the definitive course list for this intake from INTAKE_COURSES
  const courseCodes = (typeof INTAKE_COURSES !== 'Please Select Your Intake (Optional)' && INTAKE_COURSES[chosenIntake]) || [];
  if (courseCodes.length === 0) {
    alert(DICT[currentLang].intakeNoneFound);
    return;
  }

  // Clear existing selections
  for (const key in selected) delete selected[key];
  for (const key in colorMap) delete colorMap[key];
  for (const key in customColors) delete customColors[key];
  colorIdx = 0;

  let foundAny = false;
  for (const code of courseCodes) {
    if (!COURSES[code]) continue; // course not in data.js

    const secs = Object.keys(COURSES[code].sections || {});
    if (secs.length === 0) continue;

    // Prefer section tagged with this intake, fall back to first section
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
  }

  if (!foundAny) {
    alert(DICT[currentLang].intakeNoneFound);
    return;
  }

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