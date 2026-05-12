// Centralized list of standardized university majors used across onboarding,
// profile editing, and search. Keep alphabetized; popular subset surfaces
// first when there is no active search query.

export const ALL_MAJORS: readonly string[] = [
  // STEM
  "Computer Science",
  "Software Engineering",
  "Data Science",
  "Artificial Intelligence",
  "Cybersecurity",
  "Information Technology",
  "Information Systems",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Biomedical Engineering",
  "Industrial Engineering",
  "Materials Science & Engineering",
  "Environmental Engineering",
  "Nuclear Engineering",
  "Computer Engineering",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Applied Mathematics",
  "Statistics",
  "Biology",
  "Biochemistry",
  "Molecular Biology",
  "Microbiology",
  "Genetics",
  "Neuroscience",
  "Environmental Science",
  "Marine Biology",
  "Ecology",
  "Geology",
  "Astronomy",
  "Astrophysics",
  "Bioinformatics",
  "Biotechnology",
  "Pharmaceutical Sciences",
  // Business
  "Business Administration",
  "Finance",
  "Accounting",
  "Marketing",
  "Entrepreneurship",
  "Supply Chain Management",
  "Management Information Systems",
  "International Business",
  "Real Estate",
  "Human Resources Management",
  "Operations Management",
  "Business Analytics",
  "Hospitality Management",
  "Sports Management",
  "Risk Management & Insurance",
  "Actuarial Science",
  // Social Sciences
  "Economics",
  "Political Science",
  "Psychology",
  "Sociology",
  "Anthropology",
  "International Relations",
  "Public Policy",
  "Public Administration",
  "Criminal Justice",
  "Criminology",
  "Social Work",
  "Urban Planning",
  "Geography",
  "Gender Studies",
  "Ethnic Studies",
  "Human Development",
  // Humanities
  "Philosophy",
  "History",
  "English",
  "English Literature",
  "Comparative Literature",
  "Linguistics",
  "Religious Studies",
  "Theology",
  "Classics",
  "Art History",
  "American Studies",
  "African American Studies",
  "Asian Studies",
  "Latin American Studies",
  "Middle Eastern Studies",
  "European Studies",
  // Arts
  "Graphic Design",
  "Studio Art",
  "Film Production",
  "Film Studies",
  "Music",
  "Music Performance",
  "Music Production",
  "Theatre",
  "Dance",
  "Creative Writing",
  "Animation",
  "Photography",
  "Fashion Design",
  "Interior Design",
  "Industrial Design",
  "Architecture",
  "Landscape Architecture",
  "Game Design",
  // Communications & Media
  "Communications",
  "Journalism",
  "Public Relations",
  "Advertising",
  "Media Studies",
  "Digital Media",
  "Broadcasting",
  "Strategic Communications",
  // Health & Medical
  "Nursing",
  "Public Health",
  "Pre-Med",
  "Pre-Dental",
  "Pre-Veterinary",
  "Kinesiology",
  "Health Sciences",
  "Nutrition & Dietetics",
  "Speech-Language Pathology",
  "Occupational Therapy",
  "Physical Therapy",
  "Athletic Training",
  "Biomedical Sciences",
  "Epidemiology",
  "Health Administration",
  "Dental Hygiene",
  "Respiratory Therapy",
  "Radiologic Technology",
  "Medical Laboratory Science",
  // Education
  "Elementary Education",
  "Secondary Education",
  "Special Education",
  "Early Childhood Education",
  "Educational Leadership",
  "Curriculum & Instruction",
  "Higher Education Administration",
  "Physical Education",
  "TESOL / ESL",
  // Law & Government
  "Pre-Law",
  "Legal Studies",
  "Paralegal Studies",
  "Homeland Security",
  "Military Science",
  // Agriculture & Environment
  "Agriculture",
  "Agricultural Engineering",
  "Animal Science",
  "Food Science",
  "Forestry",
  "Environmental Policy",
  "Sustainable Development",
  "Wildlife Biology",
  "Horticulture",
  // Other
  "Undecided / Exploratory",
  "Liberal Arts",
  "Interdisciplinary Studies",
];

export const POPULAR_MAJORS: readonly string[] = [
  "Computer Science",
  "Business Administration",
  "Psychology",
  "Biology",
  "Nursing",
  "Economics",
  "Mechanical Engineering",
  "Communications",
  "Political Science",
  "Marketing",
  "Finance",
  "Pre-Med",
];

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Rank: exact (0) → starts with (1) → word-start (2) → contains (3).
 * When no query, surface POPULAR_MAJORS first, then alphabetical rest.
 */
export function searchMajors(query: string, limit = 60): string[] {
  const q = query.trim();
  if (!q) {
    const popular = POPULAR_MAJORS.filter((m) => ALL_MAJORS.includes(m));
    const rest = [...ALL_MAJORS]
      .filter((m) => !POPULAR_MAJORS.includes(m))
      .sort((a, b) => a.localeCompare(b));
    return [...popular, ...rest].slice(0, limit);
  }
  const nq = normalize(q);
  const scored = ALL_MAJORS.map((m) => {
    const nm = normalize(m);
    let rank = 4;
    if (nm === nq) rank = 0;
    else if (nm.startsWith(nq)) rank = 1;
    else if (m.toLowerCase().split(/\s+/).some((w) => w.startsWith(q.toLowerCase()))) rank = 2;
    else if (nm.includes(nq)) rank = 3;
    return { m, rank };
  })
    .filter((x) => x.rank < 4)
    .sort((a, b) => (a.rank - b.rank) || a.m.localeCompare(b.m));
  return scored.slice(0, limit).map((x) => x.m);
}