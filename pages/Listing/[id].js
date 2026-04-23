import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { supabase } from "../../lib/supabaseClient";
import { ArrowLeft, MessageCircle, ShoppingBag, Loader } from "lucide-react";

function formatCondition(c) {
  return { new: "New", like_new: "Like New", good: "Good", fair: "Fair" }[c] || c;
}

export default function ListingDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [images, setImages] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [messaging, setMessaging] = useState(false);
  const [buying, setBuying] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [buyError, setBuyError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentCanceled, setPaymentCanceled] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });
  }, []);

  useEffect(() => {
    if (!router.query) return;
    if (router.query.success === "true") setPaymentSuccess(true);
    if (router.query.canceled === "true") setPaymentCanceled(true);
  }, [router.query]);

  useEffect(() => {
    if (!id) return;
    fetchListing();
  }, [id]);

  async function fetchListing() {
    setLoading(true);

    const { data, error } = await supabase
      .from("listings")
      .select(`*, listing_images (*)`)
      .eq("id", id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setListing(data);

    const sorted = (data.listing_images || []).sort((a, b) => a.display_order - b.display_order);
    setImages(sorted);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.seller_id)
      .single();

    setSeller(profile);

    await supabase
      .from("listings")
      .update({ views: (data.views || 0) + 1 })
      .eq("id", id);

    setLoading(false);
  }

  async function handleContactSeller() {
    if (!currentUser) { router.push("/login"); return; }
    setMessaging(true);
    setMsgError("");

    try {
      let { data: convo } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("buyer_id", currentUser.id)
        .single();

      if (!convo) {
        const { data: newConvo, error: convoErr } = await supabase
          .from("conversations")
          .insert({
            listing_id: listing.id,
            buyer_id: currentUser.id,
            seller_id: listing.seller_id,
          })
          .select()
          .single();

        if (convoErr) throw convoErr;
        convo = newConvo;
      }

      router.push(`/messages?id=${convo.id}`);
    } catch (err) {
      setMsgError("Could not start conversation. Try again.");
    } finally {
      setMessaging(false);
    }
  }

  async function handleBuyNow() {
    if (!currentUser) { router.push("/login"); return; }
    setBuying(true);
    setBuyError("");

    try {
      let { data: convo } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("buyer_id", currentUser.id)
        .single();

      if (!convo) {
        const { data: newConvo, error: convoErr } = await supabase
          .from("conversations")
          .insert({
            listing_id: listing.id,
            buyer_id: currentUser.id,
            seller_id: listing.seller_id,
          })
          .select()
          .single();

        if (convoErr) throw convoErr;
        convo = newConvo;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          buyer_id: currentUser.id,
          conversation_id: convo.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBuyError(data.error || "Could not start checkout. Try again.");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      setBuyError("Something went wrong. Try again.");
    } finally {
      setBuying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <p className="text-sm text-gray-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Loading...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>Listing not found.</p>
        <Link href="/Listing/browse" className="text-sm underline text-gray-400">Back to browse</Link>
      </div>
    );
  }

  const isOwner = currentUser?.id === listing.seller_id;
  const isSold = listing.status === "sold";

  return (
    <>
      <Head>
        <title>{listing.title} — Scentd</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-[#FAFAF9]">
        <div className="max-w-5xl mx-auto px-4 py-10">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {/* Payment success banner */}
          {paymentSuccess && (
            <div className="mb-6 px-5 py-4 rounded-2xl bg-green-50 border border-green-200">
              <p className="text-sm font-medium text-green-800">Payment successful! 🎉</p>
              <p className="text-xs text-green-600 mt-0.5">Your order has been placed. The seller will be in touch soon. Payout will be processed within 24 hours.</p>
            </div>
          )}

          {/* Payment canceled banner */}
          {paymentCanceled && (
            <div className="mb-6 px-5 py-4 rounded-2xl bg-amber-50 border border-amber-200">
              <p className="text-sm font-medium text-amber-800">Payment canceled.</p>
              <p className="text-xs text-amber-600 mt-0.5">No charge was made. You can try again anytime.</p>
            </div>
          )}

          {/* Sold banner */}
          {isSold && (
            <div className="mb-6 px-5 py-4 rounded-2xl bg-gray-100 border border-gray-200">
              <p className="text-sm font-medium text-gray-700">This listing has been sold.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Left — Images */}
            <div>
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
                {images.length > 0 ? (
                  <img src={images[activeImg]?.image_url} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-300 text-6xl">🫧</span>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImg(i)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${activeImg === i ? "border-gray-900" : "border-transparent"}`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right — Details */}
            <div className="flex flex-col">

              <div className="mb-4">
                {listing.brand && (
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {listing.brand}
                  </p>
                )}
                <h1 className="text-3xl font-normal text-gray-900 leading-snug" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {listing.title}
                </h1>
              </div>

              <div className="text-3xl font-semibold text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                ${listing.price}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {listing.condition && (
                  <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {formatCondition(listing.condition)}
                  </span>
                )}
                {listing.ml_size && (
                  <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {listing.ml_size}ml
                  </span>
                )}
                {listing.gender && (
                  <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {listing.gender.charAt(0).toUpperCase() + listing.gender.slice(1)}
                  </span>
                )}
                {listing.views > 0 && (
                  <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-400" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {listing.views} views
                  </span>
                )}
              </div>

              {listing.description && (
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Description</p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {listing.description}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 my-4" />

              {seller && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                    {seller.avatar_url ? (
                      <img src={seller.avatar_url} alt={seller.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {seller.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800" style={{ fontFamily: "'Poppins', sans-serif" }}>{seller.full_name || "Seller"}</p>
                    {seller.city && <p className="text-xs text-gray-400" style={{ fontFamily: "'Poppins', sans-serif" }}>{seller.city}</p>}
                  </div>
                </div>
              )}

              {/* CTA — Buyer */}
              {!isOwner && !isSold && (
                <div className="flex flex-col gap-3 mt-auto">
                  {buyError && <p className="text-xs text-red-500">{buyError}</p>}
                  {msgError && <p className="text-xs text-red-500">{msgError}</p>}

                  <button
                    onClick={handleBuyNow}
                    disabled={buying}
                    className="w-full py-4 rounded-xl bg-[#1a1a18] text-white text-sm font-medium tracking-wide hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {buying ? <Loader size={15} className="animate-spin" /> : <ShoppingBag size={16} />}
                    {buying ? "Redirecting to checkout..." : `Buy Now — $${listing.price}`}
                  </button>

                  <button
                    onClick={handleContactSeller}
                    disabled={messaging}
                    className="w-full py-4 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium tracking-wide hover:border-gray-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    <MessageCircle size={16} />
                    {messaging ? "Opening chat..." : "Message Seller"}
                  </button>
                </div>
              )}

              {!isOwner && isSold && (
                <div className="mt-auto w-full py-4 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  This item has been sold
                </div>
              )}

              {isOwner && (
                <div className="flex gap-3 mt-auto">
                  <Link
                    href={`/listings/${listing.id}/edit`}
                    className="flex-1 py-3.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 text-center hover:border-gray-400 transition-colors"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Edit Listing
                  </Link>
                  <button
                    onClick={async () => {
                      await supabase.from("listings").update({ status: "sold" }).eq("id", listing.id);
                      router.push("/Listing/browse");
                    }}
                    className="flex-1 py-3.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Mark as Sold
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}