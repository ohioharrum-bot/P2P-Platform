import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import fragrances from "./fragrances";
import { Search, ExternalLink, Tag, ShoppingBag } from "lucide-react";
import Link from "next/link";

const STORE_LOGOS = {
  fragrancenet: { label: "FragranceNet", color: "#1a1a18" },
  amazon: { label: "Amazon", color: "#FF9900" },
  sephora: { label: "Sephora", color: "#E2095C" },
  ulta: { label: "Ulta", color: "#FF6B9D" },
  brand: { label: "Brand Site", color: "#4B5563" },
};

export default function ScentSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [scentResults, setScentResults] = useState([]);
  const [listingResults, setListingResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedScent, setSelectedScent] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Search fragrances data + Supabase listings
  useEffect(() => {
    if (!debouncedQuery) {
      setScentResults([]);
      setListingResults([]);
      setSelectedScent(null);
      return;
    }
    setShowResults(true);
    searchAll(debouncedQuery);
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function searchAll(q) {
    setLoading(true);
    const term = q.toLowerCase();

    // Search local fragrances data
    const matched = fragrances.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        f.brand.toLowerCase().includes(term) ||
        f.family.toLowerCase().includes(term) ||
        (f.notes || []).some((n) => n.toLowerCase().includes(term))
    );
    setScentResults(matched);

    // Search Supabase listings
    const { data } = await supabase
      .from("listings")
      .select(`*, listing_images (image_url, is_cover)`)
      .eq("status", "active")
      .or(`title.ilike.%${q}%,brand.ilike.%${q}%,description.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(6);

    setListingResults(data || []);
    setLoading(false);
  }

  function getCoverImage(listing) {
    if (!listing?.listing_images?.length) return null;
    const cover = listing.listing_images.find((i) => i.is_cover);
    return cover?.image_url || listing.listing_images[0]?.image_url;
  }

  const hasResults = scentResults.length > 0 || listingResults.length > 0;

  return (
    <div className="w-full max-w-2xl relative" style={{ fontFamily: "'Poppins', sans-serif" }} ref={containerRef}>

      {/* Search bar */}
      <div className="relative z-50">
        <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => query && setShowResults(true)}
          placeholder="Search any cologne or perfume..."
          className="w-full pl-14 pr-5 py-3.5 rounded-2xl border border-gray-200 bg-white text-base font-medium text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 shadow-sm transition-colors"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        />
        {loading && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results - Absolute positioned so it doesn't push navbar */}
      {debouncedQuery && showResults && (
        <div className="absolute top-full left-0 right-0 mt-3 z-50 bg-white rounded-2xl shadow-lg border border-gray-100 max-h-96 overflow-y-auto">
          <div className="p-5 space-y-6">

          {/* No results */}
          {!loading && !hasResults && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-base" style={{ fontFamily: "'Poppins', sans-serif" }}>No results for "{debouncedQuery}"</p>
            </div>
          )}

          {/* ===== Section 1: Buy new (from fragrances data) ===== */}
          {scentResults.length > 0 && listingResults.length === 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag size={18} className="text-gray-500" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500" style={{ fontFamily: "'Poppins', sans-serif" }}>Buy New</h3>
              </div>

              <div className="space-y-4">
                {scentResults.slice(0, 4).map((scent) => (
                  <div key={scent.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div
                      className="flex items-center gap-5 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedScent(selectedScent?.id === scent.id ? null : scent)}
                    >
                      {/* Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {scent.image ? (
                          <img src={scent.image} alt={scent.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🫧</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-semibold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{scent.name}</p>
                          <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>{scent.brand}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-sm text-gray-500" style={{ fontFamily: "'Poppins', sans-serif" }}>{scent.family}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500" style={{ fontFamily: "'Poppins', sans-serif" }}>{scent.type}</span>
                          {scent.gender && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-sm text-gray-500" style={{ fontFamily: "'Poppins', sans-serif" }}>{scent.gender}</span>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {(scent.notes || []).slice(0, 3).map((n) => (
                            <span key={n} className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>{n}</span>
                          ))}
                        </div>
                      </div>

                      {/* Price + expand */}
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>${scent.price}</p>
                        <p className="text-sm text-gray-500 mt-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{selectedScent?.id === scent.id ? "▲ Hide" : "▼ Buy"}</p>
                      </div>
                    </div>

                    {/* Buy links expanded */}
                    {selectedScent?.id === scent.id && scent.buyLinks && Object.keys(scent.buyLinks).length > 0 && (
                      <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                        <p className="text-sm text-gray-600 mb-3 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>Where to buy new:</p>
                        <div className="flex flex-wrap gap-2.5">
                          {Object.entries(scent.buyLinks || {}).map(([store, url]) => (
                            <a
                              key={store}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                              style={{ fontFamily: "'Poppins', sans-serif" }}
                            >
                              <ExternalLink size={14} />
                              {STORE_LOGOS[store]?.label || store}
                            </a>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Prices may vary by retailer</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== Section 2: Buy used (from Supabase listings) ===== */}
          {listingResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Tag size={18} className="text-gray-500" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500" style={{ fontFamily: "'Poppins', sans-serif" }}>Buy Used on Scentd</h3>
                <span className="text-xs text-gray-400" style={{ fontFamily: "'Poppins', sans-serif" }}>— save up to 60%</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {listingResults.map((listing) => {
                  const cover = getCoverImage(listing);
                  return (
                    <div
                      key={listing.id}
                      onClick={() => router.push(`/Listing/${listing.id}`)}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square bg-gray-50">
                        {cover ? (
                          <img src={cover} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">🫧</div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-semibold text-gray-900 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>{listing.title}</p>
                        <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{listing.brand}</p>
                        <p className="text-base font-bold text-gray-900 mt-2" style={{ fontFamily: "'Poppins', sans-serif" }}>${listing.price}</p>
                        {listing.condition && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium mt-2 inline-block" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {{ new: "New", like_new: "Like New", good: "Good", fair: "Fair" }[listing.condition]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link
                href={`/Listing/browse?q=${encodeURIComponent(debouncedQuery)}`}
                className="mt-4 inline-block text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                See all listings for "{debouncedQuery}" →
              </Link>
            </div>
          )}

          </div>
        </div>
      )}
    </div>
  );
}