import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Buildings,
  CheckCircle,
  ClockCounterClockwise,
  Cube,
  Eye,
  FileArrowUp,
  FloppyDisk,
  Plus,
  SignOut,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import {
  isSupabaseConfigured,
  supabase,
  usernameToEmail,
} from "../lib/supabase";
import {
  formatFileSize,
  isGlbFile,
  MODEL_BUCKET,
  safeStorageFileName,
  signModelUpdates,
  uploadGlbResumable,
  validatePdfFile,
  validatePhotoFile,
} from "../lib/modelUpdates";
import DeferredWarehouseViewer from "../components/DeferredWarehouseViewer";
import PortalLogin from "../components/PortalLogin";
import usePortalSession from "../hooks/usePortalSession";

const empty = {
  client_name: "",
  company_name: "",
  username: "",
  password: "",
  length_ft: "",
  width_ft: "",
  height_ft: "",
  total_sqft: "",
  warehouse_type: "Standard Dry Storage",
  current_stage: "Awaiting the first site update",
  pdf_plan_url: "",
};

function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError("Connect Supabase in .env to authenticate.");
      return;
    }
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(user),
      password,
    });
    if (authError) setError(authError.message);
    else if (data.user.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setError("This account does not have administrator access.");
    } else onLogin(data.user);
    setLoading(false);
  };

  return (
    <PortalLogin
      variant="admin"
      title="Admin portal"
      description="Manage client projects, written site updates, 3D construction models and project documents from one secure workspace."
      usernameLabel="Admin username or email"
      username={user}
      onUsernameChange={(event) => setUser(event.target.value)}
      password={password}
      onPasswordChange={(event) => setPassword(event.target.value)}
      error={error}
      loading={loading}
      submitLabel="Sign in to admin"
      loadingLabel="Signing in..."
      onSubmit={submit}
    />
  );
}

function PortalShell({ title, kicker, children }) {
  return (
    <main id="main-content" className="portal-page min-h-[100dvh] pt-20">
      <div className="shell py-12 md:py-16">
        <p className="eyebrow">{kicker}</p>
        <h1 className="mt-3 text-4xl tracking-[-.045em] md:text-5xl">
          {title}
        </h1>
        {children}
      </div>
    </main>
  );
}

