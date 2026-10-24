import AppShell from "@/components/AppShell";
import BibleImportToast from "@/components/BibleImportToast";
import { useDatabase } from "@/hooks/useDatabase";
import { useSettingsStore } from "@/stores/settingsStore";
import Bible from "@/views/Bible";
import Dashboard from "@/views/Dashboard";
import Onboarding from "@/views/Onboarding";
import Settings from "@/views/Settings";
import Songs from "@/views/Songs";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function AppRoutes() {
  const onboarded = useSettingsStore((s) => s.onboarded);

  if (!onboarded) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="songs" element={<Songs />} />
        <Route path="bible" element={<Bible />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function AppContent() {
  const { ready, error, bibleImport } = useDatabase();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#13131a] text-red-400 p-6">
        Database error: {error}
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#13131a] text-[#C8C4D7] gap-3">
        <p>Loading Luminary…</p>
        {bibleImport.active && (
          <p className="text-xs text-[#8a8699]">
            Importing {bibleImport.active.translation}: {bibleImport.active.imported}/
            {bibleImport.active.total}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <BibleImportToast state={bibleImport} />
      <AppRoutes />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
