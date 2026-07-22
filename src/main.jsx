import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { preloadAllLocalVideos } from '@/lib/localVideoStore'

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
