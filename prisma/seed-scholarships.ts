import "dotenv/config";
import { db } from "../src/lib/db";

const SCHOLARSHIPS = [
  {
    name: "NNPC/Total Undergraduate Scholarship",
    provider: "NNPC/TotalEnergies",
    description: "Annual scholarship for Nigerian undergraduates in science, engineering, and technology courses. Covers tuition and living expenses.",
    amount: "Full tuition + allowance",
    deadline: new Date("2026-03-31"),
    eligibility: { minGPA: 3.0, yearOfStudy: [1, 2, 3, 4] },
    url: "https://scholarship.nnpcgroup.com",
    states: [],
    courses: ["Engineering", "Science", "Technology", "Computer Science", "Medicine"],
    minScore: 250,
  },
  {
    name: "MTN Foundation Scholarship",
    provider: "MTN Foundation",
    description: "Merit-based scholarship for 200-level students in Nigerian universities. Covers tuition for remaining years.",
    amount: "Up to N200,000/year",
    deadline: new Date("2026-06-30"),
    eligibility: { minGPA: 3.5, yearOfStudy: [2] },
    url: "https://www.mtnonline.com/foundation",
    states: [],
    courses: [],
    minScore: 250,
  },
  {
    name: "Agbami Medical & Engineering Scholarship",
    provider: "Agbami",
    description: "Full scholarship for students studying Medicine, Engineering, Geosciences, and Computer Science.",
    amount: "Full scholarship",
    deadline: new Date("2026-04-30"),
    eligibility: { minGPA: 3.0 },
    url: "https://agbami.com/scholarship",
    states: [],
    courses: ["Medicine", "Engineering", "Computer Science", "Geology"],
    minScore: 260,
  },
  {
    name: "Lagos State Scholarship",
    provider: "Lagos State Government",
    description: "For Lagos State indigenes pursuing undergraduate studies in Nigerian universities.",
    amount: "N100,000/year",
    deadline: new Date("2026-05-31"),
    eligibility: { stateOfOrigin: "Lagos" },
    states: ["Lagos"],
    courses: [],
    minScore: 200,
  },
  {
    name: "Federal Government BEA Scholarship",
    provider: "Federal Government of Nigeria",
    description: "Bilateral Education Agreement scholarship for undergraduate and postgraduate studies abroad.",
    amount: "Full scholarship (international)",
    deadline: new Date("2026-04-15"),
    eligibility: { maxAge: 25 },
    url: "https://www.scholarships.gov.ng",
    states: [],
    courses: [],
    minScore: 280,
  },
  {
    name: "Shell SPDC JV University Scholarship",
    provider: "Shell Nigeria",
    description: "For students in Niger Delta states pursuing Engineering, Sciences, Medicine, Law, and related courses.",
    amount: "Full tuition + stipend",
    deadline: new Date("2026-07-31"),
    eligibility: {},
    states: ["Rivers", "Bayelsa", "Delta", "Imo", "Abia", "Ondo"],
    courses: ["Engineering", "Science", "Medicine", "Law"],
    minScore: 250,
  },
];

async function main() {
  for (const s of SCHOLARSHIPS) {
    await db.scholarship.create({ data: s as any });
  }
  console.log(`Seeded ${SCHOLARSHIPS.length} scholarships`);
}

main().catch(console.error).finally(() => db.$disconnect());