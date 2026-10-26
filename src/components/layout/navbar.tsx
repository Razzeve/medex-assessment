"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope, ShoppingBag, Calendar, Activity } from "lucide-react";

const navigationItems = [
  { name: "Service Explorer", href: "/services", icon: Stethoscope, task: "Task 1" },
  { name: "Cart Split & Checkout", href: "/cart", icon: ShoppingBag, task: "Task 2" },
  { name: "Booking & Timezones", href: "/booking", icon: Calendar, task: "Task 3" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900">MedEx</span>
            <span className="text-[10px] font-medium text-teal-600 uppercase tracking-widest">
              Frontend Assessment
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navigationItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-teal-600" : "text-slate-500"}`} />
                <span>{item.name}</span>
                <span className="hidden md:inline-block rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] text-slate-600">
                  {item.task}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}