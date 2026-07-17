import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { preloadAllLocalVideos } from '@/lib/localVideoStore'

preloadAllLocalVideos()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
