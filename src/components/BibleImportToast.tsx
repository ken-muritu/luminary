import type { BibleImportState } from "@/db/bible-store";
import { BookOpen, CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BibleImportToastProps {
  state: BibleImportState;
  onDismiss?: () => void;
}

export default function BibleImportToast({ state, onDismiss }: BibleImportToastProps) {
  const [dismissed, setDismissed] = useState(false);
  const { active, completed, failed } = state;

  useEffect(() => {
    if (active) setDismissed(false);
  }, [active]);

  useEffect(() => {
    if (completed && failed.length === 0) {
      const t = window.setTimeout(() => setDismissed(true), 6000);
      return () => clearTimeout(t);
    }
  }, [completed, failed.length]);

  if (dismissed) return null;
  if (!active && !completed) return null;

  const pct = active && active.total > 0 ? Math.round((active.imported / active.total) * 100) : 100;

  return (
    <output
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 w-72 rounded-xl border border-[#3a3844] bg-[#1B1B22] shadow-xl overflow-hidden block"
    >
      <div className="flex items-start gap-3 p-3">
        {completed && failed.length === 0 ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <BookOpen className="w-5 h-5 text-[#6c5ce7] shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          {active?.phase === "error" ? (
            <>
              <p className="text-sm font-medium text-amber-400">Bible import failed</p>
              <p className="text-xs text-[#8a8699] mt-0.5">
                {active.translation}: {active.message ?? "Unknown error"}
              </p>
            </>
          ) : active ? (
            <>
              <p className="text-sm font-medium text-[#C8C4D7]">
                Loading {active.translation} Bible
              </p>
              <p className="text-xs text-[#8a8699] mt-0.5">
                {active.imported.toLocaleString()} / {active.total.toLocaleString()} verses
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-[#2A2931] overflow-hidden">
                <div
                  className="h-full bg-[#6c5ce7] transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          ) : completed ? (
            <>
              <p className="text-sm font-medium text-[#C8C4D7]">Bible ready</p>
              <p className="text-xs text-[#8a8699] mt-0.5">
                {failed.length > 0
                  ? `${failed.length} translation(s) failed`
                  : "Default translation ready — others load when selected"}
              </p>
              {failed.length > 0 && (
                <ul className="mt-1 text-xs text-amber-400/90 list-disc pl-4">
                  {failed.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
            </>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-[#8a8699] hover:text-[#C8C4D7] p-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </output>
  );
}
