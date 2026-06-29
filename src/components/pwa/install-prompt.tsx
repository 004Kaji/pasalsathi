'use client'
import { useEffect, useState } from 'react'
import { X, Share } from 'lucide-react'

export default function InstallPrompt() {
  const [isIOS,       setIsIOS]       = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed,   setDismissed]   = useState(false)

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
    const standalone = window.matchMedia('(display-mode: standalone)').matches

    setIsIOS(!!ios)
    setIsStandalone(standalone)
  }, [])

  // Already installed or dismissed — show nothing
  if (isStandalone || dismissed) return null

  // iOS: show manual "Add to Home Screen" instructions (beforeinstallprompt doesn't work on Safari)
  if (isIOS) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-40 bg-[#1a1a1a] border border-orange-500/30 rounded-2xl p-4 shadow-xl shadow-black/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Share size={18} className="text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Add to Home Screen</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Tap <span className="text-orange-400">Share ⎋</span> then{' '}
                <span className="text-orange-400">"Add to Home Screen" ➕</span>
              </p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="p-1 text-gray-500 shrink-0 active:scale-95">
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // Non-iOS (Android/Chrome): nothing — browser shows its own native install prompt
  return null
}
