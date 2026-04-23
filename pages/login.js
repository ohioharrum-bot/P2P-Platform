import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import Head from "next/head";

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "buyer" });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        router.push("/");
      } else {
        if (!form.full_name.trim()) throw new Error("Please enter your name.");
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.full_name,
              role: form.role,
            },
          },
        });
        if (error) throw error;
        setSuccess("Account created! Check your email to confirm.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider) {
    setOauthLoading(provider);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setOauthLoading("");
    }
  }

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Poppins:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style>{`
        body { font-family: 'Poppins', sans-serif; }
        .serif { font-family: 'DM Serif Display', serif; }
        .gold { color: var(--color-gold, #b8973a); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #fafaf9 inset !important;
        }
      `}</style>

      <div className="min-h-screen bg-[#FAFAF9] flex">

        {/* Left Panel — decorative */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a18] flex-col justify-between p-12 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                #b8973a 0px,
                #b8973a 1px,
                transparent 1px,
                transparent 12px
              )`,
            }}
          />
          <div className="relative z-10">
            <Link href="/">
              <span className="serif text-white text-2xl tracking-wide cursor-pointer">
                Scentd
              </span>
            </Link>
          </div>
          <div className="relative z-10">
            <div
              className="text-[#b8973a] text-5xl serif leading-none mb-6"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              "Scent is the closest thing to a time machine."
            </div>
            <p className="text-gray-500 text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Buy and sell premium fragrances with confidence.
            </p>
          </div>
          <div className="relative z-10 flex gap-6">
            {["10k+ Listings", "Verified Sellers", "Secure Payments"].map((t) => (
              <div key={t}>
                <div className="text-white text-xs font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>{t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="lg:hidden mb-8">
              <Link href="/">
                <span className="serif text-gray-900 text-2xl tracking-wide cursor-pointer" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Scentd
                </span>
              </Link>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1
                className="text-3xl font-normal text-gray-900 mb-2"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {isLogin ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-sm text-gray-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {isLogin
                  ? "Sign in to manage your listings and messages."
                  : "Join thousands of fragrance lovers today."}
              </p>
            </div>

            {/* Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {["Sign In", "Sign Up"].map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setIsLogin(i === 0); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 text-sm rounded-lg transition-all ${
                    (i === 0) === isLogin
                      ? "bg-white text-gray-900 shadow-sm font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ===== OAuth Buttons ===== */}
            <div className="space-y-3 mb-6">

              {/* Google */}
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={!!oauthLoading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {oauthLoading === "google" ? (
                  <span className="text-sm text-gray-500">Connecting...</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
                      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
                      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
                    </svg>
                    <span className="text-sm text-gray-700 font-medium">Continue with Google</span>
                  </>
                )}
              </button>

              {/* Apple */}
              <button
                type="button"
                onClick={() => handleOAuth("apple")}
                disabled={!!oauthLoading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {oauthLoading === "apple" ? (
                  <span className="text-sm text-gray-500">Connecting...</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 814 1000" fill="none">
                      <path fill="#000" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-165.9-40.8v-.6c-47.2-11.8-85.3-47.6-109.7-87-31.7-51.2-45.1-109.5-45.1-168.5 0-98.8 33.9-200.6 109.1-267.7 54.8-49.9 128.9-80.3 206-80.3 57.4 0 117.3 22.3 162 54.9l-.1.1c51.5 33.8 85.8 54.9 131.4 54.9 40.3 0 69.9-17.4 134.3-55.7 53.3-33.8 109.2-57.8 175.2-57.8z"/>
                      <path fill="#000" d="M500.9 144.4c0-11.6-.6-23.1-2.2-34.5-42.2 1.4-92.2 28.3-123.2 62.9-26 29.1-48.5 74.8-48.5 120.5 0 9.9 1.6 19.8 2.2 23.1 2.8.2 7.3.8 11.6.8 37.8 0 84.1-25.7 113.1-59.4 27.5-31.5 46.9-73.9 47-113.4z"/>
                    </svg>
                    <span className="text-sm text-gray-700 font-medium">Continue with Apple</span>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400" style={{ fontFamily: "'Poppins', sans-serif" }}>or continue with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* ===== Email Form ===== */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fafaf9] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fafaf9] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                />
              </div>

              {!isLogin && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Choose your account type
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "buyer", label: "Buyer" },
                      { value: "seller", label: "Seller" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => set("role", option.value)}
                        className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                          form.role === option.value
                            ? "bg-[#1a1a18] border-[#1a1a18] text-white"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Password
                  </label>
                  {isLogin && (
                    <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-gray-600 transition-colors" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={isLogin ? "••••••••" : "Min. 6 characters"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fafaf9] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {error}
                </div>
              )}

              {success && (
                <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-600" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#1a1a18] text-white text-sm font-medium tracking-wide hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {loading
                  ? isLogin ? "Signing in..." : "Creating account..."
                  : isLogin ? "Sign In" : "Create Account"}
              </button>

            </form>

            <p className="mt-8 text-center text-xs text-gray-400" style={{ fontFamily: "'Poppins', sans-serif" }}>
              By continuing you agree to our{" "}
              <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}