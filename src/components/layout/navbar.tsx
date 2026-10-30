"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope, ShoppingBag, Calendar, Activity, Menu, X, ChevronRight } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: typeof Stethoscope;
  description: string;
}

const navigationItems: NavItem[] = [
  {
    name: "Service Explorer",
    href: "/services",
    icon: Stethoscope,
    description: "Catalog, filters & pricing",
  },
  {
    name: "Cart Split & Checkout",
    href: "/cart",
    icon: ShoppingBag,
    description: "Multi-vendor checkout split",
  },
  {
    name: "Booking & Timezones",
    href: "/booking",
    icon: Calendar,
    description: "Timezone schedule mapper",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Client-side mount check for createPortal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close drawer automatically on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-slate-900 shrink-0 rounded-lg py-1 transition-all duration-200 ease-in-out hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            aria-label="MedEx Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm transition-all duration-200 ease-in-out">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              MedEx
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center gap-1 lg:gap-2"
            aria-label="Desktop Navigation"
          >
            {navigationItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out ${
                    isActive
                      ? "bg-teal-50 text-teal-600"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-all duration-200 ease-in-out ${
                      isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Trigger Button (Rightmost side with "Services" and Hamburger Icon) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-all duration-200 ease-in-out hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 md:hidden"
            aria-label="Open Services menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-4 w-4 text-slate-600" />
            <span>Features</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Portal: Rendered to document.body to escape header containing block & backdrop-blur stacking context */}
      {mounted &&
        createPortal(
          <div
            className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
              mobileMenuOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
            }`}
          >
            {/* Backdrop */}
            <div
              className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
                mobileMenuOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Right-Side Slide-Over Drawer */}
            <div
              className={`fixed inset-y-0 right-0 z-50 flex h-full h-[100dvh] w-[85vw] max-w-[320px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
                mobileMenuOpen ? "translate-x-0" : "translate-x-full"
              }`}
              role="dialog"
              aria-modal="true"
              aria-label="Services Menu"
            >
              {/* Drawer Header */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-base font-bold text-slate-900 leading-tight">MedEx</span>
                    <span className="text-[11px] font-medium text-teal-600">Services & Features</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-all duration-200 ease-in-out hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-4" aria-label="Mobile Navigation">
                <div>
                  <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Workflows
                  </p>
                  <div className="mt-2.5 space-y-2">
                    {navigationItems.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`group flex items-center justify-between rounded-xl border p-3 transition-all duration-200 ease-in-out ${
                            isActive
                              ? "border-teal-500 bg-teal-50/70 text-teal-900 shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ease-in-out ${
                                isActive
                                  ? "bg-teal-600 text-white shadow-xs"
                                  : "bg-teal-50 text-teal-600 group-hover:bg-teal-100"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col text-left">
                              <span
                                className={`text-sm font-semibold ${
                                  isActive ? "text-teal-900" : "text-slate-900"
                                }`}
                              >
                                {item.name}
                              </span>
                              <span className="text-xs text-slate-600 line-clamp-1">
                                {item.description}
                              </span>
                            </div>
                          </div>
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 transition-transform duration-200 ease-in-out group-hover:translate-x-0.5 ${
                              isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </nav>

              {/* Drawer Footer */}
              <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-4">
                <div className="rounded-lg bg-teal-50/70 border border-teal-100 p-3 text-xs text-teal-800">
                  <p className="font-semibold text-teal-900">MedEx Portal</p>
                  <p className="text-teal-700/90 mt-0.5">Comprehensive Healthcare Operations</p>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
