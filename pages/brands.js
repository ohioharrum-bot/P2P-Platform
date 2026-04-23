import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} font-sans`}
    >
      {/* Hero */}
      <section className="relative">
        {/* Soft background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.04),transparent_60%)]"></div>

        <div className="mx-auto max-w-6xl px-6 sm:px-8 pt-16 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10">
            {/* Left: Copy */}
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-wide">
                Discover your next<br />signature scent
              </h1>
              <p className="mt-3 text-gray-600 max-w-prose">
                Compare listings, explore notes, and find authentic fragrances from trusted sellers.
              </p>

              <div className="mt-6 flex items-center gap-3">
                <Link
                  href="/Listing/browse"
                  className="rounded-xl border px-5 py-3 text-sm font-medium hover:opacity-80"
                >
                  Browse fragrances
                </Link>
                <Link
                  href="/about"
                  className="text-sm hover:opacity-70"
                >
                  Learn more →
                </Link>
              </div>
            </div>

            {/* Right: Brand card (optional image if you add one later) */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="SureScent Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                  priority
                />
                <div className="font-serif text-2xl font-semibold tracking-wide">
                  SureScent
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Marketplace for perfume lovers — transparent pricing, real listings, and curated discovery.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-xl border p-3">
                  Authentic
                </div>
                <div className="rounded-xl border p-3">
                  Best prices
                </div>
                <div className="rounded-xl border p-3">
                  Curated picks
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer for future sections */}
      <div className="h-6" />
    </div>
  );
}
