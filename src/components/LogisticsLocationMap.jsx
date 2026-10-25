import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowsOutCardinal,
  Crosshair,
  Info,
  Minus,
  Plus,
} from "@phosphor-icons/react";
import useMotionPreference from "../hooks/useMotionPreference";
import { PROJECT_MAP_IMAGERY } from "../lib/projectMapImagery";
import { mercatorPoint, projectMapPoint } from "../lib/projectMapCamera";
import {
  getLogisticsMapCamera,
  getLogisticsZoomRange,
  LOGISTICS_LOCATION,
  LOGISTICS_MAP_VIEWS,
  panLogisticsMap,
  zoomLogisticsMap,
} from "../lib/logisticsLocation";

const ORIGIN = mercatorPoint(
  LOGISTICS_LOCATION.longitude,
  LOGISTICS_LOCATION.latitude,
);
const WORLD_SCALE = 100000;
const SATELLITE_LAYERS = PROJECT_MAP_IMAGERY.map((layer) => {
  const [west, south, east, north] = layer.bounds;
  const nw = mercatorPoint(west, north);
  const se = mercatorPoint(east, south);
  return {
    ...layer,
    style: {
      left: (nw.x - ORIGIN.x) * WORLD_SCALE,
      top: (nw.y - ORIGIN.y) * WORLD_SCALE,
      width: (se.x - nw.x) * WORLD_SCALE,
      height: (se.y - nw.y) * WORLD_SCALE,
    },
  };
});

function closeMapPopover(event) {
  if (event.type === "keydown" && event.key !== "Escape") return;
  if (
    event.type === "blur" &&
    event.currentTarget.contains(event.relatedTarget)
  )
    return;
  event.currentTarget.open = false;
  if (event.type === "keydown")
    event.currentTarget.querySelector("summary").focus();
}

