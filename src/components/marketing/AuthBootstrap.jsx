import { useAuth } from "@/hooks/useAuth";

/** Keeps session listener + entitlement sync alive app-wide (web + native). */
export default function AuthBootstrap() {
  useAuth();
  return null;
}
