import { useState } from 'react'
import AIMatchEvaluation from './AIMatchEvaluation'

export default function SwapDetailsModal({ 
  match, 
  evaluation,
  onClose, 
  onAccept, 
  onPropose,
  onChat,
  submitting = false 
}) {
  const [showEvaluation, setShowEvaluation] = useState(false)

  const getMatchBadge = () => {
    if (match.matchStrength === 'strong') {
      return {
        text: 'Perfect Match',
        subtext: 'High Compatibility',
        bgColor: 'bg-success-950/20',
        borderColor: 'border-success-800/50',
        textColor: 'text-success-400'
      }
    } else if (match.matchStrength === 'partial') {
      return {
        text: 'Partial Match',
        subtext: 'Related Skill',
        bgColor: 'bg-warning-950/20',
        borderColor: 'border-warning-800/50',
        textColor: 'text-warning-400'
      }
    } else {
      return {
        text: 'No Match',
        subtext: 'Propose New Skill',
        bgColor: 'bg-dark-800/50',
        borderColor: 'border-dark-700',
        textColor: 'text-dark-400'
      }
    }
  }

  const badge = getMatchBadge()

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="modal-content max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col bg-dark-900 border border-dark-800">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${badge.bgColor} ${badge.borderColor} border flex items-center justify-center`}>
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark-100">Swap Details</h2>
                <div className={`text-xs ${badge.textColor} mt-0.5`}>
                  {badge.text} • {badge.subtext}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-dark-400 hover:text-dark-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Skills Exchange */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* You Teach */}
            <div className="bg-primary-950/20 border border-primary-800/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-primary-400 uppercase tracking-wide">
                  You Teach
                </div>
              </div>
              <h3 className="text-lg font-bold text-dark-100 mb-2">
                {match.mySkill?.skills?.name || 'Not selected'}
              </h3>
              {match.mySkill && (
                <div className="space-y-1 text-sm text-dark-300">
                  <div className="flex items-center gap-2">
                    <span className="text-dark-500">Level:</span>
                    <span className="font-medium">{match.mySkill.level || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-dark-500">Hours/week:</span>
                    <span className="font-medium">{match.mySkill.weekly_hours_available || 0}h</span>
                  </div>
                  {match.mySkill.difficulty_score && (
                    <div className="flex items-center gap-2">
                      <span className="text-dark-500">Difficulty:</span>
                      <span className="font-medium">{match.mySkill.difficulty_score}/100</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* They Learn */}
            <div className="bg-accent-950/20 border border-accent-800/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-accent-400 uppercase tracking-wide">
                  They Learn
                </div>
              </div>
              <h3 className="text-lg font-bold text-dark-100 mb-2">
                {match.targetSkill?.skills?.name || 'Unknown'}
              </h3>
              {match.targetSkill && (
                <div className="space-y-1 text-sm text-dark-300">
                  <div className="flex items-center gap-2">
                    <span className="text-dark-500">Level:</span>
                    <span className="font-medium">{match.targetSkill.level || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-dark-500">Hours/week:</span>
                    <span className="font-medium">{match.targetSkill.weekly_hours_available || 0}h</span>
                  </div>
                  {match.targetSkill.difficulty_score && (
                    <div className="flex items-center gap-2">
                      <span className="text-dark-500">Difficulty:</span>
                      <span className="font-medium">{match.targetSkill.difficulty_score}/100</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Match Evaluation */}
          {evaluation && (
            <div>
              <button
                onClick={() => setShowEvaluation(!showEvaluation)}
                className="w-full flex items-center justify-between p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors"
              >
                <span className="text-sm font-semibold text-dark-200">
                  AI Match Evaluation
                </span>
                <svg 
                  className={`w-5 h-5 text-dark-400 transition-transform ${showEvaluation ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showEvaluation && (
                <div className="mt-4">
                  <AIMatchEvaluation evaluation={evaluation} />
                </div>
              )}
            </div>
          )}

          {/* Match Score */}
          {match.matchScore !== undefined && (
            <div className="bg-dark-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-dark-300">Match Score</span>
                <span className="text-2xl font-bold text-primary-400">{match.matchScore}%</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${match.matchScore}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-dark-900/95 backdrop-blur-sm border-t border-dark-800 px-6 py-4 flex-shrink-0">
          <div className="flex gap-3">
            {match.matchStrength === 'none' ? (
              <button
                onClick={onPropose}
                disabled={submitting}
                className="btn btn-primary flex-1"
              >
                {submitting ? 'Processing...' : 'Propose New Skill'}
              </button>
            ) : (
              <>
                <button
                  onClick={onAccept}
                  disabled={submitting}
                  className="btn btn-primary flex-1"
                >
                  {submitting ? 'Sending...' : 'Accept & Send Proposal'}
                </button>
                <button
                  onClick={onChat}
                  className="btn btn-secondary px-4"
                  title="Chat (Coming Soon)"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

