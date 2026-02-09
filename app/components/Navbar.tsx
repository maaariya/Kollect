"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [shrink, setShrink] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [collectionCount, setCollectionCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  const router = useRouter();

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setCollectionCount(0);
    setWishlistCount(0);
    router.push("/");
  };

  // Detect scroll for shrinking navbar
  useEffect(() => {
    const handleScroll = () => {
      setShrink(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch user + counts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    async function loadData() {
      // User + collection
      const userRes = await fetch("/api/users/me", {
        headers: { Authorization: "Bearer " + token },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
        setCollectionCount(userData.user.cards?.length || 0);
      }

      // Wishlist count
      const wishlistRes = await fetch("/api/wishlist", {
        headers: { Authorization: "Bearer " + token },
      });

      if (wishlistRes.ok) {
        const wishlistData = await wishlistRes.json();
        if (Array.isArray(wishlistData)) {
          setWishlistCount(wishlistData.length);
        }
      }
    }

    loadData();
  }, []);

  return (
    <nav
      className={`
        sticky top-0 z-50 
        bg-gradient-to-r from-pink-500 via-pink-400 to-pink-300
        text-white shadow-lg px-6 
        rounded-b-3xl transition-all duration-300
        ${shrink ? "py-2 scale-95" : "py-4 scale-100"}
      `}
    >
      <div className="flex justify-between items-center relative">
        {/* Logo */}
        <Link
          href="/"
          className="text-3xl font-extrabold drop-shadow-xl tracking-wide"
        >
          Kollect
        </Link>

        {/* Mobile Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden hover:scale-110 transition"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 text-lg font-semibold items-center">
          <NavLink href="/add-card">Add Card</NavLink>

          {user ? (
            <>
              <NavLink href="/profile">
                My Collection
                <span className="ml-1 px-2 py-0.5 bg-white/30 rounded-full text-sm">
                  {collectionCount}
                </span>
              </NavLink>

              <NavLink href="/wishlist">
                My Wishlist
                <span className="ml-1 px-2 py-0.5 bg-white/30 rounded-full text-sm">
                  {wishlistCount}
                </span>
              </NavLink>

              <button
                onClick={handleLogout}
                className="bg-white/20 px-4 py-2 rounded-xl-bubble hover:bg-white/30 transition shadow-md"
              >
                Logout
              </button>

              <div className="ml-4 w-10 h-10 rounded-full bg-white border-2 border-pink-200 shadow-md flex items-center justify-center text-pink-600 font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <NavLink href="/login">Login</NavLink>
              <NavLink href="/signup">Signup</NavLink>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="mt-4 flex flex-col gap-4 md:hidden pb-4 text-lg font-semibold">
          <NavLink href="/add-card">Add Card</NavLink>

          {user ? (
            <>
              <NavLink href="/profile">
                My Collection ({collectionCount})
              </NavLink>

              <NavLink href="/wishlist">
                My Wishlist ({wishlistCount})
              </NavLink>

              <button
                onClick={handleLogout}
                className="text-left bg-white/20 px-4 py-2 rounded-xl-bubble hover:bg-white/30 transition shadow-md"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink href="/login">Login</NavLink>
              <NavLink href="/signup">Signup</NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        hover:text-yellow-200 
        hover:scale-110 
        transition-all 
        drop-shadow-md
      "
    >
      {children}
    </Link>
  );
}
