import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./lib/supabase";
import Auth from "./Auth";
import App from "./App";

function Root() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null; // brief blank while checking session
  if (!session) return <Auth />;
  return <App session={session} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
