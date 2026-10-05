"use client";

import React, { useState, useMemo } from "react";
import { CLAUDE_SESSIONS } from "@/data/sessions";
import { 
  Download, 
  Terminal, 
  Search, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  Cpu, 
  Database, 
  Clock, 
  FileText, 
  Activity
} from "lucide-react";

export default function SessionsHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(CLAUDE_SESSIONS[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Guarantee newest first
  const sortedSessions = useMemo(() => {
    return [...CLAUDE_SESSIONS].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, []);

  const filteredSessions = useMemo(() => {
    return sortedSessions.filter((s) => {
      const matchesCategory = selectedCategory === "ALL" || s.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;
      const matchesSearch = 
        s.title.toLowerCase().includes(query) ||
        s.summary.toLowerCase().includes(query) ||
        s.sessionId.toLowerCase().includes(query) ||
        s.highlights.some(h => h.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [sortedSessions, selectedCategory, searchQuery]);

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "AUDIT":
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case "IMPLEMENTATION":
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case "STORAGE":
        return <Database className="w-4 h-4 text-blue-400" />;
      default:
        return <Terminal className="w-4 h-4 text-purple-400" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "AUDIT":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "IMPLEMENTATION":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "STORAGE":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 font-sans pb-20">
      {/* Background radial subtle accents */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))]" />

      {/* Top Utility Header */}
      <header className="relative border-b border-white/[0.06] bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a 
              href="/" 
              className="flex items-center gap-2.5 text-xs tracking-wider uppercase font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white text-[11px] font-bold shadow-md shadow-indigo-500/20">
                C2
              </div>
              <span>Claude Session Vault</span>
            </a>
            <span className="hidden sm:inline-block text-slate-700">/</span>
            <span className="hidden sm:inline-block text-xs font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Gateway Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href="/"
              className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] transition-all"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 pt-10 pb-8 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
          <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Automated Session Exporter & Artifact Vault</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Claude 2 Session Logs & Traces
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
          Full un-truncated verbose execution traces, reasoning steps, tool calls, and final verification outputs captured directly from local Claude Code and desktop remote sessions.
        </p>

        {/* Global Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-7">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Total Sessions</span>
            <span className="text-xl sm:text-2xl font-bold text-white mt-1 block font-mono">{sortedSessions.length}</span>
            <span className="text-[11px] text-emerald-400/80 font-mono mt-0.5 block">Recent sorted on top</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Recorded Steps</span>
            <span className="text-xl sm:text-2xl font-bold text-white mt-1 block font-mono">
              {sortedSessions.reduce((acc, curr) => acc + curr.stepCount, 0)}
            </span>
            <span className="text-[11px] text-indigo-400/80 font-mono mt-0.5 block">Tools + responses</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Total Thinking Blocks</span>
            <span className="text-xl sm:text-2xl font-bold text-white mt-1 block font-mono">
              {sortedSessions.reduce((acc, curr) => acc + curr.thinkingBlocksCount, 0)}
            </span>
            <span className="text-[11px] text-purple-400/80 font-mono mt-0.5 block">Full internal reasoning</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Active Workspace</span>
            <span className="text-sm font-semibold text-white mt-2 block truncate font-mono">KAVACH_AI</span>
            <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">git: master (clean)</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search findings, title, session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-lg text-xs sm:text-sm text-slate-200 placeholder-slate-500 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {["ALL", "AUDIT", "IMPLEMENTATION", "STORAGE"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/20"
                    : "bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Sessions Feed (Recent on Top) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 space-y-5">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-16 border border-white/[0.06] rounded-2xl bg-white/[0.01]">
            <p className="text-slate-400 text-sm">No sessions match your search criteria.</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedCategory("ALL"); }}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredSessions.map((session, index) => {
            const isExpanded = expandedSessionId === session.id;
            return (
              <article 
                key={session.id}
                className={`rounded-2xl border transition-all duration-200 backdrop-blur-md overflow-hidden ${
                  index === 0
                    ? "bg-[#0b101d]/90 border-indigo-500/30 shadow-lg shadow-indigo-950/20"
                    : "bg-[#090d16]/80 border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                {/* Session Card Header */}
                <div className="p-5 sm:p-6 border-b border-white/[0.04]">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${getCategoryBadgeClass(session.category)}`}>
                        {getCategoryIcon(session.category)}
                        {session.category}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                          Latest Session
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {session.formattedDate}
                      </span>
                      <span className="hidden sm:inline text-slate-700">•</span>
                      <span className="hidden sm:inline text-slate-400 font-mono bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                        {session.model}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {session.title}
                  </h2>

                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                    {session.summary}
                  </p>

                  {/* Highlights Pill List */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {session.highlights.map((highlight, hIdx) => (
                      <div 
                        key={hIdx}
                        className="text-xs text-slate-300/90 bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {/* Execution Metrics & Quick Download Actions */}
                  <div className="mt-5 pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-slate-400">
                      <span className="bg-white/[0.03] px-2.5 py-1 rounded border border-white/[0.06]">
                        {session.stepCount} Steps
                      </span>
                      <span className="bg-white/[0.03] px-2.5 py-1 rounded border border-white/[0.06]">
                        {session.thinkingBlocksCount} Thinking Blocks
                      </span>
                      <span className="bg-white/[0.03] px-2.5 py-1 rounded border border-white/[0.06] text-slate-300 font-bold">
                        {session.fileSize}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* One-click Direct Download */}
                      <a
                        href={session.downloadUrl}
                        download={session.downloadUrl.replace(/^\//, '')}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                        title={`Direct download raw verbatim trace (${session.fileSize})`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Full Trace (.txt)</span>
                      </a>

                      {/* Expand / View Final Output */}
                      <button
                        type="button"
                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isExpanded ? "Hide Output" : "View Output"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                      </button>

                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={() => {
                          const fullUrl = `${window.location.origin}${session.downloadUrl}`;
                          copyToClipboard(fullUrl, session.id);
                        }}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.08] transition-all"
                        title="Copy direct download link"
                      >
                        {copiedId === session.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Verbatim Report Drawer */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-black/40 border-t border-white/[0.04]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                          Verbatim Final Assistant Output & Finding Details
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(session.finalOutputText, `text-${session.id}`)}
                        className="text-xs font-mono flex items-center gap-1.5 text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 rounded border border-white/[0.08] transition-all"
                      >
                        {copiedId === `text-${session.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === `text-${session.id}` ? "Copied" : "Copy Markdown"}</span>
                      </button>
                    </div>

                    <div className="relative rounded-xl bg-[#05070c] border border-white/[0.06] p-4 font-mono text-xs text-slate-300 max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-text scrollbar-thin scrollbar-thumb-white/10">
                      {session.finalOutputText}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Session ID: {session.sessionId}</span>
                      {session.remoteBridgeId && <span>Remote Bridge: {session.remoteBridgeId}</span>}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </main>

      {/* Extensibility Footer */}
      <footer className="mt-16 max-w-6xl mx-auto px-4 sm:px-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
        <div>
          <span>Claude 2 Session Trace Hub • Real-time synchronization active</span>
        </div>
        <div>
          <span>Automatic newest-first sorting enabled</span>
        </div>
      </footer>
    </div>
  );
}
