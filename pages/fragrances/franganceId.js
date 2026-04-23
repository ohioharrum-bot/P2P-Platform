import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShoppingBag } from "lucide-react";
import fragrances from "../../data/fragrances";

const STORE_LABELS = {
  fragrancenet: "FragranceNet",
  amazon: "Amazon",
  sephora: "Sephora",
  ulta: "Ulta",
  brand: "Brand Site",
};

const STORE_COLORS = {
  fragrancenet: "#1a1a18",
  amazon: "#FF9900",
  sephora: "#E2095C",
  ulta: "#FF6B9D",
  brand: "#4B5563",
};

export default function FragranceDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [fragrance, setFragrance] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const found = fragrances.find((f) => f.id === id);
    setFragrance(found || null);
  }, [id]);

  if (!fragrance) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <p className="text-sm text-gray-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Loading...</p>
      </div>
    );
  }

  const imageUrl = imgError
    ? `https://source.unsplash.com/400x400/?perfume,luxury,bottle`
    : `https://source.unsplash.com/400x400/?${encodeURIComponent(fragrance.brand)},perfume,bottle`;

  return (
    <>
      <Head>
        <title>{fragrance.name} by {fragrance.brand} — Scentd</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-[#FAFAF9]">
        <div className="max-w-5xl mx-auto px-4 py-10">

          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Left — Image */}
            <div>
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
                <img
                  src={imageUrl}
                  alt={fragrance.name}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              </div>

              {/* Notes */}
              {fragrance.notes?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Fragrance Notes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fragrance.notes.map((note) => (
                      <span
                        key={note}
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right — Details */}
            <div className="flex flex-col">

              {/* Brand + name */}
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {fragrance.brand}
                </p>
                <h1 className="text-3xl font-normal text-gray-900 leading-snug" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {fragrance.name}
                </h1>
              </div>

              {/* Price */}
              <div className="text-3xl font-semibold text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                From ${fragrance.price}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {fragrance.family}
                </span>
                <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {fragrance.type}
                </span>
                <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {fragrance.gender?.charAt(0).toUpperCase() + fragrance.gender?.slice(1)}
                </span>
              </div>

              {/* Description */}
              {fragrance.description && (
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>About</p>
                  <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {fragrance.description}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 my-4" />

              {/* Buy links */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag size={14} className="text-gray-500" />
                  <p className="text-xs uppercase tracking-wider text-gray-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Where to buy new
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {Object.entries(fragrance.buyLinks || {}).map(([store, url]) => (
                    <a
                      key={store}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm transition-all"
                    >
                      <span className="text-sm font-medium text-gray-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {STORE_LABELS[store] || store}
                      </span>
                      <ExternalLink size={14} className="text-gray-400" />
                    </a>
                  ))}
                </div>
                <p className="text-xs text-gray-300 mt-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Prices may vary by retailer
                </p>
              </div>

              <div className="border-t border-gray-100 my-4" />

              {/* Used listings CTA */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Want it cheaper?
                </p>
                <p className="text-xs text-gray-500 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Find used {fragrance.name} listings on Scentd and save up to 60%.
                </p>
                <Link
                  href={`/Listing/browse?q=${encodeURIComponent(fragrance.name)}`}
                  className="inline-block px-4 py-2 bg-[#1a1a18] text-white text-xs rounded-xl hover:bg-black transition-colors"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Find used listings →
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}