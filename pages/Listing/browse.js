import { useRouter } from "next/router";
import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import {
  Filter,
  X,
  Search,
  ShoppingBag,
  Tag,
  ExternalLink,
} from "lucide-react";
import Head from "next/head";

const CONDITIONS = ["new", "like_new", "good", "fair"];
const GENDERS = ["men", "women", "unisex"];

const POPULAR_BRANDS = [
  "Creed",
  "Chanel",
  "Dior",
  "Tom Ford",
  "YSL",
  "Versace",
  "Giorgio Armani",
  "Jo Malone",
  "Byredo",
  "Maison Margiela",
  "Guerlain",
  "Hermès",
  "Prada",
  "Viktor & Rolf",
  "Lancôme",
  "Marc Jacobs",
  "Dolce & Gabbana",
  "Carolina Herrera",
  "Le Labo",
  "Diptyque",
];

const STORE_LABELS = {
  fragrancenet: "FragranceNet",
  amazon: "Amazon",
  sephora: "Sephora",
  ulta: "Ulta",
  brand: "Brand Site",
};

function formatCondition(c) {
  return (
    { new: "New", like_new: "Like New", good: "Good", fair: "Fair" }[c] || c
  );
}

function getCoverImage(listing) {
  if (!listing?.listing_images?.length) return null;
  const cover = listing.listing_images.find((i) => i.is_cover);
  return cover?.image_url || listing.listing_images[0]?.image_url;
}

// ── UPDATED: handles both raw Fragella responses and Supabase cache rows ──
function mapFragrance(f) {
  const name = f["Name"] || f.name || "";
  const brand = f["Brand"] || f.brand || "";
  const imageUrl = f["Image URL"] || f.image_url || "";
  const purchaseUrl = f["Purchase URL"] || f.purchase_url || "";

  // notes_flat comes from the DB cache path (rowToFrontend sets it)
  // otherwise build from top / middle / base note arrays
  const notes = f.notes_flat?.length
    ? f.notes_flat
    : [
        ...(f["Top Notes"] || []).map((n) => n["Name"] || n),
        ...(f["Middle Notes"] || []).map((n) => n["Name"] || n),
        ...(f["Base Notes"] || []).map((n) => n["Name"] || n),
      ].slice(0, 8);

  return {
    id:
      f["ID"] || f.id || `${brand}-${name}`.toLowerCase().replace(/\s+/g, "-"),
    name,
    brand,
    family: (f["Main Accords"] || f.accords || [])[0] || "",
    type: f["Type"] || f.type || "",
    gender: (f["Gender"] || f.gender || "unisex").toLowerCase(),
    price: f["Price"] || f.price || null,
    image: imageUrl,
    imageWebp: imageUrl ? imageUrl.replace(".jpg", ".webp") : "",
    notes,
    accords: f["Main Accords"] || f.accords || [],
    longevity: f["Longevity"] || f.longevity || "",
    sillage: f["Sillage"] || f.sillage || "",
    description: f["Description"] || f.description || "",
    purchaseUrl,
    buyLinks: {
      ...(purchaseUrl ? { brand: purchaseUrl } : {}),
      amazon: `https://www.amazon.com/s?k=${encodeURIComponent(name + " " + brand)}`,
      sephora: `https://www.sephora.com/search?keyword=${encodeURIComponent(name)}`,
      ulta: `https://www.ulta.com/search?search=${encodeURIComponent(name)}`,
      fragrancenet: `https://www.fragrancenet.com/search#/?q=${encodeURIComponent(name)}`,
    },
  };
}

