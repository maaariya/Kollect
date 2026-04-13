"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Conversation = {
  user: {
    id: number;
    name: string;
    email: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
};

export default function MessagesInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  async function loadConversations() {
    const res = await fetch("/api/messages/conversations", {
      credentials: "include",
    });

    if (!res.ok) return;

    const data = await res.json();
    setConversations(data);
  }

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>

      {conversations.length === 0 && (
        <p className="text-gray-400">No conversations yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {conversations.map((c) => (
          <Link
            key={c.user.id}
            href={`/messages/${c.user.id}`}
            className="border rounded-xl p-4 hover:bg-gray-50 transition"
          >
            <div className="flex justify-between items-center">
              <p className="font-semibold">{c.user.name}</p>
              {c.lastMessage && (
                <span className="text-xs text-gray-400">
                  {new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 truncate">
              {c.lastMessage?.content || "Start a conversation"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}