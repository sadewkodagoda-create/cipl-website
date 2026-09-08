import { useEffect, useState } from "react";
import { getAuthErrorMessage } from "../lib/authErrors";
import { supabase } from "../lib/supabase";

export default function usePortalSession(requiredRole) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    const applySession = (session) => {
      if (!active) return;
      const sessionUser = session?.user;
      setUser(
        sessionUser?.app_metadata?.role === requiredRole ? sessionUser : null,
      );
      setSessionError("");
      setLoading(false);
    };

    const failSession = (error) => {
      if (!active) return;
      setUser(null);
      setSessionError(getAuthErrorMessage(error));
      setLoading(false);
    };

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) failSession(error);
        else applySession(data.session);
      })
      .catch(failSession);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        applySession(session);
      },
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [requiredRole]);

  return { user, setUser, loading, sessionError };
}
