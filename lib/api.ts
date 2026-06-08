// ─────────────────────────────────────────────
// Football Data API Client (football-data.org v4)
// ─────────────────────────────────────────────
import type {
  Match,
  MatchesResponse,
  StandingsResponse,
  Standing,
  Competition,
  Team,
} from "@/types/football";

const BASE_URL = process.env.FOOTBALL_API_BASE || "https://api.football-data.org/v4";
const API_KEY  = process.env.FOOTBALL_API_KEY || "";

function headers() {
  return {
    "X-Auth-Token": API_KEY,
    "Content-Type": "application/json",
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Skip the real API call if no key is configured — use mock data instead
  if (!API_KEY || API_KEY === "your_football_data_api_key_here") {
    throw new Error("NO_API_KEY");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: headers(),
    next: { revalidate: 60 }, // Cache 60s server-side
  });

  if (!res.ok) {
    // 400/401/403 all indicate auth or request issues — fall back to mock data
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new Error("INVALID_API_KEY");
    }
    if (res.status === 429) {
      throw new Error("RATE_LIMITED");
    }
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// Helper to handle API fetch errors cleanly without dumping scary stack traces in dev console
function handleApiError(context: string, error: unknown) {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (errMsg === "NO_API_KEY" || errMsg === "INVALID_API_KEY") {
    // Only log a clean warning on mock data fallback
    console.warn(`[Football API fallback] ${context}: Using mock data (API key missing or invalid).`);
  } else {
    console.error(`${context}:`, error);
  }
}

// ── Matches ────────────────────────────────────

export async function getLiveMatches(): Promise<Match[]> {
  try {
    const data = await apiFetch<MatchesResponse>("/matches?status=IN_PLAY,PAUSED");
    return data.matches;
  } catch (e) {
    handleApiError("getLiveMatches", e);
    return getMockMatches("IN_PLAY");
  }
}

export async function getTodayMatches(): Promise<Match[]> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const data = await apiFetch<MatchesResponse>(`/matches?dateFrom=${today}&dateTo=${today}`);
    return data.matches;
  } catch (e) {
    handleApiError("getTodayMatches", e);
    return getMockTodayMatches();
  }
}

export async function getMatchesByStatus(status: string): Promise<Match[]> {
  try {
    const data = await apiFetch<MatchesResponse>(`/matches?status=${status}`);
    return data.matches;
  } catch (e) {
    handleApiError("getMatchesByStatus", e);
    return getMockMatches(status);
  }
}

export async function getMatchById(id: string): Promise<Match | null> {
  try {
    return await apiFetch<Match>(`/matches/${id}`);
  } catch (e) {
    handleApiError("getMatchById", e);
    return getMockMatchDetail(id);
  }
}

export async function getCompetitionMatches(code: string, status?: string): Promise<Match[]> {
  try {
    const qs = status ? `?status=${status}` : "";
    const data = await apiFetch<MatchesResponse>(`/competitions/${code}/matches${qs}`);
    return data.matches;
  } catch (e) {
    handleApiError("getCompetitionMatches", e);
    return getMockMatches("SCHEDULED");
  }
}

export async function getUpcomingMatches(): Promise<Match[]> {
  try {
    const today = new Date();
    const in7 = new Date(today);
    in7.setDate(today.getDate() + 7);
    const from = today.toISOString().split("T")[0];
    const to   = in7.toISOString().split("T")[0];
    const data = await apiFetch<MatchesResponse>(`/matches?status=SCHEDULED,TIMED&dateFrom=${from}&dateTo=${to}`);
    return data.matches.slice(0, 20);
  } catch (e) {
    handleApiError("getUpcomingMatches", e);
    return getMockMatches("SCHEDULED");
  }
}

// ── Standings ─────────────────────────────────

export async function getStandings(code: string): Promise<StandingsResponse | null> {
  try {
    return await apiFetch<StandingsResponse>(`/competitions/${code}/standings`);
  } catch (e) {
    handleApiError("getStandings", e);
    return getMockStandings(code);
  }
}

// ── Competitions ──────────────────────────────

export async function getCompetitions(): Promise<Competition[]> {
  try {
    const data = await apiFetch<{ competitions: Competition[] }>("/competitions");
    return data.competitions;
  } catch (e) {
    handleApiError("getCompetitions", e);
    return [];
  }
}

export async function getTeam(id: string): Promise<Team | null> {
  try {
    return await apiFetch<Team>(`/teams/${id}`);
  } catch (e) {
    handleApiError("getTeam", e);
    return null;
  }
}

// ── Mock Data (fallback when no API key) ────────

