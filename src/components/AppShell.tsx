import Link from "next/link";
import { Activity, Cable, LayoutDashboard, Radio, Upload } from "lucide-react";

const nav = [
  { href: "/", label: "Trials", icon: LayoutDashboard },
  { href: "/oversight", label: "Risk oversight & queries", icon: Radio },
  { href: "/edc", label: "EDC Connectors", icon: Cable },
  { href: "/uploads", label: "Document intake", icon: Upload },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full bg-slate-50 text-slate-900">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-200 px-5 py-6">
          <div className="flex items-center gap-2 text-cyan-700">
            <Activity className="h-6 w-6" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              AegisNeura
            </span>
          </div>
          <h1 className="mt-2 text-lg font-semibold text-slate-900">RBQM Platform</h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Automated risk-based quality monitoring for clinical trials
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Icon className="h-4 w-4 text-cyan-600" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <p className="border-t border-slate-200 px-4 py-3 text-[11px] text-slate-400">
          AI review · Site risk signals · Lead oversight roles
        </p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-8">
          <div className="md:hidden">
            <span className="text-sm font-semibold text-cyan-700">AegisNeura RBQM</span>
          </div>
          <p className="text-xs text-slate-500">
            Remote monitoring · Statistical engine · EDC-ready connectors
          </p>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
