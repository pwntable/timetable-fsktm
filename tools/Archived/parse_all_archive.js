const fs = require('fs');

// Senarai penuh 144 Subjek yang telah diekstrak secara automatik dari PDF
const SUBJECT_DICT = {
    "BIC10003": "FUNDAMENTAL MATHEMATICS FOR COMPUTER SCIENCE",
    "BIC10103": "STRUKTUR DISKRIT",
    "BIC10203": "ALGORITMA DAN PENGATURCARAAN",
    "BIC10204": "ALGORITMA DAN PENGATURCARAAN",
    "BIC10303": "ALGEBRA",
    "BIC10403": "STRUKTUR DATA",
    "BIC10404": "STRUKTUR DATA",
    "BIC10503": "SENIBINA KOMPUTER",
    "BIC10603": "STATISTIK",
    "BIC20803": "SISTEM PENGOPERASIAN",
    "BIC20904": "PENGATURCARAAN BERORIENTASIKAN OBJEK",
    "BIC21003": "ANALISA DAN REKA BENTUK SISTEM",
    "BIC21102": "ETIKA PROFESIONAL DAN KESELAMATAN PEKERJAAN",
    "BIC21203": "PEMBANGUNAN WEB",
    "BIC21303": "RANGKAIAN KOMPUTER",
    "BIC21404": "PANGKALAN DATA",
    "BIC22003": "INTERAKSI MANUSIA KOMPUTER",
    "BIC31502": "KREATIVITI DAN INOVASI",
    "BIC31602": "PROJEK SARJANA MUDA I",
    "BIC31704": "PROJEK SARJANA MUDA II",
    "BIC31802": "KEUSAHAWANAN SIBER",
    "BIC31903": "TEKNOKEUSAHAWANAN",
    "BIE10103": "PRINSIP KEJURUTERAAN PERISIAN",
    "BIE20103": "KEJURUTERAAN KEPERLUAN",
    "BIE20203": "REKA BENTUK PERISIAN",
    "BIE20303": "ALGORITMA DAN KEKOMPLEKSAN",
    "BIE20404": "PENGATURCARAAN VISUAL",
    "BIE30503": "PENGURUSAN PROJEK PERISIAN",
    "BIE30803": "PENGUJIAN PERISIAN",
    "BIE33003": "KESELAMATAN KEJURUTERAAN PERISIAN",
    "BIE33103": "PENGATURCARAAN DOTNET",
    "BIE33503": "TOPIK-TOPIK KHAS KEJURUTERAAN PERISIAN",
    "BIK10103": "PRINSIP KEJURUTERAAN PERISIAN",
    "BIK10203": "ALGORITMA DAN PENGATURCARAAN",
    "BIK10303": "SENIBINA KOMPUTER",
    "BIK10403": "ANALISIS DAN REKABENTUK SISTEM",
    "BIK10503": "PEMBANGUNAN PERISIAN",
    "BIK10602": "STRUKTUR DISKRIT",
    "BIK10703": "SISTEM PENGOPERASIAN",
    "BIK10803": "KEJURUTERAAN KEPERLUAN",
    "BIK10903": "STRUKTUR DATA",
    "BIK20503": "JAMINAN KUALITI PERISIAN",
    "BIK20703": "ETIKA PROFESIONAL DAN KESELAMATAN PEKERJAAN",
    "BIK20803": "KREATIVITI DAN INOVASI",
    "BIK30603": "PENGATURCARAAN DOTNET",
    "BIK31003": "SPECIAL TOPICS IN SOFTWARE ENGINEERING",
    "BIM10103": "ASAS PENGKOMPUTERAN MULTIMEDIA",
    "BIM10203": "TEKNOLOGI AUDIO DAN VIDEO DIGITAL",
    "BIM10603": "GRAFIK KOMPUTER",
    "BIM20404": "SISTEM DAN APLIKASI MULTIMEDIA",
    "BIM20603": "GRAFIK KOMPUTER",
    "BIM20703": "ANIMASI KOMPUTER",
    "BIM20903": "PEMBANGUNAN PERISIAN MULTIMEDIA",
    "BIM30503": "INTERAKSI MANUSIA KOMPUTER",
    "BIM30603": "PEMBANGUNAN APLIKASI MUDAH ALIH",
    "BIM30702": "PENGURUSAN PROJEK MULTIMEDIA",
    "BIM30703": "PENGURUSAN PROJEK MULTIMEDIA",
    "BIM30803": "REALITI MAYA",
    "BIM33103": "PEMBANGUNAN PERMAINAN KOMPUTER",
    "BIM33203": "PEMPROSESAN IMEJ",
    "BIM33403": "TEKNOLOGI KESELAMATAN MULTIMEDIA",
    "BIM33603": "TOPIK-TOPIK KHAS PENGKOMPUTERAN MULTIMEDIA",
    "BIM33703": "TEKNOLOGI VIDEO DIGITAL",
    "BIS10103": "ASAS KESELAMATAN MAKLUMAT",
    "BIS20303": "KESELAMATAN WEB",
    "BIS20403": "KRIPTOGRAFI",
    "BIS20404": "KRIPTOGRAFI",
    "BIS20503": "KESELAMATAN PERISIAN",
    "BIS30603": "KESELAMATAN PENGKOMPUTERAN MUDAH ALIH DAN TANPA WAYAR",
    "BIS30703": "PENGURUSAN PROJEK KESELAMATAN MAKLUMAT",
    "BIS30803": "JENAYAH KOMPUTER DAN FORENSIK DIGITAL",
    "BIS30903": "KESELAMATAN KOMUNIKASI DAN RANGKAIAN",
    "BIS33103": "KEJURUTERAAN KESELAMATAN KORPORAT",
    "BIS33203": "PIAWAIAN KESELAMATAN MAKLUMAT",
    "BIS33303": "KESELAMATAN INFRASTRUKTUR KRITIKAL",
    "BIS33403": "TOPIK-TOPIK KHAS KESELAMATAN MAKLUMAT",
    "BIS33703": "PENILAIAN DAN PENGUJIAN KESELAMATAN",
    "BIT10103": "KEJURUTERAAN PERISIAN",
    "BIT10303": "PENGATURCARAAN KOMPUTER",
    "BIT10703": "STRUKTUR DATA DAN ALGORITMA",
    "BIT11003": "STRUKTUR DISKRIT",
    "BIT11203": "PRINSIP TEKNOLOGI MAKLUMAT",
    "BIT11603": "STATISTIK",
    "BIT20103": "ANALISIS REKABENTUK SISTEM",
    "BIT20303": "SENIBINA KOMPUTER",
    "BIT20403": "SISTEM PENGOPERASIAN",
    "BIT20502": "KREATIVITI & INOVASI",
    "BIT20603": "PENGATURCARAAN BERORIENTASIKAN OBJEK",
    "BIT20703": "RANGKAIAN DAN KOMUNIKASI DATA",
    "BIT20803": "SISTEM PANGKALAN DATA",
    "BIT20903": "KECERDASAN BUATAN",
    "BIT21202": "ETIKA PROFESIONAL DAN KESELAMATAN PEKERJAAN",
    "BIT21303": "INTERAKSI MANUSIA KOMPUTER",
    "BIT21403": "ASAS KESELAMATAN MAKLUMAT",
    "BIT21503": "PEMBANGUNAN WEB",
    "BIT22103": "TEKNOLOGI SISTEM BERSEPADU",
    "BIT22203": "RANGKAIAN LANJUTAN",
    "BIT22303": "PENGURUSAN MAKLUMAT",
    "BIT22403": "PARADIGMA SISTEM",
    "BIT30303": "SISTEM BANTUAN KEPUTUSAN",
    "BIT30403": "PENGURUSAN PROJEK",
    "BIT30502": "PERANCANGAN SUMBER ENTERPRISE",
    "BIT30503": "PERANCANGAN SUMBER ENTERPRISE",
    "BIT30603": "PENGURUSAN PERHUBUNGAN PELANGGAN",
    "BIT30803": "SISTEM MAKLUMAT PENGURUSAN",
    "BIT31502": "KEUSAHAWANAN KREATIVITI DAN INOVASI",
    "BIT33603": "PERLOMBONGAN DATA",
    "BIT33703": "PEMBANGUNAN SISTEM FUZZY",
    "BIT33803": "PENGATURCARAAN JAVA",
    "BIT33902": "KEUSAHAWANAN",
    "BIT34002": "PROJEK SARJANA MUDA I",
    "BIT34103": "PEMBANGUNAN APLIKASI MUDAH ALIH",
    "BIT34303": "PEMBELAJARAN MESIN",
    "BIT34403": "PEMBELAJARAN MENDALAM",
    "BIT34503": "SAINS DATA",
    "BIW10103": "ASAS TEKNOLOGI WEB",
    "BIW10203": "APLIKASI WEB",
    "BIW20303": "REKABENTUK WEB",
    "BIW20404": "TEKNOLOGI SERVIS WEB",
    "BIW20503": "PENGATURCARAAN DOTNET",
    "BIW30503": "PENGURUSAN PROJEK WEB",
    "BIW33003": "SISTEM PENGURUSAN KANDUNGAN",
    "BIW33103": "PANGKALAN DATA TERAGIH",
    "BIW33403": "PENGKOMPUTERAN PERVASIF",
    "BIW33503": "TOPIK-TOPIK KHAS TEKNOLOGI WEB",
    "BIW33703": "PENGKOMPUTERAN AWAN",
    "BIW33803": "INTERNET OF THINGS",
    "BPB31303": "KEJURUTERAAN INDUSTRI",
    "BPK20802": "KEUSAHAWANAN",
    "CIC10103": "ALGORITHM DESIGN AND ANALYSIS",
    "CIC10203": "RESEARCH METHODOLOGY",
    "CIE10403": "SOFTWARE VERIFICATION & VALIDATION",
    "CIE10503": "SOFTWARE AND SYSTEM SECURITY",
    "CIE10603": "ADVANCE SOFTWARE DEVELOPMENT",
    "CIE10703": "SOFTWARE ENGINEERING MANAGEMENT",
    "CII10303": "ADVANCE NETWORK SECURITY",
    "CII10603": "INFORMATION SECURITY MANAGEMENT",
    "CII10803": "CYBER SECURITY ASSESSMENT AND PENETRATION TESTING",
    "MIC10103": "INFORMATION TECHNOLOGY GOVERNANCE",
    "MIC10203": "ICT STRATEGIC PLANNING",
    "MIC10303": "APPLIED DATA VISUALIZATION",
    "MIC10403": "INFORMATION SECURITY MANAGEMENT",
    "MIC10503": "BUSINESS PROCESS REENGINEERING",
    "KIT11103": "RESEARCH METHODOLOGY",
    "PIT11103": "RESEARCH METHODOLOGY",
};

