import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function usePortalSession(requiredRole) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => applySession(data.session));
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

  return { user, setUser, loading };
}
