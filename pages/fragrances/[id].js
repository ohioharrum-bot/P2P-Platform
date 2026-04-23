import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import formatPrice from "@/lib/formatPrice";
import { CheckCircle } from "lucide-react";

export default function FragranceDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [fragrance, setFragrance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchRapidApiFragrance = async (name, brand, fetchId) => {
    if (!name || !brand) return null;

    try {
      const response = await fetch("https://fragrance-api.p.rapidapi.com/multi-search", {
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
              q: `${name} ${brand}`,
              facets: ["brand.name", "notes.name", "perfumers.name", "releasedAt"],
              limit: 20,
              offset: 0,
            },
          ],
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const hits = data?.results?.[0]?.hits || [];
      let hit = null;

      if (fetchId) {
        hit = hits.find((item) => String(item.id) === String(fetchId));
      }

      if (!hit) {
        hit = hits.find(
          (item) =>
            item.name === name && item.brand?.name === brand,
        );
      }

      if (!hit) {
        hit = hits[0] || null;
      }

      if (!hit) return null;

      return {
        id: hit.id,
        name: hit.name || "",
        brand: hit.brand?.name || "",
        family: hit.accords?.[0] || "",
        type: hit.type || "",
        gender: (hit.gender || "unisex").toLowerCase(),
        price: hit.price || null,
        image: hit.image?.url || "",
        notes: hit.notes?.map((n) => n.name) || [],
        accords: hit.accords || [],
        longevity: hit.longevity || "",
        sillage: hit.sillage || "",
        description: hit.description || "",
        purchaseUrl: hit.purchase_url || "",
        listings: [],
      };
    } catch (error) {
      console.error("RapidAPI fragrance detail error:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!id) return;

    async function loadFragrance() {
      setLoading(true);
      setNotFound(false);

      const queryName = router.query.name;
      const queryBrand = router.query.brand;
      const querySource = router.query.source;

      if (querySource === "rapidapi" && queryName && queryBrand) {
        const rapidFragrance = await fetchRapidApiFragrance(queryName, queryBrand, id);

        if (rapidFragrance) {
          setFragrance(rapidFragrance);
          setLoading(false);
          return;
        }
      }

      try {
        const response = await fetch(`/api/fragrances/${encodeURIComponent(id)}`);
        if (!response.ok) {
          if (queryName && queryBrand) {
            const rapidFragrance = await fetchRapidApiFragrance(queryName, queryBrand, id);
            if (rapidFragrance) {
              setFragrance(rapidFragrance);
              setLoading(false);
              return;
            }
          }

          setNotFound(true);
          setFragrance(null);
          return;
        }

        const data = await response.json();
        setFragrance(data);
      } catch (error) {
        console.error("Failed to load fragrance:", error);
        if (queryName && queryBrand) {
          const rapidFragrance = await fetchRapidApiFragrance(queryName, queryBrand, id);
          if (rapidFragrance) {
            setFragrance(rapidFragrance);
            setLoading(false);
            return;
          }
        }
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadFragrance();
  }, [id, router.query]);

  if (!router.isReady || loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 sm:px-8 py-20 text-center">
        <p className="text-gray-500">Loading fragrance...</p>
      </div>
    );
  }

  if (notFound || !fragrance) {
    return (
      <div className="mx-auto max-w-4xl px-6 sm:px-8 py-20 text-center">
        <p className="text-gray-500 animate-ss-up">Fragrance not found.</p>
        <Link
          href="/Listing/browse"
          className="mt-6 inline-block text-sm text-[var(--color-gold)] hover:underline"
        >
          Back to Browse
        </Link>
      </div>
    );
  }

  const notes = Array.isArray(fragrance.notes) ? fragrance.notes : [];
  const listings = Array.isArray(fragrance.listings) ? fragrance.listings : [];
  const lowest = listings.length > 0 ? Math.min(...listings.map((l) => l.price)) : fragrance.price;

  const trustedRetailers = [
    {
      name: "FragranceNet",
      url: "https://www.fragrancenet.com",
      logo: "/trusted/fragrancenet.png",
    },
    {
      name: "FragranceX",
      url: "https://www.fragrancex.com",
      logo: "/trusted/fragrancex.png",
    },
    {
      name: "Sephora",
      url: "https://www.sephora.com",
      logo: "/trusted/sephora.png",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 animate-ss-fade-slow">
      <div className="mb-6">
        <Link
          href="/Listing/browse"
          className="text-sm text-gray-500 hover:text-[var(--color-gold)] transition-colors"
        >
          ← Back to Browse
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="flex-1 max-w-md mx-auto lg:mx-0">
          <div className="aspect-square overflow-hidden rounded-2xl border shadow-sm bg-white">
            <img
              src={
                fragrance.image ||
                `https://source.unsplash.com/featured/600x600?${encodeURIComponent(
                  fragrance.brand + " " + fragrance.name + " perfume bottle"
                )}`
              }
              alt={fragrance.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://source.unsplash.com/featured/600x600?perfume-bottle`;
              }}
            />
          </div>
        </div>

        <div className="flex-1">
          <h1 className="font-[var(--font-playfair)] text-3xl sm:text-4xl font-semibold text-gray-900 mb-2">
            {fragrance.name}
          </h1>
          <h2 className="text-base sm:text-lg text-gray-600 mb-6">{fragrance.brand}</h2>

          <div className="border-t border-b border-gray-200 py-4 mb-6 text-sm sm:text-base">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div className="text-gray-700">
                <span className="font-medium">Family:</span> {fragrance.family}
              </div>
              <div className="text-gray-700">
                <span className="font-medium">MSRP:</span> {formatPrice(fragrance.price)}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <span className="font-medium text-gray-800 text-sm sm:text-base">Notes:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {notes.map((n) => (
                <span
                  key={n}
                  className="text-xs sm:text-sm px-3 py-1 rounded-full border bg-neutral-50"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
            From {formatPrice(lowest)}
          </div>
        </div>
      </div>

      <div className="my-14 border-t border-gray-200 relative">
        <div className="absolute inset-0 flex justify-center">
          <span className="bg-white px-4 -translate-y-3 text-[var(--color-gold)] text-xs uppercase tracking-wide font-semibold">
            SureScent Listings
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {listings.length > 0 ? (
          listings.map((listing, i) => (
            <div
              key={i}
              className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col h-full">
                <div className="text-base sm:text-lg font-semibold text-gray-900">
                  {formatPrice(listing.price)}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <CheckCircle className="w-4 h-4 text-[var(--color-gold)]" />
                  <span>Verified Seller</span>
                </div>
                <div className="mt-auto pt-4">
                  <button className="w-full py-2 rounded-lg border border-black text-sm sm:text-base font-medium hover:bg-black hover:text-white transition-colors">
                    View Offer
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600 text-center col-span-full">
            No active user listings yet for this fragrance.
          </p>
        )}
      </div>

      <div className="mt-20 border-t border-gray-200 relative">
        <div className="absolute inset-0 flex justify-center">
          <span className="bg-white px-4 -translate-y-3 text-[var(--color-gold)] text-xs uppercase tracking-wide font-semibold">
            Trusted Retailers
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {trustedRetailers.map((r) => (
          <a
            key={r.name}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
          >
            <div className="relative w-20 h-20 mb-3">
              <img
                src={r.logo}
                alt={r.name}
                className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 rounded-full border border-transparent group-hover:border-[var(--color-gold)] transition-all" />
            </div>
            <div className="font-medium text-gray-900">{r.name}</div>
            <span className="text-sm text-[var(--color-gold)] mt-1">Visit Site →</span>
          </a>
        ))}
      </div>

      <div className="mt-20 max-w-3xl mx-auto text-center px-2">
        <h3 className="font-[var(--font-playfair)] text-2xl sm:text-3xl font-semibold mb-4">
          About {fragrance.name}
        </h3>
        <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
          {fragrance.description ||
            "A timeless composition blending exquisite notes to evoke confidence and sophistication. Each bottle tells a story — crafted for those who appreciate refinement and individuality."}
        </p>
      </div>
    </div>
  );
}
