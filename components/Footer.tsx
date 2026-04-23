import Link from "next/link";
import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gradient-to-b from-white to-[#fffaf5] text-gray-700 font-[var(--font-lato)]">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 py-16">
        {/* ===== Top Section ===== */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-12 sm:gap-20">
          {/* Brand Info */}
          <div className="text-center sm:text-left max-w-sm">
            <h2 className="font-[var(--font-playfair)] text-3xl font-semibold tracking-wide text-gray-900">
              SureScent
            </h2>
            <p className="mt-3 text-gray-600 leading-relaxed text-[15px]">
              Discover your next signature scent.  
              A curated marketplace where fragrance meets authenticity and elegance.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col sm:flex-row sm:items-start justify-center sm:justify-end gap-8 text-sm font-medium">
            <div className="flex flex-col gap-2">
              <Link href="/" className="hover:text-[var(--color-gold)] transition-colors">
                Home
              </Link>
              <Link href="/Listing/browse" className="hover:text-[var(--color-gold)] transition-colors">
                Browse
              </Link>
              <Link href="/scent-finder" className="hover:text-[var(--color-gold)] transition-colors">
                Scent Finder
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/about" className="hover:text-[var(--color-gold)] transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-[var(--color-gold)] transition-colors">
                Contact
              </Link>
              <Link href="#" className="hover:text-[var(--color-gold)] transition-colors">
                Help Center
              </Link>
            </div>
          </nav>
        </div>

        {/* ===== Decorative Divider ===== */}
        <div className="relative my-14">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#fffaf5] px-4 text-[var(--color-gold)] text-xs tracking-wider uppercase font-semibold">
              Crafted with Elegance
            </span>
          </div>
        </div>

        {/* ===== Bottom Section ===== */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 gap-4">
          {/* Left: Copyright */}
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-[var(--font-playfair)] text-gray-800">
              SureScent
            </span>
            . All rights reserved.
          </p>

          {/* Center: Policy Links */}
          <div className="flex items-center gap-4 text-sm">
            <a href="#" className="hover:text-[var(--color-gold)] transition-colors">
              Privacy Policy
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="hover:text-[var(--color-gold)] transition-colors">
              Terms of Service
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="hover:text-[var(--color-gold)] transition-colors">
              Cookies
            </a>
          </div>

          {/* Right: Social Icons */}
          <div className="flex items-center gap-5 text-gray-500">
            <a href="#" className="hover:text-[var(--color-gold)] transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-[var(--color-gold)] transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-[var(--color-gold)] transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-[var(--color-gold)] transition-colors" aria-label="YouTube">
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
