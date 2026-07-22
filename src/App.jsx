import { lazy, Suspense } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
const Home = lazy(() => import("./pages/Home"));
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
