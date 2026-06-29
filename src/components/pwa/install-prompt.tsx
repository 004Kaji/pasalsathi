'use client'

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [isIOS,          setIsIOS]          = useState(false)
  const [isStandalone,   setIsStandalone]   = useState(false)
  const [dismissed,      setDismissed]      = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing,     setInstalling]     = useState(false)

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as { MSStream?: unknown }).MSStream
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const wasDismissed = localStorage.getItem('ps_install_dismissed') === '1'

    setIsIOS(!!ios)
    setIsStandalone(standalone)
    setDismissed(wasDismissed)

    // Capture Android/Chrome install prompt before browser swallows it
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onAppInstalled = () => { setDeferredPrompt(null); setDismissed(true) }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  function dismiss() {
    localStorage.setItem('ps_install_dismissed', '1')
    setDismissed(true)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') dismiss()
    setDeferredPrompt(null)
    setInstalling(false)
  }

  if (isStandalone || dismissed) return null

  // Android / Chrome — custom install banner
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-24 md:bottom-6 left-4 right-4 z-50 max-w-sm mx-auto">
        <div className="bg-[#1C1917] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
          <div className="w-10 h-10 bg-[#C84B2F] rounded-xl flex items-center justify-center shrink-0">
            <Download size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Install PasalSathi</p>
            <p className="text-xs text-white/50 mt-0.5">Add to home screen · works offline</p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="bg-[#C84B2F] text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform disabled:opacity-60"
              >
                {installing ? 'Installing…' : 'Install'}
              </button>
              <button onClick={dismiss} className="text-white/40 text-xs px-2 py-2">
                Not now
              </button>
            </div>
          </div>
          <button onClick={dismiss} className="text-white/30 shrink-0 p-1 active:scale-95">
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // iOS Safari — manual "Add to Home Screen" instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 max-w-sm mx-auto">
        <div className="bg-[#1C1917] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
          <div className="w-10 h-10 bg-[#C84B2F] rounded-xl flex items-center justify-center shrink-0">
            <Share size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Add to Home Screen</p>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              Tap <span className="text-[#C84B2F] font-semibold">Share ⎋</span> at the bottom,
              then tap <span className="text-[#C84B2F] font-semibold">"Add to Home Screen" ➕</span>
            </p>
          </div>
          <button onClick={dismiss} className="text-white/30 shrink-0 p-1 active:scale-95">
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  return null
}
