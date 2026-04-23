import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Menu, X, User, MessageCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import ScentSearch from "../data/ScentSearch";

export default function Navbar() {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [fragrances, setFragrances] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const inputRef = useRef(null);
  const popoverRef = useRef(null);

  const LIMITS = { fragrances: 5, brands: 3, notes: 4 };

  // Check user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch fragrances for brands and notes
  useEffect(() => {
    fetch('/api/fragrances')
      .then(res => res.json())
      .then(data => setFragrances(data))
      .catch(err => console.error('Failed to fetch fragrances:', err));
  }, []);

  // Fetch unread message count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    fetchUnreadCount();

    // realtime — listen for new messages
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchUnreadCount();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchUnreadCount();
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  async function fetchUnreadCount() {
    if (!user) return;

    // get all conversations where user is buyer or seller
    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    if (!convos || convos.length === 0) {
      setUnreadCount(0);
      return;
    }

    const convoIds = convos.map((c) => c.id);

    // count unread messages not sent by the user
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convoIds)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    setUnreadCount(count || 0);
  }

  // Debounce typing
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 200);
    return () => clearTimeout(t);
  }, [term]);

  // Unique brands
  const allBrands = useMemo(
    () => Array.from(new Set(fragrances.map((f) => f.brand))),
    [],
  );

  // Unique notes
  const allNotes = useMemo(() => {
    const set = new Set();
    for (const f of fragrances) (f.notes || []).forEach((n) => set.add(n));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  // Fragrance suggestions
  const fragranceSuggestions = useMemo(() => {
    const q = debounced.toLowerCase();
    if (!q) return [];
    return fragrances.filter((f) => {
      const inName = f.name.toLowerCase().includes(q);
      const inBrand = f.brand.toLowerCase().includes(q);
      const inFamily = f.family.toLowerCase().includes(q);
      const inNotes = (f.notes || []).some((n) => n.toLowerCase().includes(q));
      return inName || inBrand || inFamily || inNotes;
    });
  }, [debounced]);

  // Brand & note suggestions
  const brandSuggestions = useMemo(() => {
    const q = debounced.toLowerCase();
    if (!q) return [];
    return allBrands.filter((b) => b.toLowerCase().includes(q));
  }, [debounced, allBrands]);

  const noteSuggestions = useMemo(() => {
    const q = debounced.toLowerCase();
    if (!q) return [];
    return allNotes.filter((n) => n.toLowerCase().includes(q));
  }, [debounced, allNotes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Submit search
  function onSubmit(e) {
    e.preventDefault();
    const q = term.trim();
    router.push(
      q ? `/Listing/browse?q=${encodeURIComponent(q)}` : "/Listing/browse",
    );
    setOpen(false);
    setMenuOpen(false);
  }

  // Message icon with badge
  const MessageIcon = ({ onClick }) => (
    <button
      onClick={onClick}
      className="relative hover:opacity-70 transition-opacity flex items-center gap-1.5"
    >
      <MessageCircle size={18} />
      <span className="text-sm font-medium">Messages</span>
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b shadow-sm">
      <nav className="mx-auto max-w-6xl px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="SureScent Logo"
            width={38}
            height={38}
            className="object-contain"
            priority
          />
          <span className="font-serif text-2xl font-semibold tracking-wide">
            SureScent
          </span>
        </Link>

        {/* Desktop Search */}
        <div className="relative hidden sm:flex flex-1 justify-center mx-6">
          <ScentSearch />
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            Home
          </Link>
          <Link
            href="/Listing/browse"
            className="hover:opacity-70 transition-opacity"
          >
            Browse
          </Link>
          <Link href="/about" className="hover:opacity-70 transition-opacity">
            About
          </Link>
          <Link href="/contact" className="hover:opacity-70 transition-opacity">
            Contact
          </Link>

          {user && <MessageIcon onClick={() => router.push("/messages")} />}

          {user ? (
            <Link
              href="/profile"
              className="hover:opacity-70 transition-opacity flex items-center gap-2"
            >
              <User size={18} />
              Profile
            </Link>
          ) : (
            <Link href="/login" className="hover:opacity-70 transition-opacity">
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="sm:hidden p-2 rounded-md border hover:bg-neutral-50"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="sm:hidden border-t bg-white shadow-lg p-4 space-y-4">
          <ScentSearch />

          <div className="flex flex-col text-sm font-medium space-y-3">
            <Link
              href="/"
              className="hover:text-[var(--color-gold)] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/Listing/browse"
              className="hover:text-[var(--color-gold)] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              href="/about"
              className="hover:text-[var(--color-gold)] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="hover:text-[var(--color-gold)] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </Link>

            {user && (
              <button
                onClick={() => {
                  router.push("/messages");
                  setMenuOpen(false);
                }}
                className="relative flex items-center gap-2 hover:text-[var(--color-gold)] transition-colors text-left w-fit"
              >
                <MessageCircle size={16} />
                Messages
                {unreadCount > 0 && (
                  <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <Link
                href="/profile"
                className="hover:text-[var(--color-gold)] transition-colors flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                <User size={16} />
                Profile
              </Link>
            ) : (
              <Link
                href="/login"
                className="hover:text-[var(--color-gold)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
