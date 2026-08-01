import React, { Component, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter, HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { isNativeApp } from '@/lib/platform';
import { hydrateSpriteLabPersistence } from '@/lib/spriteLab';
import { recoverCorruptDiceState } from '@/lib/skinRecovery';
import PageNotFound from './lib/PageNotFound';
import Home from '@/pages/Home';
import Story from '@/pages/Story';
import StoryGame from '@/pages/StoryGame';

// Repair corrupt sprite-lab saves before hydration syncs them into the profile.
recoverCorruptDiceState();
// Restore Sprite Lab locks/snapshots from the player profile before any skin loads.
hydrateSpriteLabPersistence();

const Shop = lazy(() => import('@/pages/Shop'));

const Setup = lazy(() => import('@/pages/Setup'));
const Game = lazy(() => import('@/pages/Game'));
const Rules = lazy(() => import('@/pages/Rules'));
const PreviewDice = lazy(() => import('@/pages/PreviewDice'));
const SpriteLabPage = lazy(() => import('@/pages/SpriteLabPage'));
const HeldStylePreview = lazy(() => import('@/pages/HeldStylePreview'));
const SoundwaveMicSettings = lazy(() => import('@/pages/SoundwaveMicSettings'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const OnlineUnavailable = lazy(() => import('@/pages/OnlineUnavailable'));
const VideoAssets = lazy(() => import('@/pages/VideoAssets'));
const FishShowcase = lazy(() => import('@/pages/FishShowcase'));
const IcePowerLab = lazy(() => import('@/pages/IcePowerLab'));
const SharkBiteLab = lazy(() => import('@/pages/SharkBiteLab'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-cyan-300 text-sm">
      Loading…
    </div>
  );
}

class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    // Auto-reset when the route changes so a transient error on one screen
    // doesn't strand the user on every subsequent navigation.
    if (this.state.error && prevProps.routeKey !== this.props.routeKey) {
      this.setState({ error: null });
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      const msg = this.state.error.message || "";
      const chunkLoadFailed =
        /failed to fetch dynamically imported module|loading chunk|importing a module script failed|networkerror|load failed/i.test(
          msg
        );
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-6 text-center gap-4">
          <p className="text-rose-400 font-bold">
            {chunkLoadFailed
              ? "This page failed to load — the dev server may have stopped or the app needs a refresh."
              : "Something went wrong loading this page."}
          </p>
          <p className="text-xs text-slate-400 max-w-sm">
            {chunkLoadFailed
              ? "Run npm run dev in your Terminal, then hard-refresh (Cmd+Shift+R)."
              : msg}
          </p>
          {import.meta.env.DEV && !chunkLoadFailed && (
            <p className="text-xs text-slate-500 max-w-sm">
              Dev tip: open <code className="text-cyan-300">http://127.0.0.1:5173</code>, hard-refresh
              (Cmd+Shift+R), and check your Terminal for red Vite compile errors.
            </p>
          )}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={this.reset}
              className="text-cyan-400 text-sm font-bold underline"
            >
              Try again
            </button>
            <a href="/" className="text-cyan-400 text-sm font-bold underline">
              Back to Home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouteErrorBoundaryWithLocation({ children }) {
  const location = useLocation();
  return (
    <RouteErrorBoundary routeKey={location.pathname}>
      {children}
    </RouteErrorBoundary>
  );
}

function App() {
  const Router = isNativeApp() ? HashRouter : BrowserRouter;

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <RouteErrorBoundaryWithLocation>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/game" element={<Game />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/preview-dice" element={<PreviewDice />} />
            <Route path="/ragnarok-sprites" element={<Navigate to="/sprite-lab/matrix" replace />} />
            <Route path="/sprite-lab" element={<SpriteLabPage />} />
            <Route path="/sprite-lab/:skinId" element={<SpriteLabPage />} />
            <Route path="/held-style" element={<HeldStylePreview />} />
            <Route path="/soundwave-mic" element={<SoundwaveMicSettings />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/online" element={<OnlineUnavailable />} />
            <Route path="/online/:matchId" element={<OnlineUnavailable />} />
            <Route path="/story" element={<Story />} />
            <Route path="/story/:bossId" element={<StoryGame />} />
            <Route path="/video-assets" element={<VideoAssets />} />
            <Route path="/fish-showcase" element={<FishShowcase />} />
            <Route path="/ice-lab" element={<IcePowerLab />} />
            <Route path="/frosty-lab" element={<Navigate to="/ice-lab" replace />} />
            <Route path="/shark-bite-lab" element={<SharkBiteLab />} />
            <Route path="/shark-lab" element={<Navigate to="/shark-bite-lab" replace />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          </RouteErrorBoundaryWithLocation>
        </Suspense>
      </Router>
      <Toaster />
      <SonnerToaster position="top-center" richColors />
    </QueryClientProvider>
  )
}

export default App