function parseCSV(str) {
    const arr = [];
    let quote = false;
    let row = 0, col = 0;

    let commaCount = (str.match(/,/g) || []).length;
    let semiCount = (str.match(/;/g) || []).length;
    let separator = semiCount > commaCount ? ';' : ',';

    for (let c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c + 1];
        arr[row] = arr[row] || [];
        arr[row][col] = arr[row][col] || '';

        if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }
        if (cc === '"') { quote = !quote; continue; }
        if (cc === separator && !quote) { ++col; continue; }
        if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }
        if (cc === '\n' && !quote) { ++row; col = 0; continue; }
        if (cc === '\r' && !quote) { ++row; col = 0; continue; }

        arr[row][col] += cc;
    }
    return arr;
}

function generateTimetableData() {
    console.log("Mula mengekstrak jadual kelas dari timetable.csv...");
    const csvText = fs.readFileSync('timetable.csv', 'utf8');
    const rows = parseCSV(csvText);

    const coursesDB = {};

    // Daftarkan semua 144 subjek ke dalam database dari awal
    for (const [code, name] of Object.entries(SUBJECT_DICT)) {
        coursesDB[code] = {
            name: name,
            sections: {},
            hasMultipleSections: false
        };
    }

    let timeHeaders = {};
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    rows.forEach((row) => {
        if (!row || row.length === 0) return;
        const fullRowText = row.join(' ').trim();

        // Cari Header Masa
        const isHeaderRow = row.some(cell => String(cell).toLowerCase().trim().replace(/['"]/g, '') === 'day') &&
            row.some(cell => String(cell).includes('08:00') || String(cell).includes('08.00'));

        if (isHeaderRow) {
            let lastTime = "08:00";
            for (let c = 0; c < row.length; c++) {
                let cellText = String(row[c]).replace(/\s+/g, '');
                let tMatch = cellText.match(/(\d{1,2}[:.]\d{2})/);
                if (tMatch) {
                    lastTime = tMatch[1].replace('.', ':');
                }
                timeHeaders[c] = lastTime;
            }
            return;
        }

        // Cari Hari & Data Kelas di dalam grid CSV
        let foundDay = daysOfWeek.find(d => fullRowText.toLowerCase().includes(d.toLowerCase()));

        if (foundDay) {
            for (let c = 0; c < row.length; c++) {
                let cell = String(row[c]);
                const classMatch = cell.match(/([A-Z]{3,4}\s*\d{4,5}[A-Z]?)[^A-Z0-9]*(S\d+)\s+([A-Z])/i);

                if (classMatch) {
                    const matchedCourse = classMatch[1].replace(/\s+/g, '').toUpperCase();
                    const sectionNum = classMatch[2].toUpperCase();
                    const typeCode = classMatch[3].toUpperCase();

                    const lecturerMatch = cell.match(/\(([^)]+)\)/);
                    const venueMatch = cell.match(/\[([^\]]+)\]/);

                    const lecturer = lecturerMatch ? lecturerMatch[1].trim() : "Unknown";
                    const venue = venueMatch ? venueMatch[1].trim() : "Unknown";

                    let typeFull = "Lecture";
                    if (typeCode === 'T') typeFull = "Tutorial";
                    if (typeCode === 'A') typeFull = "Lab/Amali";

                    let timeStart = timeHeaders[c] || "08:00";

                    if (!coursesDB[matchedCourse]) {
                        coursesDB[matchedCourse] = {
                            name: "Subjek Tambahan Baru",
                            sections: {},
                            hasMultipleSections: false
                        };
                    }

                    if (!coursesDB[matchedCourse].sections[sectionNum]) {
                        coursesDB[matchedCourse].sections[sectionNum] = [];
                    }

                    coursesDB[matchedCourse].sections[sectionNum].push({
                        day: foundDay,
                        time_start: timeStart,
                        duration: 2,
                        section: `${sectionNum} ${typeCode}`,
                        type: typeFull,
                        lecturer: lecturer,
                        venue: venue
                    });
                }
            }
        }
    });

    for (let code in coursesDB) {
        let course = coursesDB[code];
        course.hasMultipleSections = Object.keys(course.sections).length > 1;

        // POST-PROCESSING: If multiple sections exist, share missing 'Lecture' slots
        if (course.hasMultipleSections) {
            let sharedLectures = [];
            // Collect all unique lectures
            for (let sec in course.sections) {
                course.sections[sec].forEach(slot => {
                    if (slot.type === "Lecture") {
                        if (!sharedLectures.some(l => l.day === slot.day && l.time_start === slot.time_start)) {
                            sharedLectures.push({ ...slot });
                        }
                    }
                });
            }

            // Distribute lectures to sections missing them
            if (sharedLectures.length > 0) {
                for (let sec in course.sections) {
                    let hasLecture = course.sections[sec].some(s => s.type === "Lecture");
                    if (!hasLecture) {
                        sharedLectures.forEach(l => {
                            let newSlot = { ...l, section: `${sec} K` };
                            course.sections[sec].push(newSlot);
                        });
                    }
                }
            }
        }
    }

    const outputCode = `/* ═══════════════════════════════════════════════
   UTHM Timetable Generator — data.js
   Generated via Standalone Parser
   Total courses: ${Object.keys(coursesDB).length}
═══════════════════════════════════════════════ */

const COURSES = ${JSON.stringify(coursesDB, null, 2)};
`;

    fs.writeFileSync('data.js', outputCode, 'utf8');
    console.log(`✅ SUCCESS! Fail data.js berjaya dihasilkan dengan ${Object.keys(coursesDB).length} subjek berserta jadual dari CSV.`);
}

generateTimetableData();