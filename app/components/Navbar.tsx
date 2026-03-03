"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface NavbarProps {
  user: {
    id: number;
    email: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [shrink, setShrink] = useState(false);
  const [collectionCount, setCollectionCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  const router = useRouter();
  const pathname = usePathname();

  // ✅ Logout
  const handleLogout = async () => {
    await fetch("/api/users/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    setCollectionCount(0);
    setWishlistCount(0);

    router.refresh();
    router.push("/");
  };

  // ✅ Scroll shrink animation
  useEffect(() => {
    const handleScroll = () => {
      setShrink(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Reload counts on route change
  useEffect(() => {
    if (!user) {
      setCollectionCount(0);
      setWishlistCount(0);
      return;
    }

    async function loadCounts() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setCollectionCount(0);
          setWishlistCount(0);
          return;
        }

        const data = await res.json();

        setCollectionCount(data?.cards?.length || 0);
        setWishlistCount(data?.wishlist?.length || 0);
      } catch (err) {
        console.error("Failed loading navbar counts:", err);
      }
    }

    loadCounts();
  }, [user, pathname]);

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

          {user && <NavLink href="/friends">Friends</NavLink>}

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
                className="bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition shadow-md"
              >
                Logout
              </button>

              <Link
                href="/profile/settings"
                className="ml-4 w-10 h-10 rounded-full bg-white border-2 border-pink-200 shadow-md 
                           flex items-center justify-center text-pink-600 font-bold
                           hover:scale-110 transition cursor-pointer"
              >
                {user.email.charAt(0).toUpperCase()}
              </Link>
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

          {user && <NavLink href="/friends">Friends</NavLink>}

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
                className="text-left bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition shadow-md"
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