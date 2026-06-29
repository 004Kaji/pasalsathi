'use client'

import { useState } from 'react'
import { X, Delete } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function Calculator({ onClose }: Props) {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState('')
  const [op, setOp] = useState('')
  const [waitingNext, setWaitingNext] = useState(false)

  function input(val: string) {
    if (waitingNext) {
      setDisplay(val === '.' ? '0.' : val)
      setWaitingNext(false)
    } else {
      if (val === '.' && display.includes('.')) return
      setDisplay(display === '0' && val !== '.' ? val : display + val)
    }
  }

  function operator(nextOp: string) {
    const cur = parseFloat(display)
    if (prev && op && !waitingNext) {
      const result = calculate(parseFloat(prev), cur, op)
      setDisplay(String(result))
      setPrev(String(result))
    } else {
      setPrev(display)
    }
    setOp(nextOp)
    setWaitingNext(true)
  }

  function calculate(a: number, b: number, operation: string): number {
    switch (operation) {
      case '+': return a + b
      case '-': return a - b
      case '×': return a * b
      case '÷': return b === 0 ? 0 : a / b
      default: return b
    }
  }

  function equals() {
    if (!op || !prev) return
    const result = calculate(parseFloat(prev), parseFloat(display), op)
    const formatted = parseFloat(result.toFixed(10)).toString()
    setDisplay(formatted)
    setPrev('')
    setOp('')
    setWaitingNext(true)
  }

  function clear() {
    setDisplay('0')
    setPrev('')
    setOp('')
    setWaitingNext(false)
  }

  function backspace() {
    if (waitingNext) return
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0')
  }

  function toggleSign() {
    setDisplay(String(parseFloat(display) * -1))
  }

  function percent() {
    setDisplay(String(parseFloat(display) / 100))
  }

  const btnBase = 'flex items-center justify-center rounded-2xl text-xl font-semibold active:scale-95 transition-transform h-14'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-t-3xl p-4 pb-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-bold text-lg">🧮 क्याल्कुलेटर</p>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Display */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 text-right">
          <p className="text-gray-500 text-sm h-5">
            {prev ? `${prev} ${op}` : ''}
          </p>
          <p className="text-white text-4xl font-bold mt-1 truncate">
            {parseFloat(display).toLocaleString('ne-NP', { maximumFractionDigits: 10 })}
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button onClick={clear} className={`${btnBase} bg-red-500/20 text-red-400`}>AC</button>
          <button onClick={toggleSign} className={`${btnBase} bg-white/10 text-gray-300`}>+/-</button>
          <button onClick={percent} className={`${btnBase} bg-white/10 text-gray-300`}>%</button>
          <button onClick={() => operator('÷')} className={`${btnBase} ${op === '÷' ? 'bg-orange-500 text-white' : 'bg-orange-600/30 text-orange-400'}`}>÷</button>

          {/* Row 2 */}
          {['7','8','9'].map(n => (
            <button key={n} onClick={() => input(n)} className={`${btnBase} bg-white/5 text-white`}>{n}</button>
          ))}
          <button onClick={() => operator('×')} className={`${btnBase} ${op === '×' ? 'bg-orange-500 text-white' : 'bg-orange-600/30 text-orange-400'}`}>×</button>

          {/* Row 3 */}
          {['4','5','6'].map(n => (
            <button key={n} onClick={() => input(n)} className={`${btnBase} bg-white/5 text-white`}>{n}</button>
          ))}
          <button onClick={() => operator('-')} className={`${btnBase} ${op === '-' ? 'bg-orange-500 text-white' : 'bg-orange-600/30 text-orange-400'}`}>−</button>

          {/* Row 4 */}
          {['1','2','3'].map(n => (
            <button key={n} onClick={() => input(n)} className={`${btnBase} bg-white/5 text-white`}>{n}</button>
          ))}
          <button onClick={() => operator('+')} className={`${btnBase} ${op === '+' ? 'bg-orange-500 text-white' : 'bg-orange-600/30 text-orange-400'}`}>+</button>

          {/* Row 5 */}
          <button onClick={() => input('0')} className={`${btnBase} bg-white/5 text-white col-span-2`}>0</button>
          <button onClick={() => input('.')} className={`${btnBase} bg-white/5 text-white`}>.</button>
          <button onClick={equals} className={`${btnBase} bg-gradient-to-br from-orange-600 to-red-600 text-white`}>=</button>
        </div>

        {/* Backspace */}
        <button
          onClick={backspace}
          className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 text-gray-400 active:scale-95 transition-transform"
        >
          <Delete size={18} /> मेट्नुहोस्
        </button>
      </div>
    </div>
  )
}