export default function AdminPortal() {
  const { user, setUser, loading } = usePortalSession("admin");
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    const { data, error: loadError } = await supabase
      .from("clients")
      .select(
        "id, client_name, company_name, username, auth_user_id, length_ft, width_ft, height_ft, total_sqft, warehouse_type, current_stage, pdf_plan_url, created_at",
      )
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setClients(data || []);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (loading) {
    return (
      <PortalShell title="Admin portal" kicker="Loading">
        <div className="mt-10 h-40 animate-pulse bg-slate-200" />
      </PortalShell>
    );
  }
  if (!user) return <Login onLogin={setUser} />;
  if (selected) {
    return (
      <ClientEditor
        client={selected}
        close={() => setSelected(null)}
        saved={() => {
          setSelected(null);
          load();
        }}
      />
    );
  }

  return (
    <PortalShell title="Client projects" kicker="Admin workspace">
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          className="btn btn-primary"
          onClick={() => setSelected({ ...empty })}
        >
          <Plus size={18} /> Add client
        </button>
        <button
          className="btn btn-outline"
          onClick={async () => {
            await supabase.auth.signOut();
            setUser(null);
          }}
        >
          <SignOut size={18} /> Sign out
        </button>
      </div>
      {error && <p className="mt-5 text-red-700">{error}</p>}
      <div className="mt-10 overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              {[
                "Client",
                "Warehouse type",
                "Current site update",
                "Area",
                "Date added",
              ].map((heading) => (
                <th key={heading} className="p-4 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                onClick={() => setSelected(client)}
                className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="p-4">
                  <strong className="heading text-sm">
                    {client.client_name}
                  </strong>
                  <span className="block text-sm text-slate-500">
                    {client.company_name}
                  </span>
                </td>
                <td className="p-4">{client.warehouse_type}</td>
                <td className="max-w-[300px] p-4">
                  <span className="line-clamp-2 text-sm text-slate-700">
                    {client.current_stage}
                  </span>
                </td>
                <td className="p-4">
                  {Number(client.total_sqft).toLocaleString()} sq.ft.
                </td>
                <td className="p-4">
                  {new Date(client.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!clients.length && (
          <div className="py-16 text-center text-slate-500">
            <Buildings size={40} weight="thin" className="mx-auto mb-3" />
            No clients yet. Add the first project to begin.
          </div>
        )}
      </div>
    </PortalShell>
  );
}

function ClientEditor({ client, close, saved }) {
  const [form, setForm] = useState(client);
  const [pdf, setPdf] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [caption, setCaption] = useState("");
  const [modelUpdates, setModelUpdates] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [modelTitle, setModelTitle] = useState("");
  const [modelNote, setModelNote] = useState("");
  const [modelStatus, setModelStatus] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const photoInput = useRef(null);
  const modelInput = useRef(null);
  const modelStatusTimer = useRef(null);
  const isNew = !client.id;

  const selectedModel = useMemo(
    () =>
      modelUpdates.find((update) => update.id === selectedModelId) ||
      modelUpdates[0] ||
      null,
    [modelUpdates, selectedModelId],
  );
  const queuedPhotos = photos.filter((photo) => photo.file);
  const publishedPhotos = photos.filter((photo) => !photo.file);

  const set = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if ((key === "length_ft" || key === "width_ft") && !current.manualTotal) {
        next.total_sqft =
          Number(key === "length_ft" ? value : current.length_ft) *
            Number(key === "width_ft" ? value : current.width_ft) || "";
      }
      return next;
    });
  };

  const loadModels = useCallback(async () => {
    const { data, error: modelError } = await supabase
      .from("project_model_updates")
      .select(
        "id, client_id, milestone_title, site_update, model_path, original_filename, file_size_bytes, uploaded_at",
      )
      .eq("client_id", client.id)
      .order("uploaded_at", { ascending: false });
    if (modelError) throw modelError;
    const signed = await signModelUpdates(data || []);
    setModelUpdates(signed);
    setSelectedModelId((current) => current || signed[0]?.id || null);
  }, [client.id]);

  const loadPhotos = useCallback(async () => {
    const { data, error: photoError } = await supabase
      .from("progress_photos")
      .select("id, client_id, photo_url, caption, uploaded_at")
      .eq("client_id", client.id)
      .order("uploaded_at", { ascending: false });
    if (photoError) throw photoError;

    const rows = data || [];
    const paths = rows.map((photo) => photo.photo_url);
    const { data: signedPhotos, error: signError } = paths.length
      ? await supabase.storage
          .from("progress-photos")
          .createSignedUrls(paths, 3600)
      : { data: [], error: null };
    if (signError) throw signError;

    const published = rows.map((photo, index) => ({
      ...photo,
      url: signedPhotos?.[index]?.signedUrl || null,
    }));
    setPhotos((current) => [
      ...current.filter((photo) => photo.file),
      ...published,
    ]);
  }, [client.id]);

  useEffect(() => {
    if (!client.id) return;
    Promise.all([loadPhotos(), loadModels()]).catch((loadError) =>
      setError(loadError.message),
    );
  }, [client.id, loadModels, loadPhotos]);

  useEffect(
    () => () => {
      if (modelStatusTimer.current)
        window.clearTimeout(modelStatusTimer.current);
    },
    [],
  );

  const save = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setError("");
    let createdClientId = null;
    try {
      validatePdfFile(pdf);

      const project = {
        client_name: form.client_name.trim(),
        company_name: form.company_name.trim(),
        username: form.username.trim().toLowerCase(),
        length_ft: Number(form.length_ft),
        width_ft: Number(form.width_ft),
        height_ft: Number(form.height_ft),
        total_sqft: Number(form.total_sqft),
        warehouse_type: form.warehouse_type,
        current_stage: form.current_stage.trim(),
      };

      let authId = form.auth_user_id;
      if (isNew) {
        const { data, error: createError } = await supabase.functions.invoke(
          "admin-create-client",
          {
            body: {
              username: project.username,
              password: form.password,
              client: project,
            },
          },
        );
        if (createError) throw createError;
        if (!data?.client?.id || !data.client.auth_user_id)
          throw new Error("The client project could not be created.");
        createdClientId = data.client.id;
        authId = data.client.auth_user_id;
      }

      let pdfPath = form.pdf_plan_url || null;
      let uploadedPdfPath = null;
      if (pdf) {
        pdfPath = `${authId}/${Date.now()}-${safeStorageFileName(pdf.name)}`;
        const { error: pdfError } = await supabase.storage
          .from("warehouse-plans")
          .upload(pdfPath, pdf);
        if (pdfError) throw pdfError;
        uploadedPdfPath = pdfPath;
      }

      const payload = {
        ...project,
        auth_user_id: authId,
        pdf_plan_url: pdfPath,
      };

      const projectId = createdClientId || form.id;
      const { error: saveError } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", projectId);
      if (saveError) {
        if (uploadedPdfPath)
          await supabase.storage
            .from("warehouse-plans")
            .remove([uploadedPdfPath]);
        throw saveError;
      }

      if (
        !isNew &&
        uploadedPdfPath &&
        form.pdf_plan_url &&
        form.pdf_plan_url !== uploadedPdfPath
      ) {
        await supabase.storage
          .from("warehouse-plans")
          .remove([form.pdf_plan_url]);
      }

      if (!isNew) {
        for (const item of photos.filter((photo) => photo.file)) {
          validatePhotoFile(item.file);
          const path = `${authId}/${Date.now()}-${crypto.randomUUID()}-${safeStorageFileName(item.file.name)}`;
          const { error: uploadError } = await supabase.storage
            .from("progress-photos")
            .upload(path, item.file);
          if (uploadError) throw uploadError;
          const { error: photoError } = await supabase
            .from("progress_photos")
            .insert({
              client_id: form.id,
              photo_url: path,
              caption: item.caption,
            });
          if (photoError) {
            await supabase.storage.from("progress-photos").remove([path]);
            throw photoError;
          }
        }
      }
      saved();
    } catch (saveError) {
      if (createdClientId) {
        await supabase.functions.invoke("admin-delete-client", {
          body: { client_id: createdClientId },
        });
      }
      setError(saveError.message || "Unable to save client.");
    } finally {
      setStatus("idle");
    }
  };

  const publishModel = async () => {
    setError("");
    if (!isGlbFile(modelFile)) {
      setError("Choose a .glb model before publishing this update.");
      return;
    }
    if (!modelTitle.trim() || !modelNote.trim()) {
      setError("Add a milestone name and a written site update.");
      return;
    }
    setModelStatus("uploading");
    setUploadProgress(0);
    try {
      const modelPath = await uploadGlbResumable({
        file: modelFile,
        authUserId: form.auth_user_id,
        clientId: form.id,
        onProgress: setUploadProgress,
      });
      const { error: insertError } = await supabase
        .from("project_model_updates")
        .insert({
          client_id: form.id,
          milestone_title: modelTitle.trim(),
          site_update: modelNote.trim(),
          model_path: modelPath,
          original_filename: modelFile.name,
          file_size_bytes: modelFile.size,
        });
      if (insertError) {
        await supabase.storage.from(MODEL_BUCKET).remove([modelPath]);
        throw insertError;
      }
      const { error: clientError } = await supabase
        .from("clients")
        .update({ current_stage: modelNote.trim() })
        .eq("id", form.id);
      if (clientError) throw clientError;
      setForm((current) => ({ ...current, current_stage: modelNote.trim() }));
      setModelFile(null);
      setModelTitle("");
      setModelNote("");
      if (modelInput.current) modelInput.current.value = "";
      await loadModels();
      setModelStatus("complete");
      modelStatusTimer.current = window.setTimeout(
        () => setModelStatus("idle"),
        2500,
      );
    } catch (uploadError) {
      setError(uploadError.message || "The 3D model could not be published.");
      setModelStatus("idle");
    }
  };

  const removeModel = async (update) => {
    if (
      !window.confirm(
        `Remove ${update.milestone_title} from the client portal?`,
      )
    )
      return;
    setError("");
    try {
      const { error: storageError } = await supabase.storage
        .from(MODEL_BUCKET)
        .remove([update.model_path]);
      if (storageError) throw storageError;
      const { error: deleteError } = await supabase
        .from("project_model_updates")
        .delete()
        .eq("id", update.id);
      if (deleteError) throw deleteError;
      const remaining = modelUpdates.filter((item) => item.id !== update.id);
      let stageError = null;
      if (modelUpdates[0]?.id === update.id) {
        const nextStage =
          remaining[0]?.site_update || "Awaiting the first site update";
        const { error: updateStageError } = await supabase
          .from("clients")
          .update({ current_stage: nextStage })
          .eq("id", form.id);
        stageError = updateStageError;
        if (!stageError) {
          setForm((current) => ({ ...current, current_stage: nextStage }));
        }
      }
      setSelectedModelId(remaining[0]?.id || null);
      setModelUpdates(remaining);
      if (stageError) {
        setError(
          "The model was removed, but the current site update could not be refreshed.",
        );
      }
    } catch (deleteError) {
      setError(deleteError.message || "The model update could not be removed.");
    }
  };

  const removePhoto = async (photo) => {
    const photoName = photo.caption?.trim() || "this progress photo";
    if (
      !window.confirm(
        `Delete ${photoName}? This also removes it from the client portal.`,
      )
    )
      return;

    setError("");
    setDeletingPhotoId(photo.id);
    try {
      const { error: storageError } = await supabase.storage
        .from("progress-photos")
        .remove([photo.photo_url]);
      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from("progress_photos")
        .delete()
        .eq("id", photo.id)
        .eq("client_id", form.id);
      if (deleteError) throw deleteError;

      setPhotos((current) => current.filter((item) => item.id !== photo.id));
    } catch (deleteError) {
      setError(
        deleteError.message || "The progress photo could not be deleted.",
      );
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const deleteClient = async () => {
    if (deleteConfirmation.trim() !== form.company_name.trim()) {
      setError(`Type ${form.company_name} exactly to confirm deletion.`);
      return;
    }
    setStatus("deleting");
    setError("");
    try {
      const { data, error: deleteError } = await supabase.functions.invoke(
        "admin-delete-client",
        { body: { client_id: form.id } },
      );
      if (deleteError) throw deleteError;
      if (!data?.deleted) throw new Error("The client could not be deleted.");
      saved();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete this client.");
      setStatus("idle");
    }
  };

  const identityFields = [
    ["Client name", "client_name", 120],
    ["Company name", "company_name", 160],
    ["Login username", "username", 40],
  ];
  const dimensionFields = [
    ["Length (ft)", "length_ft"],
    ["Width (ft)", "width_ft"],
    ["Height (ft)", "height_ft"],
  ];

  return (
    <main id="main-content" className="admin-workspace min-h-[100dvh] pt-24">
      <form onSubmit={save} className="shell admin-workspace-form">
        <header className="admin-workspace-header">
          <div className="admin-workspace-heading">
            <button type="button" className="admin-back-link" onClick={close}>
              <ArrowLeft size={18} weight="bold" /> Back to projects
            </button>
            <p className="eyebrow">
              {isNew ? "New project" : "Project workspace"}
            </p>
            <h1>{isNew ? "Add a client" : form.company_name}</h1>
            <p>
              {isNew
                ? "Create client access and define the warehouse specification."
                : `Manage ${form.client_name}'s access, live construction models and project records.`}
            </p>
          </div>
          <div className="admin-workspace-actions">
            {!isNew && (
              <span className="admin-stage-pill">
                {modelUpdates.length} model{" "}
                {modelUpdates.length === 1 ? "update" : "updates"}
              </span>
            )}
            <button
              disabled={status !== "idle"}
              className="btn btn-dark admin-save-button"
            >
              <FloppyDisk size={18} />
              {status === "loading"
                ? "Saving..."
                : isNew
                  ? "Create project"
                  : "Save changes"}
            </button>
          </div>
        </header>

        {error && (
          <p className="admin-workspace-error" role="alert">
            {error}
          </p>
        )}

        <div className="admin-workspace-grid">
          <section
            className="admin-workspace-card"
            aria-labelledby="client-access-heading"
          >
            <div className="admin-card-heading">
              <span>01</span>
              <div>
                <h2 id="client-access-heading">Client access</h2>
                <p>Identity and secure portal credentials.</p>
              </div>
            </div>
            <div className="admin-field-grid">
              {identityFields.map(([label, key, maxLength]) => (
                <label key={key}>
                  <span className="label">{label}</span>
                  <input
                    className="field"
                    required
                    maxLength={maxLength}
                    disabled={!isNew && key === "username"}
                    value={form[key]}
                    onChange={(event) => set(key, event.target.value)}
                  />
                </label>
              ))}
              {isNew && (
                <label>
                  <span className="label">Initial password</span>
                  <input
                    className="field"
                    required
                    minLength="12"
                    maxLength="128"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => set("password", event.target.value)}
                  />
                  <small>Use at least 12 characters.</small>
                </label>
              )}
            </div>
          </section>

          <section
            className="admin-workspace-card"
            aria-labelledby="warehouse-spec-heading"
          >
            <div className="admin-card-heading">
              <span>02</span>
              <div>
                <h2 id="warehouse-spec-heading">Warehouse specification</h2>
                <p>Dimensions, use type and the latest written site update.</p>
              </div>
            </div>
            <div className="admin-field-grid admin-dimension-grid">
              {dimensionFields.map(([label, key]) => (
                <label key={key}>
                  <span className="label">{label}</span>
                  <input
                    className="field"
                    required
                    type="number"
                    min="1"
                    value={form[key]}
                    onChange={(event) => set(key, event.target.value)}
                  />
                </label>
              ))}
              <label>
                <span className="label">Total sq.ft. (editable)</span>
                <input
                  className="field"
                  required
                  type="number"
                  min="1"
                  value={form.total_sqft}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      total_sqft: event.target.value,
                      manualTotal: true,
                    })
                  }
                />
              </label>
              <label>
                <span className="label">Warehouse type</span>
                <select
                  className="field"
                  value={form.warehouse_type}
                  onChange={(event) =>
                    set("warehouse_type", event.target.value)
                  }
                >
                  <option>Standard Dry Storage</option>
                  <option>Cold Storage</option>
                  <option>Heavy Racking</option>
                  <option>Custom Industrial</option>
                </select>
              </label>
              <label className="admin-site-update-field">
                <span className="label">What is happening on site now?</span>
                <textarea
                  className="field"
                  required
                  rows="4"
                  maxLength="2000"
                  value={form.current_stage}
                  onChange={(event) => set("current_stage", event.target.value)}
                  placeholder="Describe the latest work completed or currently in progress."
                />
                <small>
                  This replaces the fixed construction-stage dropdown and
                  appears in the client portal.
                </small>
              </label>
            </div>
          </section>

          <section
            className="admin-workspace-card admin-model-card"
            aria-labelledby="model-progress-heading"
          >
            <div className="admin-card-heading admin-card-heading-split">
              <span>03</span>
              <div>
                <h2 id="model-progress-heading">3D construction progress</h2>
                <p>
                  Publish a new GLB whenever the build reaches a meaningful
                  visual milestone.
                </p>
              </div>
              <span className="admin-live-indicator">
                <Cube size={15} /> Client visible
              </span>
            </div>
            {isNew ? (
              <div className="admin-model-locked">
                <Cube size={38} weight="thin" />
                <h3>Create this project first</h3>
                <p>
                  After the client account is created, reopen it to publish the
                  first GLB model.
                </p>
              </div>
            ) : (
              <>
                <div className="admin-model-layout">
                  <div className="admin-model-frame">
                    <DeferredWarehouseViewer
                      modelUrl={selectedModel?.modelUrl}
                      title={selectedModel?.milestone_title}
                      siteUpdate={selectedModel?.site_update}
                      uploadedAt={selectedModel?.uploaded_at}
                      emptyMessage="Choose the first GLB file below to start this project's visual construction history."
                    />
                  </div>
                  <div className="admin-model-publisher">
                    <label>
                      <span className="label">Milestone name</span>
                      <input
                        className="field"
                        maxLength="120"
                        value={modelTitle}
                        onChange={(event) => setModelTitle(event.target.value)}
                        placeholder="e.g. Main steel frame installed"
                      />
                    </label>
                    <label>
                      <span className="label">Site update for the client</span>
                      <textarea
                        className="field"
                        rows="5"
                        maxLength="2000"
                        value={modelNote}
                        onChange={(event) => setModelNote(event.target.value)}
                        placeholder="Explain what this model shows and what the team is working on now."
                      />
                    </label>
                    <label>
                      <span className="label">Binary glTF model (.glb)</span>
                      <input
                        ref={modelInput}
                        className="field admin-file-field"
                        type="file"
                        accept=".glb,model/gltf-binary"
                        onChange={(event) =>
                          setModelFile(event.target.files?.[0] || null)
                        }
                      />
                      <small>
                        {modelFile
                          ? `${modelFile.name} (${formatFileSize(modelFile.size)})`
                          : "Maximum 500 MB. Large uploads resume automatically if the connection is interrupted."}
                      </small>
                    </label>
                    {modelStatus === "uploading" && (
                      <div className="admin-upload-progress" aria-live="polite">
                        <div>
                          <span>Uploading model</span>
                          <strong>{uploadProgress}%</strong>
                        </div>
                        <progress max="100" value={uploadProgress}>
                          {uploadProgress}%
                        </progress>
                      </div>
                    )}
                    {modelStatus === "complete" && (
                      <p className="admin-upload-complete">
                        <CheckCircle size={19} weight="fill" /> The 3D update is
                        now visible to the client.
                      </p>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary admin-publish-model"
                      disabled={modelStatus === "uploading"}
                      onClick={publishModel}
                    >
                      <FileArrowUp size={19} />
                      {modelStatus === "uploading"
                        ? "Publishing..."
                        : "Publish 3D update"}
                    </button>
                  </div>
                </div>

                <div className="admin-model-history">
                  <div className="admin-history-heading">
                    <ClockCounterClockwise size={21} />
                    <div>
                      <h3>Published model history</h3>
                      <p>Clients can revisit every model in this order.</p>
                    </div>
                  </div>
                  {modelUpdates.length ? (
                    <div className="admin-model-update-list">
                      {modelUpdates.map((update, index) => (
                        <article
                          key={update.id}
                          className={
                            selectedModel?.id === update.id ? "is-selected" : ""
                          }
                        >
                          <button
                            type="button"
                            className="admin-model-select"
                            onClick={() => setSelectedModelId(update.id)}
                          >
                            <span>
                              <Eye size={18} />
                            </span>
                            <div>
                              <strong>{update.milestone_title}</strong>
                              <p>{update.site_update}</p>
                              <small>
                                {new Date(
                                  update.uploaded_at,
                                ).toLocaleDateString()}{" "}
                                | {formatFileSize(update.file_size_bytes)} |{" "}
                                {update.original_filename}
                              </small>
                            </div>
                            <b>{modelUpdates.length - index}</b>
                          </button>
                          <button
                            type="button"
                            className="admin-model-remove"
                            aria-label={`Remove ${update.milestone_title}`}
                            onClick={() => removeModel(update)}
                          >
                            <Trash size={17} />
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="admin-history-empty">
                      No model updates have been published.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>

          <section
            className="admin-workspace-card"
            aria-labelledby="project-files-heading"
          >
            <div className="admin-card-heading">
              <span>04</span>
              <div>
                <h2 id="project-files-heading">Plans and documents</h2>
                <p>Replace the client-facing 2D warehouse plan.</p>
              </div>
            </div>
            <label>
              <span className="label">2D warehouse plan (PDF)</span>
              <input
                className="field admin-file-field"
                type="file"
                accept="application/pdf"
                onChange={(event) => setPdf(event.target.files?.[0] || null)}
              />
            </label>
            {form.pdf_plan_url && (
              <p className="admin-current-file">
                Current file: {form.pdf_plan_url}
              </p>
            )}
          </section>

          {!isNew && (
            <section
              className="admin-workspace-card admin-photo-card"
              aria-labelledby="progress-photo-heading"
            >
              <div className="admin-card-heading">
                <span>05</span>
                <div>
                  <h2 id="progress-photo-heading">Progress photography</h2>
                  <p>
                    Upload, review and remove the site imagery visible in the
                    client portal.
                  </p>
                </div>
              </div>
              <div className="admin-photo-controls">
                <label>
                  <span className="label">Site photo</span>
                  <input
                    ref={photoInput}
                    className="field admin-file-field"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                  />
                </label>
                <label>
                  <span className="label">Caption (optional)</span>
                  <input
                    className="field"
                    maxLength="240"
                    placeholder="e.g. Roof structure completed"
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-outline admin-queue-button"
                  onClick={() => {
                    const file = photoInput.current?.files?.[0];
                    if (!file) return;
                    try {
                      validatePhotoFile(file);
                      setError("");
                      setPhotos((current) => [
                        { file, caption: caption.trim() },
                        ...current,
                      ]);
                      photoInput.current.value = "";
                      setCaption("");
                    } catch (photoError) {
                      setError(photoError.message);
                    }
                  }}
                >
                  <UploadSimple size={18} /> Queue photo
                </button>
              </div>
              {queuedPhotos.length > 0 && (
                <div className="admin-photo-queue" aria-live="polite">
                  {queuedPhotos.map((photo, index) => (
                    <div key={`${photo.file.name}-${index}`}>
                      <p>
                        <strong>Queued</strong> {photo.file.name}
                        {photo.caption && ` - ${photo.caption}`}
                      </p>
                      <button
                        type="button"
                        aria-label={`Remove queued ${photo.file.name}`}
                        onClick={() =>
                          setPhotos((current) =>
                            current.filter((item) => item !== photo),
                          )
                        }
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="admin-photo-library-heading">
                <div>
                  <h3>Published photos</h3>
                  <p>These images are currently available to the client.</p>
                </div>
                <span>{publishedPhotos.length}</span>
              </div>
              {publishedPhotos.length ? (
                <div className="admin-photo-gallery">
                  {publishedPhotos.map((photo) => (
                    <article key={photo.id}>
                      <div className="admin-photo-thumb">
                        {photo.url ? (
                          <img
                            src={photo.url}
                            alt={
                              photo.caption || "Warehouse construction progress"
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div>Preview unavailable</div>
                        )}
                        <button
                          type="button"
                          aria-label={`Delete ${photo.caption || "progress photo"}`}
                          disabled={deletingPhotoId === photo.id}
                          onClick={() => removePhoto(photo)}
                        >
                          <Trash size={17} />
                          {deletingPhotoId === photo.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                      <div className="admin-photo-meta">
                        <strong>{photo.caption || "Site progress"}</strong>
                        <time>
                          {new Date(photo.uploaded_at).toLocaleDateString()}
                        </time>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="admin-history-empty">
                  No progress photos have been published yet.
                </p>
              )}
            </section>
          )}

          {!isNew && (
            <section
              className="admin-workspace-card admin-danger-zone"
              aria-labelledby="delete-client-heading"
            >
              <div className="admin-card-heading">
                <span>06</span>
                <div>
                  <h2 id="delete-client-heading">Delete client</h2>
                  <p>
                    Permanently remove this client's login, plans, photographs,
                    3D models and project data.
                  </p>
                </div>
              </div>
              {!confirmingDelete ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash size={18} /> Delete client
                </button>
              ) : (
                <div className="admin-delete-confirmation">
                  <p>
                    This cannot be undone. Type{" "}
                    <strong>{form.company_name}</strong> to confirm.
                  </p>
                  <label>
                    <span className="label">Type company name to confirm</span>
                    <input
                      className="field"
                      value={deleteConfirmation}
                      onChange={(event) =>
                        setDeleteConfirmation(event.target.value)
                      }
                      autoComplete="off"
                    />
                  </label>
                  <div className="admin-delete-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={status === "deleting"}
                      onClick={() => {
                        setConfirmingDelete(false);
                        setDeleteConfirmation("");
                        setError("");
                      }}
                    >
                      Cancel deletion
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={
                        status === "deleting" ||
                        deleteConfirmation.trim() !== form.company_name.trim()
                      }
                      onClick={deleteClient}
                    >
                      <Trash size={18} />
                      {status === "deleting"
                        ? "Deleting..."
                        : "Delete permanently"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <footer className="admin-workspace-footer">
          <p>
            Project details become visible in the client portal after saving.
            Published 3D updates appear immediately.
          </p>
          <div>
            <button type="button" className="btn btn-outline" onClick={close}>
              Cancel
            </button>
            <button disabled={status !== "idle"} className="btn btn-dark">
              <FloppyDisk size={18} />
              {status === "loading"
                ? "Saving..."
                : isNew
                  ? "Create project"
                  : "Save changes"}
            </button>
          </div>
        </footer>
      </form>
    </main>
  );
}
