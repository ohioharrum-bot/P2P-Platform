import Link from "next/link";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function About() {
  return (
    <div className={`bg-gradient-to-b from-[#fffaf5] to-white min-h-screen ${poppins.className}`}>
      {/* ===== Header Section ===== */}
      <section className="mx-auto max-w-5xl px-6 sm:px-8 py-20 text-center">
        <h1 className="font-[var(--font-cormorant)] text-5xl sm:text-6xl font-semibold text-gray-900 mb-6">
          About SureScent
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          A curated marketplace where fragrance meets transparency. Our mission is
          to make discovering, comparing, and choosing your next scent effortless —
          with authenticity and elegance at every step.
        </p>
      </section>

      {/* ===== Story Section ===== */}
      <section className="mx-auto max-w-6xl px-6 sm:px-8 py-16 border-t border-neutral-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="rounded-3xl overflow-hidden shadow-md border bg-white/80 backdrop-blur-sm">
            <img
              src="/about-hero.jpg"
              alt="SureScent Brand Story"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Text */}
          <div>
            <h2 className="font-[var(--font-cormorant)] text-3xl font-semibold mb-4">
              Our Story
            </h2>
            <p className="text-gray-700 mb-5 leading-relaxed">
              SureScent began with a simple idea — to bring the joy of scent discovery
              to fragrance lovers everywhere. We noticed how difficult it was to
              compare real prices, find trusted sellers, or even explore new scents
              with confidence. So, we created a platform that brings everything
              together.
            </p>
            <p className="text-gray-700 mb-5 leading-relaxed">
              Today, SureScent blends technology with timeless sophistication. Whether
              you’re a seasoned collector or just beginning your fragrance journey,
              we make it easy to explore the stories behind every bottle.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Values Section ===== */}
      <section className="mx-auto max-w-6xl px-6 sm:px-8 py-20 text-center border-t border-neutral-200">
        <h2 className="font-[var(--font-cormorant)] text-3xl font-semibold mb-10">
          What We Stand For
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white shadow-xl border border-gray-200">
            <h3 className="font-semibold text-xl mb-3">Authenticity</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every listing is verified for authenticity and quality. We value trust
              above everything.
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-white shadow-xl border border-gray-200">
            <h3 className="font-semibold text-xl mb-3">Transparency</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We believe in honest pricing and clear comparisons, so you can make
              confident choices.
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-white shadow-xl border border-gray-200">
            <h3 className="font-semibold text-xl mb-3">Discovery</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Fragrance is a journey. SureScent helps you explore new scents and rediscover
              timeless classics.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Call to Action ===== */}
      <section className="mx-auto max-w-6xl px-6 sm:px-8 py-20 text-center border-t border-neutral-200">
        <h2 className="font-[var(--font-cormorant)] text-3xl font-semibold mb-6">
          Join the SureScent Journey
        </h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Explore fragrances, share your favorites, and connect with other scent
          enthusiasts. SureScent is more than a marketplace — it’s a community built
          on appreciation, authenticity, and passion.
        </p>
        <Link
          href="/Listing/browse"
          className="inline-block rounded-xl border border-black px-8 py-3 text-sm font-medium hover:bg-black hover:text-white transition-all"
        >
          Start Browsing
        </Link>
      </section>
    </div>
  );
}
