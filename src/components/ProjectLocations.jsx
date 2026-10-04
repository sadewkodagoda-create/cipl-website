import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useInView,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowUpRight, Info } from "@phosphor-icons/react";
import ScrollHeading from "./ScrollHeading";
import useMotionPreference from "../hooks/useMotionPreference";
import { CLIENT_PROJECTS } from "../lib/clientProjects";
import { PROJECT_LOCATIONS } from "../lib/projectLocations";
import { PROJECT_MAP_IMAGERY } from "../lib/projectMapImagery";
import {
  getProjectMapCamera,
  getProjectMarker,
  mercatorPoint,
  projectMapStage,
  smoothRange,
} from "../lib/projectMapCamera";

const STAGES = ["Sri Lanka", "Western Province", "Our projects"];
const STAGE_PROGRESS = [0, 0.55, 0.93];

function SatelliteLayer({ layer, progress, camera, size, enabled }) {
  const [loaded, setLoaded] = useState(false);
  const [west, south, east, north] = layer.bounds;
  const nw = mercatorPoint(west, north);
  const se = mercatorPoint(east, south);
  const x = useTransform(
    camera,
    (value) => size.width / 2 + (nw.x - value.x) * value.scale,
  );
  const y = useTransform(
    camera,
    (value) => size.height / 2 + (nw.y - value.y) * value.scale,
  );
  // Keep the raster's dimensions fixed: zoom and pan can then be composited
  // instead of changing layout and repainting every satellite image each frame.
  const scale = useTransform(camera, (value) => (se.x - nw.x) * value.scale / layer.width);
  const opacity = useTransform(progress, (value) =>
    !loaded
      ? 0
      : layer.reveal === 0
        ? 1
        : smoothRange(layer.reveal, layer.reveal + 0.1, value),
  );

  return (
    <motion.img
      className="project-map-satellite"
      src={enabled ? layer.src : undefined}
      alt=""
      loading="lazy"
      decoding="async"
      draggable="false"
      width={layer.width}
      height={layer.height}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(false)}
      style={{
        x,
        y,
        width: layer.width,
        height: layer.width * (se.y - nw.y) / (se.x - nw.x),
        scale,
        transformOrigin: "0 0",
        opacity,
      }}
    />
  );
}

function ProjectMarker({
  project,
  camera,
  progress,
  size,
  active,
  onHighlight,
  onOpen,
}) {
  const position = useTransform(() =>
    getProjectMarker(
      project,
      camera.get(),
      progress.get(),
      size.width,
      size.height,
    ),
  );
  const x = useTransform(position, (value) => value.x);
  const y = useTransform(position, (value) => value.y);
  const cx = useTransform(position, (value) => value.anchor.x);
  const cy = useTransform(position, (value) => value.anchor.y);
  const connection = useTransform(
    position,
    (value) => `M ${value.anchor.x} ${value.anchor.y} L ${value.x} ${value.y}`,
  );
  const scale = useTransform(
    progress,
    (value) => 0.78 + smoothRange(0.18, 0.82, value) * 0.22,
  );
  const labelOpacity = useTransform(progress, (value) =>
    smoothRange(0.2, 0.5, value),
  );

  return (
    <>
      <svg
        className={`project-map-connection${active ? " is-active" : ""}`}
        aria-hidden="true"
      >
        <motion.path d={connection} />
        <motion.circle cx={cx} cy={cy} r={active ? 5 : 3} />
      </svg>
      <motion.div className="project-map-marker-position" style={{ x, y }}>
        <motion.button
          type="button"
          className={`project-map-marker project-map-marker--${project.id}${active ? " is-active" : ""}`}
          style={{ scale }}
          aria-label={`Open ${project.name} project gallery`}
          aria-haspopup="dialog"
          onPointerEnter={() => onHighlight(project.id)}
          onFocus={() => onHighlight(project.id)}
          onClick={() => onOpen(CLIENT_PROJECTS[project.galleryId])}
          data-latitude={project.latitude}
          data-longitude={project.longitude}
        >
          <img src={project.logo} alt="" loading="lazy" decoding="async" />
          <motion.span
            className="project-map-marker-label"
            style={{ opacity: labelOpacity }}
            aria-hidden="true"
          >
            {project.name}
          </motion.span>
        </motion.button>
      </motion.div>
    </>
  );
}

