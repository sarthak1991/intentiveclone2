'use client'

import { DashboardCard } from '@/components/admin/DashboardCard'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AttendanceStats {
  totalSessions: number
  completedSessions: number
  cancelledSessions: number
  totalRegistrations: number
  attendedCount: number
  noShowCount: number
  attendanceRate: number
  noShowRate: number
  avgCapacity: number
  peakHours: { hour: number; count: number }[]
}

interface AttendanceMetricsProps {
  stats: AttendanceStats
  previousStats?: AttendanceStats
  showComparison: boolean
}

interface MetricChange {
  value: number
  previousValue: number
  trend?: number
}

function calculateChange(current: number, previous?: number): MetricChange {
  if (previous === undefined) {
    return { value: current, previousValue: 0 }
  }

  const trend = previous > 0 ? ((current - previous) / previous) * 100 : 0
  return { value: current, previousValue: previous, trend }
}

function TrendIndicator({ trend }: { trend?: number }) {
  if (trend === undefined || trend === 0) {
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  const Icon = trend > 0 ? TrendingUp : TrendingDown
  const colorClass = trend > 0 ? 'text-green-600' : 'text-red-600'

  return <Icon className={cn('h-3 w-3', colorClass)} />
}

function formatChange(trend?: number): string {
  if (trend === undefined) return ''
  const sign = trend > 0 ? '+' : ''
  return `${sign}${trend.toFixed(1)}%`
}

export function AttendanceMetrics({
  stats,
  previousStats,
  showComparison,
}: AttendanceMetricsProps) {
  const totalSessionsChange = calculateChange(stats.totalSessions, previousStats?.totalSessions)
  const completedSessionsChange = calculateChange(stats.completedSessions, previousStats?.completedSessions)
  const cancelledSessionsChange = calculateChange(stats.cancelledSessions, previousStats?.cancelledSessions)
  const totalRegistrationsChange = calculateChange(stats.totalRegistrations, previousStats?.totalRegistrations)
  const attendedCountChange = calculateChange(stats.attendedCount, previousStats?.attendedCount)
  const noShowCountChange = calculateChange(stats.noShowCount, previousStats?.noShowCount)
  const attendanceRateChange = calculateChange(stats.attendanceRate, previousStats?.attendanceRate)
  const noShowRateChange = calculateChange(stats.noShowRate, previousStats?.noShowRate)
  const avgCapacityChange = calculateChange(stats.avgCapacity, previousStats?.avgCapacity)

  const maxCapacity = 12 // Per project requirements
  const capacityUtilization = (stats.avgCapacity / maxCapacity) * 100

  return (
    <div className="space-y-6">
      {/* Session Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Total Sessions"
          value={stats.totalSessions}
          trend={showComparison ? totalSessionsChange.trend : undefined}
          trendLabel={showComparison ? 'vs previous period' : undefined}
        />
        <DashboardCard
          title="Completed Sessions"
          value={stats.completedSessions}
          trend={showComparison ? completedSessionsChange.trend : undefined}
          trendLabel={showComparison ? 'vs previous period' : undefined}
        />
        <DashboardCard
          title="Cancelled Sessions"
          value={stats.cancelledSessions}
          trend={showComparison ? cancelledSessionsChange.trend : undefined}
          trendLabel={showComparison ? 'vs previous period' : undefined}
        />
      </div>

      {/* Registration Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Total Registrations"
          value={stats.totalRegistrations}
          trend={showComparison ? totalRegistrationsChange.trend : undefined}
          trendLabel={showComparison ? 'vs previous period' : undefined}
        />
        <DashboardCard
          title="Attended"
          value={stats.attendedCount}
          trend={showComparison ? attendedCountChange.trend : undefined}
          trendLabel={showComparison ? 'vs previous period' : undefined}
        />
        <DashboardCard
          title="No-Shows"
          value={stats.noShowCount}
          trend={showComparison ? noShowCountChange.trend : undefined}
          trendLabel={showComparison ? 'vs previous period' : undefined}
        />
      </div>

      {/* Rate Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Attendance Rate"
          value={stats.attendanceRate.toFixed(1)}
          unit="%"
          trend={showComparison ? attendanceRateChange.trend : undefined}
          trendLabel={showComparison ? 'vs previous period' : undefined}
        />
        <DashboardCard
          title="No-Show Rate"
          value={stats.noShowRate.toFixed(1)}
          unit="%"
          trend={showComparison ? noShowRateChange.trend : undefined}
          trendLabel={showComparison ? 'vs previous period' : undefined}
        />
        <DashboardCard
          title="Avg Capacity"
          value={stats.avgCapacity.toFixed(1)}
          unit={` / ${maxCapacity}`}
          trend={showComparison ? avgCapacityChange.trend : undefined}
          trendLabel={showComparison ? 'vs previous period' : undefined}
        />
      </div>

      {/* Capacity Utilization */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base font-medium">Capacity Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average Fill Rate</span>
              <span className="font-medium">{capacityUtilization.toFixed(1)}%</span>
            </div>
            <Progress value={capacityUtilization} className="h-2" />
            <p className="text-xs text-gray-500">
              Based on average of {stats.avgCapacity.toFixed(1)} participants per session (max: {maxCapacity})
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Peak Hours */}
      {stats.peakHours && stats.peakHours.length > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base font-medium">Peak Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.peakHours.slice(0, 5).map((peak, index) => {
                const maxCount = stats.peakHours[0].count
                const percentage = (peak.count / maxCount) * 100

                return (
                  <div key={peak.hour} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {peak.hour}:00 - {peak.hour + 1}:00
                      </span>
                      <span className="font-medium">{peak.count} sessions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Summary */}
      {showComparison && previousStats && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <TrendIndicator />
              <span className="font-medium">Comparison View</span>
            </div>
            <p className="text-sm text-blue-800 mt-2">
              Showing changes compared to the previous period of equal length.
              Positive trends (green) indicate improvement, negative trends (red) indicate decline.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
