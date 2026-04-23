import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { Camera, MapPin, Phone, Edit2, Check, X, Plus } from "lucide-react";

function formatCondition(c) {
  return { new: "New", like_new: "Like New", good: "Good", fair: "Fair" }[c] || c;
}

function getCoverImage(listing) {
  if (!listing?.listing_images?.length) return null;
  const cover = listing.listing_images.find((i) => i.is_cover);
  return cover?.image_url || listing.listing_images[0]?.image_url;
}

export default function Profile() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    phone: "",
    city: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      setUser(session.user);
      fetchProfile(session.user.id);
      fetchListings(session.user.id);
    });
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setEditForm({
        full_name: data.full_name || "",
        bio: data.bio || "",
        phone: data.phone || "",
        city: data.city || "",
      });
    }
    setLoading(false);
  }

  async function fetchListings(userId) {
    const { data } = await supabase
      .from("listings")
      .select(`*, listing_images (*)`)
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (data) setListings(data);
  }

  async function saveProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .update(editForm)
      .eq("id", user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
      setEditing(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);

    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("perfume_site")
      .upload(path, file, { upsert: true });

    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage
        .from("perfume_site")
        .getPublicUrl(path);

      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
    }

    setUploadingAvatar(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function markAsSold(listingId) {
    await supabase.from("listings").update({ status: "sold" }).eq("id", listingId);
    setListings((prev) => prev.map((l) => l.id === listingId ? { ...l, status: "sold" } : l));
  }

  async function deleteListing(listingId) {
    await supabase.from("listings").update({ status: "deleted" }).eq("id", listingId);
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  }

  const filtered = listings.filter((l) => {
    if (activeTab === "active") return l.status === "active";
    if (activeTab === "sold") return l.status === "sold";
    return false;
  });

  const activeCount = listings.filter((l) => l.status === "active").length;
  const soldCount = listings.filter((l) => l.status === "sold").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <p className="text-sm text-gray-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Profile — Scentd</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-[#FAFAF9]" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="max-w-4xl mx-auto px-4 py-10">

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-start gap-5">

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-medium text-gray-400">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#1a1a18] rounded-full flex items-center justify-center hover:bg-black transition-colors"
                >
                  <Camera size={13} className="text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {!editing ? (
                  <>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-xl font-normal text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
                        {profile?.full_name || "Your Name"}
                      </h1>
                      <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <Edit2 size={14} />
                      </button>
                    </div>

                    {profile?.bio && (
                      <p className="text-sm text-gray-500 mb-2 leading-relaxed">{profile.bio}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      {profile?.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {profile.city}
                        </span>
                      )}
                      {profile?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {profile.phone}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 w-full">
                    <input
                      type="text"
                      placeholder="Full name"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                    <textarea
                      placeholder="Bio — tell buyers about yourself"
                      value={editForm.bio}
                      onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors resize-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={editForm.city}
                        onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="Phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveProfile} className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a18] text-white text-xs rounded-xl hover:bg-black transition-colors">
                        <Check size={13} /> Save
                      </button>
                      <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-xs rounded-xl hover:border-gray-300 transition-colors">
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              {!editing && (
                <div className="hidden sm:flex flex-col items-end gap-3 shrink-0">
                  <div className="flex gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{activeCount}</div>
                      <div className="text-xs text-gray-400">Active</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{soldCount}</div>
                      <div className="text-xs text-gray-400">Sold</div>
                    </div>
                  </div>
                  <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Listings section */}
          <div>
            {/* Tabs + new listing button */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {[
                  { key: "active", label: `Active (${activeCount})` },
                  { key: "sold", label: `Sold (${soldCount})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 text-sm rounded-lg transition-all ${
                      activeTab === tab.key
                        ? "bg-white text-gray-900 shadow-sm font-medium"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <Link
                href="/create-listing"
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a18] text-white text-sm rounded-xl hover:bg-black transition-colors"
              >
                <Plus size={14} /> New listing
              </Link>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-sm mb-4">
                  {activeTab === "active" ? "No active listings." : "No sold listings yet."}
                </p>
                {activeTab === "active" && (
                  <Link href="/create-listing" className="inline-block px-5 py-2.5 bg-[#1a1a18] text-white text-sm rounded-xl hover:bg-black transition-colors">
                    + Create your first listing
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((listing) => {
                  const coverImage = getCoverImage(listing);
                  return (
                    <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                      {/* Image */}
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        {coverImage ? (
                          <img src={coverImage} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">🫧</div>
                        )}
                        {listing.status === "sold" && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-white text-sm font-medium uppercase tracking-widest">Sold</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                          <p className="text-sm font-semibold text-gray-900 shrink-0">${listing.price}</p>
                        </div>
                        <div className="flex gap-2 mb-3">
                          {listing.condition && (
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-neutral-50 text-gray-500">
                              {formatCondition(listing.condition)}
                            </span>
                          )}
                          {listing.ml_size && (
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-neutral-50 text-gray-500">
                              {listing.ml_size}ml
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link
                            href={`/Listing/${listing.id}`}
                            className="flex-1 text-center py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:border-gray-400 transition-colors"
                          >
                            View
                          </Link>
                          {listing.status === "active" && (
                            <button
                              onClick={() => markAsSold(listing.id)}
                              className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:border-gray-400 transition-colors"
                            >
                              Mark Sold
                            </button>
                          )}
                          <button
                            onClick={() => deleteListing(listing.id)}
                            className="py-1.5 px-3 text-xs border border-red-100 rounded-lg text-red-400 hover:border-red-300 hover:text-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile sign out */}
          <div className="sm:hidden mt-8 text-center">
            <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Sign out
            </button>
          </div>

        </div>
      </div>
    </>
  );
}