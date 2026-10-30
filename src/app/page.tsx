import Link from "next/link";
import { Stethoscope, ShoppingBag, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";

interface WorkflowCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: typeof Stethoscope;
  tags: string[];
}

const workflows: WorkflowCard[] = [
  {
    id: "services",
    title: "Service Explorer",
    description:
      "Faceted healthcare service discovery catalog with debounced search, category filters, price sorting, and responsive grid/list views.",
    href: "/services",
    icon: Stethoscope,
    tags: ["Search", "Filtering", "URL State", "Responsive UI"],
  },
  {
    id: "cart",
    title: "Cart Split & Checkout",
    description:
      "Multi-provider order routing separating medications, diagnostics, and appointments with individual delivery fee calculations and checkout flow.",
    href: "/cart",
    icon: ShoppingBag,
    tags: ["Zustand Store", "Split Order Engine", "Form State", "Stepped Checkout"],
  },
  {
    id: "booking",
    title: "Booking & Timezones",
    description:
      "Practitioner availability mapper across patient and provider time zones, conflict prevention, and local slot conversions.",
    href: "/booking",
    icon: Calendar,
    tags: ["Timezone Conversions", "Slot Conflicts", "date-fns", "Interactive Picker"],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-full bg-slate-50 py-8 px-4 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-8 sm:mb-10 text-center sm:text-left">
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span className="truncate">MedEx Operational Platform</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            MedEx Healthcare Suite
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Unified architecture, state management, and implementation across core healthcare workflows.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow, idx) => {
            const Icon = workflow.icon;
            const isLastOnMd = idx === 2 ? "md:col-span-2 lg:col-span-1" : "";
            return (
              <div
                key={workflow.id}
                className={`group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 ease-in-out hover:border-teal-500 hover:shadow-md ${isLastOnMd}`}
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-all duration-200 ease-in-out group-hover:bg-teal-600 group-hover:text-white shadow-xs">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-base sm:text-lg font-semibold text-slate-900">
                    {workflow.title}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                    {workflow.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {workflow.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <Link
                    href={workflow.href}
                    className="inline-flex items-center gap-1.5 rounded-lg text-xs sm:text-sm font-semibold text-teal-600 transition-all duration-200 ease-in-out group-hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    <span>Explore Workflow</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-all duration-200 ease-in-out group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
