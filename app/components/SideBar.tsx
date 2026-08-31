"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar, closeSidebar } from "../store/slices/uiSlice";
import { RootState } from "../store";
import {
  Dashboard,
  Logout,
  Tag,
  Task,
  Location,
  Checkmark,
  User,
  Settings,
  Calendar,
  Flag,
  ChevronDown,
  ChevronUp,
  WarningAlt,
} from "@carbon/icons-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const isSidebarOpen = useSelector((state: RootState) => state.ui.isSidebarOpen);
  const [isEconomyOpen, setIsEconomyOpen] = useState(pathname.startsWith("/economy"));

  // Keep the dropdown open automatically when navigating straight to a child
  // route (e.g. via a direct link), without fighting the user's manual toggle.
  useEffect(() => {
    if (pathname.startsWith("/economy/")) {
      setIsEconomyOpen(true);
    }
  }, [pathname]);

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
    {
      href: "/economy",
      icon: Settings,
      label: "Economy",
      children: [{ href: "/economy/xp-engine", label: "XP Engine" }],
    },
    { href: "/quests_", icon: Task, label: "Quests" },
    { href: "/places_", icon: Location, label: "Places" },
    { href: "/events_", icon: Calendar, label: "Events" },
    { href: "/contributions", icon: Checkmark, label: "Contributions" },
    { href: "/users", icon: User, label: "Users" },
    { href: "/categories", icon: Tag, label: "Place Categories" },
    { href: "/quest-categories", icon: Tag, label: "Quest Categories" },
    { href: "/validation-configs", icon: Settings, label: "Validation Configs" },



    { href: "/quest-reports", icon: Flag, label: "Quest Reports" },
    { href: "/user-reports", icon: WarningAlt, label: "User Reports" },
  ];

  const closeMobileMenu = () => {
    // Only close sidebar on mobile (screen width < 768px)
    if (window.innerWidth < 768) {
      dispatch(closeSidebar());
    }
  };

  return (
    <>
      {/* Overlay - shows on mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-[999]"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Collapsed/Expanded */}
      <div
        className={`flex flex-col h-screen bg-white border-r border-gray-200 shadow-lg fixed top-0 bottom-0 z-[1000] transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "w-64" : "w-16"}
          md:left-0
          ${isSidebarOpen ? "left-0" : "-left-64"}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16">
          {/* Logo - Shows when expanded */}
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <Link href="/" onClick={closeMobileMenu}>
                <Image
                  src="/assets/xplralogo.png"
                  alt="Xplra Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </Link>

              <Link href="/" onClick={closeMobileMenu}>
                <Image
                  src="/assets/xplralogo2.png"
                  alt="Xplra Logo"
                  width={100}
                  height={32}
                  className="object-contain"
                />
              </Link>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className={`inline-flex items-center justify-center relative shrink-0 select-none border-transparent transition duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] h-8 w-8 rounded-md active:scale-95 group hover:bg-gray-100 ${!isSidebarOpen ? "mx-auto" : ""
              }`}
            type="button"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-pressed={isSidebarOpen}
          >
            <div className="relative flex items-center justify-center" style={{ width: '20px', height: '20px' }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 transition text-gray-400 group-hover:text-gray-900"
                aria-hidden="true"
              >
                <path d="M16.5 4C17.3284 4 18 4.67157 18 5.5V14.5C18 15.3284 17.3284 16 16.5 16H3.5C2.67157 16 2 15.3284 2 14.5V5.5C2 4.67157 2.67157 4 3.5 4H16.5ZM7 15H16.5C16.7761 15 17 14.7761 17 14.5V5.5C17 5.22386 16.7761 5 16.5 5H7V15ZM3.5 5C3.22386 5 3 5.22386 3 5.5V14.5C3 14.7761 3.22386 15 3.5 15H6V5H3.5Z" />
              </svg>
            </div>
          </button>
        </div>

        <nav className="flex flex-col flex-1 w-full px-3 py-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const hasChildren = "children" in link && !!link.children?.length;
            const isChildActive =
              hasChildren &&
              link.children!.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`));
            const isParentActive = pathname === link.href;
            const isActive = isParentActive || isChildActive;

            if (hasChildren) {
              const isOpen = isSidebarOpen && isEconomyOpen;

              return (
                <div key={link.href}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSidebarOpen) {
                        dispatch(toggleSidebar());
                        setIsEconomyOpen(true);
                        return;
                      }
                      setIsEconomyOpen((prev) => !prev);
                    }}
                    className={`flex items-center rounded-lg transition-all duration-200 ${isSidebarOpen ? "w-full px-4 py-2.5 gap-3" : "w-10 h-10 mx-auto justify-center"
                      } ${isParentActive
                        ? "bg-blue-600 text-white font-semibold shadow-md"
                        : isChildActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    title={!isSidebarOpen ? link.label : undefined}
                  >
                    <Icon size={20} />
                    {isSidebarOpen && (
                      <>
                        <span className="text-sm flex-1 text-left">{link.label}</span>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </>
                    )}
                  </button>

                  {isOpen && (
                    <div className="mt-1 ml-4 pl-3 border-l border-gray-200 space-y-1">
                      {link.children!.map((child) => {
                        const isChildLinkActive = pathname === child.href || pathname.startsWith(`${child.href}/`);

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={closeMobileMenu}
                            className={`flex items-center rounded-lg transition-all duration-200 w-full px-4 py-2 text-sm ${isChildLinkActive
                              ? "bg-blue-600 text-white font-semibold shadow-md"
                              : "text-gray-700 hover:bg-gray-100"
                              }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={`flex items-center rounded-lg transition-all duration-200 ${isSidebarOpen ? "w-full px-4 py-2.5 gap-3" : "w-10 h-10 mx-auto justify-center"
                  } ${isActive
                    ? "bg-blue-600 text-white font-semibold shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
                title={!isSidebarOpen ? link.label : undefined}
              >
                <Icon size={20} />
                {isSidebarOpen && <span className="text-sm">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            className={`bg-red-500 hover:bg-red-600 text-white border-none rounded-lg font-medium transition-colors flex items-center shadow-sm ${isSidebarOpen ? "w-full py-2.5 px-4 justify-center gap-2" : "w-10 h-10 mx-auto justify-center p-0"
              }`}
            onClick={handleLogout}
            title={!isSidebarOpen ? "Logout" : undefined}
          >
            <Logout size={18} />
            {isSidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
