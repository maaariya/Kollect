"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
};

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // ✅ Load user using cookie auth
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const data = await res.json();

        if (!data) {
          router.push("/login");
          return;
        }

        setUser(data); // your route returns user directly
      } catch {
        setMessage("Failed to load profile");
      }
    }

    loadUser();
  }, [router]);

  async function saveChanges() {
    if (!user) return;

    setMessage("");

    const res = await fetch("/api/profile/update", {
      method: "POST",
      credentials: "include", // ✅ cookie auth
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: user.name,
        phone: user.phone,
        bio: user.bio,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to save changes");
    } else {
      setMessage("Profile updated successfully");
      router.refresh(); // refresh navbar if name changed
    }
  }

  if (!user) {
    return (
      <div className="p-6">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-light p-6 font-cute">
      <h1 className="text-3xl font-bold text-pink-600 mb-6">
        Profile Settings
      </h1>

      <div className="max-w-lg bg-white/70 border border-pink-200 rounded-2xl p-6 shadow-md space-y-4">
        <div>
          <label className="block text-sm font-semibold text-pink-700">
            Name
          </label>
          <input
            value={user.name}
            onChange={(e) =>
              setUser({ ...user, name: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-pink-700">
            Email
          </label>
          <input
            disabled
            value={user.email}
            className="w-full px-3 py-2 border rounded-xl bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-pink-700">
            Phone
          </label>
          <input
            value={user.phone || ""}
            onChange={(e) =>
              setUser({ ...user, phone: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-pink-700">
            Bio
          </label>
          <textarea
            value={user.bio || ""}
            onChange={(e) =>
              setUser({ ...user, bio: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-xl"
          />
        </div>

        <button
          onClick={saveChanges}
          className="w-full bg-pink-500 text-white py-2 rounded-xl shadow hover:bg-pink-600 transition"
        >
          Save Changes
        </button>

        {message && (
          <p className="text-sm text-pink-600 text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}