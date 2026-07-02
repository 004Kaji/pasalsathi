'use client'
import { useState, useEffect } from 'react'
import { Store, Delete } from 'lucide-react'

interface Props {
  onUnlock: () => void
  onSignOut: () => void
}

async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function PinLockScreen({ onUnlock, onSignOut }: Props) {
  const [pin, setPin]     = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (pin.length !== 4) return
    hashPin(pin).then(hash => {
      if (hash === localStorage.getItem('ps_pin_hash')) {
        setPin(''); onUnlock()
      } else {
        setShake(true); setError(true)
        setTimeout(() => { setPin(''); setShake(false); setError(false) }, 500)
      }
    })
  }, [pin, onUnlock])

  function press(key: string) {
    if (pin.length < 4) setPin(p => p + key)
  }
  function del() { setPin(p => p.slice(0, -1)) }

  const PAD = ['1','2','3','4','5','6','7','8','9','','0','del']

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1C1917]/95 backdrop-blur-sm flex flex-col items-center justify-center select-none">

      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-[#C84B2F] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl">
          <Store size={28} className="text-white" />
        </div>
        <p className="text-white font-bold text-lg">PasalSathi</p>
        <p className="text-white/50 text-sm mt-1">Enter PIN to unlock</p>
      </div>

      {/* PIN dots */}
      <div className={`flex gap-5 mb-10 ${shake ? 'animate-pin-shake' : ''}`}>
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              i < pin.length
                ? error ? 'bg-red-500 border-red-500 scale-110' : 'bg-[#C84B2F] border-[#C84B2F] scale-110'
                : 'border-white/25 bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 w-72">
        {PAD.map((key, i) => {
          if (key === '') return <div key={i} />
          if (key === 'del') return (
            <button key={i} onClick={del}
              className="h-[68px] rounded-2xl bg-white/8 text-white/70 flex items-center justify-center active:bg-white/15 transition-colors">
              <Delete size={22} />
            </button>
          )
          return (
            <button key={i} onClick={() => press(key)}
              className="h-[68px] rounded-2xl bg-white/8 text-white text-2xl font-semibold active:bg-white/20 transition-colors active:scale-95">
              {key}
            </button>
          )
        })}
      </div>

      {/* Escape hatch */}
      <button onClick={onSignOut} className="mt-12 text-white/35 text-sm hover:text-white/60 transition-colors">
        Forgot PIN? Sign out
      </button>
    </div>
  )
}
