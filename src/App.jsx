import { lazy, Suspense, useLayoutEffect, useRef } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const Loader = () => (
  <div className="min-h-[70vh] grid place-items-center" role="status">
    <div className="w-56 space-y-3 animate-pulse" aria-label="Loading">
      <div className="h-3 bg-slate-200" />
      <div className="h-3 bg-slate-200 w-2/3" />
    </div>
  </div>
);
export default function App() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  useLayoutEffect(() => {
    if (previousPath.current !== pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      previousPath.current = pathname;
    }
  }, [pathname]);

  return (
    <>
      <Navbar />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/client" element={<ClientPortal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
