'use client'

import { useState } from 'react'
import { Calculator as CalcIcon } from 'lucide-react'
import Calculator from './calculator'

export default function CalcFab() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-13 h-13 bg-[#C84B2F] text-white rounded-2xl shadow-2xl shadow-[#C84B2F]/30 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="क्याल्कुलेटर"
      >
        <CalcIcon size={22} />
      </button>
      {open && <Calculator onClose={() => setOpen(false)} />}
    </>
  )
}