function makeMockTeam(id: number, name: string, tla: string): import("@/types/football").Team {
  return {
    id,
    name,
    shortName: tla,
    tla,
    crest: `https://crests.football-data.org/${id}.png`,
  };
}


// ── World Cup 2026 Mock Datasets ───────────────────
const WC2026_GROUPS = [
  { group: "Group A", teams: [
    { name: "United States", tla: "USA", crest: "https://crests.football-data.org/764.png", w: 2, d: 1, l: 0, gf: 5, ga: 2, pts: 7 },
    { name: "Mexico", tla: "MEX", crest: "https://crests.football-data.org/762.png", w: 2, d: 0, l: 1, gf: 4, ga: 3, pts: 6 },
    { name: "Sweden", tla: "SWE", crest: "https://crests.football-data.org/798.png", w: 1, d: 1, l: 1, gf: 3, ga: 3, pts: 4 },
    { name: "New Zealand", tla: "NZL", crest: "https://crests.football-data.org/11832.png", w: 0, d: 0, l: 3, gf: 1, ga: 5, pts: 0 }
  ]},
  { group: "Group B", teams: [
    { name: "Canada", tla: "CAN", crest: "https://crests.football-data.org/766.png", w: 2, d: 1, l: 0, gf: 6, ga: 2, pts: 7 },
    { name: "Argentina", tla: "ARG", crest: "https://crests.football-data.org/762.png", w: 2, d: 0, l: 1, gf: 5, ga: 2, pts: 6 },
    { name: "Nigeria", tla: "NGA", crest: "https://crests.football-data.org/778.png", w: 1, d: 1, l: 1, gf: 3, ga: 4, pts: 4 },
    { name: "Saudi Arabia", tla: "KSA", crest: "https://crests.football-data.org/801.png", w: 0, d: 0, l: 3, gf: 1, ga: 7, pts: 0 }
  ]},
  { group: "Group C", teams: [
    { name: "France", tla: "FRA", crest: "https://crests.football-data.org/773.png", w: 3, d: 0, l: 0, gf: 8, ga: 1, pts: 9 },
    { name: "Australia", tla: "AUS", crest: "https://crests.football-data.org/779.png", w: 1, d: 1, l: 1, gf: 3, ga: 4, pts: 4 },
    { name: "South Korea", tla: "KOR", crest: "https://crests.football-data.org/775.png", w: 1, d: 0, l: 2, gf: 3, ga: 5, pts: 3 },
    { name: "Honduras", tla: "HON", crest: "https://crests.football-data.org/1811.png", w: 0, d: 1, l: 2, gf: 2, ga: 6, pts: 1 }
  ]},
  { group: "Group D", teams: [
    { name: "England", tla: "ENG", crest: "https://crests.football-data.org/768.png", w: 2, d: 1, l: 0, gf: 6, ga: 2, pts: 7 },
    { name: "Ecuador", tla: "ECU", crest: "https://crests.football-data.org/761.png", w: 2, d: 0, l: 1, gf: 4, ga: 3, pts: 6 },
    { name: "Denmark", tla: "DEN", crest: "https://crests.football-data.org/782.png", w: 1, d: 1, l: 1, gf: 3, ga: 3, pts: 4 },
    { name: "Angola", tla: "ANG", crest: "https://crests.football-data.org/11831.png", w: 0, d: 0, l: 3, gf: 1, ga: 6, pts: 0 }
  ]},
  { group: "Group E", teams: [
    { name: "Brazil", tla: "BRA", crest: "https://crests.football-data.org/760.png", w: 2, d: 1, l: 0, gf: 7, ga: 2, pts: 7 },
    { name: "Japan", tla: "JPN", crest: "https://crests.football-data.org/776.png", w: 2, d: 0, l: 1, gf: 5, ga: 4, pts: 6 },
    { name: "Turkey", tla: "TUR", crest: "https://crests.football-data.org/803.png", w: 1, d: 1, l: 1, gf: 3, ga: 4, pts: 4 },
    { name: "Cameroon", tla: "CMR", crest: "https://crests.football-data.org/777.png", w: 0, d: 0, l: 3, gf: 2, ga: 7, pts: 0 }
  ]},
  { group: "Group F", teams: [
    { name: "Belgium", tla: "BEL", crest: "https://crests.football-data.org/780.png", w: 2, d: 1, l: 0, gf: 5, ga: 2, pts: 7 },
    { name: "Morocco", tla: "MAR", crest: "https://crests.football-data.org/781.png", w: 2, d: 0, l: 1, gf: 4, ga: 3, pts: 6 },
    { name: "Colombia", tla: "COL", crest: "https://crests.football-data.org/767.png", w: 1, d: 1, l: 1, gf: 3, ga: 3, pts: 4 },
    { name: "Jamaica", tla: "JAM", crest: "https://crests.football-data.org/11830.png", w: 0, d: 0, l: 3, gf: 1, ga: 5, pts: 0 }
  ]},
  { group: "Group G", teams: [
    { name: "Spain", tla: "ESP", crest: "https://crests.football-data.org/760.png", w: 2, d: 1, l: 0, gf: 6, ga: 2, pts: 7 },
    { name: "Switzerland", tla: "SUI", crest: "https://crests.football-data.org/784.png", w: 2, d: 0, l: 1, gf: 4, ga: 3, pts: 6 },
    { name: "Ghana", tla: "GHA", crest: "https://crests.football-data.org/785.png", w: 1, d: 1, l: 1, gf: 3, ga: 3, pts: 4 },
    { name: "China", tla: "CHN", crest: "https://crests.football-data.org/805.png", w: 0, d: 0, l: 3, gf: 1, ga: 6, pts: 0 }
  ]},
  { group: "Group H", teams: [
    { name: "Portugal", tla: "POR", crest: "https://crests.football-data.org/765.png", w: 3, d: 0, l: 0, gf: 8, ga: 2, pts: 9 },
    { name: "Uruguay", tla: "URU", crest: "https://crests.football-data.org/763.png", w: 1, d: 1, l: 1, gf: 4, ga: 4, pts: 4 },
    { name: "Egypt", tla: "EGY", crest: "https://crests.football-data.org/786.png", w: 1, d: 0, l: 2, gf: 3, ga: 5, pts: 3 },
    { name: "Iraq", tla: "IRQ", crest: "https://crests.football-data.org/808.png", w: 0, d: 1, l: 2, gf: 2, ga: 6, pts: 1 }
  ]},
  { group: "Group I", teams: [
    { name: "Germany", tla: "GER", crest: "https://crests.football-data.org/759.png", w: 2, d: 1, l: 0, gf: 6, ga: 2, pts: 7 },
    { name: "Poland", tla: "POL", crest: "https://crests.football-data.org/794.png", w: 1, d: 2, l: 0, gf: 4, ga: 3, pts: 5 },
    { name: "Algeria", tla: "ALG", crest: "https://crests.football-data.org/787.png", w: 1, d: 0, l: 2, gf: 3, ga: 5, pts: 3 },
    { name: "Peru", tla: "PER", crest: "https://crests.football-data.org/765.png", w: 0, d: 1, l: 2, gf: 2, ga: 5, pts: 1 }
  ]},
  { group: "Group J", teams: [
    { name: "Netherlands", tla: "NED", crest: "https://crests.football-data.org/794.png", w: 2, d: 1, l: 0, gf: 5, ga: 2, pts: 7 },
    { name: "Croatia", tla: "CRO", crest: "https://crests.football-data.org/799.png", w: 2, d: 0, l: 1, gf: 4, ga: 3, pts: 6 },
    { name: "Senegal", tla: "SEN", crest: "https://crests.football-data.org/788.png", w: 1, d: 1, l: 1, gf: 3, ga: 3, pts: 4 },
    { name: "Costa Rica", tla: "CRC", crest: "https://crests.football-data.org/769.png", w: 0, d: 0, l: 3, gf: 1, ga: 5, pts: 0 }
  ]},
  { group: "Group K", teams: [
    { name: "Italy", tla: "ITA", crest: "https://crests.football-data.org/784.png", w: 2, d: 1, l: 0, gf: 5, ga: 2, pts: 7 },
    { name: "Austria", tla: "AUT", crest: "https://crests.football-data.org/792.png", w: 1, d: 2, l: 0, gf: 3, ga: 2, pts: 5 },
    { name: "Chile", tla: "CHI", crest: "https://crests.football-data.org/764.png", w: 1, d: 0, l: 2, gf: 3, ga: 4, pts: 3 },
    { name: "Tunisia", tla: "TUN", crest: "https://crests.football-data.org/789.png", w: 0, d: 1, l: 2, gf: 2, ga: 5, pts: 1 }
  ]},
  { group: "Group L", teams: [
    { name: "Denmark", tla: "DEN", crest: "https://crests.football-data.org/782.png", w: 2, d: 1, l: 0, gf: 5, ga: 2, pts: 7 },
    { name: "Ukraine", tla: "UKR", crest: "https://crests.football-data.org/795.png", w: 2, d: 0, l: 1, gf: 4, ga: 3, pts: 6 },
    { name: "Panama", tla: "PAN", crest: "https://crests.football-data.org/1812.png", w: 1, d: 1, l: 1, gf: 3, ga: 3, pts: 4 },
    { name: "Iran", tla: "IRN", crest: "https://crests.football-data.org/807.png", w: 0, d: 0, l: 3, gf: 1, ga: 5, pts: 0 }
  ]}
];

