import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarBlank,
  Cube,
  DownloadSimple,
  FilePdf,
  Images,
  SignOut,
  X,
} from "@phosphor-icons/react";
import DeferredWarehouseViewer from "../components/DeferredWarehouseViewer";
import PortalLogin from "../components/PortalLogin";
import { formatFileSize, signModelUpdates } from "../lib/modelUpdates";
import {
  isSupabaseConfigured,
  supabase,
  usernameToEmail,
} from "../lib/supabase";
import usePortalSession from "../hooks/usePortalSession";

function Shell({ children }) {
  return (
    <main
      id="main-content"
      className="portal-page client-progress-page min-h-[100dvh] pt-20"
    >
      <div className="shell py-12 md:py-16">{children}</div>
    </main>
  );
}

function planFileName(path) {
  const storedName = decodeURIComponent(path.split("/").pop() || "")
    .replace(/^\d{10,}-/, "")
    .trim();
  return storedName || "warehouse-plan.pdf";
}

function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    if (!isSupabaseConfigured) {
      setError("Connect Supabase in .env to authenticate.");
      setBusy(false);
      return;
    }
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(user),
      password,
    });
    if (authError) setError(authError.message);
    else if (data.user.app_metadata?.role !== "client") {
      await supabase.auth.signOut();
      setError("Please use a client account.");
    } else onLogin(data.user);
    setBusy(false);
  };

  return (
    <PortalLogin
      variant="client"
      title="Client portal"
      description="Explore the latest 3D construction model, written site updates, plans and progress photography for your warehouse."
      usernameLabel="Username"
      username={user}
      onUsernameChange={(event) => setUser(event.target.value)}
      password={password}
      onPasswordChange={(event) => setPassword(event.target.value)}
      error={error}
      loading={busy}
      submitLabel="Open my project"
      loadingLabel="Signing in..."
      onSubmit={submit}
    />
  );
}

