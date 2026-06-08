// ─────────────────────────────────────────────
// Football Types (football-data.org v4 API)
// ─────────────────────────────────────────────

export interface Competition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
  area: Area;
  currentSeason?: Season;
}

export interface Area {
  id: number;
  name: string;
  code: string;
  flag?: string;
}

export interface Season {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday: number;
  winner?: Team;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  address?: string;
  website?: string;
  founded?: number;
  clubColors?: string;
  venue?: string;
  squad?: Player[];
  runningCompetitions?: Competition[];
  area?: Area;
}

export interface Player {
  id: number;
  name: string;
  position: string;
  dateOfBirth: string;
  nationality: string;
  shirtNumber?: number;
}

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED"
  | "AWARDED";

export interface Score {
  winner?: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration?: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

export interface Referee {
  id: number;
  name: string;
  type: string;
  nationality: string;
}

export interface Lineup {
  id: number;
  name: string;
  position: string;
  shirtNumber: number;
}

export interface TeamLineup {
  id: number;
  name: string;
  formation?: string;
  startXI?: Lineup[];
  substitutes?: Lineup[];
  coach?: { id: number; name: string };
}

export interface MatchGoal {
  minute: number;
  injuryTime?: number;
  type: "REGULAR" | "OWN_GOAL" | "PENALTY";
  team: { id: number; name: string };
  scorer: { id: number; name: string };
  assist?: { id: number; name: string } | null;
}

export interface MatchBooking {
  minute: number;
  team: { id: number; name: string };
  player: { id: number; name: string };
  card: "YELLOW_CARD" | "YELLOW_RED_CARD" | "RED_CARD";
}

export interface MatchSubstitution {
  minute: number;
  team: { id: number; name: string };
  playerOut: { id: number; name: string };
  playerIn: { id: number; name: string };
}

export interface Match {
  id: number;
  utcDate: string;
  status: MatchStatus;
  matchday?: number;
  stage: string;
  group?: string;
  lastUpdated: string;
  minute?: number | null;
  injuryTime?: number | null;
  attendance?: number;
  venue?: string;
  competition: Competition;
  season?: Season;
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  goals?: MatchGoal[];
  bookings?: MatchBooking[];
  substitutions?: MatchSubstitution[];
  homeTeamLineup?: TeamLineup;
  awayTeamLineup?: TeamLineup;
  referees?: Referee[];
}

export interface MatchesResponse {
  filters: Record<string, string>;
  resultSet: {
    count: number;
    first: string;
    last: string;
    played: number;
  };
  matches: Match[];
}

export interface Standing {
  position: number;
  team: Team;
  playedGames: number;
  form?: string;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface StandingTable {
  stage: string;
  type: string;
  group?: string;
  table: Standing[];
}

export interface StandingsResponse {
  filters: Record<string, string>;
  area: Area;
  competition: Competition;
  season: Season;
  standings: StandingTable[];
}

export type FilterStatus = "LIVE" | "TODAY" | "FINISHED" | "UPCOMING";

export const COMPETITIONS: { code: string; name: string; flag: string }[] = [
  { code: "PL",  name: "Premier League",    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "BL1", name: "Bundesliga",        flag: "🇩🇪" },
  { code: "SA",  name: "Serie A",           flag: "🇮🇹" },
  { code: "PD",  name: "La Liga",           flag: "🇪🇸" },
  { code: "FL1", name: "Ligue 1",           flag: "🇫🇷" },
  { code: "CL",  name: "Champions League",  flag: "🇪🇺" },
  { code: "EC",  name: "European Championship", flag: "🇪🇺" },
  { code: "WC",  name: "FIFA World Cup",    flag: "🌍" },
  { code: "DED", name: "Eredivisie",        flag: "🇳🇱" },
];
