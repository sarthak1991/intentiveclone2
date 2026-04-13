import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  value: string | number
  trend?: number  // Percentage change, positive/negative
  trendLabel?: string  // e.g., "vs yesterday", "vs 7-day avg"
  unit?: string  // e.g., "%", "GB", "sessions"
  icon?: React.ReactNode
}

export function DashboardCard({
  title,
  value,
  trend,
  trendLabel,
  unit,
  icon
}: DashboardCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return null
    return trend > 0 ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    )
  }

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-gray-500'
    return trend > 0 ? 'text-green-600' : 'text-red-600'
  }

  const formatValue = () => {
    if (typeof value === 'number' && unit) {
      return `${value}${unit}`
    }
    return value.toString()
  }

  const formatTrend = () => {
    if (trend === undefined) return null
    const sign = trend > 0 ? '+' : ''
    return `${sign}${trend}%`
  }

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-1">
          {formatValue()}
        </div>
        {(trend !== undefined || trendLabel) && (
          <div className={cn('text-sm flex items-center gap-1', getTrendColor())}>
            {getTrendIcon()}
            {formatTrend() && <span>{formatTrend()}</span>}
            {trendLabel && <span className="text-gray-500"> {trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
