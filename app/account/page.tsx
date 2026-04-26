"use client";

import { useEffect, useState } from "react";

export default function AccountPage() {
  const [form, setForm] = useState({
    name: "",
    bio: "",
    phone: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => {
        if (res.status === 401) {
          setMessage("You must be logged in.");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.user) {
          setForm({
            name: data.user.name || "",
            bio: data.user.bio || "",
            phone: data.user.phone || "",
            email: data.user.email || "",
            password: "",
          });
        }
      });
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/users/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to update profile.");
      return;
    }

    setMessage("Profile updated successfully.");
    setForm((f) => ({ ...f, password: "" }));
  }

  return (
    <div className="min-h-screen bg-primary-light p-6 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white/70 border border-pink-200 rounded-3xl p-6 shadow-md"
      >
        <h1 className="text-3xl font-bold text-pink-700 mb-6 text-center">
          Account Settings
        </h1>

        {message && (
          <p className="text-center text-pink-600 mb-4 font-semibold">
            {message}
          </p>
        )}

        <div className="space-y-4">
          <Input
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
          />

          <Textarea
            label="Bio"
            name="bio"
            value={form.bio}
            onChange={handleChange}
          />

          <Input
            label="Phone number"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />

          <Input
            label="New password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Leave blank to keep current password"
          />
        </div>

        <button
          type="submit"
          className="mt-6 w-full bg-pink-500 text-white py-3 rounded-xl font-semibold hover:bg-pink-600 transition"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-pink-600 mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-4 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
      />
    </div>
  );
}

function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-pink-600 mb-1">
        {label}
      </label>
      <textarea
        {...props}
        rows={3}
        className="w-full px-4 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
      />
    </div>
  );
}
