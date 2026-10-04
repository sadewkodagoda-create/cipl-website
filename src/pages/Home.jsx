import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Blueprint,
  Buildings,
  CalendarBlank,
  Camera,
  CheckCircle,
  EnvelopeSimple,
  Handshake,
  Images,
  Phone,
  ShieldCheck,
  UsersThree,
} from "@phosphor-icons/react";
import Reveal from "../components/Reveal";
import InquiryForm from "../components/InquiryForm";
import ScrollMotion from "../components/ScrollMotion";
import ScrollHeading from "../components/ScrollHeading";
import HeroMotion from "../components/HeroMotion";
import useMotionPreference from "../hooks/useMotionPreference";
import SitePreparationComparison from "../components/SitePreparationComparison";
import ProjectLocations from "../components/ProjectLocations";
import { CLIENT_PROJECTS } from "../lib/clientProjects";
import { STAGES } from "../lib/constants";
import hero800 from "../assets/cipl-warehouse-aerial-800.webp";
import hero1600 from "../assets/cipl-warehouse-aerial-1600.webp";
import hero2400 from "../assets/cipl-warehouse-aerial-2400.webp";
import hero3200 from "../assets/cipl-warehouse-aerial-3200.webp";
import heroAvif800 from "../assets/cipl-warehouse-aerial-800.avif";
import heroAvif1600 from "../assets/cipl-warehouse-aerial-1600.avif";
import heroAvif2400 from "../assets/cipl-warehouse-aerial-2400.avif";
import heroAvif3200 from "../assets/cipl-warehouse-aerial-3200.avif";
import heroExtendedBackground from "../assets/cipl-warehouse-extended-optimized.webp";

const ProjectGallery = lazy(() => import("../components/ProjectGallery"));

const clients = [
  {
    name: "TVS Lanka",
    src: "/clients/tvs-lanka.webp",
    className: "h-16 w-16 rounded-full",
    project: CLIENT_PROJECTS.tvs,
  },
  {
    name: "Rocell",
    src: "/clients/rocell.webp",
    className: "h-16 w-16",
    project: CLIENT_PROJECTS.rocell,
  },
  {
    name: "Spa Ceylon",
    src: "/clients/spa-ceylon.webp",
    className: "h-16 w-full max-w-[180px]",
    project: CLIENT_PROJECTS.spaCeylon,
  },
  {
    name: "Maliban",
    src: "/clients/maliban-optimized.webp",
    className: "h-12 w-full max-w-[160px]",
  },
  {
    name: "Space Logistics",
    src: "/clients/space-logistics.webp",
    className: "h-12 w-full max-w-[180px]",
    project: CLIENT_PROJECTS.spaceLogistics,
  },
  {
    name: "KAP",
    src: "/clients/kap.webp",
    className: "h-14 w-full max-w-[160px]",
  },
];

const companyStats = [
  {
    number: 2013,
    label: "Operating since",
    suffix: "",
    useGrouping: false,
    Icon: CalendarBlank,
    tone: "stat-card-pearl",
  },
  {
    number: 500,
    label: "Total built",
    suffix: "K",
    unit: "+ sq.ft.",
    Icon: Buildings,
    tone: "stat-card-blue",
  },
  {
    number: 100,
    label: "Employees",
    suffix: "+",
    Icon: UsersThree,
    tone: "stat-card-gold",
  },
  {
    number: clients.length,
    label: "Long-term clients",
    suffix: "",
    Icon: Handshake,
    tone: "stat-card-silver",
    featured: true,
  },
];

const advantages = [
  [
    Blueprint,
    "Made around you",
    "Your dimensions, workflow and operating requirements define the build, not a catalogue.",
    "why-card-tailored",
    "/site-photos/why/tailored-planning.webp?v=20261005",
  ],
  [
    Buildings,
    "One accountable partner",
    "We build and rent the facility, removing the disconnect between contractor and landlord.",
    "why-card-partner",
    "/site-photos/why/accountable-partner.webp?v=20261005",
  ],
  [
    Camera,
    "Progress you can see",
    "Follow every construction stage, view site photography and explore your warehouse in 3D.",
    "why-card-progress",
    "/site-photos/why/visible-progress.webp?v=20261005",
  ],
  [
    ShieldCheck,
    "Experience that compounds",
    "Since 2013, our field knowledge has translated into clearer decisions and dependable handovers.",
    "why-card-experience",
    "/site-photos/why/experienced-team.webp?v=20261005",
  ],
];

