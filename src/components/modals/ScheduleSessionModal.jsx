import React, { useState, useEffect } from 'react'
import { XMarkIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'

export default function ScheduleSessionModal({ 
  onClose, 
  onSchedule,
  swap,
  myUserId,
  partnerUserId,
  skillToTeach,
  hoursPerWeek 
}) {
  const [selectedDate, setSelectedDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState(60) // minutes
  const [locationType, setLocationType] = useState('online')
  const [meetingLink, setMeetingLink] = useState('')
  const [notes, setNotes] = useState('')
  const [conflicts, setConflicts] = useState([])
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setSelectedDate(tomorrow.toISOString().split('T')[0])
  }, [])

  // Check for conflicts when date/time changes
  useEffect(() => {
    if (selectedDate && startTime) {
      checkConflicts()
    }
  }, [selectedDate, startTime, duration])

  const checkConflicts = async () => {
    try {
      setChecking(true)
      
      const endTime = calculateEndTime(startTime, duration)
      
      // Check conflicts for both users
      const [myConflicts, partnerConflicts] = await Promise.all([
        supabase.rpc('check_scheduling_conflict', {
          p_user_id: myUserId,
          p_date: selectedDate,
          p_start_time: startTime,
          p_end_time: endTime
        }),
        supabase.rpc('check_scheduling_conflict', {
          p_user_id: partnerUserId,
          p_date: selectedDate,
          p_start_time: startTime,
          p_end_time: endTime
        })
      ])

      const conflictsList = []
      if (myConflicts.data) conflictsList.push('You have another session at this time')
      if (partnerConflicts.data) conflictsList.push('Your partner has another session at this time')
      
      setConflicts(conflictsList)
    } catch (error) {
      console.error('Error checking conflicts:', error)
    } finally {
      setChecking(false)
    }
  }

  const calculateEndTime = (start, durationMin) => {
    const [hours, minutes] = start.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMin
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (conflicts.length > 0) {
      alert('Please resolve scheduling conflicts before booking.')
      return
    }

    if (!selectedDate || !startTime || duration <= 0) {
      alert('Please fill in all required fields.')
      return
    }

    setSubmitting(true)

    try {
      const endTime = calculateEndTime(startTime, duration)
      
      const sessionData = {
        swap_id: swap.id,
        participant_id: swap.participantId, // The participant record ID
        teacher_user_id: myUserId,
        learner_user_id: partnerUserId,
        skill_id: skillToTeach.id,
        session_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration,
        location_type: locationType,
        meeting_link: meetingLink || null,
        notes: notes || null,
        status: 'scheduled'
      }

      const { data, error } = await supabase
        .from('scheduled_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (error) throw error

      if (onSchedule) {
        await onSchedule(data)
      }

      alert('Session scheduled successfully!')
      onClose()
    } catch (error) {
      console.error('Error scheduling session:', error)
      alert('Failed to schedule session: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const endTime = calculateEndTime(startTime, duration)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl mx-auto bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-dark-800 bg-dark-900/95 backdrop-blur-sm z-10">
          <div>
            <h3 className="text-xl font-bold text-dark-100 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-primary-500" />
              Schedule Session
            </h3>
            <p className="text-sm text-dark-400 mt-1">
              Book a time slot for your skill swap
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-dark-400 hover:text-dark-100 transition-colors p-1.5 hover:bg-dark-800 rounded-lg"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Session Info */}
          <div className="bg-primary-950/20 border border-primary-700/50 rounded-lg p-4">
            <p className="text-xs text-primary-400 mb-2">Session Details</p>
            <div className="space-y-1 text-sm">
              <p className="text-dark-200">
                <span className="text-dark-500">Teaching:</span> {skillToTeach?.name || 'Skill'}
              </p>
              <p className="text-dark-200">
                <span className="text-dark-500">Weekly commitment:</span> {hoursPerWeek}h/week
              </p>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Session Date *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="input w-full"
            />
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Duration (minutes) *
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
                className="input w-full"
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
          </div>

          {/* Time Summary */}
          <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-3 flex items-center gap-3">
            <ClockIcon className="w-5 h-5 text-accent-400" />
            <div className="text-sm">
              <p className="text-dark-300">
                Session time: <span className="font-semibold text-dark-100">{startTime} - {endTime}</span>
              </p>
              <p className="text-xs text-dark-500 mt-0.5">
                {duration} minutes ({(duration / 60).toFixed(1)}h)
              </p>
            </div>
          </div>

          {/* Conflict Warning */}
          {checking ? (
            <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-3 flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
              <p className="text-sm text-dark-400">Checking availability...</p>
            </div>
          ) : conflicts.length > 0 ? (
            <div className="bg-error-950/20 border border-error-700/50 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-error-300 mb-1">Scheduling Conflicts</p>
                  <ul className="text-xs text-error-200 space-y-1">
                    {conflicts.map((conflict, i) => (
                      <li key={i}>• {conflict}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-success-950/20 border border-success-700/50 rounded-lg p-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-success-300">Time slot available</p>
            </div>
          )}

          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Location Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['online', 'in-person', 'hybrid'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLocationType(type)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${locationType === type
                      ? 'bg-primary-600 text-white border-2 border-primary-500'
                      : 'bg-dark-800 text-dark-300 border-2 border-dark-700 hover:border-dark-600'
                    }
                  `}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Meeting Link */}
          {locationType === 'online' && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Meeting Link (Optional)
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="input w-full"
              />
              <p className="text-xs text-dark-500 mt-1">
                Add Zoom, Google Meet, or other video call link
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Session Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific topics or preparation needed..."
              rows={3}
              className="input w-full resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-dark-800">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || checking || conflicts.length > 0}
              className="btn btn-primary flex-[2]"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Scheduling...
                </span>
              ) : (
                'Confirm & Schedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

