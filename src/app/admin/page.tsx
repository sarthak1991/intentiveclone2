import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { getOverviewStats, getDateRange } from '@/lib/analytics'
import { DashboardCard } from '@/components/admin/DashboardCard'
import { Users, Calendar, Clock, Activity, DollarSign, UserCheck } from 'lucide-react'

export default async function AdminOverviewPage() {
  // Check admin authorization
  const authCheck = await requireAdmin({} as any)

  if (!authCheck.authorized) {
    // Redirect to login if not authenticated, or show 403 if forbidden
    if (authCheck.error?.includes('Unauthorized')) {
      redirect('/login?redirect=/admin')
    }
    redirect('/403')
  }

  // Fetch overview stats for past 7 days (default)
  const dateRange = getDateRange('past7Days')
  const stats = await getOverviewStats(dateRange)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive platform metrics and analytics
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Sessions */}
        <DashboardCard
          title="Total Sessions"
          value={stats.totalSessions}
          trend={stats.trends.sessionsTrend}
          trendLabel="vs previous 7 days"
          icon={<Calendar className="h-5 w-5" />}
        />

        {/* Attendance Rate */}
        <DashboardCard
          title="Attendance Rate"
          value={stats.attendanceRate}
          unit="%"
          trend={stats.trends.attendanceTrend}
          trendLabel="vs previous 7 days"
          icon={<UserCheck className="h-5 w-5" />}
        />

        {/* Active Users */}
        <DashboardCard
          title="Active Users"
          value={stats.activeUsers}
          trend={stats.trends.activeUsersTrend}
          trendLabel="vs previous 7 days"
          icon={<Users className="h-5 w-5" />}
        />

        {/* Bandwidth Used */}
        <DashboardCard
          title="Bandwidth Used"
          value={stats.bandwidthUsed}
          unit=" GB"
          trendLabel="Past 7 days"
          icon={<Activity className="h-5 w-5" />}
        />

        {/* No-Show Rate */}
        <DashboardCard
          title="No-Show Rate"
          value={stats.noShowRate}
          unit="%"
          trendLabel="Past 7 days"
          icon={<Clock className="h-5 w-5" />}
        />

        {/* Captain Coverage */}
        <DashboardCard
          title="Captain Coverage"
          value={stats.captainCoverage}
          unit="%"
          trendLabel="Of completed sessions"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Empty State Message */}
      {stats.totalSessions === 0 && (
        <div className="bg-white p-8 rounded-lg border text-center">
          <p className="text-gray-500">No data available for the selected time period.</p>
          <p className="text-sm text-gray-400 mt-2">
            Sessions will appear here once rooms are created and completed.
          </p>
        </div>
      )}

      {/* Additional Info */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Time Range: Past 7 Days</h3>
        <p className="text-sm text-blue-800">
          Showing metrics for the past 7 days. Trends are calculated by comparing this period to the previous 7-day period.
        </p>
      </div>
    </div>
  )
}
