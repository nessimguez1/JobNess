export const PROFILE = {
  name: "Nessim Guez",
  age: 26,
  location: "Tel Aviv, Israel",
  contact: {
    email: "nessimguez1@gmail.com",
    phone: "+972 54 649 5846",
    linkedin: "https://www.linkedin.com/in/nessim-guez-0519411b8/",
  },
  languages: [
    { lang: "French", level: "native" },
    { lang: "English", level: "fluent (10 years lived in the US)" },
    { lang: "Hebrew", level: "professional" },
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
    },
    {
      company: "IATI (Israel Advanced Technology Industries)",
      role: "Project Coordinator",
      years: "2022–2023",
      description:
        "Inside the Israeli tech ecosystem. Coordinated initiatives with 100+ tech companies.",
    },
    {
      company: "Eden Property Group",
      role: "Business Development",
      years: "2020–2022",
    },
    {
      company: "IDF — Sayeret Harouv",
      role: "Combat soldier (elite recon unit)",
      years: "2018–2020",
    },
  ],
  education: [
    { school: "Ono Academic College", degree: "MA Finance", year: "Nov 2025" },
    {
      school: "Reichman University (IDC)",
      degree: "BA Business Administration",
      year: "2023",
    },
  ],
  sideProject:
    "Co-founder of Sayeret Harouv Association — 3,000+ alumni network",
  targetRoles: [
    "Private banking / Relationship Manager (French desk especially)",
    "Fintech BD / Partnerships (Israel or remote EU/US)",
    "VC / IR / Platform roles",
    "Tech BD at scale-ups",
  ],
  seniority: {
    paper: "Associate / Analyst level",
    realistic:
      "Punches above — Private Banking RM for FR-speaking HNWI at tier-1 Swiss banks (Pictet, Lombard Odier, Julius Baer, Edmond de Rothschild). Head of BD at early-stage fintech (Seed/Series A, 5-30 people). Skip middle-management BD at large companies.",
  },
  constraints: {
    minSalaryNIS: 18000,
    geographies: ["Israel", "Remote EU", "Remote US"],
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
