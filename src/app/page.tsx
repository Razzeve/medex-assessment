import Link from "next/link";
import { Stethoscope, ShoppingBag, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";

const tasks = [
  {
    id: "task-1",
    title: "Task 1: Service Explorer",
    description:
      "Faceted healthcare service discovery catalog with debounced search, category filters, price sorting, and responsive grid/list views.",
    href: "/services",
    icon: Stethoscope,
    tags: ["Search", "Filtering", "URL State", "Responsive UI"],
  },
  {
    id: "task-2",
    title: "Task 2: Cart Split & Checkout",
    description:
      "Multi-provider order routing separating medications, diagnostics, and appointments with individual delivery fee calculations and checkout flow.",
    href: "/cart",
    icon: ShoppingBag,
    tags: ["Zustand Store", "Split Order Engine", "Form State", "Stepped Checkout"],
  },
  {
    id: "task-3",
    title: "Task 3: Booking & Multi-Timezone Scheduler",
    description:
      "Practitioner availability mapper across patient and provider time zones, conflict prevention, and local slot conversions.",
    href: "/booking",
    icon: Calendar,
    tags: ["Timezone Conversions", "Slot Conflicts", "date-fns", "Interactive Picker"],
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20">
          <CheckCircle2 className="h-3.5 w-3.5" /> Technical Assessment Submission
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          MedEx Frontend Engineering Suite
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Architecture, state management, and implementation across three core healthcare workflows.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <div
              key={task.id}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-500 hover:shadow-md"
            >
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{task.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{task.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <Link
                  href={task.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 group-hover:text-teal-700"
                >
                  Explore Implementation <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}