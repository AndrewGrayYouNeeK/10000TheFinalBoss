import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isNativeApp } from "@/lib/platform";
import { isWebPlayEnabled } from "@/lib/webPlay";

/** Blocks web play routes when VITE_WEB_PLAY_ENABLED=false (launch cutover). */
export default function WebPlayGate() {
  if (isNativeApp() || isWebPlayEnabled()) {
    return <Outlet />;
  }
  return <Navigate to="/" replace />;
}
