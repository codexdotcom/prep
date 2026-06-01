import "dotenv/config";
import { db } from "../src/lib/db";
const UNIVERSITIES = [
  {
    name: "University of Lagos",
    shortName: "UNILAG",
    state: "Lagos",
    type: "FEDERAL",
    courses: [
      { name: "Medicine and Surgery", faculty: "College of Medicine", jambCutoff: 290, requiredSubjects: ["USE_OF_ENGLISH", "PHYSICS", "CHEMISTRY", "BIOLOGY"], competitiveness: "VERY_HIGH", acceptanceRate: 4, totalSlots: 200 },
      { name: "Computer Science", faculty: "Faculty of Science", jambCutoff: 260, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"], competitiveness: "VERY_HIGH", acceptanceRate: 6, totalSlots: 150 },
      { name: "Law", faculty: "Faculty of Law", jambCutoff: 280, requiredSubjects: ["USE_OF_ENGLISH", "LITERATURE", "GOVERNMENT", "CRS"], competitiveness: "VERY_HIGH", acceptanceRate: 5, totalSlots: 200 },
      { name: "Electrical Engineering", faculty: "Faculty of Engineering", jambCutoff: 260, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"], competitiveness: "HIGH", acceptanceRate: 7, totalSlots: 120 },
      { name: "Accounting", faculty: "Faculty of Business Admin", jambCutoff: 250, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "ECONOMICS", "ACCOUNTING"], competitiveness: "HIGH", acceptanceRate: 8, totalSlots: 200 },
      { name: "Mass Communication", faculty: "Faculty of Social Sciences", jambCutoff: 250, requiredSubjects: ["USE_OF_ENGLISH", "LITERATURE", "GOVERNMENT", "ECONOMICS"], competitiveness: "HIGH", acceptanceRate: 7, totalSlots: 150 },
      { name: "Economics", faculty: "Faculty of Social Sciences", jambCutoff: 240, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "ECONOMICS", "GOVERNMENT"], competitiveness: "MODERATE", acceptanceRate: 10, totalSlots: 200 },
      { name: "Microbiology", faculty: "Faculty of Science", jambCutoff: 230, requiredSubjects: ["USE_OF_ENGLISH", "BIOLOGY", "CHEMISTRY", "PHYSICS"], competitiveness: "MODERATE", acceptanceRate: 13, totalSlots: 100 },
    ],
  },
  {
    name: "University of Ibadan",
    shortName: "UI",
    state: "Oyo",
    type: "FEDERAL",
    courses: [
      { name: "Medicine and Surgery", faculty: "College of Medicine", jambCutoff: 285, requiredSubjects: ["USE_OF_ENGLISH", "PHYSICS", "CHEMISTRY", "BIOLOGY"], competitiveness: "VERY_HIGH", acceptanceRate: 5, totalSlots: 250 },
      { name: "Law", faculty: "Faculty of Law", jambCutoff: 275, requiredSubjects: ["USE_OF_ENGLISH", "LITERATURE", "GOVERNMENT", "ECONOMICS"], competitiveness: "VERY_HIGH", acceptanceRate: 6, totalSlots: 200 },
      { name: "Computer Science", faculty: "Faculty of Science", jambCutoff: 250, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"], competitiveness: "HIGH", acceptanceRate: 7, totalSlots: 120 },
      { name: "Pharmacy", faculty: "Faculty of Pharmacy", jambCutoff: 270, requiredSubjects: ["USE_OF_ENGLISH", "PHYSICS", "CHEMISTRY", "BIOLOGY"], competitiveness: "VERY_HIGH", acceptanceRate: 5, totalSlots: 100 },
      { name: "Economics", faculty: "Faculty of Social Sciences", jambCutoff: 240, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "ECONOMICS", "GOVERNMENT"], competitiveness: "MODERATE", acceptanceRate: 11, totalSlots: 180 },
      { name: "English", faculty: "Faculty of Arts", jambCutoff: 220, requiredSubjects: ["USE_OF_ENGLISH", "LITERATURE", "GOVERNMENT", "CRS"], competitiveness: "MODERATE", acceptanceRate: 17, totalSlots: 150 },
    ],
  },
  {
    name: "Obafemi Awolowo University",
    shortName: "OAU",
    state: "Osun",
    type: "FEDERAL",
    courses: [
      { name: "Medicine and Surgery", faculty: "College of Health Sciences", jambCutoff: 280, requiredSubjects: ["USE_OF_ENGLISH", "PHYSICS", "CHEMISTRY", "BIOLOGY"], competitiveness: "VERY_HIGH", acceptanceRate: 5, totalSlots: 200 },
      { name: "Computer Engineering", faculty: "Faculty of Technology", jambCutoff: 255, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"], competitiveness: "HIGH", acceptanceRate: 7, totalSlots: 100 },
      { name: "Law", faculty: "Faculty of Law", jambCutoff: 270, requiredSubjects: ["USE_OF_ENGLISH", "LITERATURE", "GOVERNMENT", "ECONOMICS"], competitiveness: "VERY_HIGH", acceptanceRate: 6, totalSlots: 180 },
      { name: "Accounting", faculty: "Faculty of Admin", jambCutoff: 240, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "ECONOMICS", "ACCOUNTING"], competitiveness: "MODERATE", acceptanceRate: 10, totalSlots: 200 },
      { name: "Biology", faculty: "Faculty of Science", jambCutoff: 220, requiredSubjects: ["USE_OF_ENGLISH", "BIOLOGY", "CHEMISTRY", "PHYSICS"], competitiveness: "MODERATE", acceptanceRate: 14, totalSlots: 150 },
    ],
  },
  {
    name: "University of Nigeria, Nsukka",
    shortName: "UNN",
    state: "Enugu",
    type: "FEDERAL",
    courses: [
      { name: "Medicine and Surgery", faculty: "College of Medicine", jambCutoff: 275, requiredSubjects: ["USE_OF_ENGLISH", "PHYSICS", "CHEMISTRY", "BIOLOGY"], competitiveness: "VERY_HIGH", acceptanceRate: 6, totalSlots: 200 },
      { name: "Computer Science", faculty: "Faculty of Physical Sciences", jambCutoff: 245, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"], competitiveness: "HIGH", acceptanceRate: 8, totalSlots: 120 },
      { name: "Law", faculty: "Faculty of Law", jambCutoff: 265, requiredSubjects: ["USE_OF_ENGLISH", "LITERATURE", "GOVERNMENT", "ECONOMICS"], competitiveness: "VERY_HIGH", acceptanceRate: 7, totalSlots: 200 },
      { name: "Electrical Engineering", faculty: "Faculty of Engineering", jambCutoff: 245, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"], competitiveness: "HIGH", acceptanceRate: 9, totalSlots: 100 },
      { name: "Economics", faculty: "Faculty of Social Sciences", jambCutoff: 230, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "ECONOMICS", "GOVERNMENT"], competitiveness: "MODERATE", acceptanceRate: 13, totalSlots: 200 },
    ],
  },
  {
    name: "Ahmadu Bello University",
    shortName: "ABU",
    state: "Kaduna",
    type: "FEDERAL",
    courses: [
      { name: "Medicine and Surgery", faculty: "College of Medicine", jambCutoff: 270, requiredSubjects: ["USE_OF_ENGLISH", "PHYSICS", "CHEMISTRY", "BIOLOGY"], competitiveness: "VERY_HIGH", acceptanceRate: 6, totalSlots: 250 },
      { name: "Computer Science", faculty: "Faculty of Science", jambCutoff: 240, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"], competitiveness: "MODERATE", acceptanceRate: 10, totalSlots: 150 },
      { name: "Law", faculty: "Faculty of Law", jambCutoff: 260, requiredSubjects: ["USE_OF_ENGLISH", "LITERATURE", "GOVERNMENT", "ECONOMICS"], competitiveness: "HIGH", acceptanceRate: 7, totalSlots: 200 },
      { name: "Accounting", faculty: "Faculty of Admin", jambCutoff: 235, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "ECONOMICS", "ACCOUNTING"], competitiveness: "MODERATE", acceptanceRate: 13, totalSlots: 200 },
    ],
  },
  {
    name: "University of Benin",
    shortName: "UNIBEN",
    state: "Edo",
    type: "FEDERAL",
    courses: [
      { name: "Medicine and Surgery", faculty: "College of Medicine", jambCutoff: 275, requiredSubjects: ["USE_OF_ENGLISH", "PHYSICS", "CHEMISTRY", "BIOLOGY"], competitiveness: "VERY_HIGH", acceptanceRate: 6, totalSlots: 200 },
      { name: "Law", faculty: "Faculty of Law", jambCutoff: 265, requiredSubjects: ["USE_OF_ENGLISH", "LITERATURE", "GOVERNMENT", "ECONOMICS"], competitiveness: "HIGH", acceptanceRate: 7, totalSlots: 180 },
      { name: "Computer Science", faculty: "Faculty of Science", jambCutoff: 240, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"], competitiveness: "MODERATE", acceptanceRate: 10, totalSlots: 130 },
      { name: "Nursing", faculty: "Faculty of Nursing", jambCutoff: 250, requiredSubjects: ["USE_OF_ENGLISH", "PHYSICS", "CHEMISTRY", "BIOLOGY"], competitiveness: "HIGH", acceptanceRate: 7, totalSlots: 100 },
    ],
  },
  {
    name: "University of Ilorin",
    shortName: "UNILORIN",
    state: "Kwara",
    type: "FEDERAL",
    courses: [
      { name: "Medicine and Surgery", faculty: "College of Health Sciences", jambCutoff: 270, requiredSubjects: ["USE_OF_ENGLISH", "PHYSICS", "CHEMISTRY", "BIOLOGY"], competitiveness: "VERY_HIGH", acceptanceRate: 6, totalSlots: 200 },
      { name: "Computer Science", faculty: "Faculty of Comm & Info Sciences", jambCutoff: 235, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"], competitiveness: "MODERATE", acceptanceRate: 11, totalSlots: 150 },
      { name: "Law", faculty: "Faculty of Law", jambCutoff: 260, requiredSubjects: ["USE_OF_ENGLISH", "LITERATURE", "GOVERNMENT", "ECONOMICS"], competitiveness: "HIGH", acceptanceRate: 8, totalSlots: 200 },
      { name: "Accounting", faculty: "Faculty of Management Sciences", jambCutoff: 230, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "ECONOMICS", "ACCOUNTING"], competitiveness: "MODERATE", acceptanceRate: 14, totalSlots: 200 },
    ],
  },
  {
    name: "Lagos State University",
    shortName: "LASU",
    state: "Lagos",
    type: "STATE",
    courses: [
      { name: "Medicine and Surgery", faculty: "College of Medicine", jambCutoff: 260, requiredSubjects: ["USE_OF_ENGLISH", "PHYSICS", "CHEMISTRY", "BIOLOGY"], competitiveness: "VERY_HIGH", acceptanceRate: 5, totalSlots: 120 },
      { name: "Computer Science", faculty: "Faculty of Science", jambCutoff: 230, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"], competitiveness: "MODERATE", acceptanceRate: 10, totalSlots: 150 },
      { name: "Law", faculty: "Faculty of Law", jambCutoff: 255, requiredSubjects: ["USE_OF_ENGLISH", "LITERATURE", "GOVERNMENT", "ECONOMICS"], competitiveness: "HIGH", acceptanceRate: 7, totalSlots: 150 },
      { name: "Business Administration", faculty: "Faculty of Management Sciences", jambCutoff: 220, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "ECONOMICS", "COMMERCE"], competitiveness: "MODERATE", acceptanceRate: 13, totalSlots: 200 },
    ],
  },
  {
    name: "Covenant University",
    shortName: "CU",
    state: "Ogun",
    type: "PRIVATE",
    courses: [
      { name: "Computer Science", faculty: "College of Science & Technology", jambCutoff: 220, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"], competitiveness: "MODERATE", acceptanceRate: 20, totalSlots: 100 },
      { name: "Electrical Engineering", faculty: "College of Engineering", jambCutoff: 220, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "PHYSICS", "CHEMISTRY"], competitiveness: "MODERATE", acceptanceRate: 25, totalSlots: 80 },
      { name: "Accounting", faculty: "College of Business", jambCutoff: 210, requiredSubjects: ["USE_OF_ENGLISH", "MATHEMATICS", "ECONOMICS", "ACCOUNTING"], competitiveness: "LOW", acceptanceRate: 33, totalSlots: 120 },
      { name: "Law", faculty: "College of Leadership", jambCutoff: 230, requiredSubjects: ["USE_OF_ENGLISH", "LITERATURE", "GOVERNMENT", "ECONOMICS"], competitiveness: "MODERATE", acceptanceRate: 17, totalSlots: 80 },
    ],
  },
];

async function main() {
  for (const uni of UNIVERSITIES) {
    const { courses, ...uniData } = uni;

    const created = await db.university.upsert({
      where: { shortName: uniData.shortName },
      update: {
        name: uniData.name,
        state: uniData.state,
        type: uniData.type as any,
      },
      create: {
        name: uniData.name,
        shortName: uniData.shortName,
        state: uniData.state,
        type: uniData.type as any,
      },
    });

    for (const course of courses) {
      await db.course.upsert({
        where: {
          universityId_name: {
            universityId: created.id,
            name: course.name,
          },
        },
        update: {
          faculty: course.faculty,
          jambCutoff: course.jambCutoff,
          requiredSubjects: course.requiredSubjects as any,
          competitiveness: course.competitiveness as any,
          acceptanceRate: course.acceptanceRate,
          totalSlots: course.totalSlots,
        },
        create: {
          universityId: created.id,
          name: course.name,
          faculty: course.faculty,
          jambCutoff: course.jambCutoff,
          requiredSubjects: course.requiredSubjects as any,
          competitiveness: course.competitiveness as any,
          acceptanceRate: course.acceptanceRate,
          totalSlots: course.totalSlots,
        },
      });
    }
  }

  const uniCount = await db.university.count();
  const courseCount = await db.course.count();
  console.log(`Seeded ${uniCount} universities with ${courseCount} courses`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());