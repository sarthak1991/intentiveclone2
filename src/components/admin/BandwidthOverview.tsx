'use client'

import { DashboardCard } from './DashboardCard'
import { Activity, TrendingUp, TrendingDown, DollarSign, Database } from 'lucide-react'

interface BandwidthOverviewProps {
  summary: {
    totalBytesRelayed: number
    totalBytesDirect: number
    totalCost: number
    relayVsDirectRatio: number
    totalGB: number
  }
  trends?: {
    costChange: number
    usageChange: number
  }
}

export function BandwidthOverview({ summary, trends }: BandwidthOverviewProps) {
  // Format bytes to GB
  const bytesToGB = (bytes: number) => (bytes / (1024 ** 3)).toFixed(2)

  // Get trend indicator
  const getTrendIndicator = (value?: number) => {
    if (value === undefined) return null
    if (value > 0) return { icon: TrendingUp, color: 'text-red-600', label: '+' }
    if (value < 0) return { icon: TrendingDown, color: 'text-green-600', label: '' }
    return { icon: null, color: 'text-gray-500', label: '0' }
  }

  // Determine relay ratio color
  const getRatioColor = (ratio: number) => {
    if (ratio < 0.3) return 'text-green-600'
    if (ratio < 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const costTrend = getTrendIndicator(trends?.costChange)
  const usageTrend = getTrendIndicator(trends?.usageChange)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Bandwidth */}
      <DashboardCard
        title="Total Bandwidth"
        value={`${bytesToGB(summary.totalBytesRelayed + summary.totalBytesDirect)} GB`}
        trend={trends?.usageChange}
        trendLabel="vs previous period"
        icon={<Database className="h-5 w-5" />}
      />

      {/* Relay vs Direct Ratio */}
      <DashboardCard
        title="Relay vs Direct Ratio"
        value={`${(summary.relayVsDirectRatio * 100).toFixed(1)}%`}
        unit="relayed"
        trend={trends?.usageChange}
        trendLabel="vs previous period"
        icon={<Activity className="h-5 w-5" />}
        valueClassName={getRatioColor(summary.relayVsDirectRatio)}
      />

      {/* Estimated Cost */}
      <DashboardCard
        title="Estimated Cost"
        value={`$${summary.totalCost.toFixed(2)}`}
        trend={trends?.costChange}
        trendLabel="vs previous period"
        icon={<DollarSign className="h-5 w-5" />}
      />

      {/* Daily Average */}
      <DashboardCard
        title="Daily Average"
        value={`${bytesToGB((summary.totalBytesRelayed + summary.totalBytesDirect) / 30)} GB`}
        trendLabel="based on 30-day period"
        icon={<Activity className="h-5 w-5" />}
      />
    </div>
  )
}
