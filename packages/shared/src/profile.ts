export const PROFILE = {
  name: "Nessim Guez",
  age: 26,
  location: "Tel Aviv, Israel",
  contact: {
    email: "nessimguez1@gmail.com",
    phone: "+972 54 649 5846",
    linkedin: "https://www.linkedin.com/in/nessim-guez-0519411b8/",
  },
  // Order of strength matters for scoring decisions.
  languages: [
    { lang: "Hebrew",  level: "native (strongest for writing, speaking, and selling)" },
    { lang: "English", level: "native-level (10 years lived in the US, American accent)" },
    { lang: "French",  level: "native oral, fluent written (non-academic)" },
  ],
  currentRole: {
    title: "Relationship Manager",
    company: "UBP (Union Bancaire Privée)",
    location: "Tel Aviv",
    since: "2025",
    description:
      "Originates and services HNWI clients across Israel and France. Works with Geneva on KYC and onboarding. French desk focus.",
  },
  experience: [
    {
      company: "Tafnit Discount (Discount Bank wealth arm)",
      role: "Intern, Wealth Management",
      years: "2023–2024",
      description: "Cold-called existing clients, converted 150+ to Tafnit portfolio mandates in 10 months.",
    },
    {
      company: "IATI (Israel Advanced Technology Industries)",
      role: "Project Coordinator",
      years: "2022–2023",
      description: "Coordinated initiatives with 100+ Israeli tech companies — ecosystem exposure, not personal exec relationships.",
    },
    {
      company: "Eden Property Group",
      role: "Business Development",
      years: "2020–2022",
    },
    {
      company: "IDF — Sayeret Harouv (Kfir Brigade)",
      role: "Assistant to Battalion Commander",
      years: "2018–2020",
    },
  ],
  education: [
    { school: "Ono Academic College", degree: "MA Finance & Capital Markets", year: "Nov 2025" },
    { school: "Reichman University (IDC)", degree: "BA Business Administration & Entrepreneurship", year: "2023" },
  ],
  sideProject:
    "Co-founder of Sayeret Harouv Association — 3,000+ alumni network",
  targetRoles: [
    "Private banking / Relationship Manager (Tel Aviv desks of Swiss PBs especially)",
    "Family office IR / banker / wealth associate (TLV-located or remote)",
    "Israeli premium / private banking",
    "Fintech BD / Partnerships in Israel",
    "VC / IR / Platform roles in Israel",
    "Tech BD at Israeli scale-ups",
  ],
  geographies: {
    primary: ["Tel Aviv area", "Israel (anywhere)"],
    conditional: ["Miami / Florida — only with paid relocation + visa sponsorship"],
    excluded: ["Switzerland", "United Kingdom", "Singapore", "France", "Germany", "Dubai", "everywhere else not on the primary list"],
  },
  seniority: {
    yearsRealExperience: 4.5,
    note: "IDF years excluded. Eden BD (2yr) + IATI coordinator (1yr) + Tafnit intern (1yr) + UBP RM (current, ~6mo). Genuinely junior-to-mid.",
    goodFit: [
      "Analyst, Associate, Junior/Senior Associate at any firm",
      "Relationship Manager or Account Manager (any level)",
      "BD Associate or BD Manager at Seed/Series A/B company (<50 people)",
      "VC/PE Analyst or Associate",
      "Finance Analyst or Treasury Analyst",
    ],
    stretch: [
      "Manager at a scale-up if role is IC-heavy (no large team to manage)",
      "Senior roles at small companies where 'senior' means individual contributor",
    ],
    hardFail: [
      "VP, Director, Managing Director, Partner, C-suite",
      "Head of BD/Sales/Partnerships at company >100 people",
      "Any role explicitly requiring 7+ years experience",
    ],
  },
  constraints: {
    minSalaryNIS: 18000,
    visaStatus: "US visa from childhood, no US citizenship/green card — Miami requires sponsorship",
    blocklist: [
      "UBP",
      "Union Bancaire Privée",
      "Tafnit Discount",
      "IATI",
      "Israel Advanced Technology Industries",
      "Eden Property Group",
      "Reichman University",
    ],
  },
} as const;