export default function ClientPortal() {
  const { user, setUser, loading: sessionLoading } = usePortalSession("client");
  const [client, setClient] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [modelUpdates, setModelUpdates] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [planDownloading, setPlanDownloading] = useState(false);
  const [planDownloadError, setPlanDownloadError] = useState("");
  const lightboxCloseRef = useRef(null);

  useEffect(() => {
    if (user) return;
    setClient(null);
    setPhotos([]);
    setModelUpdates([]);
  }, [user]);

  const loadProject = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: clientError } = await supabase
        .from("clients")
        .select(
          "id, client_name, company_name, length_ft, width_ft, height_ft, total_sqft, warehouse_type, current_stage, pdf_plan_url",
        )
        .eq("auth_user_id", user.id)
        .single();
      if (clientError) throw clientError;
      setClient(data);

      const photoRequest = supabase
        .from("progress_photos")
        .select("id, photo_url, caption, uploaded_at")
        .eq("client_id", data.id)
        .order("uploaded_at", { ascending: false });
      const modelRequest = supabase
        .from("project_model_updates")
        .select(
          "id, milestone_title, site_update, model_path, original_filename, file_size_bytes, uploaded_at",
        )
        .eq("client_id", data.id)
        .order("uploaded_at", { ascending: false });

      // The 3D preview is the primary content, so do not hold it behind photo
      // query/signing work. Both queries start together; the model finishes first.
      const modelResult = await modelRequest;
      if (modelResult.error) throw modelResult.error;
      const signedModels = await signModelUpdates(modelResult.data || []);
      setModelUpdates(signedModels);
      setSelectedModelId((current) =>
        signedModels.some((model) => model.id === current)
          ? current
          : signedModels[0]?.id || null,
      );
      setLoading(false);

      const photoResult = await photoRequest;
      if (photoResult.error) throw photoResult.error;
      const photoRows = photoResult.data || [];
      const photoPaths = photoRows.map((photo) => photo.photo_url);
      const { data: signedPhotos, error: photoSignError } = photoPaths.length
        ? await supabase.storage
            .from("progress-photos")
            .createSignedUrls(photoPaths, 3600)
        : { data: [], error: null };
      if (photoSignError) throw photoSignError;
      setPhotos(
        photoRows.map((photo, index) => ({
          ...photo,
          url: signedPhotos?.[index]?.signedUrl,
        })),
      );
    } catch (loadError) {
      setError(loadError.message || "Your project could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (!lightbox) return undefined;
    const previousFocus = document.activeElement;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    lightboxCloseRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus?.();
    };
  }, [lightbox]);

  const selectedModel = useMemo(
    () =>
      modelUpdates.find((model) => model.id === selectedModelId) ||
      modelUpdates[0] ||
      null,
    [modelUpdates, selectedModelId],
  );

  if (sessionLoading || (user && loading))
    return (
      <Shell>
        <div
          className="h-[560px] animate-pulse rounded-2xl bg-slate-200"
          role="status"
          aria-label="Loading project"
        />
      </Shell>
    );
  if (!user) return <Login onLogin={setUser} />;
  if (error || !client)
    return (
      <Shell>
        <p className="text-red-700">
          {error || "No project is connected to this account."}
        </p>
      </Shell>
    );

  const downloadPlan = async () => {
    setPlanDownloading(true);
    setPlanDownloadError("");

    try {
      const downloadName = planFileName(client.pdf_plan_url);
      const { data, error: downloadError } = await supabase.storage
        .from("warehouse-plans")
        .createSignedUrl(client.pdf_plan_url, 60, { download: downloadName });
      if (downloadError) throw downloadError;
      if (!data?.signedUrl)
        throw new Error("A secure download link could not be created.");

      // A same-tab attachment request invokes the browser's native download
      // manager without leaving a useless Supabase tab behind.
      window.location.assign(data.signedUrl);
    } catch (downloadError) {
      setPlanDownloadError(
        downloadError.message || "The warehouse plan could not be downloaded.",
      );
    } finally {
      setPlanDownloading(false);
    }
  };

  return (
    <Shell>
      <header className="client-progress-header">
        <div>
          <p className="eyebrow">Live construction record</p>
          <h1>{client.company_name}</h1>
          <p>
            Welcome, {client.client_name}. Explore the model history and the
            latest update from your project team.
          </p>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setUser(null);
            setClient(null);
          }}
          className="btn btn-outline"
        >
          <SignOut /> Sign out
        </button>
      </header>

      <section
        className="client-model-stage"
        aria-labelledby="construction-model-heading"
      >
        <div className="client-model-main">
          <div className="client-model-heading">
            <div>
              <p className="eyebrow">3D progress</p>
              <h2 id="construction-model-heading">See the build take shape</h2>
            </div>
            {selectedModel && (
              <span>
                {modelUpdates.findIndex(
                  (model) => model.id === selectedModel.id,
                ) + 1}{" "}
                of {modelUpdates.length}
              </span>
            )}
          </div>
          <DeferredWarehouseViewer
            modelUrl={selectedModel?.modelUrl}
            title={selectedModel?.milestone_title}
            siteUpdate={selectedModel?.site_update}
            uploadedAt={selectedModel?.uploaded_at}
            emptyMessage="Your CIPL project team will publish the first construction model here."
          />
        </div>

        <aside className="client-model-timeline" aria-label="3D model history">
          <div className="client-timeline-heading">
            <Cube size={24} />
            <div>
              <h2>Model history</h2>
              <p>Select an update to explore it.</p>
            </div>
          </div>
          {modelUpdates.length ? (
            <div className="client-timeline-list">
              {modelUpdates.map((model, index) => (
                <button
                  key={model.id}
                  className={selectedModel?.id === model.id ? "is-active" : ""}
                  onClick={() => setSelectedModelId(model.id)}
                >
                  <span>{modelUpdates.length - index}</span>
                  <div>
                    <strong>{model.milestone_title}</strong>
                    <time>
                      <CalendarBlank size={14} />{" "}
                      {new Date(model.uploaded_at).toLocaleDateString()}
                    </time>
                    <small>{formatFileSize(model.file_size_bytes)}</small>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="client-timeline-empty">
              <Cube size={34} weight="thin" />
              <p>
                The model history will begin with the first published GLB
                update.
              </p>
            </div>
          )}
        </aside>
      </section>

      <section
        className="client-current-update"
        aria-labelledby="current-site-update-heading"
      >
        <div>
          <p className="eyebrow">Current site update</p>
          <h2 id="current-site-update-heading">What is happening now</h2>
        </div>
        <p>{client.current_stage}</p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="glass-panel p-6 md:p-8 lg:col-span-8">
          <p className="eyebrow">Project details</p>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {[
              [
                `${client.length_ft} × ${client.width_ft} × ${client.height_ft} ft`,
                "Dimensions",
              ],
              [
                `${Number(client.total_sqft).toLocaleString()} sq.ft.`,
                "Floor area",
              ],
              [client.warehouse_type, "Warehouse type"],
              [`${modelUpdates.length} published`, "3D updates"],
            ].map(([value, label]) => (
              <div key={label} className="border-t border-slate-300 pt-4">
                <strong className="heading text-lg">{value}</strong>
                <span className="mt-2 block text-xs uppercase tracking-wider text-slate-500">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel flex min-h-64 flex-col justify-between p-6 md:p-8 lg:col-span-4">
          <FilePdf
            size={36}
            weight="thin"
            className="text-[var(--gold-dark)]"
          />
          <div>
            <p className="eyebrow">Warehouse plan</p>
            <h2 className="heading mt-2 text-xl">Your approved 2D reference</h2>
            {client.pdf_plan_url ? (
              <>
                <button
                  type="button"
                  onClick={downloadPlan}
                  disabled={planDownloading}
                  className="btn btn-primary mt-5"
                >
                  <DownloadSimple />{" "}
                  {planDownloading ? "Downloading PDF..." : "Download 2D plan"}
                </button>
                {planDownloadError && (
                  <p className="mt-3 text-sm text-red-700" role="alert">
                    {planDownloadError}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-4 text-slate-600">
                The plan has not been uploaded yet.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section pb-4">
        <p className="eyebrow">Construction photography</p>
        <h2 className="mt-3 text-4xl tracking-[-.045em] md:text-5xl">
          Progress from the site
        </h2>
        {photos.length ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setLightbox(photo)}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_12px_28px_rgba(36,74,112,.08)]"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || "Warehouse construction progress"}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-4">
                  <p className="heading text-sm">
                    {photo.caption || "Site progress"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(photo.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="glass-panel mt-10 grid min-h-56 place-items-center text-center text-slate-500">
            <div>
              <Images size={38} weight="thin" className="mx-auto mb-3" />
              <p className="heading">Site photographs will appear here.</p>
              <p className="mt-1 text-sm">
                The CIPL team will add updates as construction progresses.
              </p>
            </div>
          </div>
        )}
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/90 p-4 md:p-10"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Construction progress image"
        >
          <button
            ref={lightboxCloseRef}
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-5 top-5 grid min-h-11 min-w-11 place-items-center text-white"
            aria-label="Close image"
          >
            <X size={28} />
          </button>
          <figure
            className="max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={lightbox.url}
              alt={lightbox.caption || "Construction progress"}
              className="mx-auto max-h-[80vh] w-auto"
            />
            <figcaption className="mt-4 text-center text-white">
              {lightbox.caption || "Site progress"} -{" "}
              {new Date(lightbox.uploaded_at).toLocaleDateString()}
            </figcaption>
          </figure>
        </div>
      )}
    </Shell>
  );
}
