import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { Upload, X, ChevronDown } from "lucide-react";
import Head from "next/head";

const BRANDS = [
  "Acqua di Parma", "Amouage", "Byredo", "Cartier", "Chanel",
  "Christian Dior", "Creed", "Guerlain", "Hermès", "Jo Malone",
  "Kilian", "Maison Margiela", "Montale", "Penhaligon's",
  "Serge Lutens", "Tom Ford", "Valentino", "Versace", "YSL", "Other"
];

const CONDITIONS = [
  { value: "new", label: "New", desc: "Sealed, never used" },
  { value: "like_new", label: "Like New", desc: "Used 1–2 times" },
  { value: "good", label: "Good", desc: "Lightly used, 80%+ remaining" },
  { value: "fair", label: "Fair", desc: "Noticeably used" },
];

const ML_SIZES = [10, 15, 20, 25, 30, 50, 75, 100, 125, 150, 200];
const GENDERS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
];

export default function CreateListing() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", price: "", brand: "", condition: "", ml_size: "", gender: "" });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setAuthChecked(true);
      }
    });
  }, []);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFiles(files) {
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 6 - images.length);
    setImages((prev) => [...prev, ...valid.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.title || !form.price || !form.condition || !form.brand) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const { data: listing, error: listingErr } = await supabase
  .from("listings")
  .insert({
    seller_id: user.id,
    title: form.title,
    description: form.description,
    price: parseFloat(form.price),
    brand: form.brand,
    condition: form.condition,
    ml_size: form.ml_size ? parseInt(form.ml_size) : null,
    gender: form.gender || null,
    status: "active",
  })
  .select()
  .single();

console.log("listing insert result:", listing);
console.log("listing insert error:", listingErr);

if (listingErr) throw listingErr;


      const imageRecords = [];
      for (let i = 0; i < images.length; i++) {
        const { file } = images[i];
        const ext = file.name.split(".").pop();
        const path = `listings/${listing.id}/${Date.now()}-${i}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("perfume_site").upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from("perfume_site").getPublicUrl(path);
        imageRecords.push({ listing_id: listing.id, image_url: publicUrl, display_order: i, is_cover: i === 0 });
      }

      if (imageRecords.length > 0) {
        const { error: imgErr } = await supabase.from("listing_images").insert(imageRecords);
        if (imgErr) throw imgErr;
      }

      router.push("/Listing/browse");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <p className="text-sm text-gray-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div className="min-h-screen bg-[#FAFAF9]">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>New Listing</p>
            <h1 className="text-3xl font-normal text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>List your perfume</h1>
            <p className="mt-2 text-sm text-gray-500" style={{ fontFamily: "'Poppins', sans-serif" }}>Fields marked <span className="text-red-400">*</span> are required.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Images */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Photos <span className="ml-2 text-gray-400 normal-case tracking-normal font-normal">Up to 6 — first is the cover</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-widest bg-black/60 text-white px-2 py-0.5 rounded-full">Cover</span>}
                    <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} className="text-gray-700" />
                    </button>
                  </div>
                ))}
                {images.length < 6 && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                    className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${dragOver ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                    <Upload size={20} className="text-gray-400" />
                    <span className="text-xs text-gray-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Add photo</span>
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </div>

            <div className="border-t border-gray-100" />

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Title <span className="text-red-400">*</span></label>
              <input type="text" placeholder="e.g. Creed Aventus 100ml — barely used" value={form.title} onChange={(e) => set("title", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily: "'Poppins', sans-serif" }} />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Brand <span className="text-red-400">*</span></label>
              <div className="relative">
                <select value={form.brand} onChange={(e) => set("brand", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 appearance-none focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <option value="">Select a brand</option>
                  {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Condition <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {CONDITIONS.map((c) => (
                  <button key={c.value} type="button" onClick={() => set("condition", c.value)}
                    className={`text-left px-4 py-3 rounded-xl border transition-colors ${form.condition === c.value ? "border-gray-900 bg-gray-900" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <div className={`text-sm font-medium ${form.condition === c.value ? "text-white" : "text-gray-900"}`} style={{ fontFamily: "'Poppins', sans-serif" }}>{c.label}</div>
                    <div className={`text-xs mt-0.5 ${form.condition === c.value ? "text-gray-300" : "text-gray-400"}`} style={{ fontFamily: "'Poppins', sans-serif" }}>{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Size + Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Size (ml)</label>
                <div className="relative">
                  <select value={form.ml_size} onChange={(e) => set("ml_size", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 appearance-none focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <option value="">Select size</option>
                    {ML_SIZES.map((s) => <option key={s} value={s}>{s} ml</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Gender</label>
                <div className="flex gap-2 h-[46px]">
                  {GENDERS.map((g) => (
                    <button key={g.value} type="button" onClick={() => set("gender", g.value)}
                      className={`flex-1 rounded-xl border text-sm transition-colors ${form.gender === g.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
                      style={{ fontFamily: "'Poppins', sans-serif" }}>{g.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Price <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={(e) => set("price", e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" style={{ fontFamily: "'Poppins', sans-serif" }} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Description</label>
              <textarea rows={4} placeholder="Describe the perfume — scent profile, how long you've had it, reason for selling..." value={form.description} onChange={(e) => set("description", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none" style={{ fontFamily: "'Poppins', sans-serif" }} />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-500" style={{ fontFamily: "'Poppins', sans-serif" }}>{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl bg-[#1a1a18] text-white text-sm font-medium tracking-wide hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ fontFamily: "'Poppins', sans-serif" }}>
              {loading ? "Publishing..." : "Publish Listing"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}