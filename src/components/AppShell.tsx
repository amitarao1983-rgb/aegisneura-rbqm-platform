import { Microscope } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-[#0d2137] bg-[#0a1628]">
        <div className="flex items-center gap-3 px-4 py-4 md:px-8">
          <Microscope className="h-6 w-6 text-cyan-400" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold text-white">Rodent DILI app</h1>
            <p className="text-xs text-slate-300">
              Histopathology reads for preclinical drug studies
            </p>
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
