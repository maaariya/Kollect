"use client";

import { useEffect, useState } from "react";

interface Props {
  currentUserId: number;
  profileUserId: number;
}

export default function AddFriendButton({ currentUserId, profileUserId }: Props) {
  const [status, setStatus] = useState<"none" | "pending" | "friends">("none");

  async function loadStatus() {
    const res = await fetch(`/api/friends/status/${profileUserId}`);
    const data = await res.json();
    setStatus(data.status ?? "none");
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleAdd() {
    await fetch("/api/friends/request", {
      method: "POST",
      body: JSON.stringify({ recipientId: profileUserId }),
      headers: { "Content-Type": "application/json" },
    });
    loadStatus();
  }

  async function handleCancel() {
    await fetch("/api/friends/cancel", {
      method: "POST",
      body: JSON.stringify({ recipientId: profileUserId }),
      headers: { "Content-Type": "application/json" },
    });
    loadStatus();
  }

  async function handleAccept() {
    await fetch("/api/friends/accept", {
      method: "POST",
      body: JSON.stringify({ requesterId: profileUserId }),
      headers: { "Content-Type": "application/json" },
    });
    loadStatus();
  }

  if (status === "none") {
    return (
      <button
        onClick={handleAdd}
        className="px-4 py-2 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition"
      >
        Add Friend
      </button>
    );
  }

  if (status === "pending") {
    return (
      <button
        onClick={handleCancel}
        className="px-4 py-2 rounded-xl border border-pink-400 text-pink-600 hover:bg-pink-50 transition"
      >
        Cancel Request
      </button>
    );
  }

  if (status === "friends") {
    return (
      <span className="px-4 py-2 rounded-xl bg-green-100 text-green-600 font-semibold">
        Friends
      </span>
    );
  }

  return null;
}