import React, { Component, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import { isNativeApp } from '@/lib/platform';
import PageNotFound from './lib/PageNotFound';
import Home from '@/pages/Home';

const Shop = lazy(() => import('@/pages/Shop'));

const Setup = lazy(() => import('@/pages/Setup'));
const Game = lazy(() => import('@/pages/Game'));
const Rules = lazy(() => import('@/pages/Rules'));
const PreviewDice = lazy(() => import('@/pages/PreviewDice'));
const SkinPowerPreview = lazy(() => import('@/pages/SkinPowerPreview'));
const HeldStylePreview = lazy(() => import('@/pages/HeldStylePreview'));
const SoundwaveMicSettings = lazy(() => import('@/pages/SoundwaveMicSettings'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const OnlineUnavailable = lazy(() => import('@/pages/OnlineUnavailable'));
const Story = lazy(() => import('@/pages/Story'));
const StoryGame = lazy(() => import('@/pages/StoryGame'));

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

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-6 text-center gap-4">
          <p className="text-rose-400 font-bold">Something went wrong loading this page.</p>
          <p className="text-xs text-slate-400 max-w-sm">{this.state.error.message}</p>
          <a href="/" className="text-cyan-400 text-sm font-bold underline">
            Back to Home
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const Router = isNativeApp() ? HashRouter : BrowserRouter;

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <RouteErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/game" element={<Game />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/preview-dice" element={<PreviewDice />} />
            <Route path="/preview/power-skins" element={<SkinPowerPreview />} />
            <Route path="/held-style" element={<HeldStylePreview />} />
            <Route path="/soundwave-mic" element={<SoundwaveMicSettings />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/online" element={<OnlineUnavailable />} />
            <Route path="/online/:matchId" element={<OnlineUnavailable />} />
            <Route path="/story" element={<Story />} />
            <Route path="/story/:bossId" element={<StoryGame />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          </RouteErrorBoundary>
        </Suspense>
      </Router>
      <Toaster />
      <SonnerToaster position="top-center" richColors />
    </QueryClientProvider>
  )
}

export default App
