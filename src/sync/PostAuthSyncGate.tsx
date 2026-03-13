import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { postAuthSync } from "@/sync/postAuthSync";

export default function PostAuthSyncGate() {
  const { user, session, loading } = useAuth();

  const userId = user?.id ?? session?.user?.id ?? null;

  useEffect(() => {
    if (loading) return;
    if (!userId) return;

    void postAuthSync(userId);
  }, [loading, userId]);

  return null;
}