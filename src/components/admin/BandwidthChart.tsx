'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

interface BandwidthChartProps {
  data: Array<{
    date: string
    bytesRelayed: number
    bytesDirect: number
    cost: number
  }>
  height?: number
}

export function BandwidthChart({ data, height = 200 }: BandwidthChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bandwidth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-gray-500">
            <p>No data available for selected period</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Convert bytes to GB
  const dataInGB = data.map(d => ({
    ...d,
    relayedGB: d.bytesRelayed / (1024 ** 3),
    directGB: d.bytesDirect / (1024 ** 3)
  }))

  // Find max value for Y-axis scaling
  const maxValue = Math.max(
    ...dataInGB.map(d => Math.max(d.relayedGB, d.directGB))
  )

  // Chart dimensions
  const width = '100%'
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartHeight = height - padding.top - padding.bottom
  const chartWidth = 800 - padding.left - padding.right

  // Scales
  const xScale = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth
  const yScale = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight

  // Generate path commands
  const relayPath = dataInGB.map((d, i) => {
    const x = xScale(i)
    const y = yScale(d.relayedGB)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  const directPath = dataInGB.map((d, i) => {
    const x = xScale(i)
    const y = yScale(d.directGB)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const hoveredData = hoveredIndex !== null ? dataInGB[hoveredIndex] : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bandwidth Trend (30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height: `${height}px` }}>
          {/* Legend */}
          <div className="flex gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">Relayed (TURN)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600">Direct (P2P)</span>
            </div>
          </div>

          {/* SVG Chart */}
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 800 ${height}`}
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = yScale(maxValue * ratio)
              return (
                <line
                  key={ratio}
                  x1={padding.left}
                  y1={y}
                  x2={800 - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="4"
                />
              )
            })}

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = yScale(maxValue * ratio)
              const value = (maxValue * ratio).toFixed(2)
              return (
                <text
                  key={ratio}
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {value} GB
                </text>
              )
            })}

            {/* X-axis labels (show first, middle, last) */}
            <text
              x={xScale(0)}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {formatDate(dataInGB[0].date)}
            </text>
            <text
              x={xScale(Math.floor(data.length / 2))}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {formatDate(dataInGB[Math.floor(data.length / 2)].date)}
            </text>
            <text
              x={xScale(data.length - 1)}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {formatDate(dataInGB[data.length - 1].date)}
            </text>

            {/* Direct line */}
            <path
              d={directPath}
              fill="none"
              stroke="#22c55e"
              strokeWidth={2}
            />

            {/* Relay line */}
            <path
              d={relayPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth={2}
            />

            {/* Data points and hover areas */}
            {dataInGB.map((d, i) => (
              <g key={i}>
                {/* Invisible hover area */}
                <rect
                  x={xScale(i) - 5}
                  y={padding.top}
                  width={10}
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {/* Direct point */}
                <circle
                  cx={xScale(i)}
                  cy={yScale(d.directGB)}
                  r={hoveredIndex === i ? 6 : 3}
                  fill="#22c55e"
                  className="transition-all"
                />
                {/* Relay point */}
                <circle
                  cx={xScale(i)}
                  cy={yScale(d.relayedGB)}
                  r={hoveredIndex === i ? 6 : 3}
                  fill="#ef4444"
                  className="transition-all"
                />
              </g>
            ))}
          </svg>

          {/* Tooltip */}
          {hoveredData && (
            <div
              className="absolute bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm z-10"
              style={{
                left: `${(hoveredIndex / (data.length - 1)) * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="font-medium mb-2">{formatDate(hoveredData.date)}</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Relay: {hoveredData.relayedGB.toFixed(2)} GB</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Direct: {hoveredData.directGB.toFixed(2)} GB</span>
                </div>
                <div className="border-t pt-1 mt-1">
                  <span>Cost: ${hoveredData.cost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
