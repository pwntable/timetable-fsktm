/* ═══════════════════════════════════════════════
   UTHM Timetable Generator — intake_courses.js
   Authoritative intake→courses map parsed from by_batch_11032026.pdf
   Total intakes: 22
═══════════════════════════════════════════════ */

const INTAKE_COURSES = {
  "COURSEWORK(INFORMATION TECHNOLOGY)": [
    "MIC10503",
    "MIC10303",
    "MIC10203",
    "MIC10103",
    "MIC10403"
  ],
  "FSKTM-1BIK": [
    "BIK10703",
    "BIC10003",
    "BIK10803",
    "BIK10403",
    "BIK20503",
    "BIK10503",
    "BIK31003",
    "BIK10903",
    "BIK10602",
    "BIK20703"
  ],
  "FSKTM-1BIM": [
    "BIC21203",
    "BIC10003",
    "BIM20903",
    "BIC10403",
    "BIC31903",
    "BIM10203",
    "BIC21003",
    "BIM10603",
    "BIC31502"
  ],
  "FSKTM-1BIS": [
    "BIC31502",
    "BIS20503",
    "BIS30803",
    "BIC10403",
    "BIC21003",
    "BIS20403",
    "BIW20303",
    "BIS33403"
  ],
  "FSKTM-1BIS INTAKE II": [
    "BIC31502",
    "BIS20503",
    "BIS30803",
    "BIW20303",
    "BIC10203",
    "BIC31903",
    "BIC21003",
    "BIS10103"
  ],
  "FSKTM-1BIT": [
    "BIT20103",
    "BIT20703",
    "BIT20403",
    "BIT10303",
    "BIT22103",
    "BIT10703",
    "BIT20603",
    "BIT22303"
  ],
  "FSKTM-1BIT INTAKE II": [
    "BIT20103",
    "BIT22403",
    "BIT20903",
    "BIT20703",
    "BIT20403",
    "BIT22103",
    "BIT10703",
    "BIT20603",
    "BIT22303"
  ],
  "FSKTM-1BIW": [
    "BIW20503",
    "BIC31903",
    "BIC21003",
    "BIW20303",
    "BIW33503",
    "BIC10403"
  ],
  "FSKTM-2BIM": [
    "BIC21303",
    "BIC21404",
    "BIM20703",
    "BIM20404",
    "BIM30803",
    "BIC31602",
    "BIC31502"
  ],
  "FSKTM-2BIP": [
    "BIC21404",
    "BIE20303",
    "BIE33503",
    "BIC21303",
    "BIE20203",
    "BIE30503",
    "BIC21003",
    "BIE20404",
    "BIC10404",
    "BIE33003",
    "BIC10603",
    "BIC10303",
    "BIE10103",
    "BIC31602",
    "BIC31502"
  ],
  "FSKTM-2BIS": [
    "BIC31502",
    "BIS33203",
    "BIC21303",
    "BIS20404",
    "BIS20503",
    "BIS20303",
    "BIC21404",
    "BIS33703",
    "BIC10404",
    "BIC21003",
    "BIC10603",
    "BIS30803",
    "BIC10303",
    "BIC31602",
    "BIS33403",
    "BIS10103"
  ],
  "FSKTM-2BIT": [
    "BIT20803",
    "BIT10103",
    "BIT21503",
    "BIT34303",
    "BIT20903",
    "BIT33803",
    "BIT20703",
    "BIT21403",
    "BIT33703",
    "BIT11603",
    "BIT10703",
    "BIT34503",
    "BIT34103",
    "BIT34002"
  ],
  "FSKTM-2BIW": [
    "BIW33403",
    "BIC31502",
    "BIE33103",
    "BIC21303",
    "BIC21404",
    "BIW20404",
    "BIC10404",
    "BIW33703",
    "BIC21003",
    "BIC10603",
    "BIC10303",
    "BIW33803",
    "BIW33503",
    "BIS20303"
  ],
  "FSKTM-3BIM": [
    "BIM33103",
    "BIM33703",
    "BIM33603",
    "BIM20703",
    "BIM33403",
    "BIC10303",
    "BIM30803",
    "BIC31602"
  ],
  "FSKTM-3BIP": [
    "BIC21404",
    "BIE20303",
    "BIE33503",
    "BIC21303",
    "BIT34303",
    "BIE20203",
    "BIE30503",
    "BIC21003",
    "BIE20404",
    "BIE33003",
    "BIC10603",
    "BIE10103",
    "BIC31602",
    "BIC31502"
  ],
  "FSKTM-3BIS": [
    "BIS33203",
    "BIC31502",
    "BIC20904",
    "BIC21303",
    "BIS30703",
    "BIS20404",
    "BIS30903",
    "BIS20303",
    "BIC21404",
    "BIS33703",
    "BIS33103",
    "BIC20803",
    "BIS33403",
    "BIC21003",
    "BIC10603",
    "BIC31602",
    "BIS30803"
  ],
  "FSKTM-3BIT": [
    "BIT20803",
    "BIT34103",
    "BIT10103",
    "BIT21503",
    "BIT31502",
    "BIT34303",
    "BIT20903",
    "BIT30303",
    "BIT33803",
    "BIT20703"
  ],
  "FSKTM-3BIW": [
    "BIW33403",
    "BIC21303",
    "BIW33803",
    "BIW33703",
    "BIC10203",
    "BIC20803",
    "BIC31602",
    "BIW33503",
    "BIS20303"
  ],
  "FSKTM-4BIM": [
    "BIM33703",
    "BIM20703",
    "BIM30803"
  ],
  "FSKTM-4BIS": [
    "BIS33203",
    "BIS20303",
    "BIS33703",
    "BIS33403"
  ],
  "FSKTM-4BIW": [
    "BIW33403",
    "BIW33703",
    "BIW33803",
    "BIW33503",
    "BIS20303"
  ],
  "FSKTM-MIXED MODE": [
    "CIC10103",
    "CII10603",
    "CII10803"
  ]
};
