'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BandwidthAlert {
  type: 'warning' | 'critical' | 'cost'
  message: string
  current: number
  threshold: number
  timestamp: Date
}

interface BandwidthAlertsProps {
  alerts: BandwidthAlert[]
}

export function BandwidthAlerts({ alerts }: BandwidthAlertsProps) {
  const [showConfig, setShowConfig] = useState(false)

  // Get alert styling
  const getAlertStyle = (type: BandwidthAlert['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'cost':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  // Get alert badge color
  const getBadgeColor = (type: BandwidthAlert['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'cost':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get alert icon
  const getAlertIcon = (type: BandwidthAlert['type']) => {
    switch (type) {
      case 'warning':
        return '⚠️'
      case 'critical':
        return '🚨'
      case 'cost':
        return '💰'
      default:
        return 'ℹ️'
    }
  }

  // Threshold values (from env vars, read-only display)
  const thresholds = {
    warning: process.env.NEXT_PUBLIC_BANDWIDTH_WARNING_THRESHOLD || 80,
    critical: process.env.NEXT_PUBLIC_BANDWIDTH_CRITICAL_THRESHOLD || 90,
    cost: process.env.NEXT_PUBLIC_BANDWIDTH_COST_THRESHOLD || 5.00,
    quota: process.env.NEXT_PUBLIC_BANDWIDTH_MONTHLY_QUOTA_GB || 1000
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-500">
            <span className="text-4xl mr-3">✅</span>
            <p>No active bandwidth alerts</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Bandwidth Alerts</CardTitle>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {showConfig ? 'Hide' : 'Configure'}
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Alerts */}
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getAlertStyle(alert.type)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getBadgeColor(alert.type)}`}>
                      {alert.type.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium">{alert.message}</span>
                  </div>
                  <div className="text-sm opacity-75">
                    Current: {alert.current.toFixed(1)}% / Threshold: {alert.threshold}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Configuration Display */}
        {showConfig && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium mb-3">Alert Thresholds</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Warning Threshold:</span>
                <span className="font-medium">{thresholds.warning}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Critical Threshold:</span>
                <span className="font-medium">{thresholds.critical}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cost Alert Threshold:</span>
                <span className="font-medium">${thresholds.cost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Quota:</span>
                <span className="font-medium">{thresholds.quota} GB</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Thresholds configured via environment variables. Changes require server restart.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
