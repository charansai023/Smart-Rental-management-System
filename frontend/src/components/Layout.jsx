import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import Icon from "./Icon";
import { useFleetData } from "../context/FleetDataContext";
import { API_BASE_URL } from "../lib/api";

export default function Layout() {
  const { backendError, toast, loading } = useFleetData();
  const [visibleToast, setVisibleToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    setVisibleToast(toast);
    const t = setTimeout(() => setVisibleToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="bg-slate-50 text-slate-900 font-sans antialiased flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        {backendError && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-medium px-6 py-2.5 flex items-center gap-2 shadow-xs">
            <Icon name="error" className="text-[18px] text-rose-600 shrink-0" />
            <span>
              Unable to connect to FastAPI backend at <span className="font-mono font-bold">{API_BASE_URL}</span>. Run{" "}
              <span className="font-mono bg-rose-100 px-1.5 py-0.5 rounded text-rose-900">docker-compose up --build</span> or{" "}
              <span className="font-mono bg-rose-100 px-1.5 py-0.5 rounded text-rose-900">uvicorn main:app</span> to activate telemetry stream.
            </span>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 pb-24 md:pb-8">
          <div className="max-w-[1650px] mx-auto space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 gap-3">
                <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-semibold text-slate-700">Connecting to Caterpillar Fleet Stream…</span>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
      <MobileNav />
      {visibleToast && (
        <div
          className={`fixed bottom-20 md:bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-3 border transition-all animate-bounce ${
            visibleToast.tone === "success"
              ? "bg-slate-950 text-amber-400 border-amber-400/40"
              : "bg-rose-600 text-white border-rose-500"
          }`}
        >
          <Icon name={visibleToast.tone === "success" ? "check_circle" : "error"} className="text-[18px]" />
          {visibleToast.message}
        </div>
      )}
    </div>
  );
}

