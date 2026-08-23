"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const initialResult = { type: "idle", message: "" };

export default function Home() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(initialResult);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectFile(nextFile) {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) {
      setResult({ type: "error", message: "Please choose a JPG, PNG, or WebP image." });
      return;
    }
    if (nextFile.size > 8 * 1024 * 1024) {
      setResult({ type: "error", message: "The image must be smaller than 8 MB." });
      return;
    }
    setPreviewUrl(URL.createObjectURL(nextFile));
    setFile(nextFile);
    setResult(initialResult);
  }

  function handleDrop(event) {
    event.preventDefault();
    selectFile(event.dataTransfer.files[0]);
  }

  async function verifyCheque(event) {
    event.preventDefault();
    if (!file || isSubmitting) return;

    setIsSubmitting(true);
    setResult({ type: "loading", message: "Reading the cheque and checking your profile..." });

    const formData = new FormData();
    formData.append("cheque", file);

    try {
      const response = await fetch(`${API_URL}/api/cheques/verify`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok && data.verified) {
        setResult({
          type: "success",
          message: "The cheque matches your profile.",
          details: `Submission ID: ${data.submissionId}`,
        });
      } else if (data.errorCode === "PROFILE_DATA_MISMATCH") {
        setResult({
          type: "error",
          message: "The cheque details do not match your profile.",
          details: `Check: ${(data.mismatchedFields || []).join(", ")}`,
        });
      } else if (data.errorCode === "IDENTITY_DATA_UNREADABLE") {
        setResult({ type: "error", message: "The name, bank name, or account ID could not be read clearly." });
      } else {
        setResult({ type: "error", message: "Verification could not be completed. Please try another image." });
      }
    } catch {
      setResult({ type: "error", message: "The verification service is unavailable. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">V</div>
        <div>
          <p className="eyebrow">Vaultline / identity desk</p>
          <p className="brand-name">Cheque verification</p>
        </div>
        <span className="secure-label"><span className="status-dot" /> Secure session</span>
      </header>

      <section className="hero-copy">
        <p className="eyebrow accent">Profile check 01</p>
        <h1>Confirm the cheque belongs to you.</h1>
        <p className="intro">Upload a clear cheque image. We will compare the printed name, bank name, and account ID with your profile.</p>
      </section>

      <section className="workflow-grid">
        <form className="upload-panel" onSubmit={verifyCheque}>
          <div className="panel-heading">
            <div>
              <p className="section-kicker">01 / Add document</p>
              <h2>Cheque image</h2>
            </div>
            <span className="file-limit">JPG · PNG · WEBP</span>
          </div>

          <button
            type="button"
            className={`drop-zone ${file ? "has-file" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            {previewUrl ? (
              <img className="preview-image" src={previewUrl} alt="Selected cheque preview" />
            ) : (
              <span className="drop-prompt">
                <span className="upload-symbol" aria-hidden="true">+</span>
                <strong>Drop cheque image here</strong>
                <span>or choose a file from your device</span>
              </span>
            )}
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => selectFile(event.target.files[0])} />

          {file && <p className="file-name">Selected: {file.name}</p>}
          <button className="primary-button" type="submit" disabled={!file || isSubmitting}>
            {isSubmitting ? "Checking document..." : "Verify cheque"}
            {!isSubmitting && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <aside className="status-panel" aria-live="polite">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">02 / Result</p>
              <h2>Verification status</h2>
            </div>
            <span className="step-number">02</span>
          </div>
          <div className={`result-box ${result.type}`}>
            {result.type === "idle" && <><span className="result-icon">○</span><strong>Waiting for a cheque</strong><p>Your result will appear here.</p></>}
            {result.type === "loading" && <><span className="spinner" /><strong>Checking your document</strong><p>{result.message}</p></>}
            {result.type === "success" && <><span className="result-icon">✓</span><strong>Verified successfully</strong><p>{result.message}</p><small>{result.details}</small></>}
            {result.type === "error" && <><span className="result-icon">!</span><strong>Verification needs attention</strong><p>{result.message}</p><small>{result.details}</small></>}
          </div>
          <div className="checks-list">
            <div><span>01</span><p>Printed name</p><em>Profile match</em></div>
            <div><span>02</span><p>Bank name</p><em>Profile match</em></div>
            <div><span>03</span><p>Account ID</p><em>Profile match</em></div>
          </div>
        </aside>
      </section>

      <footer className="footer-note">Only the identity fields above affect verification. Financial details are handled separately after a successful match.</footer>
    </main>
  );
}
