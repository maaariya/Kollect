"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ScrollingCards from "./components/ScrollingCards";

export default function HomePage() {
  const router = useRouter();

  // Redirect logged-in users away from landing page
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/me");

        if (res.ok) {
          router.push("/profile");
        }
      } catch {
        // do nothing
      }
    }

    checkAuth();
  }, [router]);

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-pink-100 via-white to-pink-200 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      <ScrollingCards />

      <h1 className="text-5xl md:text-7xl font-extrabold text-pink-600 drop-shadow-xl mb-6 z-10">
        Welcome to Kollect
      </h1>

      <p className="text-lg md:text-2xl text-gray-700 max-w-2xl mb-10 z-10">
        Track your trading cards, grow your dream wishlist, and trade with other users — all in one place.
      </p>

      <div className="flex gap-6 z-10">
        <Link
          href="/signup"
          className="bg-pink-500 text-white px-8 py-4 rounded-2xl shadow-lg hover:scale-105 hover:bg-pink-600 transition"
        >
          Get Started
        </Link>

        <Link
          href="/login"
          className="bg-white text-pink-600 px-8 py-4 rounded-2xl shadow-lg hover:scale-105 transition border-2 border-pink-400"
        >
          Login
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl z-10">
        <Feature
          title="Organise"
          desc="Add your trading cards and keep track of your entire collection."
        />
        <Feature
          title="Wishlist"
          desc="Build your dream wishlist and track what you're hunting."
        />
        <Feature
          title="Trade"
          desc="Interact and trade with other collectors!"
        />
      </div>
    </main>
  );
}

function Feature({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg hover:scale-105 transition">
      <h3 className="text-xl font-bold text-pink-600 mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}