const MOCK_FIXTURES: Match[] = [
  // Official FIFA World Cup 2026 opening matches
  {
    id: 202601,
    status: "SCHEDULED",
    utcDate: "2026-06-11T19:00:00Z", // June 11, 19:00 UTC (June 12, 01:00 AM BD)
    homeTeam: makeMockTeam(762, "Mexico", "MEX"),
    awayTeam: makeMockTeam(9901, "South Africa", "RSA"),
    score: { fullTime: { home: null, away: null }, halfTime: { home: null, away: null } },
    competition: { id: 2000, name: "FIFA World Cup 2026", code: "WC", type: "CUP", emblem: "", area: { id: 2000, name: "North America", code: "NA" } },
    stage: "GROUP_STAGE",
    lastUpdated: "2026-06-08T00:00:00Z",
    venue: "Estadio Azteca, Mexico City"
  },
  {
    id: 202602,
    status: "SCHEDULED",
    utcDate: "2026-06-12T19:00:00Z", // June 12, 19:00 UTC (June 13, 01:00 AM BD)
    homeTeam: makeMockTeam(766, "Canada", "CAN"),
    awayTeam: makeMockTeam(9902, "Bosnia & Herzegovina", "BIH"),
    score: { fullTime: { home: null, away: null }, halfTime: { home: null, away: null } },
    competition: { id: 2000, name: "FIFA World Cup 2026", code: "WC", type: "CUP", emblem: "", area: { id: 2000, name: "North America", code: "NA" } },
    stage: "GROUP_STAGE",
    lastUpdated: "2026-06-08T00:00:00Z",
    venue: "BMO Field, Toronto"
  },
  {
    id: 202603,
    status: "SCHEDULED",
    utcDate: "2026-06-13T01:00:00Z", // June 12, 18:00 PT (June 13, 07:00 AM BD)
    homeTeam: makeMockTeam(764, "United States", "USA"),
    awayTeam: makeMockTeam(9903, "Paraguay", "PAR"),
    score: { fullTime: { home: null, away: null }, halfTime: { home: null, away: null } },
    competition: { id: 2000, name: "FIFA World Cup 2026", code: "WC", type: "CUP", emblem: "", area: { id: 2000, name: "North America", code: "NA" } },
    stage: "GROUP_STAGE",
    lastUpdated: "2026-06-08T00:00:00Z",
    venue: "SoFi Stadium, Los Angeles"
  },
  // Friendly / Live matches happening today (June 8, 2026) for testing live UI components
  {
    id: 202604,
    status: "IN_PLAY",
    utcDate: new Date(Date.now() - 35 * 60000).toISOString(),
    homeTeam: makeMockTeam(773, "France", "FRA"),
    awayTeam: makeMockTeam(768, "England", "ENG"),
    score: { fullTime: { home: null, away: null }, halfTime: { home: null, away: null } },
    competition: { id: 2001, name: "International Friendlies", code: "FRIENDLY", type: "CUP", emblem: "", area: { id: 2000, name: "Europe", code: "EU" } },
    stage: "FRIENDLY",
    minute: 35,
    lastUpdated: new Date().toISOString(),
    venue: "Stade de France, Paris"
  },
  {
    id: 202605,
    status: "IN_PLAY",
    utcDate: new Date(Date.now() - 70 * 60000).toISOString(),
    homeTeam: makeMockTeam(760, "Brazil", "BRA"),
    awayTeam: makeMockTeam(765, "Portugal", "POR"),
    score: { fullTime: { home: null, away: null }, halfTime: { home: null, away: null } },
    competition: { id: 2001, name: "International Friendlies", code: "FRIENDLY", type: "CUP", emblem: "", area: { id: 2000, name: "South America", code: "SA" } },
    stage: "FRIENDLY",
    minute: 70,
    lastUpdated: new Date().toISOString(),
    venue: "Maracanã, Rio de Janeiro"
  },
  // Finished matches ( La Liga )
  {
    id: 202606,
    status: "FINISHED",
    utcDate: new Date(Date.now() - 24 * 3600000).toISOString(),
    homeTeam: makeMockTeam(86, "Real Madrid", "RMA"),
    awayTeam: makeMockTeam(81, "Barcelona", "BAR"),
    score: { fullTime: { home: 3, away: 2 }, halfTime: { home: 1, away: 1 } },
    competition: { id: 2014, name: "La Liga", code: "PD", type: "LEAGUE", emblem: "", area: { id: 2224, name: "Spain", code: "ESP" } },
    stage: "REGULAR_SEASON",
    lastUpdated: new Date().toISOString(),
    venue: "Santiago Bernabéu, Madrid"
  }
];