export default function LogisticsLocationMap() {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const loadImagery = useInView(canvasRef, { margin: "500px", once: true });
  const reduceMotion = useMotionPreference();
  const [map, setMap] = useState(() => ({
    width: 640,
    height: 420,
    camera: getLogisticsMapCamera("western", 640, 420),
    view: "western",
    instant: false,
  }));
  const [dragging, setDragging] = useState(false);
  const { width, height, camera } = map;
  const range = getLogisticsZoomRange(width, height);
  const marker = projectMapPoint(
    LOGISTICS_LOCATION.longitude,
    LOGISTICS_LOCATION.latitude,
    camera,
    width,
    height,
  );
  const transition = {
    duration: reduceMotion || map.instant ? 0 : 0.45,
    ease: [0.22, 1, 0.36, 1],
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const observer = new ResizeObserver(([entry]) => {
      const { width: nextWidth, height: nextHeight } = entry.contentRect;
      if (!nextWidth || !nextHeight) return;
      setMap((current) => {
        const camera = current.view
          ? getLogisticsMapCamera(current.view, nextWidth, nextHeight)
          : {
              ...current.camera,
              scale:
                current.camera.scale *
                Math.min(
                  nextWidth / current.width,
                  nextHeight / current.height,
                ),
            };
        return {
          ...current,
          width: nextWidth,
          height: nextHeight,
          instant: true,
          camera: zoomLogisticsMap(camera, 1, nextWidth, nextHeight),
        };
      });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const onWheel = (event) => {
      // Leave ordinary page scrolling available, including on touch screens.
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const factor = Math.exp(
        -Math.max(-100, Math.min(100, event.deltaY)) * 0.008,
      );
      setMap((current) => ({
        ...current,
        view: null,
        instant: true,
        camera: zoomLogisticsMap(
          current.camera,
          factor,
          current.width,
          current.height,
          { x: event.clientX - rect.left, y: event.clientY - rect.top },
        ),
      }));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  const goToView = (view) => {
    setMap((current) => ({
      ...current,
      view,
      instant: false,
      camera: getLogisticsMapCamera(view, current.width, current.height),
    }));
  };
  const zoom = (factor) => {
    setMap((current) => ({
      ...current,
      view: null,
      instant: false,
      camera: zoomLogisticsMap(
        current.camera,
        factor,
        current.width,
        current.height,
      ),
    }));
  };
  const pan = (x, y) => {
    setMap((current) => ({
      ...current,
      view: null,
      instant: false,
      camera: panLogisticsMap(current.camera, x, y),
    }));
  };
  const stopDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <figure className="logistics-location-map">
      <div
        ref={canvasRef}
        className={`logistics-map-canvas${dragging ? " is-dragging" : ""}`}
        role="group"
        aria-label="Interactive satellite map of CIPL Logistics in Bandaragama"
        aria-describedby="logistics-map-help"
        tabIndex={0}
        data-map-view={map.view || "custom"}
        data-map-scale={camera.scale}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const directions = {
            ArrowLeft: [80, 0],
            ArrowRight: [-80, 0],
            ArrowUp: [0, 80],
            ArrowDown: [0, -80],
          };
          if (directions[event.key]) {
            event.preventDefault();
            pan(...directions[event.key]);
          } else if (["+", "=", "-", "Home"].includes(event.key)) {
            event.preventDefault();
            if (event.key === "Home") goToView("western");
            else zoom(event.key === "-" ? 1 / 1.6 : 1.6);
          }
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 || event.target.closest("a, button, details"))
            return;
          dragRef.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            camera,
          };
          if (event.pointerType === "mouse") {
            event.currentTarget.setPointerCapture(event.pointerId);
          }
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || event.pointerId !== drag.id) return;
          const dx = event.clientX - drag.x;
          const dy = event.clientY - drag.y;
          if (event.pointerType !== "mouse" && !dragging) {
            if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          if (Math.hypot(dx, dy) < 3) return;
          setDragging(true);
          setMap((current) => ({
            ...current,
            view: null,
            instant: true,
            camera: panLogisticsMap(drag.camera, dx, dy),
          }));
        }}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onLostPointerCapture={stopDrag}
      >
        <motion.div
          className="logistics-map-world"
          aria-hidden="true"
          initial={false}
          animate={{
            x: marker.x,
            y: marker.y,
            scale: camera.scale / WORLD_SCALE,
          }}
          transition={transition}
        >
          {SATELLITE_LAYERS.map((layer) => (
            <img
              key={layer.src}
              src={loadImagery ? layer.src : undefined}
              width={layer.width}
              height={layer.height}
              style={layer.style}
              alt=""
              decoding="async"
              draggable="false"
            />
          ))}
        </motion.div>
        <div className="logistics-map-shade" aria-hidden="true" />
        <motion.div
          className="logistics-map-pin"
          initial={false}
          animate={{ x: marker.x, y: marker.y }}
          transition={transition}
          data-latitude={LOGISTICS_LOCATION.latitude}
          data-longitude={LOGISTICS_LOCATION.longitude}
        >
          <span className="logistics-map-pin-stem" aria-hidden="true" />
          <span className="logistics-map-pin-dot" aria-hidden="true" />
          <a
            className="logistics-map-logo"
            href={LOGISTICS_LOCATION.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open CIPL Logistics location in Google Maps (opens in a new tab)"
            draggable="false"
          >
            <img
              src="/cipl-logistics-logo-transparent.png"
              alt="CIPL Logistics"
              width="1965"
              height="800"
              draggable="false"
            />
            <span>Distribution center</span>
          </a>
        </motion.div>
        <div className="logistics-map-tools" aria-label="Map controls">
          <button
            type="button"
            aria-label="Zoom in"
            disabled={camera.scale >= range.max - 0.001}
            onClick={() => zoom(1.6)}
          >
            <Plus size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={camera.scale <= range.min + 0.001}
            onClick={() => zoom(1 / 1.6)}
          >
            <Minus size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Recenter map on CIPL Logistics"
            onClick={() => goToView("western")}
          >
            <Crosshair size={19} aria-hidden="true" />
          </button>
          <details
            className="logistics-map-pan-menu"
            onKeyDown={closeMapPopover}
            onBlur={closeMapPopover}
          >
            <summary aria-label="Pan map controls">
              <ArrowsOutCardinal size={18} aria-hidden="true" />
            </summary>
            <div className="logistics-map-pan-buttons">
              {[
                ["north", ArrowUp, 0, 80],
                ["west", ArrowLeft, 80, 0],
                ["east", ArrowRight, -80, 0],
                ["south", ArrowDown, 0, -80],
              ].map(([direction, Icon, x, y]) => (
                <button
                  key={direction}
                  type="button"
                  className={`pan-${direction}`}
                  aria-label={`Pan map ${direction}`}
                  onClick={() => pan(x, y)}
                >
                  <Icon size={18} aria-hidden="true" />
                </button>
              ))}
            </div>
          </details>
        </div>
        <p id="logistics-map-help" className="logistics-map-help">
          Use + / − to zoom. Drag to explore.
          <span className="sr-only">
            Use arrow keys to pan, plus and minus to zoom, or Home to reset.
            Select the logistics logo to open directions in Google Maps.
          </span>
        </p>
      </div>
      <figcaption className="logistics-map-caption">
        <nav aria-label="Location map views" className="logistics-map-views">
          {LOGISTICS_MAP_VIEWS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={map.view === id}
              onClick={() => goToView(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <details
          className="project-map-credits"
          onKeyDown={closeMapPopover}
          onBlur={closeMapPopover}
        >
          <summary aria-label="Map imagery credits">
            <Info size={18} aria-hidden="true" />
          </summary>
          <p className="project-map-attribution">
            <a
              href="https://cloudless.eox.at/"
              target="_blank"
              rel="noopener noreferrer"
            >
              EOxCloudless
            </a>
            {" by "}
            <a href="https://eox.at/" target="_blank" rel="noopener noreferrer">
              EOX IT Services GmbH
            </a>
            . Contains modified Copernicus Sentinel data 2016 &amp; 2017.{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY 4.0
            </a>
            .
          </p>
        </details>
      </figcaption>
    </figure>
  );
}
