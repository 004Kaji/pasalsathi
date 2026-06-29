'use client'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
  }

  if (!deferredPrompt || dismissed) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 bg-[#1a1a1a] border border-orange-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-xl shadow-black/50">
      <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
        <Download size={20} className="text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">Add to Home Screen</p>
        <p className="text-xs text-gray-500 mt-0.5">Install PasalSathi for fast offline access</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl active:scale-95"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-gray-500 active:scale-95"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