export default function ProjectLocations({ onOpenProject }) {
  const journeyRef = useRef(null);
  const canvasRef = useRef(null);
  const loadImagery = useInView(canvasRef, { margin: "600px 0px", once: true });
  const reduceMotion = useMotionPreference();
  const [size, setSize] = useState({ width: 1000, height: 520 });
  const [activeId, setActiveId] = useState(null);
  const [stage, setStage] = useState(reduceMotion ? 2 : 0);
  const manualProgress = useMotionValue(1);
  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ["start 96px", "end end"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 30,
    mass: 0.7,
  });
  const progress = useTransform(() =>
    reduceMotion ? manualProgress.get() : smoothProgress.get(),
  );
  const camera = useTransform(() =>
    getProjectMapCamera(progress.get(), size.width, size.height),
  );
  const progressScale = useTransform(progress, (value) =>
    Math.min(1, Math.max(0, value)),
  );

  const stageRef = useRef(stage);
  useMotionValueEvent(progress, "change", (value) => {
    const nextStage = projectMapStage(value);
    if (stageRef.current !== nextStage) {
      stageRef.current = nextStage;
      setStage(nextStage);
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setSize({ width, height });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    stageRef.current = projectMapStage(progress.get());
    setStage(stageRef.current);
  }, [progress, reduceMotion]);

  const goToStage = (index) => {
    if (reduceMotion) {
      manualProgress.set(STAGE_PROGRESS[index]);
      return;
    }
    const journey = journeyRef.current;
    const sticky = journey.querySelector(".project-map-sticky");
    const topOffset =
      Number.parseFloat(window.getComputedStyle(sticky).top) || 96;
    const start = journey.getBoundingClientRect().top + window.scrollY - 96;
    const travel = journey.offsetHeight - window.innerHeight + 96;
    window.scrollTo({
      top:
        start +
        travel * STAGE_PROGRESS[index] +
        (index === 0 ? 96 - topOffset : 0),
      behavior: "smooth",
    });
  };

  return (
    <section
      className={`section project-locations-section${reduceMotion ? " is-reduced-motion" : ""}`}
      aria-labelledby="project-locations-title"
    >
      <div className="shell project-locations-heading">
        <div>
          <p className="eyebrow">Our project locations</p>
          <ScrollHeading id="project-locations-title">Our projects in Sri Lanka.</ScrollHeading>
        </div>
        <p className="project-locations-intro">
          From the island to the places we build.
          <br />
          Explore our projects in Poruwadanda and Wadduwa.
        </p>
      </div>

      <div ref={journeyRef} className="project-map-journey">
        <div className="shell project-map-sticky">
          <figure className="project-map-figure">
            <div
              ref={canvasRef}
              className="project-map-canvas"
              role="group"
              aria-label="Satellite map of CIPL project locations. Select a company logo to open its photo gallery."
              data-stage={stage}
            >
              <div className="project-map-world" aria-hidden="true">
                {PROJECT_MAP_IMAGERY.map((layer) => (
                  <SatelliteLayer
                    key={layer.src}
                    layer={layer}
                    progress={progress}
                    camera={camera}
                    size={size}
                    enabled={loadImagery}
                  />
                ))}
              </div>
              <div className="project-map-shade" aria-hidden="true" />
              {PROJECT_LOCATIONS.map((project) => (
                <ProjectMarker
                  key={project.id}
                  project={project}
                  camera={camera}
                  progress={progress}
                  size={size}
                  active={activeId === project.id}
                  onHighlight={setActiveId}
                  onOpen={onOpenProject}
                />
              ))}
              <p className="sr-only">
                All five projects are in the Western Province. Logo callouts
                connect to each site's exact coordinates. The map zooms closer
                as you scroll and reverses as you scroll up.
              </p>
            </div>

            <figcaption className="project-map-caption">
              <nav className="project-map-stages" aria-label="Map views">
                {STAGES.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    aria-current={index === stage ? "step" : undefined}
                    onClick={() => goToStage(index)}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <div className="project-map-caption-actions">
                <p className="project-map-hint">
                  {reduceMotion || stage === 2 ? (
                    <>
                      Select a logo to view project photos{" "}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Scroll to explore{" "}
                      <ArrowDown size={17} aria-hidden="true" />
                    </>
                  )}
                </p>
                <details
                  className="project-map-credits"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.currentTarget.open = false;
                      event.currentTarget.querySelector("summary")?.focus();
                    }
                  }}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      event.currentTarget.open = false;
                    }
                  }}
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
                    <a
                      href="https://eox.at/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      EOX IT Services GmbH
                    </a>
                    <span>
                      {" "}
                      (Contains modified Copernicus Sentinel data 2016 &amp;
                      2017).{" "}
                    </span>
                    <a
                      href="https://creativecommons.org/licenses/by/4.0/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      CC BY 4.0
                    </a>
                  </p>
                </details>
              </div>
            </figcaption>
            <div className="project-map-progress" aria-hidden="true">
              <motion.span style={{ scaleX: progressScale }} />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
