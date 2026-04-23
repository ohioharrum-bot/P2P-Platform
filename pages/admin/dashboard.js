import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { createClient } from "@supabase/supabase-js";
import { Flag, Lightbulb, ShoppingBag, Users, LogOut, DollarSign, CheckCircle, Mail, Copy } from "lucide-react";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TABS = [
  { key: "transactions", label: "Transactions", icon: DollarSign },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "flagged", label: "Flagged Messages", icon: Flag },
  { key: "suggestions", label: "Suggestions", icon: Lightbulb },
  { key: "users", label: "Users", icon: Users },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("transactions");
  const [data, setData] = useState({ transactions: [], flagged: [], suggestions: [], orders: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);

    const [transactions, flagged, suggestions, orders, users] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select(`*, listings(title), buyer:profiles_with_email!orders_buyer_id_fkey(full_name, email), seller:profiles_with_email!orders_seller_id_fkey(full_name, email, phone, city, stripe_account_id)`)
        .eq("status", "paid")
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("messages")
        .select(`*, conversations(listing_id, listings(title)), profiles!messages_sender_id_fkey(full_name)`)
        .eq("is_flagged", true)
        .order("sent_at", { ascending: false }),

      supabaseAdmin
        .from("suggestions")
        .select(`*, profiles!suggestions_user_id_fkey(full_name)`)
        .order("upvotes", { ascending: false }),

      supabaseAdmin
        .from("orders")
        .select(`*, listings(title), buyer:profiles_with_email!orders_buyer_id_fkey(full_name, email), seller:profiles_with_email!orders_seller_id_fkey(full_name, email, phone)`)
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("profiles_with_email")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    setData({
      transactions: transactions.data || [],
      flagged: flagged.data || [],
      suggestions: suggestions.data || [],
      orders: orders.data || [],
      users: users.data || [],
    });

    setLoading(false);
  }

  async function handleMarkPaid(orderId) {
    setPayingId(orderId);
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: "seller_paid" })
      .eq("id", orderId);

    if (!error) {
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.map((o) =>
          o.id === orderId ? { ...o, status: "seller_paid" } : o
        ),
      }));
    }
    setPayingId(null);
  }

  function copyEmail(email, id) {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openEmail(email, sellerName, amount) {
    const subject = encodeURIComponent("Scentd — Payment Details Required");
    const body = encodeURIComponent(
      `Hi ${sellerName},\n\nYour item has been sold on Scentd! We need your payment details to send you $${amount}.\n\nPlease reply with:\n- Your preferred payment method (Venmo, Zelle, bank transfer)\n- Your payment details\n\nWe'll process your payout within 24 hours of receiving your details.\n\nThanks,\nScentd Team`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }

  const totalReceived = data.transactions.reduce((sum, o) => sum + Number(o.amount || 0), 0);
  const totalFees = data.transactions.reduce((sum, o) => sum + Number(o.platform_fee || 0), 0);
  const totalOwedToSellers = data.transactions
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + Number(o.seller_amount || 0), 0);

  function StatusBadge({ status }) {
    const colors = {
      paid: "bg-green-50 text-green-700 border-green-200",
      seller_paid: "bg-blue-50 text-blue-700 border-blue-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      failed: "bg-red-50 text-red-700 border-red-200",
      active: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colors[status] || colors.active}`}>
        {status === "seller_paid" ? "Seller Paid ✓" : status}
      </span>
    );
  }

  const currentData = data[activeTab];

  return (
    <>
      <Head>
        <title>Admin Dashboard — Scentd</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-[#FAFAF9]" style={{ fontFamily: "'Poppins', sans-serif" }}>

        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-normal text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Scentd Admin
          </h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <LogOut size={15} /> Logout
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`bg-white border rounded-2xl p-4 text-left hover:border-gray-300 transition-colors ${activeTab === tab.key ? "border-[#1a1a18]" : "border-gray-100"}`}
                >
                  <Icon size={18} className="text-gray-400 mb-2" />
                  <p className="text-2xl font-medium text-gray-900">{data[tab.key].length}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{tab.label}</p>
                </button>
              );
            })}
          </div>

          {/* Transaction summary */}
          {activeTab === "transactions" && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Total Received</p>
                <p className="text-2xl font-semibold text-gray-900">${totalReceived.toFixed(2)}</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Platform Fees (3%)</p>
                <p className="text-2xl font-semibold text-green-600">${totalFees.toFixed(2)}</p>
              </div>
              <div className="bg-white border border-amber-200 rounded-2xl p-4">
                <p className="text-xs text-amber-600 mb-1">Owed to Sellers</p>
                <p className="text-2xl font-semibold text-amber-600">${totalOwedToSellers.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Tab nav */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm shrink-0 transition-colors ${activeTab === tab.key ? "bg-[#1a1a18] text-white" : "bg-white border border-gray-100 text-gray-500 hover:border-gray-300"}`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : currentData.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
              <p className="text-gray-400 text-sm">No {activeTab} found.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-x-auto">

              {/* Transactions */}
              {activeTab === "transactions" && (
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr className="text-left">
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Listing</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Buyer</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Seller</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Contact Seller</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Total</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Fee (3%)</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Pay Seller</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Status</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((order, i) => (
                      <tr key={order.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="px-5 py-3 text-gray-700 font-medium max-w-[120px] truncate">
                          {order.listings?.title || "—"}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          <p className="text-gray-700 font-medium">{order.buyer?.full_name || "—"}</p>
                          <p className="text-gray-400">{order.buyer?.email || "—"}</p>
                        </td>
                        <td className="px-5 py-3 text-xs">
                          <p className="text-gray-700 font-medium">{order.seller?.full_name || "—"}</p>
                          {order.seller?.city && <p className="text-gray-400">{order.seller.city}</p>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1">
                            {order.seller?.email && (
                              <>
                                <button
                                  onClick={() => openEmail(order.seller.email, order.seller.full_name, Number(order.seller_amount).toFixed(2))}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                                >
                                  <Mail size={10} />
                                  Email Seller
                                </button>
                                <button
                                  onClick={() => copyEmail(order.seller.email, order.id)}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
                                >
                                  <Copy size={10} />
                                  {copiedId === order.id ? "Copied!" : order.seller.email}
                                </button>
                              </>
                            )}
                            {order.seller?.phone && (
                              <p className="text-[10px] text-gray-400">{order.seller.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-700 font-medium whitespace-nowrap">${Number(order.amount).toFixed(2)}</td>
                        <td className="px-5 py-3 text-green-600 text-xs font-medium">${Number(order.platform_fee).toFixed(2)}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-amber-600">${Number(order.seller_amount).toFixed(2)}</span>
                            {order.status === "paid" ? (
                              <button
                                onClick={() => handleMarkPaid(order.id)}
                                disabled={payingId === order.id}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 bg-[#1a1a18] text-white rounded-lg hover:bg-black disabled:opacity-50 transition-colors whitespace-nowrap"
                              >
                                <CheckCircle size={10} />
                                {payingId === order.id ? "Saving..." : "Mark Paid"}
                              </button>
                            ) : (
                              <span className="text-[10px] text-blue-600">✓ Paid out</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Flagged Messages */}
              {activeTab === "flagged" && (
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr className="text-left">
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Sender</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Message</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Reason</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Listing</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((msg, i) => (
                      <tr key={msg.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="px-5 py-3 text-gray-700 font-medium whitespace-nowrap">{msg.profiles?.full_name || "Unknown"}</td>
                        <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{msg.body}</td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                            {msg.flag_reason || "Flagged"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{msg.conversations?.listings?.title || "—"}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(msg.sent_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Suggestions */}
              {activeTab === "suggestions" && (
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr className="text-left">
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Perfume</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Brand</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Description</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Upvotes</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Submitted by</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((s, i) => (
                      <tr key={s.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="px-5 py-3 text-gray-700 font-medium">{s.perfume_name}</td>
                        <td className="px-5 py-3 text-gray-500">{s.brand}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs max-w-xs truncate">{s.description || "—"}</td>
                        <td className="px-5 py-3"><span className="text-xs font-medium text-gray-700">▲ {s.upvotes}</span></td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{s.profiles?.full_name || "—"}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(s.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Orders */}
              {activeTab === "orders" && (
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr className="text-left">
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Listing</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Buyer</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Seller</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Amount</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Fee</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Seller Gets</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Status</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((order, i) => (
                      <tr key={order.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="px-5 py-3 text-gray-700 font-medium max-w-[150px] truncate">{order.listings?.title || "—"}</td>
                        <td className="px-5 py-3 text-xs">
                          <p className="text-gray-700">{order.buyer?.full_name || "—"}</p>
                          <p className="text-gray-400">{order.buyer?.email || "—"}</p>
                        </td>
                        <td className="px-5 py-3 text-xs">
                          <p className="text-gray-700">{order.seller?.full_name || "—"}</p>
                          <p className="text-gray-400">{order.seller?.email || "—"}</p>
                        </td>
                        <td className="px-5 py-3 text-gray-700 font-medium">${Number(order.amount).toFixed(2)}</td>
                        <td className="px-5 py-3 text-green-600 text-xs">${Number(order.platform_fee).toFixed(2)}</td>
                        <td className="px-5 py-3 text-amber-600 font-medium text-xs">${Number(order.seller_amount).toFixed(2)}</td>
                        <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Users */}
              {activeTab === "users" && (
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr className="text-left">
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Name</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Email</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">City</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Phone</th>
                      <th className="px-5 py-3 text-xs text-gray-400 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((u, i) => (
                      <tr key={u.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="px-5 py-3 text-gray-700 font-medium">{u.full_name || "—"}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{u.email || "—"}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{u.city || "—"}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{u.phone || "—"}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";
  const hasSession = cookie.includes("admin_session=authenticated");
  if (!hasSession) return { redirect: { destination: "/admin", permanent: false } };
  return { props: {} };
}