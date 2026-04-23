import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { Send, ArrowLeft, MessageCircle } from "lucide-react";

export default function Messages() {
  const router = useRouter();
  const { id: activeConvoId, success, canceled } = router.query;

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [flagWarning, setFlagWarning] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutMessageType, setCheckoutMessageType] = useState("");
  const bottomRef = useRef(null);

  // 1. Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      setUser(session.user);
      setUserRole(session.user?.user_metadata?.role || null);
    });
  }, []);

  // 2. Fetch convos when user ready
  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  // 3. Fetch messages when convo selected
  useEffect(() => {
    if (!activeConvo || !user) return;
    fetchMessages(activeConvo.id);

    const channel = supabase
      .channel(`messages:${activeConvo.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${activeConvo.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
        if (payload.new?.is_flagged) setFlagWarning(true);
        scrollToBottom();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeConvo, user]);

  async function fetchConversations() {
    setLoadingConvos(true);
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        listings (id, title, price, status, listing_images (image_url, is_cover)),
        buyer:profiles!conversations_buyer_id_fkey (id, full_name, avatar_url),
        seller:profiles!conversations_seller_id_fkey (id, full_name, avatar_url, stripe_account_id)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setConversations(data);
      if (activeConvoId) {
        const found = data.find((c) => c.id === activeConvoId);
        if (found) selectConvo(found);
      }
    }
    setLoadingConvos(false);
  }

  async function fetchMessages(convoId) {
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("sent_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      setFlagWarning(data.some((msg) => msg.is_flagged));
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", convoId)
        .neq("sender_id", user.id);
    }
    setLoadingMessages(false);
    scrollToBottom();
  }

  useEffect(() => {
    if (success === "true") {
      setCheckoutMessage("Payment completed successfully. Refresh the conversation to see the latest status.");
      setCheckoutMessageType("success");
    } else if (canceled === "true") {
      setCheckoutMessage("Payment was canceled. You can retry when ready.");
      setCheckoutMessageType("error");
    }
  }, [success, canceled]);

  function selectConvo(convo) {
    setActiveConvo(convo);
    setFlagWarning(false);
    setCheckoutMessage("");
    setCheckoutMessageType("");
    router.push(`/messages?id=${convo.id}`, undefined, { shallow: true });
  }

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo) return;
    setSending(true);
    setFlagWarning(false);

    const res = await fetch("/api/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: activeConvo.id,
        sender_id: user.id,
        body: newMessage.trim(),
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setNewMessage("");
      if (data.flagged) setFlagWarning(true);
    }

    setSending(false);
    scrollToBottom();
  }

  async function handlePayNow() {
    if (!activeConvo || !user) return;
    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: activeConvo.id,
          listing_id: activeConvo.listings.id,
          buyer_id: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || "Unable to start Stripe payment.");
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError("Stripe payment could not be started.");
      }
    } catch (err) {
      setCheckoutError(err.message || "Unable to start Stripe payment.");
    }

    setCheckoutLoading(false);
  }

  function getOtherPerson(convo) {
    if (!user || !convo) return null;
    return convo.buyer?.id === user.id ? convo.seller : convo.buyer;
  }

  function getCoverImage(listing) {
    if (!listing?.listing_images?.length) return null;
    const cover = listing.listing_images.find((i) => i.is_cover);
    return cover?.image_url || listing.listing_images[0]?.image_url;
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(ts) {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function Avatar({ person, size = "10" }) {
    const initials = person?.full_name?.charAt(0)?.toUpperCase() || "?";
    const cls = `w-${size} h-${size} rounded-full object-cover shrink-0`;
    return person?.avatar_url ? (
      <img src={person.avatar_url} alt={person.full_name} className={cls} />
    ) : (
      <div className={`w-${size} h-${size} rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium shrink-0`}>
        {initials}
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Messages — Scentd</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="h-screen bg-[#FAFAF9] flex flex-col" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="flex flex-1 overflow-hidden max-w-6xl mx-auto w-full border-x border-gray-100">

          {/* ===== LEFT: Conversation list ===== */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-white ${activeConvo ? "hidden md:flex" : "flex"}`}>

            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h1 className="text-xl font-normal text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>Messages</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConvos && (
                <div className="p-5 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loadingConvos && conversations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-20 gap-3">
                  <MessageCircle size={32} className="text-gray-300" />
                  <p className="text-gray-400 text-sm">No conversations yet.</p>
                  <Link
                    href="/Listing/browse"
                    className="text-xs px-4 py-2 bg-[#1a1a18] text-white rounded-xl hover:bg-black transition-colors"
                  >
                    Browse listings
                  </Link>
                </div>
              )}

              {!loadingConvos && conversations.map((convo) => {
                const other = getOtherPerson(convo);
                const coverImg = getCoverImage(convo.listings);
                const isActive = activeConvo?.id === convo.id;
                return (
                  <button
                    key={convo.id}
                    onClick={() => selectConvo(convo)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${isActive ? "bg-gray-50" : ""}`}
                  >
                    <Avatar person={other} size="11" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{other?.full_name || "User"}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">{formatDate(convo.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{convo.listings?.title || "Listing"}</p>
                    </div>
                    {coverImg && <img src={coverImg} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== RIGHT: Chat area ===== */}
          <div className={`flex-1 flex flex-col ${activeConvo ? "flex" : "hidden md:flex"}`}>

            {/* Empty state — no convo selected */}
            {!activeConvo && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-5 bg-[#FAFAF9]">
                <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                  <MessageCircle size={36} className="text-gray-300" />
                </div>
                <div>
                  <h2 className="text-xl font-normal text-gray-800 mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    Your messages
                  </h2>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Select a conversation on the left, or browse listings and tap <strong>Message Seller</strong> to start a new one.
                  </p>
                </div>
                <Link
                  href="/Listing/browse"
                  className="px-5 py-2.5 bg-[#1a1a18] text-white text-sm rounded-xl hover:bg-black transition-colors"
                >
                  Browse listings
                </Link>
              </div>
            )}

            {/* Active convo */}
            {activeConvo && (
              <>
                {/* Chat header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
                  <button className="md:hidden" onClick={() => setActiveConvo(null)}>
                    <ArrowLeft size={18} className="text-gray-500" />
                  </button>
                  <Avatar person={getOtherPerson(activeConvo)} size="9" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getOtherPerson(activeConvo)?.full_name || "User"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">re: {activeConvo.listings?.title}</p>
                  </div>
                  {activeConvo.listings && (
                    <button
                      onClick={() => router.push(`/Listing/${activeConvo.listings.id}`)}
                      className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      {getCoverImage(activeConvo.listings) && (
                        <img src={getCoverImage(activeConvo.listings)} alt="" className="w-7 h-7 rounded-lg object-cover" />
                      )}
                      <span className="text-xs text-gray-500 max-w-[100px] truncate">{activeConvo.listings.title}</span>
                    </button>
                  )}
                </div>

                {/* Payment action for buyer */}
                {(userRole === "buyer" || !userRole) && user?.id === activeConvo?.buyer?.id && activeConvo?.listings?.status === "active" && (
                  <div className="px-5 py-4 border-b border-gray-100 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Pay the seller securely</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Use Stripe to pay the seller for this listing. The seller must have Stripe connected.
                        </p>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <button
                          type="button"
                          disabled={checkoutLoading || !activeConvo.seller?.stripe_account_id}
                          onClick={handlePayNow}
                          className="px-4 py-2 rounded-xl bg-[#1a1a18] text-white text-sm hover:bg-black disabled:opacity-50 transition-colors"
                        >
                          {checkoutLoading ? "Starting payment..." : `Pay $${activeConvo.listings.price}`}
                        </button>
                        {!activeConvo.seller?.stripe_account_id && (
                          <p className="text-xs text-amber-600">Seller has not connected Stripe yet. Ask them to connect in profile.</p>
                        )}
                      </div>
                    </div>
                    {checkoutError && <p className="text-xs text-red-500 mt-2">{checkoutError}</p>}
                    {checkoutMessage && (
                      <p className={`text-xs mt-2 ${checkoutMessageType === "success" ? "text-green-600" : "text-amber-600"}`}>
                        {checkoutMessage}
                      </p>
                    )}
                  </div>
                )}

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#FAFAF9]">
                  {loadingMessages && (
                    <div className="flex justify-center py-10">
                      <p className="text-xs text-gray-400">Loading...</p>
                    </div>
                  )}

                  {!loadingMessages && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center">
                        <MessageCircle size={22} className="text-gray-300" />
                      </div>
                      <p className="text-xs text-gray-400">No messages yet. Say hello!</p>
                    </div>
                  )}

                  {!loadingMessages && messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    const showTime = i === messages.length - 1 || messages[i + 1]?.sender_id !== msg.sender_id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? "bg-[#1a1a18] text-white rounded-br-sm"
                              : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
                          }`}>
                            {msg.body}
                          </div>
                          {/* Flag indicator on the message bubble */}
                          {msg.is_flagged && (
                            <span className="text-[10px] text-amber-500 px-1 flex items-center gap-1">
                              ⚠️ Flagged for review{msg.flag_reason ? ` • ${msg.flag_reason}` : ""}
                            </span>
                          )}
                          {showTime && (
                            <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.sent_at)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Flag warning banner */}
                {flagWarning && (
                  <div className="mx-4 mb-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <span className="text-amber-500 mt-0.5 shrink-0 text-base">⚠️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-800">Message flagged for review</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Your message may contain contact info or off-platform payment details.
                        Please keep all transactions within Scentd.
                      </p>
                    </div>
                    <button
                      onClick={() => setFlagWarning(false)}
                      className="text-amber-400 hover:text-amber-600 shrink-0 text-xl leading-none mt-0.5"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Message input */}
                <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-100 bg-white flex items-end gap-3 shrink-0">
                  <textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    placeholder="Type a message... (Enter to send)"
                    rows={1}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-[#FAFAF9] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none overflow-hidden"
                    style={{ fontFamily: "'Poppins', sans-serif", minHeight: "42px" }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="w-10 h-10 rounded-xl bg-[#1a1a18] flex items-center justify-center hover:bg-black disabled:opacity-40 transition-colors shrink-0 mb-0.5"
                  >
                    <Send size={16} className="text-white" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}