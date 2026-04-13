'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

export type TimeRangePreset = 'today' | 'yesterday' | 'past7days' | 'past30days' | 'custom'

export interface DateRange {
  startDate: Date
  endDate: Date
}

interface TimeRangeSelectorProps {
  value: TimeRangePreset
  onChange: (value: TimeRangePreset) => void
  onCustomRangeChange?: (range: DateRange) => void
  showCompare?: boolean
  onCompareChange?: (enabled: boolean) => void
  customStartDate?: Date
  customEndDate?: Date
}

const presets: { value: TimeRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'past7days', label: 'Past 7 Days' },
  { value: 'past30days', label: 'Past 30 Days' },
]

export function TimeRangeSelector({
  value,
  onChange,
  onCustomRangeChange,
  showCompare = false,
  onCompareChange,
  customStartDate,
  customEndDate,
}: TimeRangeSelectorProps) {
  const [compareEnabled, setCompareEnabled] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(customStartDate)
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(customEndDate)

  const handlePresetClick = (preset: TimeRangePreset) => {
    onChange(preset)
    if (preset !== 'custom') {
      setTempStartDate(undefined)
      setTempEndDate(undefined)
    }
  }

  const handleCustomRangeApply = () => {
    if (tempStartDate && tempEndDate) {
      onCustomRangeChange?.({
        startDate: tempStartDate,
        endDate: tempEndDate,
      })
      onChange('custom')
      setCalendarOpen(false)
    }
  }

  const handleCompareChange = (checked: boolean) => {
    setCompareEnabled(checked)
    onCompareChange?.(checked)
  }

  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            variant={value === preset.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetClick(preset.value)}
            className={cn(
              value === preset.value && 'bg-accent text-accent-foreground'
            )}
          >
            {preset.label}
          </Button>
        ))}

        {/* Custom Range Button */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={value === 'custom' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                value === 'custom' && 'bg-accent text-accent-foreground'
              )}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {value === 'custom' && customStartDate && customEndDate
                ? `${format(customStartDate, 'MMM dd')} - ${format(customEndDate, 'MMM dd')}`
                : 'Custom Range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Start Date</p>
                <Calendar
                  mode="single"
                  selected={tempStartDate}
                  onSelect={setTempStartDate}
                  initialFocus
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">End Date</p>
                <Calendar
                  mode="single"
                  selected={tempEndDate}
                  onSelect={setTempEndDate}
                  initialFocus
                  disabled={(date) => tempStartDate ? date < tempStartDate : false}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCustomRangeApply}
                  disabled={!tempStartDate || !tempEndDate}
                  className="flex-1"
                >
                  Apply Range
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCalendarOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Compare Toggle */}
      {showCompare && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="compare"
            checked={compareEnabled}
            onCheckedChange={handleCompareChange}
          />
          <label
            htmlFor="compare"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Compare to previous period
          </label>
        </div>
      )}
    </div>
  )
}
