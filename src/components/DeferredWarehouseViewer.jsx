import { lazy, Suspense, useEffect, useRef, useState } from "react";

let viewerModulePromise;

function loadWarehouseViewer() {
  viewerModulePromise ||= import("./WarehouseViewer");
  return viewerModulePromise;
}

const WarehouseViewer = lazy(loadWarehouseViewer);

function ViewerPlaceholder() {
  return (
    <div
      className="model-viewer-placeholder"
      role="status"
      aria-live="polite"
    >
      <span className="model-viewer-spinner" aria-hidden="true" />
      <strong>Preparing 3D preview</strong>
      <span>Loading the latest construction model…</span>
    </div>
  );
}

export default function DeferredWarehouseViewer(props) {
  const container = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const preload = () => void loadWarehouseViewer();

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timerId = window.setTimeout(preload, 0);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    const node = container.current;
    if (!node || visible) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "1200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={container}>
      {visible ? (
        <Suspense fallback={<ViewerPlaceholder />}>
          <WarehouseViewer {...props} />
        </Suspense>
      ) : (
        <ViewerPlaceholder />
      )}
    </div>
  );
}
