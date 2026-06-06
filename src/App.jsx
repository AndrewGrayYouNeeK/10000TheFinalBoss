import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Home from '@/pages/Home';
import Setup from '@/pages/Setup';
import Game from '@/pages/Game';
import Rules from '@/pages/Rules';
import Shop from '@/pages/Shop';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import OnlineUnavailable from '@/pages/OnlineUnavailable';
import Story from '@/pages/Story';
import StoryGame from '@/pages/StoryGame';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/game" element={<Game />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/online" element={<OnlineUnavailable />} />
          <Route path="/online/:matchId" element={<OnlineUnavailable />} />
          <Route path="/story" element={<Story />} />
          <Route path="/story/:bossId" element={<StoryGame />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
      <SonnerToaster position="top-center" richColors />
    </QueryClientProvider>
  )
}

export default App
