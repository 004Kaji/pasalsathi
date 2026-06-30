'use client'

import { useRef, useState } from 'react'
import { X, Printer, Download } from 'lucide-react'
import { formatBSFull } from '@/lib/utils/date'
import type { SaleResult } from '@/lib/types/app'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', khata: 'Khata', esewa: 'eSewa', khalti: 'Khalti', fonepay: 'FonePay',
}

interface Props {
  result:          SaleResult
  businessName:    string
  businessPhone:   string | null
  businessAddress: string | null
  onClose:         () => void
}

export default function InvoiceSheet({ result, businessName, businessPhone, businessAddress, onClose }: Props) {
  const { total, subtotalBeforeVat, vatAmount, vatNumber, items, discountPercent, discountType, paymentMethod, customer, splitMethod, splitAmount } = result
  const fmt     = (n: number) => `NPR ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  const today   = formatBSFull(new Date())
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [sharing,     setSharing]     = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function buildPdf() {
    const { jsPDF } = await import('jspdf')
    const doc   = new jsPDF({ unit: 'mm', format: 'a4' })
    const W     = 210
    const pad   = 20
    let   y     = 20

    const centerText = (text: string, size: number, bold = false) => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.text(text, W / 2, y, { align: 'center' })
      y += size * 0.45
    }

    const row = (left: string, right: string, size = 10, bold = false) => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.text(left,  pad, y)
      doc.text(right, W - pad, y, { align: 'right' })
      y += size * 0.45
    }

    // Business header
    centerText(businessName, 16, true);             y += 2
    if (businessAddress) { centerText(businessAddress, 9); y += 1 }
    if (businessPhone)   { centerText(businessPhone,   9); y += 1 }
    if (vatNumber)       { centerText(`VAT No: ${vatNumber}`, 9, true); y += 1 }

    // Divider
    y += 3
    doc.setDrawColor(180, 173, 166)
    doc.line(pad, y, W - pad, y)
    y += 6

    // Meta
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 113, 108)
    doc.text('Date', pad, y)
    doc.text('Payment', W - pad, y, { align: 'right' })
    y += 5
    doc.setTextColor(28, 25, 23); doc.setFont('helvetica', 'bold')
    doc.text(today, pad, y)
    doc.text(METHOD_LABELS[paymentMethod] ?? paymentMethod, W - pad, y, { align: 'right' })
    y += 8

    // Customer
    if (customer) {
      doc.setFillColor(245, 240, 232)
      doc.roundedRect(pad, y - 4, W - pad * 2, 12, 2, 2, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 113, 108)
      doc.text('Customer', pad + 3, y)
      y += 5
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(28, 25, 23)
      doc.text(customer.name, pad + 3, y)
      y += 9
    }

    // Items table header
    doc.setFillColor(245, 240, 232)
    doc.rect(pad, y - 4, W - pad * 2, 8, 'F')
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(120, 113, 108)
    doc.text('ITEM',  pad + 2,       y)
    doc.text('QTY',   W / 2 - 10,   y, { align: 'center' })
    doc.text('RATE',  W - pad - 24,  y, { align: 'right' })
    doc.text('AMT',   W - pad,       y, { align: 'right' })
    y += 7

    // Items
    doc.setFont('helvetica', 'normal'); doc.setTextColor(28, 25, 23)
    for (const item of items) {
      doc.setFontSize(9)
      doc.text(item.name.slice(0, 30),                              pad + 2,      y)
      doc.text(String(item.qty),                                    W / 2 - 10,  y, { align: 'center' })
      doc.text(item.unitPrice.toLocaleString('en-IN'),              W - pad - 24, y, { align: 'right' })
      doc.text((item.qty * item.unitPrice).toLocaleString('en-IN'), W - pad,      y, { align: 'right' })
      y += 7
      doc.setDrawColor(220, 214, 206)
      doc.line(pad, y - 2, W - pad, y - 2)
    }

    y += 4
    doc.setDrawColor(180, 173, 166)
    doc.line(pad, y, W - pad, y)
    y += 6

    // Totals
    doc.setTextColor(28, 25, 23)
    if (discountPercent > 0) {
      const label = `Discount${discountType === 'percent' ? ` (${discountPercent}%)` : ''}`
      const val   = discountType === 'amount' ? `- ${fmt(discountPercent)}` : ''
      row(label, val, 9)
      y += 3
    }
    if (vatAmount > 0) {
      row('Subtotal', fmt(subtotalBeforeVat), 9); y += 3
      row('VAT 13%',  fmt(vatAmount),         9); y += 3
    }
    if (splitMethod && splitAmount) {
      const label = `${METHOD_LABELS[paymentMethod]} + ${METHOD_LABELS[splitMethod]}`
      row(label, `${fmt(total - splitAmount)} + ${fmt(splitAmount)}`, 8)
      y += 3
    }

    doc.line(pad, y, W - pad, y); y += 5
    row('Total', fmt(total), 13, true)
    y += 10

    // Footer
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 113, 108)
    doc.text('Thank you for your business! — PasalSathi', W / 2, y, { align: 'center' })

    return doc
  }

  async function handleSharePdf() {
    setSharing(true)
    try {
      const doc  = await buildPdf()
      const blob = doc.output('blob')
      const file = new File([blob], `invoice-${businessName}.pdf`, { type: 'application/pdf' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Invoice — ${businessName}` })
      }
    } catch (_) {}
    setSharing(false)
  }

  async function handleDownloadPdf() {
    setDownloading(true)
    try {
      const doc = await buildPdf()
      doc.save(`invoice-${businessName}-${Date.now()}.pdf`)
    } catch (_) {}
    setDownloading(false)
  }

  const canShare = typeof window !== 'undefined' && typeof navigator.share === 'function'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="w-full max-h-[92vh] bg-white rounded-t-3xl overflow-y-auto">

        {/* Header bar */}
        <div className="sticky top-0 bg-white border-b border-[#E0D9CE] px-5 py-4 flex items-center justify-between">
          <p className="font-bold text-[#1C1917]">Invoice</p>
          <div className="flex items-center gap-3">
            {canShare && (
              <button onClick={handleSharePdf} disabled={sharing}
                className="flex items-center gap-1.5 text-sm font-semibold text-green-700 active:opacity-70 disabled:opacity-40">
                <span className="text-base">💬</span> {sharing ? 'Preparing...' : 'WhatsApp'}
              </button>
            )}
            <button onClick={handleDownloadPdf} disabled={downloading}
              className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold active:opacity-70 disabled:opacity-40">
              <Download size={16} /> {downloading ? 'Saving...' : 'Download'}
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm text-[#6B6560] font-semibold active:opacity-70">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full bg-[#F5F0E8] active:bg-[#EDE8DF]">
              <X size={18} className="text-[#6B6560]" />
            </button>
          </div>
        </div>

        {/* Invoice body (preview) */}
        <div id="invoice-print" ref={invoiceRef} className="px-6 py-6 space-y-5 bg-white">

          {/* Business header */}
          <div className="text-center border-b border-dashed border-[#D5CFC6] pb-5">
            <p className="text-xl font-black text-[#1C1917]">{businessName}</p>
            {businessAddress && <p className="text-sm text-[#6B6560] mt-0.5">{businessAddress}</p>}
            {businessPhone && <p className="text-sm text-[#6B6560]">{businessPhone}</p>}
            {vatNumber && <p className="text-sm font-semibold text-[#1C1917] mt-1">VAT No: {vatNumber}</p>}
          </div>

          {/* Invoice meta */}
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-[#9B948E] text-xs">Date</p>
              <p className="font-semibold text-[#1C1917]">{today}</p>
            </div>
            <div className="text-right">
              <p className="text-[#9B948E] text-xs">Payment</p>
              <p className="font-semibold text-[#1C1917]">{METHOD_LABELS[paymentMethod]}</p>
            </div>
          </div>

          {customer && (
            <div className="bg-[#F5F0E8] rounded-xl px-4 py-3">
              <p className="text-xs text-[#9B948E]">Customer</p>
              <p className="font-semibold text-[#1C1917]">{customer.name}</p>
            </div>
          )}

          {/* Line items */}
          <div className="border border-[#D5CFC6] rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 text-xs font-bold text-[#9B948E] uppercase px-4 py-2 bg-[#F5F0E8] border-b border-[#D5CFC6]">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Rate</span>
              <span className="col-span-2 text-right">Amt</span>
            </div>
            {items.map(item => (
              <div key={item.id} className="grid grid-cols-12 text-sm px-4 py-3 border-b border-[#E0D9CE] last:border-0">
                <span className="col-span-6 font-medium text-[#1C1917] truncate">{item.name}</span>
                <span className="col-span-2 text-center text-[#6B6560]">{item.qty}</span>
                <span className="col-span-2 text-right text-[#6B6560]">{item.unitPrice.toLocaleString('en-IN')}</span>
                <span className="col-span-2 text-right font-semibold text-[#1C1917]">{(item.qty * item.unitPrice).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm border-t border-dashed border-[#D5CFC6] pt-4">
            {discountPercent > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Discount {discountType === 'percent' ? `(${discountPercent}%)` : ''}</span>
                <span>- {discountType === 'amount' ? fmt(discountPercent) : ''}</span>
              </div>
            )}
            {vatAmount > 0 && (
              <>
                <div className="flex justify-between text-[#6B6560]">
                  <span>Subtotal</span><span>{fmt(subtotalBeforeVat)}</span>
                </div>
                <div className="flex justify-between text-[#6B6560]">
                  <span>VAT 13%</span><span>{fmt(vatAmount)}</span>
                </div>
              </>
            )}
            {splitMethod && splitAmount && (
              <div className="flex justify-between text-purple-600 text-xs">
                <span>{METHOD_LABELS[paymentMethod]} + {METHOD_LABELS[splitMethod]}</span>
                <span>{fmt(total - splitAmount)} + {fmt(splitAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-lg text-[#1C1917] border-t border-[#D5CFC6] pt-2 mt-2">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-[#9B948E] pt-2">Thank you for your business! — PasalSathi</p>
        </div>
      </div>

      <style>{`@media print { body * { visibility: hidden; } #invoice-print, #invoice-print * { visibility: visible; } #invoice-print { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
    </div>
  )
}
