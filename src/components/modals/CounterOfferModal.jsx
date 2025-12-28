import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import HoursAllocationForm from '../swaps/HoursAllocationForm'
import { calculateRemainingHours } from '../../utils/capacity'

export default function CounterOfferModal({ 
  onClose, 
  onSubmit, 
  currentProposal,
  myUserId,
  partnerUserId 
}) {
  const [newHours, setNewHours] = useState(currentProposal.hours || 1)
  const [timePreferences, setTimePreferences] = useState({})
  const [teacherCapacity, setTeacherCapacity] = useState({})
  const [learnerCapacity, setLearnerCapacity] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Fetch capacity on mount
  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        setLoading(true)
        
        const [myTeachCap, theirTeachCap] = await Promise.all([
          calculateRemainingHours(myUserId, currentProposal.myTeachSkillId, 'teach'),
          calculateRemainingHours(partnerUserId, currentProposal.theirTeachSkillId, 'teach')
        ])

        setTeacherCapacity(myTeachCap)
        setLearnerCapacity(theirTeachCap)
      } catch (error) {
        console.error('Error fetching capacity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCapacity()
  }, [myUserId, partnerUserId, currentProposal])

  const handleSubmit = async () => {
    const maxAvailable = Math.min(
      teacherCapacity.remainingHours || 0,
      learnerCapacity.remainingHours || 0
    )

    if (newHours <= 0 || newHours > maxAvailable) {
      alert(`Please select between 0.5 and ${maxAvailable} hours per week.`)
      return
    }

    if (newHours === currentProposal.hours) {
      alert('Please change the hours to make a counter offer.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        hours: newHours,
        preferences: timePreferences
      })
      onClose()
    } catch (error) {
      console.error('Error submitting counter offer:', error)
      alert('Failed to submit counter offer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const fairnessChange = currentProposal.fairness
  const newFairness = Math.round(fairnessChange + (newHours - currentProposal.hours) * 2) // Simple calculation

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl mx-auto bg-dark-900 border border-dark-700 rounded-xl shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-800">
          <div>
            <h3 className="text-xl font-bold text-dark-100">Counter Offer</h3>
            <p className="text-sm text-dark-400 mt-1">
              Adjust the hours and propose alternative terms
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-dark-400 hover:text-dark-100 transition-colors p-1.5 hover:bg-dark-800 rounded-lg"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Current vs Proposed Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-4">
              <p className="text-xs text-dark-500 mb-2">Current Proposal</p>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-dark-400">Hours/week:</p>
                  <p className="text-2xl font-bold text-dark-200">{currentProposal.hours}h</p>
                </div>
                <div>
                  <p className="text-sm text-dark-400">Fairness:</p>
                  <p className="text-lg font-semibold text-dark-200">{currentProposal.fairness}%</p>
                </div>
              </div>
            </div>

            <div className="bg-primary-950/20 border border-primary-700/50 rounded-lg p-4">
              <p className="text-xs text-primary-400 mb-2">Your Counter Offer</p>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-primary-300">Hours/week:</p>
                  <p className="text-2xl font-bold text-primary-100">{newHours}h</p>
                </div>
                <div>
                  <p className="text-sm text-primary-300">Est. Fairness:</p>
                  <p className="text-lg font-semibold text-primary-100">{newFairness}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          <div className="bg-dark-800/30 border border-dark-700 rounded-lg p-4">
            <p className="text-xs text-dark-500 mb-3">Swap Details</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-dark-500 mb-1">You Teach:</p>
                <p className="text-dark-100 font-semibold">{currentProposal.myTeachSkillName}</p>
              </div>
              <div>
                <p className="text-dark-500 mb-1">You Learn:</p>
                <p className="text-dark-100 font-semibold">{currentProposal.myLearnSkillName}</p>
              </div>
            </div>
          </div>

          {/* Hours Allocation Form */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <HoursAllocationForm
              teacherCapacity={teacherCapacity}
              learnerCapacity={learnerCapacity}
              onHoursChange={setNewHours}
              onPreferencesChange={setTimePreferences}
              initialHours={newHours}
              initialPreferences={timePreferences}
            />
          )}

          {/* Impact Preview */}
          <div className="bg-accent-950/20 border border-accent-700/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-accent-300 mb-1">Counter Offer Impact</p>
                <p className="text-xs text-dark-400">
                  {newHours > currentProposal.hours ? (
                    <>Increasing hours shows stronger commitment but requires more availability.</>
                  ) : newHours < currentProposal.hours ? (
                    <>Decreasing hours provides more flexibility but may reduce match appeal.</>
                  ) : (
                    <>Hours unchanged. Consider adjusting time preferences.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-dark-800 bg-dark-900/50">
          <button
            onClick={onClose}
            className="btn btn-secondary flex-1"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading || newHours === currentProposal.hours}
            className="btn btn-primary flex-[2]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </span>
            ) : (
              `Send Counter Offer (${newHours}h/week)`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

