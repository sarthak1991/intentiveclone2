"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StreakBadge } from './StreakBadge'

export interface Stats {
  totalSessions: number
  completedTasks: number
  completionRate: number
  currentStreak: number
  longestStreak: number
}

export interface AttendanceStatsProps {
  userId: string
}

/**
 * Displays user's attendance statistics with minimal design.
 * Shows 5 key metrics: total sessions, tasks completed, completion rate, current streak, longest streak
 */
export function AttendanceStats({ userId }: AttendanceStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/stats')
        const data = await response.json()

        if (data.success) {
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [userId])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const statsData = [
    { label: 'Sessions Attended', value: stats.totalSessions, icon: '📅' },
    { label: 'Tasks Completed', value: stats.completedTasks, icon: '✅' },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: '📊',
    },
    { label: 'Current Streak', value: `${stats.currentStreak} days`, icon: '🔥' },
    { label: 'Longest Streak', value: `${stats.longestStreak} days`, icon: '🏆' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsData.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center p-4 bg-muted/50 rounded-lg"
            >
              <span className="text-2xl mb-1">{stat.icon}</span>
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Streak badge integration */}
        <div className="mt-4 flex justify-center">
          <StreakBadge variant="card" userId={userId} />
        </div>
      </CardContent>
    </Card>
  )
}
