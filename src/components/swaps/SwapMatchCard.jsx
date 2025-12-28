import { useState } from 'react'
import UserProfileModal from '../modals/UserProfileModal'
import ChatModal from '../modals/ChatModal'

export default function SwapMatchCard({ 
  swap, 
  learnSkill, // Locked learn skill passed as prop (for mode=learn)
  teachSkill, // Locked teach skill passed as prop (for mode=teach)
  mode, // 'learn' or 'teach'
  otherUser, // The other user in the swap
  onProposeSwap
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)

  const getMatchBadge = () => {
    const score = swap.matchScore || 0
    
    if (score >= 85) {
      return {
        text: 'Perfect Match',
        bgColor: 'bg-success-950/30',
        borderColor: 'border-success-700/50',
        textColor: 'text-success-400',
        scoreColor: 'text-success-300'
      }
    } else if (score >= 60) {
      return {
        text: 'Strong Match',
        bgColor: 'bg-primary-950/30',
        borderColor: 'border-primary-700/50',
        textColor: 'text-primary-400',
        scoreColor: 'text-primary-300'
      }
    } else if (score >= 30) {
      return {
        text: 'Okay Match',
        bgColor: 'bg-warning-950/30',
        borderColor: 'border-warning-700/50',
        textColor: 'text-warning-400',
        scoreColor: 'text-warning-300'
      }
    } else {
      return {
        text: 'Weak Match',
        bgColor: 'bg-dark-800/50',
        borderColor: 'border-dark-700',
        textColor: 'text-dark-400',
        scoreColor: 'text-dark-300'
      }
    }
  }

  const badge = getMatchBadge()
  const matchScore = swap.matchScore || 0
  const isCustom = swap.isCustom || false

  // Determine which sides are locked based on mode
  const displayTeachSkill = mode === 'teach' ? teachSkill : swap.teachSkill
  const displayLearnSkill = mode === 'learn' ? learnSkill : swap.learnSkill
  const isTeachLocked = mode === 'teach'
  const isLearnLocked = mode === 'learn'

  return (
    <>
      <div
        className={`
          relative overflow-hidden rounded-xl border-2 transition-all duration-300
          ${badge.borderColor}
          ${isHovered ? 'shadow-xl scale-[1.01] border-opacity-100' : 'shadow-lg border-opacity-50'}
          bg-dark-900/80
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Match Score Indicator Bar */}
        <div className={`h-1 ${badge.bgColor.replace('/30', '/50')} opacity-80`} 
             style={{ width: `${matchScore}%` }} />

        <div className="p-5">
          {/* Header: Match Badge, Score & Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isCustom && (
                <div className="px-3 py-1 bg-accent-950/30 border border-accent-700/50 rounded-lg">
                  <span className="text-xs font-semibold text-accent-400">Custom Offer</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Profile Button */}
              {otherUser && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowProfileModal(true)
                  }}
                  className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 flex items-center justify-center transition-colors group"
                  title="View Profile"
                >
                  <svg className="w-4 h-4 text-dark-400 group-hover:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              )}
              
              {/* Chat Button */}
              {otherUser && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowChatModal(true)
                  }}
                  className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 flex items-center justify-center transition-colors group"
                  title="Chat"
                >
                  <svg className="w-4 h-4 text-dark-400 group-hover:text-accent-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              )}
              
              {/* Match Badge */}
              <div className={`px-3 py-1.5 rounded-lg ${badge.bgColor} ${badge.borderColor} border`}>
                <div className={`text-xs font-semibold ${badge.textColor}`}>
                  {badge.text}
                </div>
                <div className={`text-[10px] ${badge.textColor} opacity-70 mt-0.5`}>
                  {matchScore}/100
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Layout: Two Columns with Arrow */}
          <div className="relative mb-4">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
              {/* Left: You Teach */}
              <div className={`bg-primary-950/20 border border-primary-800/30 rounded-lg p-4 relative ${isTeachLocked ? 'ring-2 ring-primary-600/50' : ''}`}>
                {isTeachLocked && (
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary-600 text-white text-[10px] font-bold rounded uppercase">
                    Locked
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-primary-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="text-xs font-semibold text-primary-400 uppercase tracking-wide">
                    You Teach
                  </div>
                </div>
                <h3 className="text-base font-bold text-dark-100 mb-1">
                  {displayTeachSkill?.skills?.name || displayTeachSkill?.name || 'Unknown'}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {displayTeachSkill?.level && (
                    <span className="badge badge-secondary text-[10px] py-0.5">
                      {displayTeachSkill.level}
                    </span>
                  )}
                  {displayTeachSkill?.skills?.category && (
                    <span className="badge badge-secondary text-[10px] py-0.5">
                      {displayTeachSkill.skills.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow Indicator */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-dark-800 border-2 border-dark-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="w-10 h-10 rounded-full bg-dark-800 border-2 border-dark-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-400 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>

              {/* Right: You Learn */}
              <div className={`bg-accent-950/20 border border-accent-800/30 rounded-lg p-4 relative ${isLearnLocked ? 'ring-2 ring-accent-600/50' : ''}`}>
                {isLearnLocked && (
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-accent-600 text-white text-[10px] font-bold rounded uppercase">
                    Locked
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-accent-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="text-xs font-semibold text-accent-400 uppercase tracking-wide">
                    You Learn
                  </div>
                </div>
                <h3 className="text-base font-bold text-dark-100 mb-1">
                  {displayLearnSkill?.skills?.name || displayLearnSkill?.name || 'Unknown'}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {displayLearnSkill?.level && (
                    <span className="badge badge-secondary text-[10px] py-0.5">
                      {displayLearnSkill.level}
                    </span>
                  )}
                  {displayLearnSkill?.skills?.category && (
                    <span className="badge badge-secondary text-[10px] py-0.5">
                      {displayLearnSkill.skills.category}
                    </span>
                  )}
                </div>
                {otherUser && (
                  <div className="text-xs text-dark-400 mt-2">
                    from {otherUser.full_name || 'Partner'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expandable Details Section */}
          {isExpanded && (
            <div className="mb-4 border-t border-dark-800 pt-4 space-y-3 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Teach Skill Details */}
                <div className="bg-dark-800/30 border border-dark-700 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-primary-400 uppercase mb-2">Teaching Details</h4>
                  <div className="space-y-1.5 text-xs text-dark-300">
                    {displayTeachSkill?.difficulty_score && (
                      <div className="flex justify-between">
                        <span className="text-dark-400">Difficulty:</span>
                        <span className="font-medium">{displayTeachSkill.difficulty_score}/100</span>
                      </div>
                    )}
                    {displayTeachSkill?.weekly_hours_available > 0 && (
                      <div className="flex justify-between">
                        <span className="text-dark-400">Availability:</span>
                        <span className="font-medium">{displayTeachSkill.weekly_hours_available}h/week</span>
                      </div>
                    )}
                    {displayTeachSkill?.ai_explanation && (
                      <div className="mt-2 pt-2 border-t border-dark-700">
                        <p className="text-dark-400 text-[11px] leading-relaxed line-clamp-3">
                          {displayTeachSkill.ai_explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Learn Skill Details */}
                <div className="bg-dark-800/30 border border-dark-700 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-accent-400 uppercase mb-2">Learning Details</h4>
                  <div className="space-y-1.5 text-xs text-dark-300">
                    {displayLearnSkill?.difficulty_score && (
                      <div className="flex justify-between">
                        <span className="text-dark-400">Difficulty:</span>
                        <span className="font-medium">{displayLearnSkill.difficulty_score}/100</span>
                      </div>
                    )}
                    {displayLearnSkill?.weekly_hours_available > 0 && (
                      <div className="flex justify-between">
                        <span className="text-dark-400">Availability:</span>
                        <span className="font-medium">{displayLearnSkill.weekly_hours_available}h/week</span>
                      </div>
                    )}
                    {displayLearnSkill?.ai_explanation && (
                      <div className="mt-2 pt-2 border-t border-dark-700">
                        <p className="text-dark-400 text-[11px] leading-relaxed line-clamp-3">
                          {displayLearnSkill.ai_explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="btn btn-secondary flex-1 text-sm py-2.5"
            >
              {isExpanded ? (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Hide Details
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  View Details
                </>
              )}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onProposeSwap(swap)
              }}
              className="btn btn-primary flex-[2] text-sm py-2.5"
            >
              Propose Swap
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showProfileModal && otherUser && (
        <UserProfileModal 
          userId={otherUser.id} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}
      
      {showChatModal && otherUser && (
        <ChatModal 
          partner={otherUser}
          onClose={() => setShowChatModal(false)} 
        />
      )}
    </>
  )
}
