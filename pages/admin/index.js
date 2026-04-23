import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      setError(data.error || "Invalid credentials");
    }

    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>Admin — Scentd</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-normal text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Scentd Admin
            </h1>
            <p className="text-sm text-gray-400 mt-1">Sign in to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#FAFAF9] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#FAFAF9] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !form.username || !form.password}
              className="w-full py-2.5 bg-[#1a1a18] text-white text-sm rounded-xl hover:bg-black disabled:opacity-40 transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}