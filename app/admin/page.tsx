"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tv, Plus, Edit3, Trash2, Check, X, LogOut, Zap, Shield,
  FileDown, Loader2, Search, CheckSquare, Square, Trash,
  FileUp, BarChart2, AlertTriangle, RefreshCw, GripVertical, Bell
} from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useChannels } from "@/hooks/useChannels";
import { Button } from "@/components/ui/button";
import type { Channel } from "@/types/channel";
import { CHANNEL_CATEGORIES } from "@/types/channel";

const EMPTY_CHANNEL: Partial<Channel> = {
  name: "", stream: "", logo: "", category: "Sports", quality: "HD", isLive: true, featured: false,
};

// ─── M3U Parser ────────────────────────────────────────────────────────────
function parseM3U(text: string): Partial<Channel>[] {
  const lines = text.split("\n");
  const channels: Partial<Channel>[] = [];
  let currentChannel: Partial<Channel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("#EXTINF:")) {
      currentChannel = { isLive: true, featured: false, quality: "HD", category: "Sports" };
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      if (logoMatch) currentChannel.logo = logoMatch[1];
      const groupMatch = line.match(/group-title="([^"]+)"/);
      if (groupMatch) {
        const title = groupMatch[1].toLowerCase();
        if (title.includes("sport") || title.includes("football") || title.includes("fifa")) {
          currentChannel.category = "Sports";
        } else if (title.includes("news")) {
          currentChannel.category = "News";
        } else if (title.includes("ent") || title.includes("show")) {
          currentChannel.category = "Entertainment";
        } else if (title.includes("doc")) {
          currentChannel.category = "Documentary";
        } else {
          currentChannel.category = "Other";
        }
      }
      const commaIdx = line.lastIndexOf(",");
      currentChannel.name = commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : "M3U Stream";
    } else if (line && !line.startsWith("#")) {
      currentChannel.stream = line;
      if (currentChannel.name) channels.push(currentChannel);
      currentChannel = {};
    }
  }
  return channels;
}

