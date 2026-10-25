import { lazy, Suspense, useLayoutEffect, useRef } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import CompanySelection from "./pages/CompanySelection";
import "./company-pages.css";
const Home = lazy(() => import("./pages/Home"));
const Logistics = lazy(() => import("./pages/Logistics"));
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
  const { pathname, hash, search } = useLocation();
  const routePath = pathname.replace(/\/+$/, "").toLowerCase() || "/";
  const showConstructionNav = ["/construction", "/admin", "/client"].includes(
    routePath,
  );
  const previousPath = useRef(pathname);
  useLayoutEffect(() => {
    const titles = {
      "/": "CIPL | Construction & Logistics",
      "/construction":
        "CIPL Construction | Warehouses, built around your business",
      "/logistics": "CIPL Logistics | Chanithu International",
      "/client": "Client portal | CIPL Construction",
      "/admin": "Admin portal | CIPL Construction",
    };
    document.title = titles[routePath] || titles["/"];
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      const isLogistics = routePath === "/logistics";
      favicon.href = isLogistics
        ? "/cipl-logistics-logo-transparent.png"
        : "/cipl-logo.webp";
      favicon.type = isLogistics ? "image/png" : "image/webp";
    }
    if (previousPath.current !== pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      previousPath.current = pathname;
    }
  }, [pathname, routePath]);

  return (
    <>
      {showConstructionNav && <Navbar />}
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route
            path="/"
            element={
              hash === "#contact" ? (
                <Navigate
                  to={{ pathname: "/construction", hash, search }}
                  replace
                />
              ) : (
                <CompanySelection />
              )
            }
          />
          <Route path="/construction" element={<Home />} />
          <Route path="/logistics" element={<Logistics />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/client" element={<ClientPortal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
