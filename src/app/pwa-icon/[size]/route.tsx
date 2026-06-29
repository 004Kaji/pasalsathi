import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params
  const sz = size === '512' ? 512 : 192
  const radius = Math.round(sz * 0.13)
  const iconSize = Math.round(sz * 0.52)

  return new ImageResponse(
    (
      <div
        style={{
          width: sz,
          height: sz,
          background: '#C84B2F',
          borderRadius: radius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Store icon in white */}
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l1-5h16l1 5" />
          <path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
          <path d="M5 9v11h14V9" />
          <path d="M9 21v-6h6v6" />
        </svg>
      </div>
    ),
    { width: sz, height: sz },
  )
}