// ─── Export M3U ────────────────────────────────────────────────────────────
function exportM3U(channels: Channel[]) {
  let content = "#EXTM3U\n";
  for (const ch of channels) {
    content += `#EXTINF:-1 tvg-logo="${ch.logo || ""}" group-title="${ch.category}",${ch.name}\n`;
    content += `${ch.stream}\n`;
  }
  const blob = new Blob([content], { type: "application/x-mpegURL" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fifa-live-hub-channels.m3u";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Stat Badge ────────────────────────────────────────────────────────────
function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${color}`}>
      <span className="text-sm font-extrabold">{value}</span>
      <span className="uppercase tracking-wider opacity-70">{label}</span>
    </div>
  );
}

// ─── Confirm Modal ──────────────────────────────────────────────────────────
function ConfirmModal({
  message, onConfirm, onCancel, danger = false,
}: { message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0d0d11] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-white text-sm font-medium leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-white/10 hover:bg-white/5 text-white text-xs font-bold uppercase tracking-wider rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 text-xs font-bold uppercase tracking-wider rounded-full ${danger ? "bg-red-500 hover:bg-red-400" : "bg-cyan-500 hover:bg-cyan-400"} text-white`}
          >
            Confirm
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const { token, isAuthenticated, logout } = useAdmin();
  const { channels, isLoading, addChannel, addChannels, updateChannel, deleteChannel, deleteChannels, deleteAllChannels, mutate } = useChannels(token || undefined);

  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState<Partial<Channel> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  // Bulk selection
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // Search
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // M3U Import
  const [parsedChannels, setParsedChannels] = useState<Partial<Channel>[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // IPTV URL Playlist Sync
  const [iptvConfig, setIptvConfig] = useState<{
    playlistUrl: string;
    autoUpdate: boolean;
    syncMode: "overwrite" | "merge";
    lastUpdated?: string;
    channelCount?: number;
  }>({
    playlistUrl: "",
    autoUpdate: false,
    syncMode: "merge",
  });
  const [showIPTVConfig, setShowIPTVConfig] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Notification settings
  const [showNotificationConfig, setShowNotificationConfig] = useState(false);
  const [savingNotification, setSavingNotification] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<{
    text: string;
    active: boolean;
    color: string;
  }>({
    text: "",
    active: false,
    color: "bg-linear-to-r from-cyan-600/90 to-blue-600/90",
  });

  // Drag and Drop ordering
  const [channelList, setChannelList] = useState<Channel[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (channels) {
      setChannelList(channels);
    }
  }, [channels]);

  const handleSaveOrder = async (updatedList: Channel[]) => {
    if (!token) return;
    try {
      const res = await fetch("/api/channels", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(updatedList),
      });
      if (res.ok) {
        showSuccess("Channels reordered successfully!");
        mutate();
      } else {
        alert("Failed to save reordered channels.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving reorder.");
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (search) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (search || draggedIndex === null || draggedIndex === index) return;

    const listCopy = [...channelList];
    const draggedItem = listCopy[draggedIndex];
    listCopy.splice(draggedIndex, 1);
    listCopy.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setChannelList(listCopy);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    if (!search) {
      handleSaveOrder(channelList);
    }
  };

  // Handle mounting client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load IPTV config on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      fetch("/api/iptv", {
        headers: { "x-admin-token": token },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setIptvConfig({
              playlistUrl: data.playlistUrl || "",
              autoUpdate: data.autoUpdate || false,
              syncMode: data.syncMode || "merge",
              lastUpdated: data.lastUpdated,
              channelCount: data.channelCount,
            });
          }
        })
        .catch((err) => console.error("Failed to load IPTV config:", err));
    }
  }, [isAuthenticated, token]);

  // Load Notification config on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      fetch("/api/notification")
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setNotificationSettings({
              text: data.text || "",
              active: data.active || false,
              color: data.color || "bg-linear-to-r from-cyan-600/90 to-blue-600/90",
            });
          }
        })
        .catch((err) => console.error("Failed to load Notification config:", err));
    }
  }, [isAuthenticated, token]);

  const handleSaveNotification = async () => {
    if (!token) return;
    setSavingNotification(true);
    try {
      const res = await fetch("/api/notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(notificationSettings),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        showSuccess("Notification settings saved!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save notification settings.");
    } finally {
      setSavingNotification(false);
    }
  };

  const handleSaveIPTVConfig = async (triggerSync = false) => {
    if (!token) return;
    setSyncing(triggerSync);
    setSaving(!triggerSync);
    try {
      const res = await fetch(`/api/iptv${triggerSync ? "?sync=true" : ""}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(iptvConfig),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      
      if (data.config) {
        setIptvConfig({
          playlistUrl: data.config.playlistUrl || "",
          autoUpdate: data.config.autoUpdate || false,
          syncMode: data.config.syncMode || "merge",
          lastUpdated: data.config.lastUpdated,
          channelCount: data.config.channelCount,
        });
      }
      
      if (triggerSync) {
        if (data.sync && data.sync.success) {
          showSuccess(`IPTV Sync completed! Loaded ${data.sync.count} channels.`);
          mutate(); // Refresh the channels list
        } else {
          alert(`IPTV Sync failed: ${data.sync?.error || "Unknown error"}`);
        }
      } else {
        showSuccess("IPTV Settings saved.");
      }
    } catch (err: any) {
      console.error(err);
      alert("An error occurred during IPTV operation.");
    } finally {
      setSyncing(false);
      setSaving(false);
    }
  };

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, router, mounted]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setEditing(null); setParsedChannels(null); setConfirmModal(null); setShowIPTVConfig(false); setShowNotificationConfig(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!mounted || !isAuthenticated) return null;

  // ── Filtered channels ────────────────────────────────────────────────────
  const filtered = channelList.filter((ch) =>
    !search ||
    ch.name.toLowerCase().includes(search.toLowerCase()) ||
    ch.stream.toLowerCase().includes(search.toLowerCase()) ||
    ch.category.toLowerCase().includes(search.toLowerCase())
  );

  const liveCount = channelList.filter((c) => c.isLive).length;
  const featuredCount = channelList.filter((c) => c.featured).length;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3500);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  // ── Save channel ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editing || !token) return;
    setSaving(true);
    try {
      if (isNew) {
        await addChannel(editing, token);
      } else {
        await updateChannel(editing as Channel, token);
      }
      setEditing(null);
      setIsNew(false);
      showSuccess(isNew ? "Channel added!" : "Channel updated!");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete single ─────────────────────────────────────────────────────────
  const handleDelete = (id: number) => {
    setConfirmModal({
      message: "Are you sure you want to delete this channel? This cannot be undone.",
      onConfirm: async () => {
        setConfirmModal(null);
        if (!token) return;
        await deleteChannel(id, token);
        setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
        showSuccess("Channel deleted.");
      },
    });
  };

  // ── Delete selected (single request) ────────────────────────────────────
  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    setConfirmModal({
      message: `Delete ${selected.size} selected channel${selected.size > 1 ? "s" : ""}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        if (!token) return;
        await deleteChannels([...selected], token);
        setSelected(new Set());
        showSuccess(`${selected.size} channels deleted.`);
      },
    });
  };

  // ── Delete all (single request) ───────────────────────────────────────────
  const handleDeleteAll = () => {
    setConfirmModal({
      message: `⚠️ Delete ALL ${channels.length} channels? This is irreversible.`,
      onConfirm: async () => {
        setConfirmModal(null);
        if (!token) return;
        await deleteAllChannels(token);
        setSelected(new Set());
        showSuccess("All channels deleted.");
      },
    });
  };

  // ── M3U file handler ─────────────────────────────────────────────────────
  const handleM3UFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseM3U(text);
      if (parsed.length === 0) { alert("No valid channels found in this M3U file."); return; }
      setParsedChannels(parsed);
      setImportProgress(0);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Batch import (single request) ─────────────────────────────────────────
  const handleImportM3U = async () => {
    if (!parsedChannels || !token) return;
    setImporting(true);
    setImportProgress(0);
    try {
      // Send all channels in one POST request (bulk insert)
      await addChannels(parsedChannels, token);
      setImportProgress(parsedChannels.length);
      showSuccess(`Successfully imported ${parsedChannels.length} channels!`);
      setParsedChannels(null);
    } catch (err) {
      console.error("Failed to import channels:", err);
      alert("Error importing channels.");
    } finally {
      setImporting(false);
    }
  };

  const allFilteredSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <>
      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
          danger
        />
      )}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 md:px-16 pt-14 pb-28 min-h-screen bg-black">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wider font-sans">Admin Panel</h1>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mt-0.5">FIFA Live Hub Control Center</p>
            </div>
          </div>
          <button
            id="admin-logout-btn"
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-white/70 hover:text-white hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* ── Success toast ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {success && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 px-5 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <Check className="w-4 h-4" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input */}
        <input type="file" id="m3u-file-input" accept=".m3u,.m3u8" onChange={handleM3UFile} className="hidden" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Channel List ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-2">
              <StatBadge label="Total" value={channelList.length} color="text-white/60 bg-white/5 border-white/5" />
              <StatBadge label="Live" value={liveCount} color="text-red-400 bg-red-500/10 border-red-500/20" />
              <StatBadge label="Featured" value={featuredCount} color="text-yellow-400 bg-yellow-500/10 border-yellow-500/20" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search channels… (⌘F)"
                  className="w-full pl-8 pr-3 py-2 rounded-full bg-white/5 border border-white/5 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-cyan-500/40 focus:bg-white/8 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* IPTV Auto Sync */}
              <Button
                id="iptv-sync-btn"
                onClick={() => { setShowIPTVConfig(true); setShowNotificationConfig(false); setEditing(null); setParsedChannels(null); }}
                size="sm"
                className="bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-full px-3 text-xs"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                IPTV Sync
              </Button>

              {/* Notification Bar Settings */}
              <Button
                id="notification-settings-btn"
                onClick={() => { setShowNotificationConfig(true); setShowIPTVConfig(false); setEditing(null); setParsedChannels(null); }}
                size="sm"
                className="bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-full px-3 text-xs"
              >
                <Bell className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />
                Notification
              </Button>

              {/* Import M3U */}
              <Button
                id="import-m3u-btn"
                onClick={() => { document.getElementById("m3u-file-input")?.click(); setShowIPTVConfig(false); setShowNotificationConfig(false); }}
                size="sm"
                className="bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-full px-3 text-xs"
              >
                <FileDown className="w-3.5 h-3.5 mr-1.5 text-white/50" />
                Import M3U
              </Button>

              {/* Export M3U */}
              <Button
                id="export-m3u-btn"
                onClick={() => exportM3U(channelList)}
                size="sm"
                disabled={channelList.length === 0}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-full px-3 text-xs disabled:opacity-40"
              >
                <FileUp className="w-3.5 h-3.5 mr-1.5 text-white/50" />
                Export M3U
              </Button>

              {/* Add Channel */}
              <Button
                id="add-channel-btn"
                onClick={() => { setEditing({ ...EMPTY_CHANNEL }); setIsNew(true); setParsedChannels(null); setShowIPTVConfig(false); setShowNotificationConfig(false); }}
                size="sm"
                className="bg-cyan-500 hover:bg-cyan-400 text-white rounded-full px-3 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Channel
              </Button>
            </div>

            {/* Drag and Drop Tip */}
            {!search && channelList.length > 1 && (
              <p className="text-[10px] text-white/35 font-semibold flex items-center gap-1.5 px-1.5 pt-1">
                <span>💡 Tip: Drag and drop items using the grab handle <GripVertical className="inline w-3 h-3 text-white/40 -mt-0.5" /> to reorder the IPTV list.</span>
              </p>
            )}

            {/* Bulk action bar */}
            <div className="flex items-center justify-between bg-[#0d0d11] border border-white/5 rounded-xl px-4 py-2.5">
              {/* Select all toggle */}
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors"
              >
                {allFilteredSelected
                  ? <CheckSquare className="w-4 h-4 text-cyan-400" />
                  : <Square className="w-4 h-4" />}
                {allFilteredSelected ? "Deselect All" : `Select All (${filtered.length})`}
              </button>

              <div className="flex items-center gap-2">
                {selected.size > 0 && (
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    id="delete-selected-btn"
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete {selected.size}
                  </motion.button>
                )}

                {channelList.length > 0 && (
                  <button
                    id="delete-all-btn"
                    onClick={handleDeleteAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/5 border border-red-500/10 text-red-500/60 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    Delete All
                  </button>
                )}

                <button
                  id="refresh-channels-btn"
                  onClick={() => mutate()}
                  className="p-1.5 rounded-full text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Channel list */}
            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 skeleton-shimmer rounded-xl" />
                ))
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-white/25 text-sm font-semibold">
                  {search ? `No channels matching "${search}"` : "No channels yet. Import an M3U or add one manually."}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filtered.map((ch) => {
                    const isSelected = selected.has(ch.id);
                    return (
                      <motion.div
                        key={ch.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        draggable={!search}
                        onDragStart={(e: any) => handleDragStart(e, channelList.indexOf(ch))}
                        onDragOver={(e: any) => handleDragOver(e, channelList.indexOf(ch))}
                        onDragEnd={handleDragEnd}
                        className={`bg-[#0d0d11] border rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-all duration-200 ${
                          draggedIndex === channelList.indexOf(ch)
                            ? "border-cyan-500/50 bg-cyan-500/10 opacity-50 cursor-grabbing"
                            : isSelected
                            ? "border-cyan-500/30 bg-cyan-500/5"
                            : "border-white/5 hover:border-white/10"
                        }`}
                      >
                        {/* Drag Handle */}
                        {!search && (
                          <div
                            className="shrink-0 text-white/20 hover:text-white cursor-grab active:cursor-grabbing p-1 -ml-1 transition-colors"
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}

                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelect(ch.id)}
                          className="shrink-0 text-white/30 hover:text-cyan-400 transition-colors"
                          aria-label={`Select ${ch.name}`}
                        >
                          {isSelected
                            ? <CheckSquare className="w-4 h-4 text-cyan-400" />
                            : <Square className="w-4 h-4" />}
                        </button>

                        {/* Logo */}
                        {ch.logo ? (
                          <img
                            src={ch.logo}
                            alt={ch.name}
                            className="w-8 h-8 rounded-lg object-contain bg-white/5 border border-white/10 shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <Tv className="w-3.5 h-3.5 text-white/20" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-white font-semibold text-sm truncate">{ch.name}</span>
                            <span className="text-[9px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{ch.category}</span>
                            {ch.quality && (
                              <span className="text-[9px] text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded font-extrabold">{ch.quality}</span>
                            )}
                            {ch.isLive && (
                              <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-extrabold uppercase">LIVE</span>
                            )}
                            {ch.featured && (
                              <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded font-extrabold uppercase">★</span>
                            )}
                          </div>
                          <p className="text-white/25 text-[10px] truncate mt-0.5 font-mono">{ch.stream}</p>
                        </div>

                        {/* Actions — always visible */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            id={`edit-ch-${ch.id}`}
                            onClick={() => { setEditing({ ...ch }); setIsNew(false); setParsedChannels(null); setShowIPTVConfig(false); setShowNotificationConfig(false); }}
                            title="Edit channel"
                            className="p-2 rounded-lg text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-ch-${ch.id}`}
                            onClick={() => handleDelete(ch.id)}
                            title="Delete channel"
                            className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Result count when searching */}
            {search && filtered.length > 0 && (
              <p className="text-center text-white/25 text-xs font-semibold">
                Showing {filtered.length} of {channelList.length} channels
              </p>
            )}
          </div>

          {/* ── Right Panel ─────────────────────────────────────────────── */}
          <div>
            <AnimatePresence mode="wait">
              {parsedChannels ? (
                <motion.div
                  key="m3u-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0d0d11] border border-cyan-500/20 shadow-2xl rounded-2xl p-5 sticky top-24"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">M3U Playlist Import</h3>
                    <button onClick={() => setParsedChannels(null)} disabled={importing} className="text-white/40 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-white/50 text-xs mb-4">
                    Parsed <span className="text-cyan-400 font-bold">{parsedChannels.length}</span> channels. Click import to add all.
                  </p>

                  {importing && (
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-cyan-400">
                        <span>Importing…</span>
                        <span>{importProgress} / {parsedChannels.length}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                          style={{ width: `${(importProgress / parsedChannels.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="max-h-60 overflow-y-auto space-y-1.5 mb-5 pr-1 scrollbar-thin">
                    {parsedChannels.slice(0, 15).map((ch, i) => (
                      <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-white truncate font-medium max-w-[180px]">{ch.name}</span>
                        <span className="text-white/35 text-[9px] uppercase font-bold shrink-0">{ch.category}</span>
                      </div>
                    ))}
                    {parsedChannels.length > 15 && (
                      <div className="text-center text-[10px] text-white/30 font-semibold py-1">
                        + {parsedChannels.length - 15} more channels
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={() => setParsedChannels(null)} disabled={importing} variant="outline"
                      className="w-1/2 border-white/10 hover:bg-white/5 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                      Cancel
                    </Button>
                    <Button onClick={handleImportM3U} disabled={importing}
                      className="w-1/2 bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                      {importing ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Importing</> : "Import All"}
                    </Button>
                  </div>
                </motion.div>
              ) : showNotificationConfig ? (
                <motion.div
                  key="notification-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-[#0d0d11] border border-white/5 shadow-2xl rounded-2xl p-5 sticky top-24"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                      <Bell className="w-4 h-4 text-yellow-400" />
                      Marquee Notification
                    </h3>
                    <button onClick={() => setShowNotificationConfig(false)} className="text-white/40 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Active Checkbox */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-white/60 text-xs font-bold uppercase tracking-wider block">Active Status</span>
                        <span className="text-[10px] text-white/30 font-semibold block mt-0.5">Show or hide the marquee notification</span>
                      </div>
                      <label className="relative flex items-center cursor-pointer select-none">
                        <div
                          onClick={() => setNotificationSettings({ ...notificationSettings, active: !notificationSettings.active })}
                          className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${notificationSettings.active ? "bg-cyan-500" : "bg-white/10"}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${notificationSettings.active ? "translate-x-4" : ""}`} />
                        </div>
                      </label>
                    </div>

                    {/* Notification Text */}
                    <div>
                      <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-1">Notification Text</label>
                      <textarea
                        id="notification-text"
                        value={notificationSettings.text}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, text: e.target.value })}
                        placeholder="Enter announcement text..."
                        rows={4}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder:text-white/20 focus:outline-none focus:bg-white/8 focus:border-cyan-500/40 transition-all resize-none"
                      />
                    </div>

                    {/* Notification Color/Gradient */}
                    <div>
                      <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-1">Bar Styling</label>
                      <select
                        id="notification-color"
                        value={notificationSettings.color}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, color: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs focus:outline-none focus:border-cyan-500/40 transition-all"
                      >
                        <option value="bg-linear-to-r from-cyan-600/95 to-blue-600/95" className="bg-[#0f0f12]">Cyan-Blue Gradient</option>
                        <option value="bg-linear-to-r from-emerald-600/95 to-teal-600/95" className="bg-[#0f0f12]">Emerald-Teal Gradient</option>
                        <option value="bg-linear-to-r from-amber-600/95 to-red-600/95" className="bg-[#0f0f12]">Amber-Red Gradient</option>
                        <option value="bg-linear-to-r from-purple-600/95 to-pink-600/95" className="bg-[#0f0f12]">Purple-Pink Gradient</option>
                        <option value="bg-red-600/95" className="bg-[#0f0f12]">Solid Red</option>
                        <option value="bg-cyan-600/95" className="bg-[#0f0f12]">Solid Cyan</option>
                        <option value="bg-[#0f0f12]" className="bg-[#0f0f12]">Dark Obsidian</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-6">
                    <Button
                      id="save-notification-btn"
                      onClick={handleSaveNotification}
                      disabled={savingNotification || !notificationSettings.text}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold uppercase tracking-wider text-xs rounded-full py-2.5 disabled:opacity-50"
                    >
                      {savingNotification ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Saving Announcement…
                        </>
                      ) : (
                        "Save Announcement"
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-white/20 text-[10px] font-semibold mt-3">Press Esc to cancel</p>
                </motion.div>
              ) : showIPTVConfig ? (
                <motion.div
                  key="iptv-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-[#0d0d11] border border-white/5 shadow-2xl rounded-2xl p-5 sticky top-24"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      IPTV Playlist Sync
                    </h3>
                    <button onClick={() => setShowIPTVConfig(false)} className="text-white/40 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Playlist URL */}
                    <div>
                      <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-1">Playlist URL *</label>
                      <input
                        id="iptv-playlist-url"
                        type="text"
                        value={iptvConfig.playlistUrl}
                        onChange={(e) => setIptvConfig({ ...iptvConfig, playlistUrl: e.target.value })}
                        placeholder="https://example.com/playlist.m3u"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder:text-white/20 focus:outline-none focus:bg-white/8 focus:border-cyan-500/40 transition-all"
                      />
                    </div>

                    {/* Sync Mode */}
                    <div>
                      <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-1">Sync Mode</label>
                      <select
                        id="iptv-sync-mode"
                        value={iptvConfig.syncMode}
                        onChange={(e) => setIptvConfig({ ...iptvConfig, syncMode: e.target.value as "overwrite" | "merge" })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs focus:outline-none focus:border-cyan-500/40 transition-all"
                      >
                        <option value="merge" className="bg-[#0f0f1a]">Merge (Replace IPTV, keep manual)</option>
                        <option value="overwrite" className="bg-[#0f0f1a]">Overwrite (Caution: Delete all channels)</option>
                      </select>
                    </div>

                    {/* Auto Update Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div>
                        <span className="text-white/60 text-xs font-bold uppercase tracking-wider block">Auto-Sync</span>
                        <span className="text-[10px] text-white/30 font-semibold block mt-0.5">Automatically updates every 12 hours</span>
                      </div>
                      <label className="relative flex items-center cursor-pointer select-none">
                        <div
                          onClick={() => setIptvConfig({ ...iptvConfig, autoUpdate: !iptvConfig.autoUpdate })}
                          className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${iptvConfig.autoUpdate ? "bg-cyan-500" : "bg-white/10"}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${iptvConfig.autoUpdate ? "translate-x-4" : ""}`} />
                        </div>
                      </label>
                    </div>

                    {/* Status Information */}
                    {iptvConfig.lastUpdated && (
                      <div className="bg-white/2 border border-white/5 rounded-xl p-3 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-white/40">Last Synced:</span>
                          <span className="text-white font-medium">{new Date(iptvConfig.lastUpdated).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">Channels Loaded:</span>
                          <span className="text-cyan-400 font-bold">{iptvConfig.channelCount || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-6">
                    <Button
                      id="iptv-save-btn"
                      onClick={() => handleSaveIPTVConfig(false)}
                      disabled={saving || syncing || !iptvConfig.playlistUrl}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold uppercase tracking-wider text-xs rounded-full py-2.5 disabled:opacity-50"
                    >
                      {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving Settings…</> : "Save Settings"}
                    </Button>
                    
                    <Button
                      id="iptv-sync-now-btn"
                      onClick={() => handleSaveIPTVConfig(true)}
                      disabled={saving || syncing || !iptvConfig.playlistUrl}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold uppercase tracking-wider text-xs rounded-full py-2.5 disabled:opacity-50"
                    >
                      {syncing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Syncing IPTV Playlist…
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          Sync & Update Now
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-white/20 text-[10px] font-semibold mt-3">Press Esc to cancel</p>
                </motion.div>
              ) : editing ? (
                <motion.div
                  key="edit-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-[#0d0d11] border border-white/5 rounded-2xl p-5 sticky top-24 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                      {isNew ? "Add Channel" : "Edit Channel"}
                    </h3>
                    <button onClick={() => setEditing(null)} className="text-white/40 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Channel Name *", key: "name" as const, placeholder: "Sky Sports" },
                      { label: "Stream URL (m3u8) *", key: "stream" as const, placeholder: "https://example.com/live.m3u8" },
                      { label: "Logo URL", key: "logo" as const, placeholder: "/logos/channel.png" },
                      { label: "Description", key: "description" as const, placeholder: "Live sports coverage" },
                      { label: "Language", key: "language" as const, placeholder: "English" },
                      { label: "Country", key: "country" as const, placeholder: "UK" },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-1">{label}</label>
                        <input
                          id={`field-${key}`}
                          type="text"
                          value={(editing[key] as string) || ""}
                          onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                          placeholder={placeholder}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder:text-white/20 focus:outline-none focus:bg-white/8 focus:border-cyan-500/40 transition-all"
                        />
                      </div>
                    ))}

                    {/* Category */}
                    <div>
                      <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-1">Category</label>
                      <select
                        id="field-category"
                        value={editing.category || "Sports"}
                        onChange={(e) => setEditing({ ...editing, category: e.target.value as Channel["category"] })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs focus:outline-none focus:border-cyan-500/40 transition-all"
                      >
                        {CHANNEL_CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#0f0f1a]">{c}</option>)}
                      </select>
                    </div>

                    {/* Quality */}
                    <div>
                      <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-1">Quality</label>
                      <select
                        id="field-quality"
                        value={editing.quality || "HD"}
                        onChange={(e) => setEditing({ ...editing, quality: e.target.value as Channel["quality"] })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs focus:outline-none focus:border-cyan-500/40 transition-all"
                      >
                        {["SD", "HD", "FHD", "4K"].map((q) => <option key={q} value={q} className="bg-[#0f0f1a]">{q}</option>)}
                      </select>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center gap-6 pt-2">
                      {[
                        { label: "Live", key: "isLive" as const },
                        { label: "Featured", key: "featured" as const },
                      ].map(({ label, key }) => (
                        <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none">
                          <div
                            onClick={() => setEditing({ ...editing, [key]: !editing[key] })}
                            className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${editing[key] ? "bg-cyan-500" : "bg-white/10"}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${editing[key] ? "translate-x-4" : ""}`} />
                          </div>
                          <span className="text-white/60 text-xs font-bold uppercase tracking-wider">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    id="save-channel-btn"
                    onClick={handleSave}
                    disabled={saving || !editing.name || !editing.stream}
                    className="w-full mt-6 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs rounded-full py-2.5"
                  >
                    {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</> : isNew ? "Add Channel" : "Save Changes"}
                  </Button>

                  <p className="text-center text-white/20 text-[10px] font-semibold mt-3">Press Esc to cancel</p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#0d0d11] border border-white/5 rounded-2xl p-8 text-center shadow-xl"
                >
                  <BarChart2 className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-xs font-semibold leading-relaxed">
                    Select a channel to edit,<br />or click <span className="text-cyan-400">Add Channel</span> / Import M3U
                  </p>
                  <div className="mt-4 space-y-1 text-[10px] text-white/20 font-mono">
                    <p>⌘F — search</p>
                    <p>Esc — close panel</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
