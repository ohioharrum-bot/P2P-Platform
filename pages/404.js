import Link from "next/link";

export default function Custom404() {
  return (
    <div className="bg-gradient-to-b from-[#fffaf5] to-white min-h-screen flex flex-col items-center justify-center text-center font-[var(--font-lora)] px-6">
      {/* ===== 404 Heading ===== */}
      <div className="max-w-lg mx-auto animate-ss-fade">
        <h1 className="font-[var(--font-cormorant)] text-[6rem] sm:text-[8rem] font-bold text-gray-900 leading-none mb-4">
          404
        </h1>
        <h2 className="font-[var(--font-cormorant)] text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 text-lg mb-10 leading-relaxed">
          The page you’re looking for doesn’t exist, has been moved, or might be
          experiencing a temporary issue. Don’t worry — we’ll guide you back to
          something wonderful.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-xl border border-black px-8 py-3 text-sm font-medium hover:bg-black hover:text-white transition-all"
          >
            ← Back to Home
          </Link>
          <Link
            href="/Listing/browse"
            className="rounded-xl border border-black/70 px-8 py-3 text-sm font-medium hover:bg-black/80 hover:text-white transition-all"
          >
            Browse Fragrances
          </Link>
        </div>
      </div>

      {/* ===== Decorative Accent ===== */}
      <div className="absolute bottom-12 text-sm text-gray-400 font-[var(--font-lora)] animate-ss-fade-slow">
        © {new Date().getFullYear()} SureScent — Crafted with elegance.
      </div>
    </div>
  );
}
