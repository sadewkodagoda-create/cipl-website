import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeSlash,
  LockKey,
  ShieldCheck,
  UserCircle,
  WarningCircle,
} from "@phosphor-icons/react";

export default function PortalLogin({
  variant,
  title,
  description,
  usernameLabel,
  username,
  onUsernameChange,
  password,
  onPasswordChange,
  error,
  loading,
  submitLabel,
  loadingLabel,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isAdmin = variant === "admin";
  const image = isAdmin
    ? "/site-photos/building-structure.webp"
    : "/site-photos/interior-1.webp";

  return (
    <main
      id="main-content"
      className={`portal-login-page portal-login-${variant}`}
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        width="1120"
        height="1400"
        fetchPriority="high"
        decoding="async"
        className="portal-login-image"
      />
      <div className="portal-login-wash" aria-hidden="true" />
      <div className="portal-login-grid" aria-hidden="true" />

      <section
        className="portal-login-card"
        aria-labelledby={`${variant}-portal-title`}
      >
        <header className="portal-login-header">
          <Link to="/" className="portal-login-brand" aria-label="CIPL home">
            <span className="portal-login-logo">
              <img src="/cipl-logo.jpg" alt="CIPL" />
            </span>
            <span>
              <strong>Chanithu International</strong>
              <small>Private Limited</small>
            </span>
          </Link>

          <h1 id={`${variant}-portal-title`}>{title}</h1>
          <p>{description}</p>
        </header>

        <form onSubmit={onSubmit} className="portal-login-form">
          <div className="portal-field-group">
            <label htmlFor={`${variant}-username`}>{usernameLabel}</label>
            <div className="portal-field-wrap">
              <UserCircle size={21} weight="regular" aria-hidden="true" />
              <input
                id={`${variant}-username`}
                name="username"
                autoComplete="username"
                required
                value={username}
                onChange={onUsernameChange}
              />
            </div>
          </div>

          <div className="portal-field-group">
            <label htmlFor={`${variant}-password`}>Password</label>
            <div className="portal-field-wrap">
              <LockKey size={21} weight="regular" aria-hidden="true" />
              <input
                id={`${variant}-password`}
                name="password"
                autoComplete="current-password"
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={onPasswordChange}
              />
              <button
                type="button"
                className="portal-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="portal-login-error" role="alert">
              <WarningCircle size={19} weight="fill" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}

          <button
            disabled={loading}
            className="btn btn-dark portal-login-submit"
          >
            <span>{loading ? loadingLabel : submitLabel}</span>
            {!loading && (
              <ArrowRight size={19} weight="bold" aria-hidden="true" />
            )}
          </button>
        </form>

        <footer className="portal-login-security">
          <ShieldCheck size={20} weight="duotone" aria-hidden="true" />
          <span>Protected access for authorized CIPL users</span>
        </footer>
      </section>
    </main>
  );
}
