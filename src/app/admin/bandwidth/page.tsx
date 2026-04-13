import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { BandwidthOverview } from '@/components/admin/BandwidthOverview'
import { BandwidthChart } from '@/components/admin/BandwidthChart'
import { BandwidthAlerts } from '@/components/admin/BandwidthAlerts'
import { checkBandwidthAlerts } from '@/lib/bandwidth-alerts'
import { subDays } from 'date-fns'

interface BandwidthPageProps {
  searchParams: { startDate?: string; endDate?: string; compare?: string }
}

export default async function BandwidthPage({ searchParams }: BandwidthPageProps) {
  // Check admin authorization
  const authCheck = await requireAdmin({} as any)

  if (!authCheck.authorized) {
    if (authCheck.error?.includes('Unauthorized')) {
      redirect('/login?redirect=/admin/bandwidth')
    }
    redirect('/403')
  }

  // Parse date range params (default: past 30 days)
  const endDate = searchParams.endDate ? new Date(searchParams.endDate) : new Date()
  const startDate = searchParams.startDate
    ? new Date(searchParams.startDate)
    : subDays(endDate, 30)
  const includeComparison = searchParams.compare === 'true'

  // Fetch bandwidth data from API
  let bandwidthData
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...(includeComparison && { compare: 'true' })
    })

    const response = await fetch(`${baseUrl}/api/admin/bandwidth?${params}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch bandwidth data')
    }

    bandwidthData = await response.json()
  } catch (error) {
    console.error('Failed to fetch bandwidth data:', error)
    bandwidthData = {
      summary: {
        totalBytesRelayed: 0,
        totalBytesDirect: 0,
        totalCost: 0,
        relayVsDirectRatio: 0,
        totalGB: 0
      },
      daily: [],
      roomBreakdown: []
    }
  }

  // Check for bandwidth alerts
  const alerts = await checkBandwidthAlerts()

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bandwidth Monitoring</h1>
        <p className="text-gray-600 mt-2">
          Monitor TURN bandwidth usage, costs, and capacity utilization
        </p>
      </div>

      {/* Bandwidth Overview */}
      <BandwidthOverview
        summary={bandwidthData.summary}
        trends={bandwidthData.trends}
      />

      {/* Bandwidth Chart */}
      <BandwidthChart data={bandwidthData.daily} />

      {/* Bandwidth Alerts */}
      <BandwidthAlerts alerts={alerts} />

      {/* Room Breakdown */}
      {bandwidthData.roomBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Top Bandwidth Consumers</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Room ID</th>
                  <th className="text-right py-3 px-4">Relay GB</th>
                  <th className="text-right py-3 px-4">Direct GB</th>
                  <th className="text-right py-3 px-4">Cost</th>
                  <th className="text-right py-3 px-4">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {bandwidthData.roomBreakdown.map((room: any, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 px-4 font-mono text-sm">{room.roomId.slice(0, 12)}...</td>
                    <td className="text-right py-3 px-4">
                      {(room.bytesRelayed / (1024 ** 3)).toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {(room.bytesDirect / (1024 ** 3)).toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">${room.cost.toFixed(2)}</td>
                    <td className="text-right py-3 px-4">{room.sessionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
