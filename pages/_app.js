import "@/styles/globals.css";
import { useEffect, useState } from "react";
import Head from "next/head";
import Preloader from "@/components/Preloader";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "../lib/supabaseClient";

export default function App({ Component, pageProps }) {
  const [showPreloader, setShowPreloader] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("surescentSeen");
    if (!seen) {
      sessionStorage.setItem("surescentSeen", "true");
      setShowPreloader(true);
    } else {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const finishPreloader = () => {
    setShowPreloader(false);
    setTimeout(() => setVisible(true), 400);
  };

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      {showPreloader && <Preloader onFinish={finishPreloader} />}

      <div
        className={`min-h-screen flex flex-col transition-opacity duration-700 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Navbar />
        <main className="flex-grow">
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </>
  );
}
