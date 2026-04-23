"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function PageTransition({ children }) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsTransitioning(true);
    const handleComplete = () => setTimeout(() => setIsTransitioning(false), 250);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  return (
    <div
      className={`relative transition-opacity duration-500 ease-out ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {children}

      {/* Overlay during transitions */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[999] flex items-center justify-center animate-ss-fade">
          <div className="text-center">
            <h2 className="font-[var(--font-cormorant)] text-2xl text-gray-900 animate-ss-up">
              Transitioning...
            </h2>
            <p className="font-[var(--font-lora)] text-gray-500 text-sm mt-2 animate-ss-up anim-delay-150">
              Please wait a moment
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
