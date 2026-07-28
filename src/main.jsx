import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { preloadAllLocalVideos } from '@/lib/localVideoStore'
import { installAnimateGuard } from '@/lib/animateGuard'

// Install the global WAAPI guard once, before any component renders, so no
// framer-motion / Element.animate caller can crash the route with an invalid
// duration/times value. See src/lib/animateGuard.js for details.
installAnimateGuard()

// IndexedDB is origin-scoped. localhost and 127.0.0.1 are DIFFERENT origins —
// uploads saved on one look "gone" on the other. Canonicalize to localhost in browser.
try {
  const { protocol, hostname, port, pathname, search, hash } = window.location
  if (
    (protocol === 'http:' || protocol === 'https:') &&
    hostname === '127.0.0.1'
  ) {
    const portPart = port ? `:${port}` : ''
    window.location.replace(`${protocol}//localhost${portPart}${pathname}${search}${hash}`)
  }
} catch {
  /* ignore */
}

preloadAllLocalVideos().catch(() => {})

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
