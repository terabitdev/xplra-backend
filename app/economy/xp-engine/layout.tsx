"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardLayout from "@/app/components/DashboardLayout";
import { XP_ENGINE_TABS } from "./tabs";

export default function XpEngineLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">XP Engine</h1>

        <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-lg text-sm w-fit max-w-full">
          {XP_ENGINE_TABS.map((tab) => {
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-white shadow-sm font-medium text-gray-900"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div>{children}</div>
      </div>
    </DashboardLayout>
  );
}
