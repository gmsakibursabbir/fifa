import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Activity, Tv, Trophy, Globe } from "lucide-react";
import HeroBanner from "@/components/home/HeroBanner";
import MatchCard from "@/components/matches/MatchCard";
import ChannelCard from "@/components/channels/ChannelCard";
import WorldCupGroups from "@/components/home/WorldCupGroups";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { getLiveMatches, getUpcomingMatches } from "@/lib/api";
import { loadChannels } from "@/lib/channels";
import type { Channel } from "@/types/channel";

export const revalidate = 60;

async function LiveMatchesSection() {
  const matches = await getLiveMatches();
  const display = matches.slice(0, 8); // Grab up to 8 live fixtures

  return (
    <section className="py-6 border-b border-white/5">
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <h2 className="text-lg font-bold uppercase tracking-wider text-white font-sans">Live Fixtures</h2>
        </div>
        <Link
          href="/matches"
          className="flex items-center gap-1 text-white/50 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {display.length === 0 ? (
        <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-12 text-center">
          <Activity className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm font-semibold">No live fixtures right now</p>
          <p className="text-white/20 text-xs mt-1">Check back later or view upcoming match schedules</p>
        </div>
      ) : (
        <div className="flex gap-3 sm:gap-5 overflow-x-auto pt-3 sm:pt-4 pb-6 sm:pb-8 px-4 sm:px-8 md:px-16 -mx-4 sm:-mx-8 md:-mx-16 hide-scrollbar">
          {display.map((match) => (
            <div key={match.id} className="w-[260px] sm:w-[300px] md:w-[340px] flex-shrink-0">
              <MatchCard match={match} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

async function LiveChannelsSection() {
  const channelsData = await loadChannels();
  const channels = channelsData.filter((c) => c.isLive || c.featured);

  return (
    <section className="py-6 border-b border-white/5">
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-white/40" />
          <h2 className="text-lg font-bold uppercase tracking-wider text-white font-sans">Live IPTV Channels</h2>
        </div>
        <Link
          href="/watch"
          className="flex items-center gap-1 text-white/50 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
        >
          All Channels <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex gap-3 sm:gap-5 overflow-x-auto pt-3 sm:pt-4 pb-6 sm:pb-8 px-4 sm:px-8 md:px-16 -mx-4 sm:-mx-8 md:-mx-16 hide-scrollbar">
        {channels.slice(0, 8).map((ch, i) => (
          <div key={ch.id} className="w-[240px] sm:w-[260px] md:w-[280px] flex-shrink-0">
            <ChannelCard channel={ch} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}

async function UpcomingMatchesSection() {
  const matches = await getUpcomingMatches();
  const display = matches.slice(0, 8);

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-white/40" />
          <h2 className="text-lg font-bold uppercase tracking-wider text-white font-sans">Upcoming Fixtures</h2>
        </div>
        <Link
          href="/matches"
          className="flex items-center gap-1 text-white/50 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
        >
          Full Schedule <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex gap-3 sm:gap-5 overflow-x-auto pt-3 sm:pt-4 pb-6 sm:pb-8 px-4 sm:px-8 md:px-16 -mx-4 sm:-mx-8 md:-mx-16 hide-scrollbar">
        {display.map((match, i) => (
          <div key={match.id} className="w-[260px] sm:w-[300px] md:w-[340px] flex-shrink-0">
            <MatchCard match={match} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-16 pt-14 pb-28">
      {/* Hero Billboard */}
      <div className="mb-6 sm:mb-10">
        <HeroBanner />
      </div>

      {/* Apple TV Shelf Navigation */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-3 mb-6 sm:mb-8 hide-scrollbar">
        {[
          { href: "/matches", icon: Activity, label: "Matches" },
          { href: "/watch",   icon: Tv,       label: "Watch IPTV" },
          { href: "/standings",icon: Trophy,  label: "Standings" },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white/5 border border-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all font-semibold uppercase tracking-wider text-[11px] sm:text-xs flex-shrink-0"
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40" />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Main Shelves */}
      <div className="space-y-4">
        {/* Live Matches Shelf */}
        <Suspense fallback={<LoadingSkeleton count={4} variant="match-card" />}>
          <LiveMatchesSection />
        </Suspense>

        {/* FIFA World Cup 2026 interactive group stage standings section */}
        <WorldCupGroups />

        {/* Live IPTV Channels Shelf */}
        <Suspense fallback={<LoadingSkeleton count={4} variant="channel-card" />}>
          <LiveChannelsSection />
        </Suspense>

        {/* Upcoming matches */}
        <Suspense fallback={<LoadingSkeleton count={4} variant="match-card" />}>
          <UpcomingMatchesSection />
        </Suspense>
      </div>
    </div>
  );
}
