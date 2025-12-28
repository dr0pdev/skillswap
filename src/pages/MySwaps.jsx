import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import UserProfileModal from '../components/modals/UserProfileModal'
import ChatModal from '../components/modals/ChatModal'

export default function MySwaps() {
  const { user } = useAuth()
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    if (user?.id) {
      fetchSwaps()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchSwaps = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('swap_participants')
        .select(`
          *,
          swaps (*),
          teaching_skill:skills!swap_participants_teaching_skill_id_fkey (name),
          learning_skill:skills!swap_participants_learning_skill_id_fkey (name),
          learning_from:users!swap_participants_learning_from_user_id_fkey (id, full_name, reputation_score)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSwaps(data || [])
    } catch (error) {
      console.error('Error fetching swaps:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptSwap = async (swapId, participantId) => {
    try {
      // Update participant acceptance
      await supabase
        .from('swap_participants')
        .update({ has_accepted: true, accepted_at: new Date().toISOString() })
        .eq('id', participantId)

      // Check if all participants accepted
      const { data: allParticipants } = await supabase
        .from('swap_participants')
        .select('has_accepted')
        .eq('swap_id', swapId)

      const allAccepted = allParticipants?.every(p => p.has_accepted)

      if (allAccepted) {
        await supabase
          .from('swaps')
          .update({ 
            status: 'active',
            accepted_at: new Date().toISOString(),
            start_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', swapId)
      }

      fetchSwaps()
      alert('Swap accepted!')
    } catch (error) {
      console.error('Error accepting swap:', error)
      alert('Failed to accept swap')
    }
  }

  const handleDeclineSwap = async (swapId) => {
    if (!confirm('Are you sure you want to decline this proposal?')) return

    try {
      // Update swap status to cancelled (declined swaps use 'cancelled' status)
      const { error: swapError } = await supabase
        .from('swaps')
        .update({ 
          status: 'cancelled',
          declined_at: new Date().toISOString()
        })
        .eq('id', swapId)

      if (swapError) {
        console.error('Error updating swap:', swapError)
        throw swapError
      }

      // Also update participant status
      const { error: participantError } = await supabase
        .from('swap_participants')
        .update({ has_accepted: false })
        .eq('swap_id', swapId)
        .eq('user_id', user.id)

      if (participantError) {
        console.error('Error updating participant:', participantError)
        // Don't throw - swap status update is more important
      }

      fetchSwaps()
      alert('Proposal declined successfully')
    } catch (error) {
      console.error('Error declining swap:', error)
      alert(`Failed to decline swap: ${error.message || 'Please try again'}`)
    }
  }

  const handleCounterProposal = async (swap) => {
    // Get other user's teaching skills
    const otherUserId = swap.learning_from.id || swap.learning_from_user_id
    
    try {
      const { data: otherSkills, error } = await supabase
        .from('user_skills')
        .select('*, skills(*)')
        .eq('user_id', otherUserId)
        .eq('role', 'teach')
        .eq('is_active', true)

      if (error) throw error

      if (!otherSkills || otherSkills.length === 0) {
        alert('This user has no other skills to offer')
        return
      }

      // Show selection modal
      const skillNames = otherSkills.map(s => s.skills.name).join('\n')
      const selected = prompt(
        `Counter proposal: Select a different skill from ${swap.learning_from.full_name}:\n\n${skillNames}\n\nEnter the skill name:`
      )

      if (!selected) return

      const selectedSkill = otherSkills.find(
        s => s.skills.name.toLowerCase() === selected.toLowerCase()
      )

      if (!selectedSkill) {
        alert('Invalid skill name')
        return
      }

      // Update the swap to "countered" status
      await supabase
        .from('swaps')
        .update({ 
          status: 'countered',
          notes: `Counter: Requesting ${selectedSkill.skills.name} instead`
        })
        .eq('id', swap.swaps.id)

      // Update the participant's learning skill
      await supabase
        .from('swap_participants')
        .update({ learning_skill_id: selectedSkill.skill_id })
        .eq('swap_id', swap.swaps.id)
        .eq('user_id', user.id)

      fetchSwaps()
      alert('Counter proposal sent!')
    } catch (error) {
      console.error('Error creating counter proposal:', error)
      alert('Failed to create counter proposal')
    }
  }

  const handleCancelSwap = async (swapId) => {
    if (!confirm('Are you sure you want to cancel this swap?')) return

    try {
      await supabase
        .from('swaps')
        .update({ status: 'cancelled' })
        .eq('id', swapId)

      fetchSwaps()
    } catch (error) {
      console.error('Error cancelling swap:', error)
      alert('Failed to cancel swap')
    }
  }

  const handleCompleteSwap = async (swapId) => {
    if (!confirm('Mark this swap as completed? This cannot be undone.')) return

    try {
      await supabase
        .from('swaps')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', swapId)

      fetchSwaps()
      alert('Swap marked as completed! 🎉')
    } catch (error) {
      console.error('Error completing swap:', error)
      alert('Failed to mark swap as completed')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      proposed: 'bg-yellow-100 text-yellow-800',
      countered: 'bg-orange-100 text-orange-800',
      accepted: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      declined: 'bg-red-100 text-red-800',
      disputed: 'bg-orange-100 text-orange-800',
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.proposed}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const filteredSwaps = swaps.filter(swap => {
    if (filter === 'all') return true
    return swap.swaps.status === filter
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#0C243D' }}>My Swaps</h1>
        <p className="mt-1" style={{ color: '#0C243D' }}>
          Track your skill exchange agreements
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto">
        {['all', 'proposed', 'active', 'completed'].map((status) => {
          const count = status === 'all' 
            ? swaps.length 
            : swaps.filter(s => s.swaps.status === status).length

          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                filter === status
                  ? 'border-primary-600'
                  : 'border-transparent'
              }`}
              style={{ 
                color: filter === status ? '#0C243D' : '#0C243D',
                borderBottomColor: filter === status ? '#0C243D' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (filter !== status) {
                  e.target.style.opacity = '0.7'
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== status) {
                  e.target.style.opacity = '1'
                }
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
            </button>
          )
        })}
      </div>

      {/* Swaps List */}
      {filteredSwaps.length === 0 ? (
        <div className="card text-center py-12" style={{ backgroundColor: '#1e293b' }}>
          <div className="text-6xl mb-4">🤝</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No {filter !== 'all' ? filter : ''} swaps yet
          </h3>
          <p className="text-white mb-6">
            {filter === 'all'
              ? 'Start by finding matches and proposing swaps!'
              : `You don't have any ${filter} swaps.`}
          </p>
          {filter === 'all' && (
            <a 
              href="/find-swaps" 
              className="btn mt-1 text-white font-medium px-6 py-3 rounded-lg transition-all duration-300 hover:opacity-90"
              style={{ backgroundColor: '#27496A' }}
            >
              Find Swaps
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSwaps.map((swap) => (
            <div key={swap.id} className="card">
              <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#0C243D] mt-1">
                        Swap with {swap.learning_from?.full_name || 'Partner'}
                      </h3>
                      {/* Profile Button */}
                      {(swap.learning_from?.id || swap.learning_from_user_id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const userId = swap.learning_from?.id || swap.learning_from_user_id
                            setSelectedUser({ id: userId, full_name: swap.learning_from?.full_name || 'Partner' })
                            setShowProfileModal(true)
                          }}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center transition-colors group"
                          title="View Profile"
                        >
                          <svg className="w-4 h-4 text-gray-600 group-hover:text-primary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </button>
                      )}
                      
                      {/* Chat Button */}
                      {(swap.learning_from?.id || swap.learning_from_user_id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const userId = swap.learning_from?.id || swap.learning_from_user_id
                            setSelectedUser({ id: userId, full_name: swap.learning_from?.full_name || 'Partner' })
                            setShowChatModal(true)
                          }}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center transition-colors group"
                          title="Chat"
                        >
                          <svg className="w-4 h-4 text-gray-600 group-hover:text-accent-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {getStatusBadge(swap.swaps.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        🎓 YOU TEACH
                      </p>
                      <p className="font-semibold text-gray-900">
                        {swap.teaching_skill?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {swap.teaching_hours_per_week}h/week
                      </p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs text-purple-600 font-medium mb-1">
                        📚 YOU LEARN
                      </p>
                      <p className="font-semibold text-gray-900">
                        {swap.learning_skill?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {swap.learning_hours_per_week}h/week
                      </p>
                    </div>
                  </div>

                  {swap.swaps.balance_explanation && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-700">
                        {swap.swaps.balance_explanation}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex lg:flex-col gap-2">
                  {swap.swaps.status === 'proposed' && !swap.has_accepted && (
                    <>
                      <button
                        onClick={() => handleAcceptSwap(swap.swaps.id, swap.id)}
                        className="btn btn-primary whitespace-nowrap"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineSwap(swap.swaps.id)}
                        className="btn btn-secondary whitespace-nowrap"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleCounterProposal(swap)}
                        className="btn btn-secondary whitespace-nowrap"
                      >
                        Counter Offer
                      </button>
                    </>
                  )}
                  {swap.swaps.status === 'proposed' && swap.has_accepted && (
                    <span className="text-sm text-gray-600">
                      Waiting for partner...
                    </span>
                  )}
                  {swap.swaps.status === 'active' && (
                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => handleCompleteSwap(swap.swaps.id)}
                        className="btn btn-primary whitespace-nowrap flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mark as Completed
                      </button>
                      <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Active
                      </span>
                    </div>
                  )}
                  {swap.swaps.status === 'completed' && (
                    <span className="text-sm text-purple-600 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Completed
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 text-sm">
                <span className="text-white">
                  Created {new Date(swap.created_at).toLocaleDateString()}
                </span>
                {swap.swaps.fairness_score && (
                  <span className="font-medium text-green-600">
                    Fairness: {swap.swaps.fairness_score}/100
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showProfileModal && selectedUser && (
        <UserProfileModal 
          userId={selectedUser.id} 
          onClose={() => {
            setShowProfileModal(false)
            setSelectedUser(null)
          }} 
        />
      )}
      
      {showChatModal && selectedUser && (
        <ChatModal 
          partner={selectedUser}
          onClose={() => {
            setShowChatModal(false)
            setSelectedUser(null)
          }} 
        />
      )}
    </div>
  )
}

