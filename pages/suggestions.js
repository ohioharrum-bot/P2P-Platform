import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "../lib/supabaseClient";
import { ArrowUp, Plus, X, Loader } from "lucide-react";



export default function Suggestions() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [upvotedIds, setUpvotedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ perfume_name: "", brand: "", description: "" });
  const [formError, setFormError] = useState(null);

  // 1. Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);

  // 2. Fetch suggestions
  useEffect(() => {
    fetchSuggestions();
  }, []);

  // 3. Fetch upvotes when user ready
  useEffect(() => {
    if (!user) return;
    fetchUpvotes();
  }, [user]);

  async function fetchSuggestions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("suggestions")
      .select(`*, profiles!suggestions_user_id_fkey(full_name, avatar_url)`)
      .order("upvotes", { ascending: false });

    if (!error && data) setSuggestions(data);
    setLoading(false);
  }

  async function fetchUpvotes() {
    const { data } = await supabase
      .from("suggestion_upvotes")
      .select("suggestion_id")
      .eq("user_id", user.id);

    if (data) setUpvotedIds(new Set(data.map((u) => u.suggestion_id)));
  }

  async function handleUpvote(suggestion) {
    if (!user) { router.push("/login"); return; }

    const alreadyUpvoted = upvotedIds.has(suggestion.id);

    // Optimistic UI update
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === suggestion.id
          ? { ...s, upvotes: alreadyUpvoted ? s.upvotes - 1 : s.upvotes + 1 }
          : s
      ).sort((a, b) => b.upvotes - a.upvotes)
    );
    setUpvotedIds((prev) => {
      const next = new Set(prev);
      alreadyUpvoted ? next.delete(suggestion.id) : next.add(suggestion.id);
      return next;
    });

    if (alreadyUpvoted) {
      await supabase
        .from("suggestion_upvotes")
        .delete()
        .eq("suggestion_id", suggestion.id)
        .eq("user_id", user.id);

      await supabase
        .from("suggestions")
        .update({ upvotes: suggestion.upvotes - 1 })
        .eq("id", suggestion.id);
    } else {
      await supabase
        .from("suggestion_upvotes")
        .insert({ suggestion_id: suggestion.id, user_id: user.id });

      await supabase
        .from("suggestions")
        .update({ upvotes: suggestion.upvotes + 1 })
        .eq("id", suggestion.id);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) { router.push("/login"); return; }
    setFormError(null);

    if (!form.perfume_name.trim() || !form.brand.trim()) {
      setFormError("Perfume name and brand are required.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("suggestions").insert({
      user_id: user.id,
      perfume_name: form.perfume_name.trim(),
      brand: form.brand.trim(),
      description: form.description.trim() || null,
    });

    if (error) {
      setFormError("Failed to submit suggestion. Please try again.");
    } else {
      setForm({ perfume_name: "", brand: "", description: "" });
      setShowForm(false);
      fetchSuggestions();
    }

    setSubmitting(false);
  }

  function Avatar({ person }) {
    const initials = person?.full_name?.charAt(0)?.toUpperCase() || "?";
    return person?.avatar_url ? (
      <img src={person.avatar_url} alt={person.full_name} className="w-7 h-7 rounded-full object-cover shrink-0" />
    ) : (
      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium shrink-0">
        {initials}
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Suggestions — Scentd</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-[#FAFAF9]" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="max-w-2xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-normal text-gray-900 mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Suggest a Perfume
              </h1>
              <p className="text-sm text-gray-400">
                Tell us what you'd love to see on Scentd. Upvote suggestions you agree with.
              </p>
            </div>
            <button
              onClick={() => {
                if (!user) { router.push("/login"); return; }
                setShowForm(!showForm);
                setFormError(null);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a18] text-white text-sm rounded-xl hover:bg-black transition-colors shrink-0 ml-4"
            >
              {showForm ? <X size={15} /> : <Plus size={15} />}
              {showForm ? "Cancel" : "Suggest"}
            </button>
          </div>

          {/* Submit form */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm"
            >
              <h2 className="text-base font-medium text-gray-900 mb-4">New suggestion</h2>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Perfume name *</label>
                  <input
                    type="text"
                    value={form.perfume_name}
                    onChange={(e) => setForm({ ...form, perfume_name: e.target.value })}
                    placeholder="e.g. Bleu de Chanel"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#FAFAF9] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Brand *</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g. Chanel"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#FAFAF9] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Why do you want it? (optional)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Tell us why this perfume should be on Scentd..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#FAFAF9] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-xs text-red-500 mt-3">{formError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full py-2.5 bg-[#1a1a18] text-white text-sm rounded-xl hover:bg-black disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader size={14} className="animate-spin" />}
                {submitting ? "Submitting..." : "Submit suggestion"}
              </button>
            </form>
          )}

          {/* Suggestions list */}
          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-16 bg-gray-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <p className="text-gray-400 text-sm">No suggestions yet. Be the first!</p>
              <button
                onClick={() => {
                  if (!user) { router.push("/login"); return; }
                  setShowForm(true);
                }}
                className="text-xs px-4 py-2 bg-[#1a1a18] text-white rounded-xl hover:bg-black transition-colors"
              >
                Add suggestion
              </button>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((s) => {
                const upvoted = upvotedIds.has(s.id);
                return (
                  <div
                    key={s.id}
                    className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 shadow-sm hover:border-gray-200 transition-colors"
                  >
                    {/* Upvote button */}
                    <button
                      onClick={() => handleUpvote(s)}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-colors shrink-0 ${
                        upvoted
                          ? "bg-[#1a1a18] border-[#1a1a18] text-white"
                          : "border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-700"
                      }`}
                    >
                      <ArrowUp size={14} />
                      <span className="text-xs font-medium">{s.upvotes}</span>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{s.perfume_name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{s.brand}</p>
                        </div>
                      </div>

                      {s.description && (
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{s.description}</p>
                      )}

                      {/* Submitted by */}
                      <div className="flex items-center gap-1.5 mt-3">
                        <Avatar person={s.profiles} />
                        <span className="text-[10px] text-gray-400">
                          {s.profiles?.full_name || "Anonymous"} · {new Date(s.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}