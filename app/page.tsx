import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Activity, Tv, Trophy, Globe, Zap } from "lucide-react";
import HeroBanner from "@/components/home/HeroBanner";
import MatchCard from "@/components/matches/MatchCard";
import ChannelCard from "@/components/channels/ChannelCard";
import WorldCupGroups from "@/components/home/WorldCupGroups";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { getLiveMatches, getUpcomingMatches } from "@/lib/api";
import { loadChannels } from "@/lib/channels";
import type { Channel } from "@/types/channel";

export const revalidate = 60;

/* ── Section heading ── */
function SectionHeading({
  icon: Icon,
  label,
  href,
  linkLabel,
  accent = "cyan",
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  linkLabel: string;
  accent?: "cyan" | "yellow" | "magenta";
}) {
  const accentColor = {
    cyan:    { text: "text-[#00f0ff]", bg: "bg-[#00f0ff]", dim: "text-[#00f0ff]/50" },
    yellow:  { text: "text-[#fcee0a]", bg: "bg-[#fcee0a]", dim: "text-[#fcee0a]/50" },
    magenta: { text: "text-[#ff0055]", bg: "bg-[#ff0055]", dim: "text-[#ff0055]/50" },
  }[accent];

  return (
    <div className="flex items-center justify-between mb-5 px-1">
      <div className="flex items-center gap-3">
        <div className={`w-0.5 h-5 ${accentColor.bg}`} aria-hidden="true" />
        <Icon className={`w-4 h-4 ${accentColor.dim}`} aria-hidden="true" />
        <h2 className="font-cyber font-black text-base sm:text-lg uppercase tracking-widest text-white">
          {label}
        </h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-white/35 text-[10px] font-cyber font-bold uppercase tracking-widest hover:text-white transition-colors"
        aria-label={`${linkLabel} - see all`}
      >
        {linkLabel}
        <ChevronRight className="w-3 h-3" aria-hidden="true" />
      </Link>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ icon: Icon, text, sub }: { icon: React.ElementType; text: string; sub: string }) {
  return (
    <div className="border border-[#00f0ff]/10 bg-[#09090d] p-12 text-center">
      <Icon className="w-8 h-8 text-white/15 mx-auto mb-3" aria-hidden="true" />
      <p className="text-white/35 text-sm font-cyber font-bold uppercase tracking-wider">{text}</p>
      <p className="text-white/20 text-xs mt-2 font-mono">{sub}</p>
    </div>
  );
}

/* ── Live Matches ── */
async function LiveMatchesSection() {
  const matches = await getLiveMatches();
  const display = matches.slice(0, 8);

  return (
    <section aria-labelledby="live-matches-heading" className="py-6 border-b border-[#00f0ff]/8">
      <SectionHeading
        icon={Activity}
        label="Live Fixtures"
        href="/matches"
        linkLabel="View All"
        accent="magenta"
      />
      {display.length === 0 ? (
        <EmptyState
          icon={Activity}
          text="No live fixtures right now"
          sub="Check back later or view upcoming match schedules"
        />
      ) : (
        <div
          role="list"
          aria-label="Live fixtures"
          className="flex gap-3 sm:gap-5 overflow-x-auto pt-2 pb-6 px-4 sm:px-8 md:px-16 -mx-4 sm:-mx-8 md:-mx-16 hide-scrollbar"
        >
          {display.map((match) => (
            <div key={match.id} role="listitem" className="w-[260px] sm:w-[300px] md:w-[330px] shrink-0">
              <MatchCard match={match} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Live Channels ── */
async function LiveChannelsSection() {
  const channelsData = await loadChannels();
  const channels = channelsData.filter((c) => c.isLive || c.featured);

  return (
    <section aria-labelledby="live-channels-heading" className="py-6 border-b border-[#00f0ff]/8">
      <SectionHeading
        icon={Tv}
        label="Live IPTV Channels"
        href="/watch"
        linkLabel="All Channels"
        accent="cyan"
      />
      {channels.length === 0 ? (
        <EmptyState
          icon={Tv}
          text="No live channels configured"
          sub="Add IPTV channels from the admin panel"
        />
      ) : (
        <div
          role="list"
          aria-label="Live IPTV channels"
          className="flex gap-3 sm:gap-5 overflow-x-auto pt-2 pb-6 px-4 sm:px-8 md:px-16 -mx-4 sm:-mx-8 md:-mx-16 hide-scrollbar"
        >
          {channels.slice(0, 8).map((ch, i) => (
            <div key={ch.id} role="listitem" className="w-[240px] sm:w-[260px] md:w-[280px] shrink-0">
              <ChannelCard channel={ch} index={i} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Upcoming Matches ── */
async function UpcomingMatchesSection() {
  const matches = await getUpcomingMatches();
  const display = matches.slice(0, 8);

  return (
    <section aria-labelledby="upcoming-matches-heading" className="py-6">
      <SectionHeading
        icon={Globe}
        label="Upcoming Fixtures"
        href="/matches"
        linkLabel="Full Schedule"
        accent="yellow"
      />
      <div
        role="list"
        aria-label="Upcoming fixtures"
        className="flex gap-3 sm:gap-5 overflow-x-auto pt-2 pb-6 px-4 sm:px-8 md:px-16 -mx-4 sm:-mx-8 md:-mx-16 hide-scrollbar"
      >
        {display.map((match, i) => (
          <div key={match.id} role="listitem" className="w-[260px] sm:w-[300px] md:w-[330px] shrink-0">
            <MatchCard match={match} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── HOME PAGE ── */
export default function HomePage() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 md:px-16 pt-14 pb-28">

      {/* Hero with embedded IPTV player */}
      <div className="mb-8 sm:mb-12">
        <HeroBanner />
      </div>

      {/* Quick nav pills */}
      <nav
        aria-label="Quick navigation"
        className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-3 mb-8 sm:mb-10 hide-scrollbar"
      >
        {[
          { href: "/matches",   icon: Activity, label: "Live Matches",  accent: "#ff0055" },
          { href: "/watch",     icon: Tv,       label: "Watch IPTV",   accent: "#00f0ff" },
          { href: "/standings", icon: Trophy,   label: "Standings",    accent: "#fcee0a" },
          { href: "/schedule",  icon: Globe,    label: "Schedule",     accent: "#39ff14" },
        ].map(({ href, icon: Icon, label, accent }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className="group shrink-0 transition-all hover:-translate-y-[2px]"
            style={{
              clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
            }}
          >
            {/* Outer border wrapper */}
            <div
              className="p-[1px] bg-[#00f0ff]/20 group-hover:bg-[#fcee0a]/50 transition-colors h-full"
              style={{
                clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
              }}
            >
              {/* Inner button */}
              <div
                className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-[#09090d] text-[#00f0ff] group-hover:text-[#fcee0a] transition-all font-cyber font-bold uppercase tracking-widest text-[10px] sm:text-[11px]"
                style={{
                  clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                }}
              >
                <Icon className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                <span>{label}</span>
              </div>
            </div>
          </Link>
        ))}
      </nav>

      {/* Content sections */}
      <div className="space-y-2">
        <Suspense fallback={<LoadingSkeleton count={4} variant="match-card" />}>
          <LiveMatchesSection />
        </Suspense>

        <WorldCupGroups />

        <Suspense fallback={<LoadingSkeleton count={4} variant="channel-card" />}>
          <LiveChannelsSection />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton count={4} variant="match-card" />}>
          <UpcomingMatchesSection />
        </Suspense>
      </div>
    </div>
  );
}
