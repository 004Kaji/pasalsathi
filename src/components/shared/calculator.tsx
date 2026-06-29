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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-white border border-[#D5CFC6] rounded-t-3xl p-4 pb-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-[#D5CFC6] rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[#1C1917] font-bold text-lg">🧮 क्याल्कुलेटर</p>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#EDE8DF] text-[#6B6560]">
            <X size={18} />
          </button>
        </div>

        {/* Display */}
        <div className="bg-[#F5F0E8] border border-[#D5CFC6] rounded-2xl p-4 mb-4 text-right">
          <p className="text-[#9B948E] text-sm h-5">
            {prev ? `${prev} ${op}` : ''}
          </p>
          <p className="text-[#1C1917] text-4xl font-bold mt-1 truncate">
            {parseFloat(display).toLocaleString('ne-NP', { maximumFractionDigits: 10 })}
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button onClick={clear} className={`${btnBase} bg-red-500/15 text-red-500`}>AC</button>
          <button onClick={toggleSign} className={`${btnBase} bg-[#EDE8DF] text-[#6B6560]`}>+/-</button>
          <button onClick={percent} className={`${btnBase} bg-[#EDE8DF] text-[#6B6560]`}>%</button>
          <button onClick={() => operator('÷')} className={`${btnBase} ${op === '÷' ? 'bg-[#C84B2F] text-white' : 'bg-[#C84B2F]/15 text-[#C84B2F]'}`}>÷</button>

          {/* Row 2 */}
          {['7','8','9'].map(n => (
            <button key={n} onClick={() => input(n)} className={`${btnBase} bg-[#EDE8DF] text-[#1C1917]`}>{n}</button>
          ))}
          <button onClick={() => operator('×')} className={`${btnBase} ${op === '×' ? 'bg-[#C84B2F] text-white' : 'bg-[#C84B2F]/15 text-[#C84B2F]'}`}>×</button>

          {/* Row 3 */}
          {['4','5','6'].map(n => (
            <button key={n} onClick={() => input(n)} className={`${btnBase} bg-[#EDE8DF] text-[#1C1917]`}>{n}</button>
          ))}
          <button onClick={() => operator('-')} className={`${btnBase} ${op === '-' ? 'bg-[#C84B2F] text-white' : 'bg-[#C84B2F]/15 text-[#C84B2F]'}`}>−</button>

          {/* Row 4 */}
          {['1','2','3'].map(n => (
            <button key={n} onClick={() => input(n)} className={`${btnBase} bg-[#EDE8DF] text-[#1C1917]`}>{n}</button>
          ))}
          <button onClick={() => operator('+')} className={`${btnBase} ${op === '+' ? 'bg-[#C84B2F] text-white' : 'bg-[#C84B2F]/15 text-[#C84B2F]'}`}>+</button>

          {/* Row 5 */}
          <button onClick={() => input('0')} className={`${btnBase} bg-[#EDE8DF] text-[#1C1917] col-span-2`}>0</button>
          <button onClick={() => input('.')} className={`${btnBase} bg-[#EDE8DF] text-[#1C1917]`}>.</button>
          <button onClick={equals} className={`${btnBase} bg-[#C84B2F] text-white`}>=</button>
        </div>

        {/* Backspace */}
        <button
          onClick={backspace}
          className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#EDE8DF] text-[#6B6560] active:scale-95 transition-transform"
        >
          <Delete size={18} /> मेट्नुहोस्
        </button>
      </div>
    </div>
  )
}
