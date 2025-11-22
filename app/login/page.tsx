"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/users/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // store JWT
      localStorage.setItem("token", data.token);

      // REDIRECT TO PROFILE PAGE
      router.push("/profile");

    } catch (error: any) {
      setMessage(` ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-primary-light font-cute">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 p-8 rounded-xl-bubble shadow-2xl bg-secondary-light w-96"
      >
        <h1 className="text-3xl font-bold text-pink-dark text-center mb-2">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border-2 border-pink-light rounded-xl-bubble p-3 focus:outline-none focus:ring-2 focus:ring-pink-medium bg-pink-light placeholder-pink-dark"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border-2 border-pink-light rounded-xl-bubble p-3 focus:outline-none focus:ring-2 focus:ring-pink-medium bg-pink-light placeholder-pink-dark"
          required
        />

        <button
          disabled={loading}
          className="bg-pink-medium text-white rounded-xl-bubble p-3 hover:bg-pink-light shadow-lg transition-colors duration-200"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && (
          <p className="text-center text-pink-dark font-semibold mt-2">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
