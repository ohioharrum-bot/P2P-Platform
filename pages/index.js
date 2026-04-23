import Link from "next/link";
import { Cormorant_Garamond, Lora } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-lora",
});

export default function Home() {
  return (
    <div
      className={`${cormorant.variable} ${lora.variable} font-sans bg-gradient-to-b from-[#fff8f2] to-white text-gray-800`}
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: "url(/hero-bg.png)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-8 py-24">
          <div className="mx-auto max-w-3xl text-center rounded-3xl border border-white/60 bg-white/60 backdrop-blur-lg shadow-sm p-8 sm:p-12">
            <h1 className="font-[var(--font-cormorant)] text-5xl sm:text-6xl font-semibold tracking-wide mb-6 text-gray-900">
              Discover. Compare. Choose.
            </h1>

            <p className="font-[var(--font-lora)] text-[1.05rem] leading-relaxed text-gray-700 max-w-2xl mx-auto">
              SureScent helps you explore fragrances through real listings, note
              matching, and transparent pricing so you can confidently find your
              next signature scent.
            </p>

            <div className="mt-10 flex justify-center gap-4 flex-wrap">
              <Link
                href="/Listing/browse"
                className="rounded-xl border border-black px-8 py-3 text-sm sm:text-base font-medium hover:bg-black hover:text-white transition-all"
              >
                Browse Fragrances
              </Link>
              <Link
                href="/scent-finder"
                className="rounded-xl border border-black/60 px-8 py-3 text-sm sm:text-base font-medium hover:bg-black/80 hover:text-white transition-all"
              >
                Try the Scent Finder
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative mx-auto max-w-6xl px-6 sm:px-8 py-28 text-center bg-gradient-to-b from-[#fffaf3] to-white overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            fill="none"
            className="w-[520px] h-[520px] opacity-[0.08]"
          >
            <defs>
              <radialGradient id="scentGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c9a66b" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#fffaf3" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="32" fill="url(#scentGlow)" />
            <rect x="22" y="18" width="20" height="28" rx="3" stroke="#c9a66b" strokeWidth="1.4" />
            <rect x="28" y="10" width="8" height="8" fill="#c9a66b" opacity="0.35" />
          </svg>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="particle p1"></div>
          <div className="particle p2"></div>
          <div className="particle p3"></div>
          <div className="particle p4"></div>
          <div className="particle p5"></div>
        </div>

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="h-[2px] w-20 bg-[var(--color-gold)] rounded-full"></div>
          </div>

          <h2 className="font-[var(--font-cormorant)] text-4xl sm:text-5xl font-semibold mb-6 text-gray-900">
            What is SureScent?
          </h2>

          <p className="font-[var(--font-lora)] text-xl sm:text-2xl leading-relaxed text-gray-700 max-w-3xl mx-auto">
            SureScent is a modern fragrance marketplace for collectors and
            connoisseurs. It brings together authentic listings, note exploration,
            and trusted sellers in a space designed to make discovering your next
            signature scent feel effortless and inspiring.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-neutral-50 py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 text-center">
          <h2 className="font-[var(--font-cormorant)] text-4xl sm:text-5xl font-semibold mb-14">
            How It Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            <div className="p-10 rounded-3xl bg-white shadow-sm border hover:-translate-y-1 hover:shadow-md transition-all">
              <div className="flex justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className="w-16 h-16 text-gray-800">
                  <circle cx="28" cy="28" r="12" stroke="#000" />
                  <line x1="38" y1="38" x2="54" y2="54" stroke="#000" />
                </svg>
              </div>
              <h3 className="font-[var(--font-cormorant)] text-2xl font-semibold mb-4 text-gray-900">Discover</h3>
              <p className="font-[var(--font-lora)] text-lg leading-relaxed text-gray-700">
                Browse by brand, family, or notes to find what truly matches your personality and taste.
              </p>
            </div>

            <div className="p-10 rounded-3xl bg-white shadow-sm border hover:-translate-y-1 hover:shadow-md transition-all">
              <div className="flex justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className="w-16 h-16 text-gray-800">
                  <line x1="14" y1="46" x2="50" y2="46" stroke="#000" />
                  <line x1="32" y1="46" x2="32" y2="22" stroke="#000" />
                  <line x1="20" y1="26" x2="44" y2="26" stroke="#000" />
                  <rect x="17" y="26" width="6" height="10" rx="1" fill="#c9a66b" stroke="#000" />
                  <rect x="39" y="26" width="6" height="10" rx="1" fill="#c9a66b" stroke="#000" />
                  <rect x="18" y="23" width="4" height="3" fill="#000" />
                  <rect x="40" y="23" width="4" height="3" fill="#000" />
                </svg>
              </div>
              <h3 className="font-[var(--font-cormorant)] text-2xl font-semibold mb-4 text-gray-900">Compare</h3>
              <p className="font-[var(--font-lora)] text-lg leading-relaxed text-gray-700">
                Review verified listings side by side and find the right balance between price, quality, and authenticity.
              </p>
            </div>

            <div className="p-10 rounded-3xl bg-white shadow-sm border hover:-translate-y-1 hover:shadow-md transition-all">
              <div className="flex justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className="w-16 h-16 text-gray-800">
                  <path d="M10 42c7 3 12 0 15-2.5s5-3.5 8-1 3 3 6 3 4.5-1.5 6.5-1.5" stroke="#000" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="42" y="14" width="6" height="10" rx="1" fill="#c9a66b" stroke="#000" />
                  <rect x="43" y="11" width="4" height="3" fill="#000" />
                </svg>
              </div>
              <h3 className="font-[var(--font-cormorant)] text-2xl font-semibold mb-4 text-gray-900">Choose</h3>
              <p className="font-[var(--font-lora)] text-lg leading-relaxed text-gray-700">
                Select the scent that feels right for you, the one that reflects your mood and becomes part of your daily style.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Particle Animations */}
      <style jsx global>{`
        @keyframes floatUp {
          0% { transform: translate(0, 0); opacity: 0.9; }
          50% { transform: translate(20px, -250px); opacity: 0.7; }
          100% { transform: translate(-15px, -520px); opacity: 0; }
        }
        @keyframes shimmer {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.8); }
          100% { filter: brightness(1); }
        }
        .particle {
          position: absolute;
          border-radius: 9999px;
          background: #c9a66b;
          box-shadow: 0 0 30px rgba(201, 166, 107, 0.6);
          opacity: 0.9;
          animation: floatUp 20s linear infinite, shimmer 4s ease-in-out infinite;
        }
        .particle.p1 { width: 24px; height: 24px; left: 47%; bottom: -60px; animation-delay: 0s; }
        .particle.p2 { width: 28px; height: 28px; left: 52%; bottom: -80px; animation-delay: 4s; }
        .particle.p3 { width: 22px; height: 22px; left: 49%; bottom: -100px; animation-delay: 8s; }
        .particle.p4 { width: 20px; height: 20px; left: 45%; bottom: -120px; animation-delay: 12s; }
        .particle.p5 { width: 30px; height: 30px; left: 54%; bottom: -140px; animation-delay: 16s; }
      `}</style>
    </div>
  );
}