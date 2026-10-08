"use client";

import React, { useState, useEffect, useRef } from "react";
import { KnowledgeArticle, TicketCategory } from "@/types";
import { 
  Search, 
  BookOpen, 
  Tag, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  Plus, 
  UploadCloud, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  FileCode
} from "lucide-react";

export const KnowledgeBaseView: React.FC = () => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<TicketCategory>("general");
  const [formContent, setFormContent] = useState("");
  const [formKeywords, setFormKeywords] = useState("");

  // Upload State
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchArticles = async (query = searchQuery) => {
    setIsLoading(true);
    try {
      const url = query.trim() 
        ? `/api/knowledge?q=${encodeURIComponent(query)}`
        : "/api/knowledge";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        if (data.articles?.length > 0) {
          if (!selectedArticle || !data.articles.some((a: any) => a.id === selectedArticle.id)) {
            setSelectedArticle(data.articles[0]);
          } else {
            const updatedSelected = data.articles.find((a: any) => a.id === selectedArticle.id);
            if (updatedSelected) setSelectedArticle(updatedSelected);
          }
        } else {
          setSelectedArticle(null);
        }
      }
    } catch (e) {
      console.error("Knowledge base fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchArticles(searchQuery);
    }, 250);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const openCreateModal = () => {
    setFormTitle("");
    setFormCategory("general");
    setFormContent("");
    setFormKeywords("");
    setIsCreateOpen(true);
  };

  const openEditModal = () => {
    if (!selectedArticle) return;
    setFormTitle(selectedArticle.title);
    setFormCategory(selectedArticle.category);
    setFormContent(selectedArticle.content);
    setFormKeywords(selectedArticle.keywords.join(", "));
    setIsEditOpen(true);
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setIsSubmitting(true);
    try {
      const keywordsArray = formKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          category: formCategory,
          content: formContent.trim(),
          keywords: keywordsArray,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsCreateOpen(false);
        showNotification("success", "Article created and indexed in vector knowledge base!");
        await fetchArticles();
        if (data.article) setSelectedArticle(data.article);
      } else {
        const err = await res.json();
        showNotification("error", err.error || "Failed to create article");
      }
    } catch (err) {
      showNotification("error", "Error creating article");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle || !formTitle.trim() || !formContent.trim()) return;

    setIsSubmitting(true);
    try {
      const keywordsArray = formKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const res = await fetch(`/api/knowledge/${selectedArticle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          category: formCategory,
          content: formContent.trim(),
          keywords: keywordsArray,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsEditOpen(false);
        showNotification("success", "Article successfully updated!");
        await fetchArticles();
        if (data.article) setSelectedArticle(data.article);
      } else {
        const err = await res.json();
        showNotification("error", err.error || "Failed to update article");
      }
    } catch (err) {
      showNotification("error", "Error updating article");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!selectedArticle) return;
    if (!confirm(`Are you sure you want to delete "${selectedArticle.title}"?`)) return;

    try {
      const res = await fetch(`/api/knowledge/${selectedArticle.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showNotification("success", "Article deleted from knowledge base.");
        await fetchArticles();
      } else {
        showNotification("error", "Failed to delete article");
      }
    } catch (err) {
      showNotification("error", "Error deleting article");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Extract title from markdown heading # Title or use file name
      let detectedTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const headingMatch = text.match(/^#\s+(.+)$/m);
      if (headingMatch && headingMatch[1]) {
        detectedTitle = headingMatch[1].trim();
      }

      // Auto detect category by content
      const lower = (detectedTitle + " " + text).toLowerCase();
      let detectedCat: TicketCategory = "general";
      if (lower.includes("bill") || lower.includes("invoice") || lower.includes("refund") || lower.includes("price")) {
        detectedCat = "billing";
      } else if (lower.includes("api") || lower.includes("webhook") || lower.includes("rate limit") || lower.includes("code")) {
        detectedCat = "technical";
      } else if (lower.includes("account") || lower.includes("login") || lower.includes("sso") || lower.includes("password")) {
        detectedCat = "account";
      }

      setFormTitle(detectedTitle);
      setFormCategory(detectedCat);
      setFormContent(text);
      setFormKeywords("");
      setIsUploadOpen(true);
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className={`fixed top-16 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-xs font-medium animate-in fade-in slide-in-from-top-2 ${
          feedbackMsg.type === "success" 
            ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
            : "bg-rose-950/90 border-rose-500/50 text-rose-200"
        }`}>
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Hidden File Input for Document Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".md,.txt,.json,.markdown"
        className="hidden"
      />

      {/* Left List of Articles */}
      <div className="w-80 md:w-96 flex flex-col border-r border-slate-800 bg-slate-900/60 shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">RAG Knowledge Base</h3>
                <p className="text-[11px] text-slate-400">SQLite & Gemini Grounding Store</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload Markdown or Document (.md, .txt)"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              >
                <UploadCloud className="w-4 h-4 text-amber-400" />
              </button>
              <button
                onClick={openCreateModal}
                title="Create New Article"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search policies, FAQs, docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Articles List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Retrieving articles from SQLite...</span>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <p>No articles match search query.</p>
              <button
                onClick={openCreateModal}
                className="mt-3 text-amber-400 hover:underline inline-flex items-center gap-1 text-xs"
              >
                <Plus className="w-3 h-3" /> Create article now
              </button>
            </div>
          ) : (
            articles.map((art) => {
              const isSelected = selectedArticle?.id === art.id;
              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className={`p-4 cursor-pointer transition-all border-l-4 ${
                    isSelected
                      ? "bg-slate-800/80 border-l-amber-500"
                      : "border-l-transparent hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-400/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                      {art.category}
                    </span>
                    <span className="text-[10px] text-slate-500">{art.lastUpdated}</span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200 mt-1 line-clamp-2">
                    {art.title}
                  </h4>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {art.keywords.slice(0, 3).map((kw, i) => (
                      <span key={i} className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                        #{kw}
                      </span>
                    ))}
                    {art.keywords.length > 3 && (
                      <span className="text-[10px] text-slate-500 px-1">
                        +{art.keywords.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Article Viewer & Management */}
      {selectedArticle ? (
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl">
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold uppercase text-amber-400 bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-800/40">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Updated: {selectedArticle.lastUpdated}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-white leading-tight">
                  {selectedArticle.title}
                </h1>
              </div>

              {/* Action Buttons: Edit & Delete */}
              <div className="flex items-center gap-2">
                <button
                  onClick={openEditModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDeleteArticle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Article Content & Guidelines
              </h4>
              <div className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line space-y-2">
                {selectedArticle.content}
              </div>
            </div>

            {/* Grounding & Indexing Keywords */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
              <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> Grounding Keywords & Vector Tokens:
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {selectedArticle.keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300 font-mono"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-slate-300">
                This document is indexed in SQLite and dynamically grounded in OmniSupport AI responses. When customer inquiries relate to these topics, the AI cites and retrieves this document in real time.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
          <BookOpen className="w-8 h-8 text-slate-700" />
          <p>Select an article from the list or create a new one</p>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Article
          </button>
        </div>
      )}

      {/* Modal: Create Article */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" /> Create Knowledge Article
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Enterprise Billing Cycles & Invoicing"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="billing">Billing & Invoices</option>
                  <option value="technical">Technical & API</option>
                  <option value="account">Account & Security</option>
                  <option value="general">General Support</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Content (Markdown supported)</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Detailed guidelines, troubleshooting instructions, or FAQ details..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Keywords / Tags (comma-separated, or leave blank to auto-extract)
                </label>
                <input
                  type="text"
                  placeholder="billing, refund, invoice, wire"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Indexing..." : "Save Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Article */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" /> Edit Knowledge Article
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateArticle} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="billing">Billing & Invoices</option>
                  <option value="technical">Technical & API</option>
                  <option value="account">Account & Security</option>
                  <option value="general">General Support</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Content</label>
                <textarea
                  required
                  rows={6}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Keywords</label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Update Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Document Upload Preview */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-400" /> Review Uploaded Document
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-center gap-2 text-xs text-amber-300">
              <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Parsed file: <strong>{uploadedFileName}</strong>. Confirm details to index.</span>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Detected Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="billing">Billing & Invoices</option>
                  <option value="technical">Technical & API</option>
                  <option value="account">Account & Security</option>
                  <option value="general">General Support</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Extracted Content Preview</label>
                <textarea
                  required
                  rows={6}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Indexing..." : "Index into Knowledge Base"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
