"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/users/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // important
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Login failed");
        return;
      }

      // 🔥 THIS IS THE IMPORTANT PART
      router.refresh();   // forces server layout to re-read cookies
      router.push("/");   // navigate after refresh
    } catch (err) {
      setMessage("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6 text-center text-pink-500">
          Login
        </h1>

        {message && (
          <p className="text-red-500 mb-4 text-center">{message}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 border rounded-xl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 border rounded-xl"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-pink-500 text-white py-3 rounded-xl hover:bg-pink-600 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}