"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function FriendsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [showRequests, setShowRequests] = useState(false);

  const [friends, setFriends] = useState<any[]>([]);

  // Load friend requests
  const loadRequests = async () => {
    const res = await fetch("/api/friends/requests");
    const data = await res.json();
    setFriendRequests(Array.isArray(data) ? data : []);
  };

  // Load current friends
  const loadFriends = async () => {
    const res = await fetch("/api/friends/list");
    const data = await res.json();
    setFriends(Array.isArray(data) ? data : []);
  };

  // Search users
  const searchUsers = async (search: string) => {
    if (!search) {
      setResults([]);
      return;
    }

    setLoading(true);

    const res = await fetch(
      `/api/friends/search?search=${encodeURIComponent(search)}`
    );

    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    searchUsers(query.trim());
    loadRequests();
    loadFriends();
  }, [query]);

  // Accept friend request
  const acceptRequest = async (requesterId: number) => {
    await fetch("/api/friends/accept", {
      method: "POST",
      body: JSON.stringify({ requesterId }),
      headers: { "Content-Type": "application/json" },
    });
    loadRequests();
    loadFriends();
  };

  // Remove friend
  const removeFriend = async (friendId: number) => {
    await fetch("/api/friends/remove", {
      method: "POST",
      body: JSON.stringify({ friendId }),
      headers: { "Content-Type": "application/json" },
    });
    loadFriends();
  };

  // Send friend request
  const sendRequest = async (userId: number) => {
    await fetch("/api/friends/request", {
      method: "POST",
      body: JSON.stringify({ recipientId: userId }),
      headers: { "Content-Type": "application/json" },
    });
    loadRequests();
  };

  // Helper to check state of relationship with user
  const getFriendStatus = (userId: number) => {
    if (friends.some((f) => f.id === userId)) return "friend";
    if (friendRequests.some((r) => r.requesterId === userId)) return "requested";
    return "none";
  };

  return (
    <div className="p-6 max-w-xl mx-auto relative">
      <h1 className="text-2xl font-bold mb-4 flex justify-between items-center">
        Friends
        {friendRequests.length > 0 && (
          <button
            onClick={() => setShowRequests(!showRequests)}
            className="bg-pink-500 text-white px-3 py-1 rounded-lg"
          >
            Friend Requests ({friendRequests.length})
          </button>
        )}
      </h1>

      {/* Friend Requests Pop-up */}
      {showRequests && friendRequests.length > 0 && (
        <div className="absolute top-16 right-0 w-80 bg-white shadow-xl rounded-xl p-4 z-50 border border-pink-200">
          <h2 className="text-lg font-semibold mb-2">Incoming Requests</h2>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {friendRequests.map((r) => (
              <li
                key={r.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-semibold">{r.requester.name}</p>
                  <p className="text-sm text-gray-500">{r.requester.email}</p>
                </div>
                <button
                  onClick={() => acceptRequest(r.requesterId)}
                  className="bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 transition"
                >
                  Accept
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Current Friends */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Your Friends</h2>
        {friends.length === 0 ? (
          <p className="text-gray-500">You have no friends yet.</p>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => (
              <li
                key={f.id}
                className="flex justify-between items-center p-2 border rounded"
              >
                <div>
                  <p className="font-semibold">{f.name}</p>
                  <p className="text-sm text-gray-500">{f.email}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/profile/${f.id}`}
                    className="bg-pink-500 text-white px-3 py-1 rounded-lg"
                  >
                    View Profile
                  </a>
                  <button
                    onClick={() => removeFriend(f.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Find Traders */}
      <Link
        href="/recommendations"
        className="mt-4 mb-6 flex items-center justify-center gap-2 w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-md transition text-base"
      >
        ✦ Find Traders - view your perfect matches!
      </Link>

      {/* Search Users */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Find Friends</h2>
        <input
          type="text"
          placeholder="Search by name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />

        {loading && <p>Loading...</p>}
        {!loading && results.length === 0 && query && <p>No users found</p>}

        <ul className="space-y-4">
          {results.map((u) => {
            const status = getFriendStatus(u.id);
            return (
              <li
                key={u.id}
                className="p-4 border rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/profile/${u.id}`}
                    className="bg-pink-500 text-white px-3 py-1 rounded-lg"
                  >
                    View Profile
                  </a>
                  {status === "none" && (
                    <button
                      onClick={() => sendRequest(u.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition"
                    >
                      +
                    </button>
                  )}
                  {status === "requested" && (
                    <button className="bg-gray-400 text-white px-3 py-1 rounded-lg cursor-not-allowed">
                      Requested ...
                    </button>
                  )}
                  {status === "friend" && (
                    <button className="bg-blue-500 text-white px-3 py-1 rounded-lg cursor-not-allowed">
                      Friends
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}