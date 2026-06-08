"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Tv, Activity, Globe } from "lucide-react";

interface Banner {
  id: string;
  tag: string;
  title: string;
  description: string;
  cta: string;
  ctaLink: string;
  image: string;
}

const FALLBACK_BANNERS: Banner[] = [
  {
    id: "1",
    tag: "FIFA World Cup 2026",
    title: "United States, Canada & Mexico",
    description: "Follow the journey of 48 nations competing in North America. Track live scores, fixtures, and group standings in real time.",
    cta: "Explore Standings",
    ctaLink: "/standings",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1600&auto=format&fit=crop",
  },
];

export default function HeroBanner() {
  const [banners, setBanners] = useState<Banner[]>(FALLBACK_BANNERS);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBanners() {
      try {
        const res = await fetch("/api/banners");
        if (res.ok) {
          const data = await res.json() as Banner[];
          if (data && data.length > 0) {
            setBanners(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch banners from API:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((p) => (p + 1) % banners.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [banners]);

  const banner = banners[current] || FALLBACK_BANNERS[0];

  return (
    <div className="relative min-h-[360px] sm:min-h-[440px] md:min-h-[500px] flex items-center overflow-hidden rounded-2xl sm:rounded-3xl border border-white/5 bg-black shadow-2xl">
      {/* Background Image Carousel with AnimatePresence */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.image}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.65, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="relative w-full h-full"
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Apple TV dark gradient overlays */}
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/70 to-transparent z-10" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent z-10" />
        {/* Subtle grid watermark */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-size-[4rem_4rem] z-10" />
      </div>

      {/* Content */}
      <div className="relative z-20 w-full px-5 py-10 sm:px-8 sm:py-14 md:px-16 md:py-16">
        <div className="max-w-2xl">
          {/* Live indicator / Tag */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`tag-${banner.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 mb-4"
            >
              <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
                {banner.tag}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Animated title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${banner.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
            >
              <h1 className="font-extrabold text-2xl sm:text-4xl md:text-6xl text-white mb-3 sm:mb-4 leading-tight tracking-tight font-sans">
                {banner.title}
              </h1>
              <p className="text-white/60 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed font-sans max-w-xl font-medium">
                {banner.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={banner.ctaLink}
              className="flex items-center gap-2 px-7 py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-white/90 transition-all active:scale-95 shadow-lg"
            >
              {banner.cta}
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/watch"
              className="flex items-center gap-2 px-7 py-3 rounded-full bg-white/5 border border-white/5 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/15 transition-all active:scale-95"
            >
              <Tv className="w-4 h-4" />
              Watch Live TV
            </Link>
          </div>

          {/* Bottom stats overview */}
          <div className="flex items-center gap-4 sm:gap-8 mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-white/5 overflow-x-auto pb-1 hide-scrollbar">
            {[
              { icon: Globe, label: "Groups A to L", value: "48 Teams" },
              { icon: Activity, label: "Opening Matchday", value: "WC 2026" },
              { icon: Tv, label: "HD Video Streams", value: "IPTV Channels" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/5 text-white/50">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm leading-none tracking-wide">{value}</div>
                  <div className="text-white/30 text-[10px] uppercase font-bold mt-1 tracking-wider">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide indicators (Apple TV dots style) */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 right-8 flex gap-2 z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-400 ${
                current === i ? "w-6 bg-white" : "w-1.5 bg-white/35 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