function FragranceCard({ scent, onClick }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-50 overflow-hidden">
        {scent.imageWebp && !imgErr ? (
          <img
            src={scent.imageWebp}
            alt={scent.name}
            className="w-full h-full object-contain"
            onError={() => setImgErr(true)}
          />
        ) : scent.image && !imgErr ? (
          <img
            src={scent.image}
            alt={scent.name}
            className="w-full h-full object-contain"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1a18] gap-1">
            <div
              className="text-xl font-bold text-[#b8973a]"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {scent.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div
              className="text-[9px] uppercase tracking-widest text-[#b8973a] opacity-70 text-center px-2"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {scent.brand}
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <p
          className="text-xs font-medium text-gray-900 truncate"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {scent.name}
        </p>
        <p
          className="text-xs text-gray-500 mt-0.5"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {scent.brand}
        </p>
        <div className="flex items-center justify-between mt-1">
          {scent.price ? (
            <p
              className="text-sm font-semibold text-gray-900"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              ~${scent.price}
            </p>
          ) : (
            <p
              className="text-xs text-gray-400"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              View price
            </p>
          )}
          {scent.family && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 truncate max-w-[80px]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {scent.family}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Browse() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [apiFragrances, setApiFragrances] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("Creed");

  const [selectedScent, setSelectedScent] = useState(null);

  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [activeFilters, setActiveFilters] = useState({
    brands: [],
    conditions: [],
    genders: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const availableBrands = useMemo(() => {
    const brands = new Set(listings.map((l) => l.brand).filter(Boolean));
    return Array.from(brands).sort();
  }, [listings]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 1000);
    return () => clearTimeout(t);
  }, [searchQuery]);

  let lastQuery = "";

  const fetchFragrances = useCallback(async (params) => {
    const qs = new URLSearchParams(params).toString();

    if (qs === lastQuery) return; // prevent duplicate request
    lastQuery = qs;

    setApiLoading(true);

    try {
      // Try Supabase first for search queries
      if (params.search) {
        const { data: searchResults, error } = await supabase
          .from('fragrances')
          .select('*')
          .or(`name.ilike.%${params.search}%,brand.ilike.%${params.search}%`)
          .limit(params.limit || 30);

        if (!error && searchResults && searchResults.length > 0) {
          console.log(`Found ${searchResults.length} fragrances in Supabase for "${params.search}"`);
          setApiFragrances(searchResults.map(mapFragrance));
          setApiLoading(false);
          return;
        }
      }

      // Fallback to RapidAPI
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "fragrance-api.p.rapidapi.com",
          "x-rapidapi-key": "43adc8b128msh3533d6e30965f42p19e94ejsnb8ccbfcc6d07",
        },
        body: JSON.stringify({
          queries: [
            {
              indexUid: "fragrances",
              q: params.search || params.brand || "Chanel",
              facets: ["brand.name", "notes.name", "perfumers.name", "releasedAt"],
              limit: params.limit || 30,
              offset: 0,
            },
          ],
        }),
      };

      const response = await fetch(
        "https://fragrance-api.p.rapidapi.com/multi-search",
        options
      );
      const result = await response.json();
      const hits = result?.results?.[0]?.hits || [];

      setApiFragrances(hits.map(f => ({
        id: f.id || `${f.brand?.name}-${f.name}`.toLowerCase().replace(/\s+/g, "-"),
        name: f.name,
        brand: f.brand?.name || "",
        family: f.accords?.[0] || "",
        type: f.type || "",
        gender: f.gender || "unisex",
        price: f.price || null,
        image: f.image?.url || "",
        imageWebp: f.image?.url ? f.image.url.replace(".jpg", ".webp") : "",
        notes: f.notes?.map(n => n.name) || [],
        accords: f.accords || [],
        longevity: f.longevity || "",
        sillage: f.sillage || "",
        description: f.description || "",
        purchaseUrl: f.purchase_url || "",
        buyLinks: {
          ...(f.purchase_url ? { brand: f.purchase_url } : {}),
          amazon: `https://www.amazon.com/s?k=${encodeURIComponent(f.name + " " + (f.brand?.name || ""))}`,
          sephora: `https://www.sephora.com/search?keyword=${encodeURIComponent(f.name)}`,
          ulta: `https://www.ulta.com/search?search=${encodeURIComponent(f.name)}`,
          fragrancenet: `https://www.fragrancenet.com/search#/?q=${encodeURIComponent(f.name)}`,
        },
      })));
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      fetchFragrances({ search: debouncedSearch, limit: 30 });
    } else {
      fetchFragrances({ brand: selectedBrand, limit: 30 });
    }
  }, [debouncedSearch, selectedBrand]);

  useEffect(() => {
    async function fetchListings() {
      setLoadingListings(true);
      const { data, error } = await supabase
        .from("listings")
        .select(`*, listing_images (image_url, is_cover, display_order)`)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (!error && data) setListings(data);
      setLoadingListings(false);
    }
    fetchListings();
  }, []);

  // Fetch popular brands on load - try Supabase first, then RapidAPI
  useEffect(() => {
    async function fetchPopularBrands() {
      try {
        // First try to get from Supabase
        const { data: supabaseFragrances, error } = await supabase
          .from('fragrances')
          .select('*')
          .in('brand', ["Chanel", "Dior", "Tom Ford", "Gucci", "Versace"])
          .limit(20);

        if (!error && supabaseFragrances && supabaseFragrances.length > 0) {
          console.log('Loaded fragrances from Supabase:', supabaseFragrances.length);
          setApiFragrances(supabaseFragrances.map(mapFragrance));
          return;
        }

        // Fallback to RapidAPI if Supabase is empty
        console.log('No fragrances in Supabase, fetching from RapidAPI...');
        const brands = ["Chanel", "Dior", "Tom Ford", "Gucci", "Versace"];
        const allFragrances = [];

        for (const brand of brands) {
          try {
            const options = {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-rapidapi-host": "fragrance-api.p.rapidapi.com",
                "x-rapidapi-key": "43adc8b128msh3533d6e30965f42p19e94ejsnb8ccbfcc6d07",
              },
              body: JSON.stringify({
                queries: [
                  {
                    indexUid: "fragrances",
                    q: brand,
                    facets: ["brand.name", "notes.name", "perfumers.name", "releasedAt"],
                    limit: 4,
                    offset: 0,
                  },
                ],
              }),
            };

            const response = await fetch(
              "https://fragrance-api.p.rapidapi.com/multi-search",
              options
            );
            const result = await response.json();
            const hits = result?.results?.[0]?.hits || [];
            allFragrances.push(...hits);
          } catch (error) {
            console.error(`Error fetching ${brand}:`, error);
          }
        }

        // Convert to the expected format for the UI
        setApiFragrances(allFragrances.map(f => ({
          id: f.id || `${f.brand?.name}-${f.name}`.toLowerCase().replace(/\s+/g, "-"),
          name: f.name,
          brand: f.brand?.name || "",
          family: f.accords?.[0] || "",
          type: f.type || "",
          gender: f.gender || "unisex",
          price: f.price || null,
          image: f.image?.url || "",
          imageWebp: f.image?.url ? f.image.url.replace(".jpg", ".webp") : "",
          notes: f.notes?.map(n => n.name) || [],
          accords: f.accords || [],
          longevity: f.longevity || "",
          sillage: f.sillage || "",
          description: f.description || "",
          purchaseUrl: f.purchase_url || "",
          buyLinks: {
            ...(f.purchase_url ? { brand: f.purchase_url } : {}),
            amazon: `https://www.amazon.com/s?k=${encodeURIComponent(f.name + " " + (f.brand?.name || ""))}`,
            sephora: `https://www.sephora.com/search?keyword=${encodeURIComponent(f.name)}`,
            ulta: `https://www.ulta.com/search?search=${encodeURIComponent(f.name)}`,
            fragrancenet: `https://www.fragrancenet.com/search#/?q=${encodeURIComponent(f.name)}`,
          },
        })));
      } catch (error) {
        console.error('Error fetching fragrances:', error);
      }
    }

    fetchPopularBrands();
  }, []);

  const filteredListings = useMemo(() => {
    let items = listings;
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      items = items.filter(
        (l) =>
          l.title?.toLowerCase().includes(term) ||
          l.brand?.toLowerCase().includes(term) ||
          l.description?.toLowerCase().includes(term),
      );
    }
    if (activeFilters.brands.length > 0)
      items = items.filter((l) => activeFilters.brands.includes(l.brand));
    if (activeFilters.conditions.length > 0)
      items = items.filter((l) =>
        activeFilters.conditions.includes(l.condition),
      );
    if (activeFilters.genders.length > 0)
      items = items.filter((l) => activeFilters.genders.includes(l.gender));
    return items;
  }, [listings, debouncedSearch, activeFilters]);

  function toggleFilter(type, value) {
    setActiveFilters((prev) => {
      const current = prev[type];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  }

  function clearFilters() {
    setActiveFilters({ brands: [], conditions: [], genders: [] });
  }

  const SidebarContent = (
    <div className="h-full overflow-y-auto">
      <h2
        className="text-lg font-semibold mb-4"
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        Filters
      </h2>

      <div className="mb-6">
        <h3
          className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Browse by Brand
        </h3>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {POPULAR_BRANDS.map((b) => (
            <button
              key={b}
              onClick={() => {
                setSelectedBrand(b);
                setSearchQuery("");
              }}
              className={`w-full text-left text-sm px-2 py-1 rounded-lg transition-colors ${selectedBrand === b && !debouncedSearch ? "bg-[#1a1a18] text-white" : "text-gray-700 hover:bg-gray-50"}`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 my-4" />

      <div className="mb-6">
        <h3
          className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Brand (used only)
        </h3>
        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
          {availableBrands.map((b) => (
            <label
              key={b}
              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <input
                type="checkbox"
                className="accent-[var(--color-gold)]"
                checked={activeFilters.brands.includes(b)}
                onChange={() => toggleFilter("brands", b)}
              />
              {b}
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 my-4" />

      <div className="mb-6">
        <h3
          className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Condition (used only)
        </h3>
        <div className="space-y-1">
          {CONDITIONS.map((c) => (
            <label
              key={c}
              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <input
                type="checkbox"
                className="accent-[var(--color-gold)]"
                checked={activeFilters.conditions.includes(c)}
                onChange={() => toggleFilter("conditions", c)}
              />
              {formatCondition(c)}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3
          className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Gender
        </h3>
        <div className="space-y-1">
          {GENDERS.map((g) => (
            <label
              key={g}
              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <input
                type="checkbox"
                className="accent-[var(--color-gold)]"
                checked={activeFilters.genders.includes(g)}
                onChange={() => toggleFilter("genders", g)}
              />
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="w-full border border-[var(--color-gold)] text-[var(--color-gold)] rounded-lg py-1.5 text-sm hover:bg-[var(--color-gold)] hover:text-white transition-colors"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Clear All
      </button>
    </div>
  );

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Poppins:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block sticky self-start top-24 h-max rounded-2xl border bg-white shadow-sm p-5">
          {SidebarContent}
        </aside>

        {/* Main */}
        <div>
          {/* Desktop header */}
          <div className="hidden lg:flex items-center justify-between gap-4 mb-4">
            <h1
              className="text-3xl font-semibold tracking-wide"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Browse Fragrances
            </h1>
            <Link
              href="/Listing/createListing"
              className="px-4 py-2 bg-[#1a1a18] text-white text-sm rounded-xl hover:bg-black transition-colors"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              + Sell yours
            </Link>
          </div>

          {/* Mobile header */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h1
              className="text-2xl font-semibold tracking-wide"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Browse
            </h1>
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm hover:bg-neutral-50"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <Filter size={16} /> Filters
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 74,000+ fragrances by name, brand, or note..."
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 shadow-sm transition-colors"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
            {[
              { key: "all", label: "All" },
              { key: "used", label: `Buy Used (${filteredListings.length})` },
              {
                key: "new",
                label: `Buy New (${apiFragrances.length}${apiLoading ? "..." : ""})`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${activeTab === tab.key ? "bg-white text-gray-900 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"}`}
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ===== USED LISTINGS ===== */}
          {(activeTab === "all" || activeTab === "used") && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={15} className="text-gray-500" />
                <h3
                  className="text-xs font-medium uppercase tracking-wider text-gray-500"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Buy Used — save up to 60%
                </h3>
              </div>

              {loadingListings && (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border bg-white shadow-sm animate-pulse"
                    >
                      <div className="aspect-square rounded-t-2xl bg-gray-100" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loadingListings && filteredListings.length === 0 && (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl">
                  <p
                    className="text-gray-400 text-sm mb-3"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    No used listings yet
                  </p>
                  <Link
                    href="/Listing/createListing"
                    className="text-xs px-4 py-2 bg-[#1a1a18] text-white rounded-xl hover:bg-black transition-colors"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    + Sell yours
                  </Link>
                </div>
              )}

              {!loadingListings && filteredListings.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredListings.map((listing) => {
                    const cover = getCoverImage(listing);
                    return (
                      <div
                        key={listing.id}
                        onClick={() => router.push(`/Listing/${listing.id}`)}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square bg-gray-50">
                          {cover ? (
                            <img
                              src={cover}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl">
                              🫧
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p
                            className="text-xs font-medium text-gray-900 truncate"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                          >
                            {listing.title}
                          </p>
                          <p
                            className="text-xs text-gray-500 mt-0.5"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                          >
                            {listing.brand}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p
                              className="text-sm font-semibold text-gray-900"
                              style={{ fontFamily: "'Poppins', sans-serif" }}
                            >
                              ${listing.price}
                            </p>
                            {listing.condition && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                                style={{ fontFamily: "'Poppins', sans-serif" }}
                              >
                                {formatCondition(listing.condition)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== BUY NEW — from Fragella API ===== */}
          {(activeTab === "all" || activeTab === "new") && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={15} className="text-gray-500" />
                  <h3
                    className="text-xs font-medium uppercase tracking-wider text-gray-500"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {debouncedSearch
                      ? `Search results for "${debouncedSearch}"`
                      : `${selectedBrand} fragrances`}
                  </h3>
                </div>
                <span
                  className="text-xs text-gray-400"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Browse a wide selection of fragrances
                </span>
              </div>

              {apiLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border bg-white shadow-sm animate-pulse"
                    >
                      <div className="aspect-square rounded-t-2xl bg-gray-100" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!apiLoading && apiFragrances.length === 0 && (
                <div className="text-center py-16">
                  <p
                    className="text-gray-400 text-sm"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    No fragrances found
                  </p>
                </div>
              )}

              {!apiLoading && apiFragrances.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {apiFragrances.map((scent, i) => (
                    <FragranceCard
                      key={scent.id || i}
                      scent={scent}
                      onClick={() =>
                        setSelectedScent(
                          selectedScent?.id === scent.id ? null : scent,
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== BUY LINKS PANEL ===== */}
          {selectedScent && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {selectedScent.imageWebp ? (
                      <img
                        src={selectedScent.imageWebp}
                        alt={selectedScent.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = selectedScent.image;
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full bg-[#1a1a18] flex items-center justify-center text-[#b8973a] font-bold text-lg"
                        style={{ fontFamily: "'DM Serif Display', serif" }}
                      >
                        {selectedScent.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs uppercase tracking-wider text-gray-400"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {selectedScent.brand}
                    </p>
                    <h3
                      className="text-lg font-normal text-gray-900"
                      style={{ fontFamily: "'DM Serif Display', serif" }}
                    >
                      {selectedScent.name}
                    </h3>
                    {selectedScent.price && (
                      <p
                        className="text-sm font-semibold text-gray-700 mt-0.5"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        ~${selectedScent.price}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedScent(null)}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                {selectedScent.notes?.length > 0 && (
                  <div className="mb-4">
                    <p
                      className="text-xs uppercase tracking-wider text-gray-400 mb-2"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      Notes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedScent.notes.map((n) => (
                        <span
                          key={n}
                          className="text-[10px] px-2 py-1 rounded-full border border-gray-200 text-gray-600"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedScent.longevity || selectedScent.sillage) && (
                  <div className="flex gap-4 mb-4">
                    {selectedScent.longevity && (
                      <div>
                        <p
                          className="text-[10px] uppercase tracking-wider text-gray-400"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          Longevity
                        </p>
                        <p
                          className="text-xs text-gray-700 font-medium"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          {selectedScent.longevity}
                        </p>
                      </div>
                    )}
                    {selectedScent.sillage && (
                      <div>
                        <p
                          className="text-[10px] uppercase tracking-wider text-gray-400"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          Sillage
                        </p>
                        <p
                          className="text-xs text-gray-700 font-medium"
                          style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                          {selectedScent.sillage}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p
                    className="text-xs uppercase tracking-wider text-gray-400 mb-2"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Where to buy new
                  </p>
                  <div className="flex flex-col gap-2">
                    {Object.entries(selectedScent.buyLinks || {}).map(
                      ([store, url]) => (
                        <a
                          key={store}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm transition-all"
                        >
                          <span
                            className="text-sm font-medium text-gray-800"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                          >
                            {STORE_LABELS[store] || store}
                          </span>
                          <ExternalLink size={14} className="text-gray-400" />
                        </a>
                      ),
                    )}
                  </div>
                  <p
                    className="text-xs text-gray-300 mt-2"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Prices may vary by retailer
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p
                    className="text-xs text-gray-500 mb-2"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Want it cheaper? Find used listings:
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery(selectedScent.name);
                      setActiveTab("used");
                      setSelectedScent(null);
                    }}
                    className="w-full py-2.5 bg-[#1a1a18] text-white text-xs rounded-xl hover:bg-black transition-colors"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Search used listings for "{selectedScent.name}" →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex">
            <div className="bg-white w-72 max-w-full h-full p-5 shadow-xl overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2
                  className="text-lg font-semibold"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  Filters
                </h2>
                <button onClick={() => setShowFilters(false)}>
                  <X size={18} />
                </button>
              </div>
              {SidebarContent}
            </div>
            <div className="flex-1" onClick={() => setShowFilters(false)} />
          </div>
        )}
      </div>
    </>
  );
}