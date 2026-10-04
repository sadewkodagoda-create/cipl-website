import { useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";

const loadInquiryClient = () => import("../lib/supabase");

const EMPTY_INQUIRY = {
  name: "",
  company: "",
  email: "",
  phone: "",
  message: "",
  website: "",
};

export default function InquiryForm() {
  const [form, setForm] = useState(EMPTY_INQUIRY);
  const [state, setState] = useState("idle");

  const submit = async (event) => {
    event.preventDefault();
    setState("loading");
    try {
      const { isSupabaseConfigured, supabase } = await loadInquiryClient();
      if (!isSupabaseConfigured) {
        setState("error");
        return;
      }
      const { data, error } = await supabase.functions.invoke(
        "submit-inquiry",
        { body: form },
      );
      setState(error || !data?.success ? "error" : "success");
    } catch {
      setState("error");
    }
  };

  return (
    <form
      onSubmit={submit}
      onFocusCapture={() => { void loadInquiryClient().catch(() => null); }}
      aria-live="polite"
    >
      {state === "success" ? (
        <div className="grid min-h-[500px] place-items-center text-center">
          <div>
            <CheckCircle
              size={48}
              weight="thin"
              className="mx-auto text-[var(--gold-dark)]"
            />
            <h3 className="heading mt-5 text-2xl">
              Inquiry received.
            </h3>
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
                    name === "email"
                      ? 254
                      : name === "phone"
                        ? 40
                        : 120
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
  );
}
