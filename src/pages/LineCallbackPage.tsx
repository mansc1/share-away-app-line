import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = "line_session_token";

const LineCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (!code || !state) {
      setError("missing_params");
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
          setError(data.error || "exchange_failed");
          return;
        }

        localStorage.setItem(SESSION_KEY, data.session_token);
        navigate("/app", { replace: true });
      } catch {
        setError("network_error");
      }
    };

    exchange();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Login failed: {error}</p>
          <a href="/" className="text-sm text-muted-foreground underline">Back to home</a>
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
