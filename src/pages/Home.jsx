import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Blueprint,
  Buildings,
  CalendarBlank,
  Camera,
  CheckCircle,
  EnvelopeSimple,
  Handshake,
  Phone,
  ShieldCheck,
  UsersThree,
} from "@phosphor-icons/react";
import Reveal from "../components/Reveal";
import SitePreparationComparison from "../components/SitePreparationComparison";
import { STAGES } from "../lib/constants";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const EMPTY_INQUIRY = {
  name: "",
  company: "",
  email: "",
  phone: "",
  message: "",
  website: "",
};

const clients = [
  {
    name: "TVS Lanka",
    src: "/clients/tvs-lanka.jpg",
    className: "h-16 w-16 rounded-full",
  },
  { name: "Rocell", src: "/clients/rocell.jpg", className: "h-16 w-16" },
  {
    name: "Spa Ceylon",
    src: "/clients/spa-ceylon-optimized.webp",
    className: "h-16 w-full max-w-[180px]",
  },
  {
    name: "Maliban",
    src: "/clients/maliban-optimized.webp",
    className: "h-12 w-full max-w-[160px]",
  },
  {
    name: "Space Logistics",
    src: "/clients/space-logistics-navy.webp",
    className: "h-12 w-full max-w-[180px]",
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
  ],
  [
    Buildings,
    "One accountable partner",
    "We build and rent the facility, removing the disconnect between contractor and landlord.",
    "why-card-partner",
  ],
  [
    Camera,
    "Progress you can see",
    "Follow every construction stage, view site photography and explore your warehouse in 3D.",
    "why-card-progress",
  ],
  [
    ShieldCheck,
    "Experience that compounds",
    "Since 2013, our field knowledge has translated into clearer decisions and dependable handovers.",
    "why-card-experience",
  ],
];

const stagePhotos = [
  "/site-photos/process/site-preparation.webp",
  "/site-photos/process/foundation.webp",
  "/site-photos/process/structural-framework.webp",
  "/site-photos/process/wall-construction.webp",
  "/site-photos/process/roofing.webp",
  "/site-photos/process/interior-completion.webp",
];

const processStages = STAGES.filter((stage) => stage !== "Completed");

