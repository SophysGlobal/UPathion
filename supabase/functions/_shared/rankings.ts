// Curated US News-aligned rankings (National Universities + National Liberal Arts Colleges).
// Used as the primary source for `national_ranking`. Schools not in this list fall back to
// a selectivity tier computed from acceptance/graduation rate. We never fabricate a rank.
//
// Keys are lowercase, punctuation-stripped school names for tolerant matching.

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const RAW_RANKINGS: Array<[string, number]> = [
  // National Universities (top 75)
  ["princeton university", 1],
  ["massachusetts institute of technology", 2],
  ["harvard university", 3],
  ["stanford university", 3],
  ["yale university", 5],
  ["california institute of technology", 6],
  ["duke university", 6],
  ["johns hopkins university", 6],
  ["northwestern university", 6],
  ["university of pennsylvania", 6],
  ["cornell university", 11],
  ["university of chicago", 11],
  ["brown university", 13],
  ["columbia university", 13],
  ["dartmouth college", 15],
  ["university of california los angeles", 15],
  ["ucla", 15],
  ["university of california berkeley", 17],
  ["uc berkeley", 17],
  ["rice university", 18],
  ["university of notre dame", 18],
  ["vanderbilt university", 18],
  ["carnegie mellon university", 21],
  ["university of michigan ann arbor", 21],
  ["university of michigan", 21],
  ["washington university in st louis", 21],
  ["emory university", 24],
  ["georgetown university", 24],
  ["university of virginia", 24],
  ["university of north carolina at chapel hill", 27],
  ["university of southern california", 28],
  ["new york university", 30],
  ["nyu", 30],
  ["university of california san diego", 30],
  ["uc san diego", 30],
  ["university of florida", 30],
  ["university of texas at austin", 30],
  ["georgia institute of technology", 35],
  ["university of california davis", 35],
  ["uc davis", 35],
  ["university of california santa barbara", 35],
  ["uc santa barbara", 35],
  ["university of illinois urbana champaign", 35],
  ["boston college", 40],
  ["university of california irvine", 40],
  ["uc irvine", 40],
  ["university of wisconsin madison", 40],
  ["rutgers university new brunswick", 43],
  ["tufts university", 43],
  ["university of washington", 43],
  ["boston university", 46],
  ["ohio state university", 46],
  ["the ohio state university", 46],
  ["purdue university", 46],
  ["university of maryland college park", 46],
  ["lehigh university", 50],
  ["texas a m university", 50],
  ["university of georgia", 50],
  ["university of rochester", 50],
  ["case western reserve university", 54],
  ["university of minnesota twin cities", 54],
  ["villanova university", 54],
  ["florida state university", 57],
  ["university of california santa cruz", 57],
  ["william & mary", 57],
  ["college of william and mary", 57],
  ["brandeis university", 60],
  ["george washington university", 60],
  ["michigan state university", 60],
  ["north carolina state university", 60],
  ["santa clara university", 60],
  ["syracuse university", 60],
  ["university of connecticut", 60],
  ["university of pittsburgh", 67],
  ["pennsylvania state university", 68],
  ["penn state university", 68],
  ["university of miami", 68],
  ["university of utah", 68],
  ["yeshiva university", 68],
  ["pepperdine university", 73],
  ["stevens institute of technology", 73],
  ["university of massachusetts amherst", 73],
  ["virginia tech", 73],
  ["binghamton university", 77],
  ["george mason university", 77],
  ["indiana university bloomington", 77],
  ["university at buffalo", 77],
  ["worcester polytechnic institute", 77],

  // National Liberal Arts Colleges (top 50, offset to coexist; we keep one ordered list)
  ["williams college", 1],
  ["amherst college", 2],
  ["swarthmore college", 3],
  ["pomona college", 4],
  ["wellesley college", 4],
  ["bowdoin college", 6],
  ["united states naval academy", 6],
  ["claremont mckenna college", 8],
  ["united states military academy", 8],
  ["smith college", 10],
  ["united states air force academy", 10],
  ["barnard college", 12],
  ["carleton college", 12],
  ["hamilton college", 12],
  ["middlebury college", 12],
  ["washington and lee university", 12],
  ["davidson college", 17],
  ["grinnell college", 17],
  ["haverford college", 17],
  ["vassar college", 17],
  ["colby college", 21],
  ["colgate university", 21],
  ["wesleyan university", 21],
  ["bates college", 24],
  ["macalester college", 24],
  ["university of richmond", 24],
  ["bryn mawr college", 27],
  ["college of the holy cross", 27],
  ["harvey mudd college", 29],
  ["soka university of america", 29],
  ["kenyon college", 31],
  ["lafayette college", 31],
  ["occidental college", 31],
  ["college of the ozarks", 34],
  ["scripps college", 34],
  ["bucknell university", 36],
  ["mount holyoke college", 36],
  ["oberlin college", 36],
  ["pitzer college", 36],
  ["skidmore college", 36],
  ["thomas aquinas college", 36],
  ["franklin & marshall college", 42],
  ["trinity college", 42],
  ["whitman college", 42],
  ["depauw university", 45],
  ["dickinson college", 45],
  ["furman university", 45],
  ["union college", 45],
  ["denison university", 49],
  ["gettysburg college", 49],
  ["rhodes college", 49],
];

const RANK_MAP: Map<string, number> = new Map(
  RAW_RANKINGS.map(([n, r]) => [normalize(n), r]),
);

/** Returns the curated national rank for a known school, or null. */
export function lookupNationalRank(schoolName: string): number | null {
  const key = normalize(schoolName);
  if (RANK_MAP.has(key)) return RANK_MAP.get(key)!;
  // Tolerant prefix match for "University of X" / "X University" variants
  for (const [k, r] of RANK_MAP) {
    if (k.length > 12 && (k.startsWith(key) || key.startsWith(k))) return r;
  }
  return null;
}

/**
 * Selectivity tier derived from real Scorecard data. Used as a fallback when no
 * curated rank exists. Returns null when we don't have enough data to label.
 */
export function computeSelectivityTier(
  acceptanceRate: number | null, // 0-1
  graduationRate: number | null, // 0-1
): string | null {
  if (acceptanceRate == null && graduationRate == null) return null;
  const ar = acceptanceRate ?? 1;
  const gr = graduationRate ?? 0;
  if (ar <= 0.1) return "Most Selective";
  if (ar <= 0.25 && gr >= 0.8) return "Highly Selective";
  if (ar <= 0.5 && gr >= 0.6) return "Selective";
  if (ar <= 0.75) return "Moderately Selective";
  return "Open Admissions";
}