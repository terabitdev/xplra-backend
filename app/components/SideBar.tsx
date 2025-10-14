"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Dashboard,
  Home,
  EarthEuropeAfrica,
  Logout,
  Trophy,
  Tag,
  Menu,
  Close,
} from "@carbon/icons-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        localStorage.removeItem("token");
        router.push("/signin");
      } else {
        console.error("Failed to log out");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const navLinks = [
    { href: "/", icon: Dashboard, label: "Dashboard" },
    { href: "/quests", icon: Home, label: "Quests" },
    { href: "/adventures", icon: EarthEuropeAfrica, label: "Adventures" },
    { href: "/categories", icon: Tag, label: "Categories" },
    { href: "/achievements", icon: Trophy, label: "Achievements" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[1100] p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isMobileMenuOpen ? <Close size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[999]"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Hidden on mobile unless menu is open */}
      <div
        className={`w-64 flex flex-col h-screen bg-white shadow-2xl fixed top-0 left-0 bottom-0 z-[1000] transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center p-3 border-b">
          <Link href="/" onClick={closeMobileMenu}>
            <Image
              src="/assets/xplralogo.png"
              alt="Xplra Logo"
              width={50}
              height={50}
              className="object-contain"
            />
          </Link>

          <Link href="/" onClick={closeMobileMenu}>
            {/* Logo */}
            <Image
              src="/assets/xplralogo2.png"
              alt="Xplra Logo"
              width={120}
              height={40}
              className="object-contain"
            />
          </Link>
        </div>

        <nav className="flex flex-col flex-1 w-full px-4 py-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 gap-3 ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={22} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button
            className="w-full bg-red-500 hover:bg-red-600 text-white border-none py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            onClick={handleLogout}
          >
            <Logout size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
