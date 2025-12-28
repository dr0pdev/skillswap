import React from 'react'
import TimeDateSelector from './TimeDateSelector'

/**
 * Enhanced Hours Allocation Form
 * Now uses the advanced TimeDateSelector component for better UX
 */
export default function HoursAllocationForm({
  teacherCapacity,
  learnerCapacity,
  onHoursChange,
  onPreferencesChange,
  initialHours = 1,
  initialPreferences = {},
  compact = false
}) {
  const maxAvailable = Math.min(
    teacherCapacity?.remainingHours || Infinity,
    learnerCapacity?.remainingHours || Infinity
  )

  const handleHoursChange = (hours) => {
    if (onHoursChange) onHoursChange(hours)
  }

  const handlePreferencesChange = (prefs) => {
    if (onPreferencesChange) {
      onPreferencesChange({
        days: prefs.days || [],
        times: prefs.times || []
      })
    }
  }

  // Convert old format to new format
  const days = Array.isArray(initialPreferences.days) 
    ? initialPreferences.days 
    : (initialPreferences.days ? [initialPreferences.days] : [])
  
  const times = Array.isArray(initialPreferences.times) 
    ? initialPreferences.times 
    : (initialPreferences.time ? [initialPreferences.time] : [])

  return (
    <div className="card-glass p-4">
      <TimeDateSelector
        initialHours={initialHours}
        maxHours={maxAvailable === Infinity ? 10 : maxAvailable}
        initialDays={days}
        initialTimes={times}
        onHoursChange={handleHoursChange}
        onDaysChange={(newDays) => handlePreferencesChange({ days: newDays, times })}
        onTimesChange={(newTimes) => handlePreferencesChange({ days, times: newTimes })}
        showSpecificDates={false}
        compact={compact}
      />
    </div>
  )
}
