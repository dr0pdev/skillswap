import React, { useState, useEffect } from 'react'
import { CalendarIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline'

/**
 * Advanced Time & Date Selection Component
 * Allows users to select:
 * - Weekly hours commitment
 * - Preferred days (Weekdays/Weekends/Flexible)
 * - Preferred time windows (Morning/Afternoon/Evening/Flexible)
 * - Specific dates (optional, for scheduling)
 */
export default function TimeDateSelector({
  initialHours = 1,
  maxHours = 10,
  initialDays = [],
  initialTimes = [],
  initialDates = [],
  onHoursChange,
  onDaysChange,
  onTimesChange,
  onDatesChange,
  showSpecificDates = false, // Show calendar for specific date selection
  compact = false // Compact mode for smaller spaces
}) {
  const [hours, setHours] = useState(initialHours)
  const [selectedDays, setSelectedDays] = useState(initialDays)
  const [selectedTimes, setSelectedTimes] = useState(initialTimes)
  const [selectedDates, setSelectedDates] = useState(initialDates)
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    setHours(initialHours)
  }, [initialHours])

  useEffect(() => {
    setSelectedDays(initialDays)
  }, [initialDays])

  useEffect(() => {
    setSelectedTimes(initialTimes)
  }, [initialTimes])

  const dayOptions = [
    { value: 'weekdays', label: 'Weekdays', icon: '📅' },
    { value: 'weekends', label: 'Weekends', icon: '🎉' },
    { value: 'flexible', label: 'Flexible', icon: '✨' }
  ]

  const timeOptions = [
    { value: 'morning', label: 'Morning', time: '6am - 12pm', icon: '🌅' },
    { value: 'afternoon', label: 'Afternoon', time: '12pm - 6pm', icon: '☀️' },
    { value: 'evening', label: 'Evening', time: '6pm - 10pm', icon: '🌙' },
    { value: 'flexible', label: 'Flexible', time: 'Any time', icon: '⏰' }
  ]

  const handleHoursChange = (newHours) => {
    const clampedHours = Math.max(0.5, Math.min(newHours, maxHours))
    setHours(clampedHours)
    if (onHoursChange) onHoursChange(clampedHours)
  }

  const toggleDay = (day) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day]
    setSelectedDays(newDays)
    if (onDaysChange) onDaysChange(newDays)
  }

  const toggleTime = (time) => {
    const newTimes = selectedTimes.includes(time)
      ? selectedTimes.filter(t => t !== time)
      : [...selectedTimes, time]
    setSelectedTimes(newTimes)
    if (onTimesChange) onTimesChange(newTimes)
  }

  const handleDateSelect = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    const newDates = selectedDates.includes(dateStr)
      ? selectedDates.filter(d => d !== dateStr)
      : [...selectedDates, dateStr].sort()
    setSelectedDates(newDates)
    if (onDatesChange) onDatesChange(newDates)
  }

  const isFullyBooked = maxHours === 0
  const isLimited = maxHours > 0 && hours >= maxHours

  return (
    <div className={`space-y-4 ${compact ? 'text-sm' : ''}`}>
      {/* Hours Selection */}
      <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-dark-300 font-medium flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-primary-400" />
            Hours per Week
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleHoursChange(hours - 0.5)}
              disabled={hours <= 0.5 || isFullyBooked}
              className="btn-icon-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              value={hours}
              onChange={(e) => handleHoursChange(parseFloat(e.target.value) || 0)}
              min="0.5"
              max={maxHours}
              step="0.5"
              disabled={isFullyBooked}
              className="w-20 text-center bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50"
            />
            <button
              onClick={() => handleHoursChange(hours + 0.5)}
              disabled={hours >= maxHours || isFullyBooked}
              className="btn-icon-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hours Info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-dark-500">
            {isFullyBooked ? (
              <span className="text-error-400 font-medium">Fully Booked</span>
            ) : (
              <>
                Max available: <span className="font-semibold text-primary-400">{maxHours}h/week</span>
              </>
            )}
          </span>
          {isLimited && !isFullyBooked && (
            <span className="text-warning-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Using all capacity
            </span>
          )}
        </div>

        {/* Visual Hours Bar */}
        {!isFullyBooked && maxHours > 0 && (
          <div className="mt-3 w-full bg-dark-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(hours / maxHours) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Preferred Days */}
      <div>
        <label className="block text-dark-300 font-medium mb-2 text-sm">
          Preferred Days
        </label>
        <div className="flex flex-wrap gap-2">
          {dayOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleDay(option.value)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                ${selectedDays.includes(option.value)
                  ? 'bg-primary-600 text-white border-2 border-primary-500 shadow-lg scale-105'
                  : 'bg-dark-800 text-dark-300 border-2 border-dark-700 hover:border-dark-600 hover:bg-dark-750'
                }
              `}
            >
              <span>{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
        {selectedDays.length === 0 && (
          <p className="text-xs text-dark-500 mt-1">Select at least one option (or choose Flexible)</p>
        )}
      </div>

      {/* Preferred Times */}
      <div>
        <label className="block text-dark-300 font-medium mb-2 text-sm">
          Preferred Time Windows
        </label>
        <div className="grid grid-cols-2 gap-2">
          {timeOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleTime(option.value)}
              className={`
                px-3 py-3 rounded-lg text-sm transition-all text-left
                ${selectedTimes.includes(option.value)
                  ? 'bg-accent-600 text-white border-2 border-accent-500 shadow-lg'
                  : 'bg-dark-800 text-dark-300 border-2 border-dark-700 hover:border-dark-600'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{option.icon}</span>
                <span className="font-semibold">{option.label}</span>
              </div>
              <div className="text-xs opacity-90">{option.time}</div>
            </button>
          ))}
        </div>
        {selectedTimes.length === 0 && (
          <p className="text-xs text-dark-500 mt-1">Select preferred times (or choose Flexible)</p>
        )}
      </div>

      {/* Specific Dates (Optional) */}
      {showSpecificDates && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-dark-300 font-medium text-sm">
              Specific Dates (Optional)
            </label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              <CalendarIcon className="w-4 h-4" />
              {showCalendar ? 'Hide Calendar' : 'Select Dates'}
            </button>
          </div>

          {showCalendar && (
            <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-4">
              <SimpleCalendar
                selectedDates={selectedDates}
                onDateSelect={handleDateSelect}
              />
            </div>
          )}

          {selectedDates.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedDates.map(date => (
                <span
                  key={date}
                  className="px-3 py-1 bg-primary-950/30 text-primary-300 rounded-lg text-xs flex items-center gap-2"
                >
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  <button
                    type="button"
                    onClick={() => handleDateSelect(new Date(date))}
                    className="hover:text-primary-100"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {(selectedDays.length > 0 || selectedTimes.length > 0) && (
        <div className="bg-accent-950/20 border border-accent-700/30 rounded-lg p-3">
          <p className="text-xs font-medium text-accent-300 mb-1">Your Preferences:</p>
          <div className="text-xs text-dark-400 space-y-1">
            <p>
              <span className="font-medium">Hours:</span> {hours}h/week
            </p>
            {selectedDays.length > 0 && (
              <p>
                <span className="font-medium">Days:</span> {selectedDays.map(d => dayOptions.find(o => o.value === d)?.label).join(', ')}
              </p>
            )}
            {selectedTimes.length > 0 && (
              <p>
                <span className="font-medium">Times:</span> {selectedTimes.map(t => timeOptions.find(o => o.value === t)?.label).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Simple Calendar Component for Date Selection
 */
function SimpleCalendar({ selectedDates, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const isSelected = (day) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0]
    return selectedDates.includes(dateStr)
  }

  const isPast = (day) => {
    const date = new Date(year, month, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="btn-icon-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-sm font-semibold text-dark-100">
          {monthNames[month]} {year}
        </h3>
        <button
          type="button"
          onClick={goToNextMonth}
          className="btn-icon-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-dark-500 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array(firstDay).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1
          const dateStr = new Date(year, month, day).toISOString().split('T')[0]
          const selected = isSelected(day)
          const past = isPast(day)

          return (
            <button
              key={day}
              type="button"
              onClick={() => !past && onDateSelect(new Date(year, month, day))}
              disabled={past}
              className={`
                aspect-square rounded-lg text-xs font-medium transition-all
                ${past
                  ? 'text-dark-600 cursor-not-allowed'
                  : selected
                  ? 'bg-primary-600 text-white border-2 border-primary-500'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600 border-2 border-transparent hover:border-dark-600'
                }
              `}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