const stagePhotos = {
  Foundation: "/site-photos/process/foundation.webp?v=20261005",
  "Structural Framework": "/site-photos/process/structural-framework.webp?v=20261005",
  "Wall Construction": "/site-photos/process/wall-construction.webp?v=20261005",
  Roofing: "/site-photos/process/roofing.webp?v=20261005",
  "Interior Completion": "/site-photos/process/interior-completion.webp?v=20261005",
};

const processStages = STAGES.filter((stage) => stage !== "Completed");

function Statistic({ to, suffix = "", unit = "", useGrouping = true }) {
  return (
    <strong className="stat-value heading tracking-[-.05em] text-[var(--ink)]">
      {to.toLocaleString(undefined, { useGrouping })}
      {suffix && (
        <span
          className={unit ? "stat-suffix stat-suffix-major" : "stat-suffix"}
        >
          {suffix}
        </span>
      )}
      {unit && <span className="stat-unit">{unit}</span>}
    </strong>
  );
}

export default function Home() {
  const reduceMotion = useMotionPreference();
  const location = useLocation();
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    if (location.hash !== "#contact") return undefined;
    const timer = window.setTimeout(() => {
      document
        .querySelector("#contact")
        ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [location.hash, reduceMotion]);

  return (
    <ScrollMotion>
      <main id="main-content" className="overflow-x-clip">
        <HeroMotion className="hero-section relative flex items-end">
          <div
            className="hero-media"
            style={{
              "--hero-extended-photo": `url("${heroExtendedBackground}")`,
            }}
          >
            <div aria-hidden="true" className="hero-extension" />
            <picture>
              <source
                type="image/avif"
                srcSet={`${heroAvif800} 800w, ${heroAvif1600} 1600w, ${heroAvif2400} 2400w, ${heroAvif3200} 3200w`}
                sizes="100vw"
              />
              <img
                src={hero1600}
                srcSet={`${hero800} 800w, ${hero1600} 1600w, ${hero2400} 2400w, ${hero3200} 3200w`}
                sizes="100vw"
                alt="Aerial view of CIPL warehouses surrounded by greenery"
                width="3200"
                height="1828"
                fetchPriority="high"
                decoding="async"
                className="hero-image absolute inset-0 h-full w-full object-cover"
              />
            </picture>
          </div>
          <div className="hero-content shell relative grid items-end gap-8 py-10 lg:grid-cols-12 lg:gap-10">
            <Reveal kind="copy" className="hero-copy lg:col-span-8">
              <div className="hero-overlay absolute" aria-hidden="true" />
              <p className="eyebrow mb-5">
                Warehouse construction & rental /{" "}
                <span className="inline-block">Sri Lanka</span>
              </p>
              <h1 className="hero-title max-w-[900px] text-[clamp(2.75rem,5.5vw,5.4rem)] font-semibold leading-[.97] tracking-[-.058em] text-[var(--ink)]">
                <ScrollHeading as="span">Built to your spec.</ScrollHeading>
                <br />
                <ScrollHeading
                  as="span"
                  className="hero-title-accent text-[#33506f]"
                >
                  Ready for your ambition.
                </ScrollHeading>
              </h1>
              <p className="hero-description mt-6 max-w-xl text-base leading-relaxed text-slate-700 md:text-lg">
                CIPL designs, builds and rents industrial warehouses around your
                operation. One accountable partner from first drawing to
                handover.
              </p>
              <div className="hero-actions mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    document.querySelector("#contact")?.scrollIntoView({
                      behavior: reduceMotion ? "auto" : "smooth",
                    })
                  }
                  className="btn btn-primary hero-action"
                >
                  Start a conversation <ArrowRight size={18} />
                </button>
                <Link
                  to="/client"
                  className="btn btn-hero-secondary hero-action"
                >
                  Track your build
                </Link>
              </div>
            </Reveal>
            <div className="hero-stat lg:col-span-3 lg:col-start-10 lg:ml-auto lg:max-w-[280px]">
              <p className="text-sm text-slate-600">
                A decade of accountable delivery
              </p>
              <p className="heading mt-3 text-lg leading-snug text-[var(--ink)] xl:text-xl">
                Building long-term capacity for Sri Lankan industry since 2013.
              </p>
            </div>
          </div>
        </HeroMotion>

        <section className="stats-section py-12 md:py-16">
          <div className="stats-showcase shell grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)]">
            <Reveal kind="photo" className="stats-photo-card" hover>
              <div className="stats-photo-frame">
                <img
                  src="/site-photos/cipl-workforce-generated.webp?v=20261005"
                  alt="Sri Lankan warehouse construction workforce during a site briefing"
                  width="1536"
                  height="1024"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="stats-photo-copy">
                <p className="heading text-lg text-[var(--ink)]">
                  The people behind every project
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Site teams, engineers and project specialists working as one.
                </p>
              </div>
            </Reveal>
            <div className="stats-grid grid gap-4 sm:grid-cols-2">
              {companyStats.map(
                (
                  {
                    number,
                    label,
                    suffix,
                    unit,
                    useGrouping,
                    Icon,
                    tone,
                    featured,
                  },
                  index,
                ) => (
                  <Reveal
                    key={label}
                    index={index}
                    className={`stat-card ${tone}${featured ? " stat-card-featured" : ""}`}
                    hover
                  >
                    <span className="stat-icon">
                      <Icon size={23} weight="regular" />
                    </span>
                    <div>
                      <Statistic
                        to={number}
                        suffix={suffix}
                        unit={unit}
                        useGrouping={useGrouping}
                      />
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        {label}
                      </p>
                    </div>
                  </Reveal>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="section clients-section">
          <img className="section-photo" src="/site-photos/clients-background.webp?v=20261005" alt="" aria-hidden="true" width="1920" height="1080" loading="lazy" decoding="async" />
          <div className="shell">
            <Reveal kind="copy">
              <ScrollHeading className="max-w-3xl text-4xl tracking-[-.045em] md:text-5xl">
                Built around the businesses Sri Lanka knows.
              </ScrollHeading>
              <p className="mt-5 max-w-xl text-slate-600">
                Established companies, one shared expectation: dependable space
                delivered as promised.
              </p>
            </Reveal>
            <div className="client-logo-wall mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {clients.map((client, index) => (
                <Reveal
                  key={client.name}
                  index={index}
                  className={`client-logo-cell${client.project ? " client-logo-cell-interactive" : ""}`}
                  hover={Boolean(client.project)}
                >
                  {client.project ? (
                    <button
                      type="button"
                      className="client-logo-trigger"
                      onClick={() => setActiveProject(client.project)}
                      aria-haspopup="dialog"
                      aria-label={`View ${client.name} project gallery`}
                    >
                      <img
                        src={client.src}
                        alt={`${client.name} logo`}
                        loading="lazy"
                        decoding="async"
                        className={`client-logo object-contain ${client.className}`}
                      />
                      <span
                        className="client-logo-gallery-badge"
                        aria-hidden="true"
                      >
                        <Images size={15} />
                      </span>
                      <span
                        className="client-logo-gallery-cue"
                        aria-hidden="true"
                      >
                        View project
                      </span>
                    </button>
                  ) : (
                    <img
                      src={client.src}
                      alt={`${client.name} logo`}
                      loading="lazy"
                      decoding="async"
                      className={`client-logo object-contain ${client.className}`}
                    />
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <Suspense
          fallback={
            <div
              className="project-gallery-backdrop project-gallery-loading"
              role="status"
            >
              <span>Opening project gallery…</span>
            </div>
          }
        >
          {activeProject ? (
            <ProjectGallery
              project={activeProject}
              onClose={() => setActiveProject(null)}
            />
          ) : null}
        </Suspense>

        <ProjectLocations onOpenProject={setActiveProject} />

        <section className="section why-section">
          <div className="shell">
            <Reveal kind="copy" className="max-w-3xl">
              <p className="eyebrow">Why CIPL</p>
              <ScrollHeading className="mt-4 text-4xl tracking-[-.045em] md:text-5xl">
                Less friction. More certainty.
              </ScrollHeading>
            </Reveal>
            <div className="why-grid mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-12">
              {advantages.map(
                ([Icon, title, description, className, photo], index) => (
                  <Reveal
                    key={title}
                    index={index}
                    className={`why-card ${className} ${index === 0 || index === 2 ? "lg:col-span-7" : "lg:col-span-5"}`}
                    hover
                    photo={photo}
                  >
                    <span className="why-icon">
                      <Icon size={29} weight="regular" />
                    </span>
                    <div className="why-card-copy relative">
                      <ScrollHeading
                        as="h3"
                        className="heading text-xl text-[var(--ink)]"
                      >
                        {title}
                      </ScrollHeading>
                      <p className="mt-3 max-w-xl text-slate-600">
                        {description}
                      </p>
                    </div>
                  </Reveal>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="section process-section">
          <img className="section-photo" src="/site-photos/process-completed-warehouse.webp?v=20261005" alt="" aria-hidden="true" width="1920" height="1080" loading="lazy" decoding="async" />
          <div className="shell">
            <Reveal kind="copy">
              <p className="eyebrow">From ground to handover</p>
              <ScrollHeading className="mt-4 max-w-3xl text-4xl tracking-[-.045em] md:text-5xl">
                Six visible stages. One clear process.
              </ScrollHeading>
              <Link to="/client" className="btn btn-outline mt-7">
                Open client portal
              </Link>
            </Reveal>
            <div className="process-track mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {processStages.map((stage, index) => (
                <Reveal
                  key={stage}
                  index={index}
                  kind={index === 0 ? "copy" : "photo"}
                  className={`process-step${index === 0 ? " process-step-comparison" : ""}`}
                  hover={index !== 0}
                >
                  {index === 0 ? (
                    <SitePreparationComparison />
                  ) : (
                    <>
                      <img
                        src={stagePhotos[stage]}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        width="900"
                        height="675"
                        className="process-step-image"
                      />
                      <span
                        className="process-step-overlay"
                        aria-hidden="true"
                      />
                      <div className="process-step-copy">
                        <span className="heading text-xs">0{index + 1}</span>
                        <p className="heading mt-3 text-sm">{stage}</p>
                      </div>
                    </>
                  )}
                </Reveal>
              ))}
            </div>
            <Reveal kind="seal" className="process-complete-wrap">
              <div
                className="process-complete-pill"
                role="status"
                aria-label="Construction process completed"
              >
                <CheckCircle size={24} weight="fill" aria-hidden="true" />
                <span>Completed</span>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="contact" className="section contact-section scroll-mt-20">
          <div className="shell grid items-stretch gap-6 lg:grid-cols-12">
            <Reveal kind="photo" className="contact-story lg:col-span-5" hover>
              <img
                src="/site-photos/interior-1.webp?v=20261005"
                alt="Completed CIPL warehouse interior"
                loading="lazy"
                width="1122"
                height="1402"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="contact-story-overlay absolute inset-0" />
              <div className="relative flex h-full min-h-[520px] flex-col justify-end p-7 md:p-10">
                <p className="eyebrow">Contact us</p>
                <ScrollHeading className="mt-4 text-4xl tracking-[-.05em] text-[var(--ink)] md:text-5xl">
                  Let's build the space your next chapter needs.
                </ScrollHeading>
                <p className="mt-5 max-w-md text-slate-700">
                  Tell us what you need. We'll respond with a practical next
                  step.
                </p>
                <div className="mt-8 space-y-2">
                  <a href="tel:+94766378978" className="contact-link">
                    <Phone size={20} />
                    076 637 8978
                  </a>
                  <a href="mailto:info@cipl.lk" className="contact-link">
                    <EnvelopeSimple size={20} />
                    info@cipl.lk
                  </a>
                </div>
              </div>
            </Reveal>
            <Reveal
              kind="form"
              index={1}
              className="glass-panel p-6 md:p-9 lg:col-span-7"
            >
              <InquiryForm />
            </Reveal>
          </div>
        </section>

        <footer className="site-footer py-8 text-slate-600">
          <Reveal
            kind="copy"
            className="shell flex flex-col justify-between gap-3 text-sm sm:flex-row"
          >
            <p>
              © {new Date().getFullYear()} Chanithu International (Pvt) Ltd.
            </p>
            <p>Warehouses, built around your business.</p>
          </Reveal>
        </footer>
      </main>
    </ScrollMotion>
  );
}