export function getMockMatches(status: string): Match[] {
  const statuses = status.split(",");
  return MOCK_FIXTURES.filter(m => statuses.includes(m.status));
}

export function getMockMatchDetail(id: string): Match {
  const match = MOCK_FIXTURES.find(m => String(m.id) === id) || MOCK_FIXTURES[0];
  const hasStarted = match.status === "FINISHED" || match.status === "IN_PLAY" || match.status === "PAUSED";
  return {
    ...match,
    goals: hasStarted ? [
      { minute: 14, type: "REGULAR", team: { id: match.homeTeam.id, name: match.homeTeam.name }, scorer: { id: 9910, name: "Player A" } },
      { minute: 42, type: "REGULAR", team: { id: match.awayTeam.id, name: match.awayTeam.name }, scorer: { id: 9911, name: "Player B" } }
    ] : [],
    bookings: [],
    referees: [{ id: 888, name: "Piero Maza", type: "REFEREE", nationality: "Chile" }]
  };
}

export function getMockTodayMatches(): Match[] {
  const todayStr = new Date().toDateString();
  return MOCK_FIXTURES.filter(m => new Date(m.utcDate).toDateString() === todayStr);
}

function getMockStandings(code: string): StandingsResponse {
  // If request is WC, generate the full 12 group stages tables
  if (code === "WC") {
    const standingsTables = WC2026_GROUPS.map((g) => {
      const table: Standing[] = g.teams.map((t, idx) => ({
        position: idx + 1,
        team: {
          id: idx + 100,
          name: t.name,
          shortName: t.name,
          tla: t.tla,
          crest: t.crest
        },
        playedGames: t.w + t.d + t.l,
        won: t.w,
        draw: t.d,
        lost: t.l,
        points: t.pts,
        goalsFor: t.gf,
        goalsAgainst: t.ga,
        goalDifference: t.gf - t.ga,
      }));

      return {
        stage: "GROUP_STAGE",
        type: "TOTAL",
        group: g.group,
        table
      };
    });

    return {
      filters: {},
      area: { id: 2000, name: "North America", code: "NA" },
      competition: { id: 2000, name: "FIFA World Cup 2026", code: "WC", type: "CUP", emblem: "", area: { id: 2000, name: "North America", code: "NA" } },
      season: { id: 2026, startDate: "2026-06-11", endDate: "2026-07-19", currentMatchday: 1 },
      standings: standingsTables,
    };
  }

  // Fallback for standard league (PL)
  const teams = [
    { id: 64, name: "Liverpool",        tla: "LIV", pts: 82, w: 26, d: 4, l: 7, gf: 79, ga: 38 },
    { id: 65, name: "Manchester City",  tla: "MCI", pts: 77, w: 24, d: 5, l: 8, gf: 70, ga: 41 },
    { id: 61, name: "Chelsea",          tla: "CHE", pts: 69, w: 21, d: 6, l: 10, gf: 65, ga: 45 },
    { id: 66, name: "Manchester United",tla: "MUN", pts: 63, w: 19, d: 6, l: 12, gf: 58, ga: 50 },
    { id: 57, name: "Arsenal",          tla: "ARS", pts: 60, w: 18, d: 6, l: 13, gf: 65, ga: 48 },
    { id: 73, name: "Tottenham",        tla: "TOT", pts: 57, w: 17, d: 6, l: 14, gf: 62, ga: 56 },
  ];

  const table: Standing[] = teams.map((t, i) => ({
    position: i + 1,
    team: { id: t.id, name: t.name, shortName: t.name, tla: t.tla, crest: `https://crests.football-data.org/${t.id}.png` },
    playedGames: t.w + t.d + t.l,
    won: t.w,
    draw: t.d,
    lost: t.l,
    points: t.pts,
    goalsFor: t.gf,
    goalsAgainst: t.ga,
    goalDifference: t.gf - t.ga,
  }));

  return {
    filters: {},
    area: { id: 2072, name: "England", code: "ENG" },
    competition: { id: 2021, name: "Premier League", code: "PL", type: "LEAGUE", emblem: "", area: { id: 2072, name: "England", code: "ENG" } },
    season: { id: 1563, startDate: "2024-08-16", endDate: "2025-05-25", currentMatchday: 38 },
    standings: [{ stage: "REGULAR_SEASON", type: "TOTAL", table }],
  };
}


