import { useState } from "react";
import Link from "next/link";
import formatPrice from "@/lib/formatPrice";

export default function ScentFinder() {
  const [answers, setAnswers] = useState({
    name: "",
    family: "",
    mood: "",
    price: "",
  });
  const [result, setResult] = useState(null);
  const [noResults, setNoResults] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({ ...prev, [name]: value }));
    setNoResults(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, family, mood, price } = answers;
    const searchTerm = [name, family, mood].filter(Boolean).join(" ").trim();

    if (!searchTerm) {
      setResult(null);
      setNoResults(true);
      return;
    }

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
              q: searchTerm || "Chanel",
              facets: ["brand.name", "notes.name", "perfumers.name", "releasedAt"],
              limit: 100,
              offset: 0,
            },
          ],
        }),
      };

      const response = await fetch(
        "https://fragrance-api.p.rapidapi.com/multi-search",
        options
      );
      const data = await response.json();
      const hits = data?.results?.[0]?.hits || [];

      const results = hits.map((f) => ({
        id:
          f.id ||
          `${f.brand?.name || ""}-${f.name}`
            .toLowerCase()
            .replace(/\s+/g, "-"),
        name: f.name || "",
        brand: f.brand?.name || "",
        family: f.accords?.[0] || "",
        type: f.type || "",
        gender: (f.gender || "unisex").toLowerCase(),
        price: f.price || null,
        image: f.image?.url || "",
        notes: f.notes?.map((n) => n.name) || [],
        accords: f.accords || [],
        longevity: f.longevity || "",
        sillage: f.sillage || "",
        description: f.description || "",
      }));

      const normalizeText = (value) =>
        String(value || "").toLowerCase();

      const matchesFamily = (fragrance, familyValue) => {
        const normalizedFamily = familyValue.toLowerCase();
        const familyText = normalizeText(fragrance.family);
        const notesText = normalizeText(fragrance.notes?.join(" "));
        const descriptionText = normalizeText(fragrance.description);
        const nameText = normalizeText(fragrance.name);

        return (
          familyText.includes(normalizedFamily) ||
          notesText.includes(normalizedFamily) ||
          descriptionText.includes(normalizedFamily) ||
          nameText.includes(normalizedFamily)
        );
      };

      const matchesMood = (fragrance, moodValue) => {
        const normalizedMood = moodValue.toLowerCase();
        const familyText = normalizeText(fragrance.family);
        const notesText = normalizeText(fragrance.notes?.join(" "));
        const descriptionText = normalizeText(fragrance.description);
        const nameText = normalizeText(fragrance.name);

        if (normalizedMood === "fresh") {
          return (
            familyText.includes("citrus") ||
            familyText.includes("green") ||
            familyText.includes("aquatic") ||
            notesText.includes("fresh") ||
            descriptionText.includes("fresh") ||
            nameText.includes("fresh")
          );
        }

        if (normalizedMood === "warm") {
          return (
            familyText.includes("amber") ||
            familyText.includes("woody") ||
            notesText.includes("warm") ||
            notesText.includes("spice") ||
            descriptionText.includes("warm") ||
            nameText.includes("warm")
          );
        }

        if (normalizedMood === "romantic") {
          return (
            familyText.includes("floral") ||
            notesText.includes("rose") ||
            notesText.includes("floral") ||
            notesText.includes("sweet") ||
            descriptionText.includes("romantic") ||
            nameText.includes("romantic")
          );
        }

        if (normalizedMood === "bold") {
          return (
            familyText.includes("oud") ||
            familyText.includes("leather") ||
            notesText.includes("spicy") ||
            notesText.includes("amber") ||
            descriptionText.includes("bold") ||
            nameText.includes("bold")
          );
        }

        return (
          familyText.includes(normalizedMood) ||
          notesText.includes(normalizedMood) ||
          descriptionText.includes(normalizedMood) ||
          nameText.includes(normalizedMood)
        );
      };

      let filtered = results;

      if (family) {
        filtered = filtered.filter((f) => matchesFamily(f, family));
      }

      if (mood) {
        filtered = filtered.filter((f) => matchesMood(f, mood));
      }

      if (price) {
        const maxPrice = parseInt(price, 10);
        filtered = filtered.filter((f) => Number(f.price) <= maxPrice);
      }

      if (filtered.length === 0) {
        setResult(null);
        setNoResults(true);
        return;
      }

      const suggestion = filtered[Math.floor(Math.random() * filtered.length)];
      setResult(suggestion);
      setNoResults(false);
    } catch (error) {
      console.error("Scent Finder fetch failed:", error);
      setResult(null);
      setNoResults(true);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#fffaf5] to-white min-h-screen font-[var(--font-lora)]">
      <section className="mx-auto max-w-5xl px-6 sm:px-8 py-20 text-center">
        <h1 className="font-[var(--font-cormorant)] text-5xl sm:text-6xl font-semibold text-gray-900 mb-6">
          Scent Finder
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Not sure where to start? Take this quick scent quiz and we’ll recommend
          a fragrance that suits your personality and preferences.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 sm:px-8 py-16 border-t border-neutral-200">
        {!result ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white/90 backdrop-blur-sm shadow-md border rounded-3xl p-8 sm:p-10 space-y-8"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold mb-2 font-[var(--font-cormorant)] text-gray-800"
              >
                Search by fragrance name or brand
              </label>
              <input
                id="name"
                name="name"
                value={answers.name}
                onChange={handleChange}
                placeholder="e.g. Aventus"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-black/20 focus:outline-none font-[var(--font-lora)]"
              />
            </div>

            <div>
              <label
                htmlFor="family"
                className="block text-sm font-semibold mb-2 font-[var(--font-cormorant)] text-gray-800"
              >
                What type of fragrance family do you prefer?
              </label>
              <select
                id="family"
                name="family"
                value={answers.family}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-black/20 focus:outline-none font-[var(--font-lora)]"
              >
                <option value="">Select one...</option>
                <option value="Woody">Woody</option>
                <option value="Floral">Floral</option>
                <option value="Amber">Amber</option>
                <option value="Citrus">Citrus</option>
                <option value="Green">Green</option>
                <option value="Aquatic">Aquatic</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="mood"
                className="block text-sm font-semibold mb-2 font-[var(--font-cormorant)] text-gray-800"
              >
                What’s your mood or vibe today?
              </label>
              <select
                id="mood"
                name="mood"
                value={answers.mood}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-black/20 focus:outline-none font-[var(--font-lora)]"
              >
                <option value="">Select one...</option>
                <option value="fresh">Fresh & Energetic</option>
                <option value="warm">Warm & Cozy</option>
                <option value="romantic">Romantic & Floral</option>
                <option value="bold">Bold & Confident</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-semibold mb-2 font-[var(--font-cormorant)] text-gray-800"
              >
                What’s your ideal price range?
              </label>
              <select
                id="price"
                name="price"
                value={answers.price}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-black/20 focus:outline-none font-[var(--font-lora)]"
              >
                <option value="">Select one...</option>
                <option value="400">Under $400</option>
                <option value="500">Under $500</option>
                <option value="700">Under $700</option>
                <option value="1000">Under $1000</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto rounded-xl border border-black px-8 py-3 text-sm font-medium hover:bg-black hover:text-white transition-all"
            >
              Find My Scent
            </button>

            {noResults && (
              <p className="mt-4 text-sm text-red-600">
                No matching fragrances found. Try adjusting your selections.
              </p>
            )}
          </form>
        ) : (
          <div className="text-center bg-white/90 border rounded-3xl shadow-md p-10">
            <h2 className="font-[var(--font-cormorant)] text-3xl font-semibold mb-6 text-gray-900">
              Your Recommended Scent
            </h2>

            <div className="max-w-md mx-auto">
              <img
                src={result.image || "/placeholder.jpg"}
                alt={result.name}
                className="w-full rounded-2xl border shadow-sm mb-6"
              />
              <h3 className="font-[var(--font-cormorant)] text-2xl font-semibold text-gray-900 mb-1">
                {result.name}
              </h3>
              <p className="text-gray-600 font-[var(--font-lora)] mb-2">
                {result.brand}
              </p>
              <p className="text-gray-700 font-[var(--font-lora)] mb-4">
                {result.family} Family • {formatPrice(result.price)}
              </p>

              <Link
                href={`/fragrances/${result.id}?source=rapidapi&name=${encodeURIComponent(
                  result.name
                )}&brand=${encodeURIComponent(result.brand)}`}
                className="inline-block rounded-xl border border-black px-8 py-3 text-sm font-medium hover:bg-black hover:text-white transition-all"
              >
                View Details
              </Link>
            </div>

            <button
              onClick={() => {
                setResult(null);
                setAnswers({ name: "", family: "", mood: "", price: "" });
                setNoResults(false);
              }}
              className="mt-8 inline-block rounded-xl border border-gray-400 px-8 py-2 text-sm font-medium hover:bg-gray-100 transition-all"
            >
              Retake Quiz
            </button>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-4xl px-6 sm:px-8 py-16 text-center border-t border-neutral-200">
        <Link
          href="/Listing/browse"
          className="inline-block rounded-xl border border-black px-8 py-3 text-sm font-medium hover:bg-black hover:text-white transition-all"
        >
          ← Back to Browse
        </Link>
      </section>
    </div>
  );
}