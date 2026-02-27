"use client";

import { useEffect, useState } from "react";
import { setTokens } from "@/lib/api-client";

export default function SSOCallbackPage() {
  const [status, setStatus] = useState("Processing SSO login...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const isNewUser = params.get("isNewUser") === "true";
    const error = params.get("error");

    if (error) {
      setStatus(`Authentication error: ${error}`);
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
      return;
    }

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      const destination = isNewUser ? "/profile?tour=welcome" : "/dashboard";
      setStatus("Success! Redirecting...");
      window.location.replace(destination);
    } else {
      setStatus("No tokens received. Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    }
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "24px", marginBottom: "16px" }}>&#8987;</div>
        <p>{status}</p>
      </div>
    </div>
  );
}
