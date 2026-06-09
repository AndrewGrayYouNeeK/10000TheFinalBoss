import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Home from '@/pages/Home';

const Setup = lazy(() => import('@/pages/Setup'));
const Game = lazy(() => import('@/pages/Game'));
const Rules = lazy(() => import('@/pages/Rules'));
const Shop = lazy(() => import('@/pages/Shop'));
const PreviewDice = lazy(() => import('@/pages/PreviewDice'));
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

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/game" element={<Game />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/preview-dice" element={<PreviewDice />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/online" element={<OnlineUnavailable />} />
            <Route path="/online/:matchId" element={<OnlineUnavailable />} />
            <Route path="/story" element={<Story />} />
            <Route path="/story/:bossId" element={<StoryGame />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster />
      <SonnerToaster position="top-center" richColors />
    </QueryClientProvider>
  )
}

export default App
