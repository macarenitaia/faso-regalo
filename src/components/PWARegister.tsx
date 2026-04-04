'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // CRITICO: window.location.origin evita redirects 307 en iOS
    const swUrl = `${window.location.origin}/sw.js`

    navigator.serviceWorker
      .register(swUrl, { scope: '/' })
      .then((registration) => {
        setInterval(() => registration.update(), 60 * 60 * 1000)

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state === 'activated' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' })
              setTimeout(() => window.location.reload(), 1000)
            }
          })
        })
      })
      .catch((err) => console.error('[PWA] SW registration failed:', err))
  }, [])

  return null
}
