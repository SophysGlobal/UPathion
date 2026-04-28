/**
 * Shortened/common-usage display names for colleges & universities.
 * Keep this list curated — only well-known short forms.
 * Full official names are still stored in the DB; this only affects UI.
 *
 * High schools intentionally NOT shortened (per product decision).
 */
const COLLEGE_SHORT_NAMES: Record<string, string> = {
  "university of massachusetts amherst": "UMass Amherst",
  "university of massachusetts boston": "UMass Boston",
  "university of massachusetts lowell": "UMass Lowell",
  "university of massachusetts dartmouth": "UMass Dartmouth",
  "university of california los angeles": "UCLA",
  "university of california, los angeles": "UCLA",
  "university of california berkeley": "UC Berkeley",
  "university of california, berkeley": "UC Berkeley",
  "university of california san diego": "UC San Diego",
  "university of california, san diego": "UC San Diego",
  "university of california davis": "UC Davis",
  "university of california, davis": "UC Davis",
  "university of california irvine": "UC Irvine",
  "university of california, irvine": "UC Irvine",
  "university of california santa barbara": "UC Santa Barbara",
  "university of california, santa barbara": "UC Santa Barbara",
  "university of california santa cruz": "UC Santa Cruz",
  "university of california, santa cruz": "UC Santa Cruz",
  "university of california riverside": "UC Riverside",
  "university of california, riverside": "UC Riverside",
  "university of california merced": "UC Merced",
  "university of california, merced": "UC Merced",
  "new york university": "NYU",
  "massachusetts institute of technology": "MIT",
  "california institute of technology": "Caltech",
  "georgia institute of technology": "Georgia Tech",
  "virginia polytechnic institute and state university": "Virginia Tech",
  "university of southern california": "USC",
  "university of pennsylvania": "Penn",
  "university of north carolina at chapel hill": "UNC Chapel Hill",
  "university of north carolina chapel hill": "UNC Chapel Hill",
  "university of texas at austin": "UT Austin",
  "university of texas austin": "UT Austin",
  "university of illinois urbana-champaign": "UIUC",
  "university of illinois at urbana-champaign": "UIUC",
  "university of michigan": "Michigan",
  "university of michigan ann arbor": "Michigan",
  "university of michigan-ann arbor": "Michigan",
  "university of wisconsin-madison": "UW–Madison",
  "university of wisconsin madison": "UW–Madison",
  "university of washington": "UW",
  "university of washington seattle": "UW",
  "pennsylvania state university": "Penn State",
  "the pennsylvania state university": "Penn State",
  "ohio state university": "Ohio State",
  "the ohio state university": "Ohio State",
  "louisiana state university": "LSU",
  "florida state university": "FSU",
  "brigham young university": "BYU",
  "rensselaer polytechnic institute": "RPI",
  "worcester polytechnic institute": "WPI",
  "rhode island school of design": "RISD",
  "school of the art institute of chicago": "SAIC",
  "carnegie mellon university": "Carnegie Mellon",
  "johns hopkins university": "Johns Hopkins",
  "northeastern university": "Northeastern",
  "boston university": "BU",
  "boston college": "BC",
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\bthe\b /g, "")
    .trim();

/**
 * Returns the commonly-recognized short display name for a college/university,
 * or the original name if no short form is registered. High schools (and any
 * other non-college string) pass through untouched.
 *
 * Pass `schoolType` when known so we never accidentally shorten high schools.
 */
export function getDisplaySchoolName(
  fullName: string | null | undefined,
  schoolType?: string | null,
): string {
  if (!fullName) return "";
  if (schoolType && schoolType !== "college") return fullName;
  const key = normalize(fullName);
  return COLLEGE_SHORT_NAMES[key] ?? fullName;
}