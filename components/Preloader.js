import { useEffect, useState } from "react";

export default function Preloader({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // start fade at 1.5 s, end at 2 s
    const fadeTimer = setTimeout(() => setFadeOut(true), 1500);
    const finishTimer = setTimeout(onFinish, 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-[#fffaf3] to-white transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex items-end justify-center">
        {/* Bottle */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#c9a66b"
          strokeWidth="2"
          className="w-16 h-16 animate-rise"
        >
          <rect x="24" y="20" width="16" height="28" rx="3" />
          <rect x="28" y="12" width="8" height="8" rx="1" />
        </svg>

        {/* Mist */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`mist-particle m${i + 1}`} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes rise {
          0% {
            transform: translateY(80px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-rise {
          animation: rise 0.8s ease-out forwards;
        }

        @keyframes mistSpray {
          0% {
            transform: scale(0.5) translateY(20px);
            opacity: 0;
          }
          30% {
            transform: scale(1) translate(10px, -20px);
            opacity: 0.8;
          }
          70% {
            transform: scale(1.3) translate(-10px, -50px);
            opacity: 0.4;
          }
          100% {
            transform: scale(1.5) translateY(-80px);
            opacity: 0;
          }
        }
        .mist-particle {
          position: absolute;
          width: 16px;
          height: 16px;
          background: radial-gradient(
            circle,
            rgba(201, 166, 107, 0.8) 0%,
            rgba(201, 166, 107, 0) 70%
          );
          border-radius: 50%;
          opacity: 0;
          animation: mistSpray 0.8s ease-out forwards;
        }
        .m1 {
          left: 48%;
          animation-delay: 0.6s;
        }
        .m2 {
          left: 52%;
          animation-delay: 0.65s;
        }
        .m3 {
          left: 45%;
          animation-delay: 0.7s;
        }
        .m4 {
          left: 55%;
          animation-delay: 0.75s;
        }
        .m5 {
          left: 50%;
          animation-delay: 0.8s;
        }
      `}</style>
    </div>
  );
}
