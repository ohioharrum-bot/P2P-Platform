"use client";
import { useEffect, useState } from "react";

export default function SplashScreen({ children }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay (you can adjust this)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-[#fffaf5] to-white animate-ss-fade-slow">
        {/* Logo (replace /logo.png with your real logo) */}
        <img
          src="/logo.png"
          alt="SureScent Logo"
          className="w-20 h-20 mb-4 animate-ss-up"
        />

        <h1 className="font-[var(--font-cormorant)] text-4xl sm:text-5xl text-gray-900 tracking-wide animate-ss-up anim-delay-150">
          SureScent
        </h1>
        <p className="font-[var(--font-lora)] text-gray-500 mt-2 animate-ss-up anim-delay-300">
          Discover your next signature scent
        </p>
      </div>
    );
  }

  return children;
}
