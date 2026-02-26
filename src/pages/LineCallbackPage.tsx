import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = "line_session_token";

interface ErrorDetails {
  error: string;
  message?: string;
  line_status?: number;
  line_error?: string;
  line_error_description?: string;
  redirect_uri_used?: string;
  token_kid?: string;
  token_keys?: string[];
}

const LineCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<ErrorDetails | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError({ error: errorParam });
      return;
    }

    if (!code || !state) {
      setError({ error: "missing_params" });
      return;
    }

    const exchange = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/auth-line-callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        });

        const data = await res.json();

        if (!res.ok || !data.session_token) {
          setError(data as ErrorDetails);
          return;
        }

        localStorage.setItem(SESSION_KEY, data.session_token);
        const redirect = localStorage.getItem("post_login_redirect") || "/app";
        localStorage.removeItem("post_login_redirect");
        navigate(redirect, { replace: true });
      } catch {
        setError({ error: "network_error" });
      }
    };

    exchange();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-4 text-left">
          <h2 className="text-lg font-semibold text-destructive">Login Failed</h2>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2 text-sm font-mono break-all">
            <div><span className="text-muted-foreground">error:</span> {error.error}</div>
            {error.message && <div><span className="text-muted-foreground">message:</span> {error.message}</div>}
            {error.line_status && <div><span className="text-muted-foreground">line_status:</span> {error.line_status}</div>}
            {error.line_error && <div><span className="text-muted-foreground">line_error:</span> {error.line_error}</div>}
            {error.line_error_description && <div><span className="text-muted-foreground">line_error_desc:</span> {error.line_error_description}</div>}
            {error.redirect_uri_used && <div><span className="text-muted-foreground">redirect_uri:</span> {error.redirect_uri_used}</div>}
            {error.token_kid && <div><span className="text-muted-foreground">token_kid:</span> {error.token_kid}</div>}
            {error.token_keys && <div><span className="text-muted-foreground">token_keys:</span> {error.token_keys.join(", ")}</div>}
          </div>
          <a href="/" className="text-sm text-muted-foreground underline block">Back to home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Logging in...</p>
    </div>
  );
};

export default LineCallbackPage;