function Counter({ to, suffix = "", unit = "", useGrouping = true }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? to : 0);

  useEffect(() => {
    if (reduceMotion) return;
    let start;
    let frame;

    if (!seen) return undefined;

    const tick = (time) => {
      start ??= time;
      const progress = Math.min((time - start) / 1200, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, to, reduceMotion]);

  return (
    <strong
      ref={ref}
      className="stat-value heading tracking-[-.05em] text-[var(--ink)]"
    >
      {value.toLocaleString(undefined, { useGrouping })}
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
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const [form, setForm] = useState(EMPTY_INQUIRY);
  const [state, setState] = useState("idle");

  const submit = async (event) => {
    event.preventDefault();
    setState("loading");
    if (!isSupabaseConfigured) {
      setState("error");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke(
        "submit-inquiry",
        { body: form },
      );
      setState(error || !data?.success ? "error" : "success");
    } catch {
      setState("error");
    }
  };

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
    <main id="main-content" className="overflow-hidden">
      <section className="hero-section relative flex min-h-[100dvh] items-center overflow-hidden pt-24">
        <img
          src="/site-photos/hero-section.webp"
          alt="Warehouse structure under construction at sunset"
          width="2048"
          height="1152"
          fetchPriority="high"
          decoding="async"
          className="hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
        <motion.div
          className="shell relative grid items-center gap-8 py-14 lg:grid-cols-12 lg:gap-10"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="lg:col-span-8">
            <p className="eyebrow mb-5">
              Warehouse construction & rental / Sri Lanka
            </p>
            <h1 className="hero-title max-w-[900px] text-[clamp(2.75rem,5.5vw,5.4rem)] font-semibold leading-[.97] tracking-[-.058em] text-[var(--ink)]">
              Built to your spec.
              <br />
              <span className="text-[#33506f]">Ready for your ambition.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-700 md:text-lg">
              CIPL designs, builds and rents industrial warehouses around your
              operation. One accountable partner from first drawing to handover.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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
              <Link to="/client" className="btn btn-hero-secondary hero-action">
                Track your build
              </Link>
            </div>
          </div>
          <div className="hero-stat lg:col-span-3 lg:col-start-10 lg:ml-auto lg:max-w-[280px]">
            <p className="text-sm text-slate-600">
              A decade of accountable delivery
            </p>
            <p className="heading mt-3 text-lg leading-snug text-[var(--ink)] xl:text-xl">
              Building long-term capacity for Sri Lankan industry since 2013.
            </p>
          </div>
        </motion.div>
      </section>

      <section className="stats-section py-12 md:py-16">
        <div className="stats-showcase shell grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)]">
          <Reveal className="stats-photo-card" hover>
            <div className="stats-photo-frame">
              <img
                src="/site-photos/cipl-workforce-generated.webp"
                alt="Sri Lankan warehouse construction workforce during a site briefing"
                width="1536"
                height="1024"
                loading="lazy"
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
                  delay={index * 0.05}
                  className={`stat-card ${tone}${featured ? " stat-card-featured" : ""}`}
                  hover
                >
                  <span className="stat-icon">
                    <Icon size={23} weight="regular" />
                  </span>
                  <div>
                    <Counter
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
        <div className="shell">
          <Reveal>
            <h2 className="max-w-3xl text-4xl tracking-[-.045em] md:text-5xl">
              Built around the businesses Sri Lanka knows.
            </h2>
            <p className="mt-5 max-w-xl text-slate-600">
              Five established companies, one shared expectation: dependable
              space delivered as promised.
            </p>
          </Reveal>
          <div className="client-logo-wall mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {clients.map((client, index) => (
              <Reveal
                key={client.name}
                delay={index * 0.05}
                className="client-logo-cell"
                hover
              >
                <motion.img
                  src={client.src}
                  alt={`${client.name} logo`}
                  loading="lazy"
                  className={`client-logo object-contain ${client.className}`}
                  whileHover={
                    reduceMotion ? undefined : { y: -4, scale: 1.025 }
                  }
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section why-section">
        <div className="shell">
          <Reveal className="max-w-3xl">
            <p className="eyebrow">Why CIPL</p>
            <h2 className="mt-4 text-4xl tracking-[-.045em] md:text-5xl">
              Less friction. More certainty.
            </h2>
          </Reveal>
          <div className="why-grid mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-12">
            {advantages.map(([Icon, title, description, className], index) => (
              <Reveal
                key={title}
                delay={index * 0.06}
                className={`why-card ${className} ${index === 0 || index === 2 ? "lg:col-span-7" : "lg:col-span-5"}`}
                hover
              >
                <span className="why-icon">
                  <Icon size={29} weight="regular" />
                </span>
                <div className="relative">
                  <h3 className="heading text-xl text-[var(--ink)]">{title}</h3>
                  <p className="mt-3 max-w-xl text-slate-600">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="shell">
          <Reveal>
            <p className="eyebrow">From ground to handover</p>
            <h2 className="mt-4 max-w-3xl text-4xl tracking-[-.045em] md:text-5xl">
              Six visible stages. One clear process.
            </h2>
            <Link to="/client" className="btn btn-outline mt-7">
              Open client portal
            </Link>
          </Reveal>
          <div className="process-track mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {processStages.map((stage, index) => (
              <Reveal
                key={stage}
                delay={index * 0.04}
                className={`process-step${index === 0 ? " process-step-comparison" : ""}`}
                hover={index !== 0}
              >
                {index === 0 ? (
                  <SitePreparationComparison />
                ) : (
                  <>
                    <img
                      src={stagePhotos[index]}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      width="900"
                      height="675"
                      className="process-step-image"
                    />
                    <span className="process-step-overlay" aria-hidden="true" />
                    <div className="process-step-copy">
                      <span className="heading text-xs">0{index + 1}</span>
                      <p className="heading mt-3 text-sm">{stage}</p>
                    </div>
                  </>
                )}
              </Reveal>
            ))}
          </div>
          <motion.div
            className="process-complete-wrap"
            initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 190, damping: 20 }
            }
          >
            <div
              className="process-complete-pill"
              role="status"
              aria-label="Construction process completed"
            >
              <CheckCircle size={24} weight="fill" aria-hidden="true" />
              <span>Completed</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="contact" className="section contact-section scroll-mt-20">
        <div className="shell grid items-stretch gap-6 lg:grid-cols-12">
          <Reveal className="contact-story lg:col-span-5" hover>
            <img
              src="/site-photos/interior-1.webp"
              alt="Completed CIPL warehouse interior"
              loading="lazy"
              width="1122"
              height="1402"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="contact-story-overlay absolute inset-0" />
            <div className="relative flex h-full min-h-[520px] flex-col justify-end p-7 md:p-10">
              <p className="eyebrow">Contact us</p>
              <h2 className="mt-4 text-4xl tracking-[-.05em] text-[var(--ink)] md:text-5xl">
                Let's build the space your next chapter needs.
              </h2>
              <p className="mt-5 max-w-md text-slate-700">
                Tell us what you need. We'll respond with a practical next step.
              </p>
              <div className="mt-8 space-y-2">
                <a href="tel:+94766378978" className="contact-link">
                  <Phone size={20} />
                  076 637 8978
                </a>
                <a
                  href="mailto:Chanithu1970@gmail.com"
                  className="contact-link"
                >
                  <EnvelopeSimple size={20} />
                  Chanithu1970@gmail.com
                </a>
              </div>
            </div>
          </Reveal>
          <Reveal className="glass-panel p-6 md:p-9 lg:col-span-7">
            <form onSubmit={submit} aria-live="polite">
              {state === "success" ? (
                <div className="grid min-h-[500px] place-items-center text-center">
                  <div>
                    <CheckCircle
                      size={48}
                      weight="thin"
                      className="mx-auto text-[var(--gold-dark)]"
                    />
                    <h3 className="heading mt-5 text-2xl">Inquiry received.</h3>
                    <p className="mt-2 text-slate-600">
                      Thank you. The CIPL team will be in touch shortly.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline mt-6"
                      onClick={() => {
                        setState("idle");
                        setForm(EMPTY_INQUIRY);
                      }}
                    >
                      Send another
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="absolute -left-[10000px] h-px w-px overflow-hidden"
                    aria-hidden="true"
                  >
                    <label htmlFor="contact-website">Website</label>
                    <input
                      id="contact-website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(event) =>
                        setForm({ ...form, website: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {[
                      ["Name", "name", "text"],
                      ["Company", "company", "text"],
                      ["Email", "email", "email"],
                      ["Phone", "phone", "tel"],
                    ].map(([label, name, type]) => (
                      <label key={name}>
                        <span className="label">{label}</span>
                        <input
                          className="field"
                          name={name}
                          required={name !== "company"}
                          type={type}
                          maxLength={
                            name === "email" ? 254 : name === "phone" ? 40 : 120
                          }
                          autoComplete={
                            name === "name"
                              ? "name"
                              : name === "company"
                                ? "organization"
                                : name === "phone"
                                  ? "tel"
                                  : name
                          }
                          value={form[name]}
                          onChange={(event) =>
                            setForm({ ...form, [name]: event.target.value })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <label className="mt-5 block">
                    <span className="label">Message</span>
                    <textarea
                      className="field min-h-32 resize-y"
                      name="message"
                      autoComplete="off"
                      required
                      maxLength="5000"
                      value={form.message}
                      onChange={(event) =>
                        setForm({ ...form, message: event.target.value })
                      }
                    />
                  </label>
                  {state === "error" && (
                    <p className="mt-3 text-red-700" role="alert">
                      We couldn't send this inquiry. Please call or email us
                      directly.
                    </p>
                  )}
                  <button
                    disabled={state === "loading"}
                    className="btn btn-primary mt-6 w-full sm:w-auto"
                  >
                    {state === "loading" ? "Sending..." : "Send inquiry"}{" "}
                    <ArrowRight size={18} />
                  </button>
                </>
              )}
            </form>
          </Reveal>
        </div>
      </section>

      <footer className="site-footer py-8 text-slate-600">
        <div className="shell flex flex-col justify-between gap-3 text-sm sm:flex-row">
          <p>© {new Date().getFullYear()} Chanithu International (Pvt) Ltd.</p>
          <p>Warehouses, built around your business.</p>
        </div>
      </footer>
    </main>
  );
}
