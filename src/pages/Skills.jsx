import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import AddSkillModal from '../components/skills/AddSkillModal'
import SkillCard from '../components/skills/SkillCard'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants'

export default function Skills() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState('all')

  const fetchUserSkills = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select(`
          *,
          skills (
            id,
            name,
            category,
            demand_score,
            base_difficulty
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSkills(data || [])
    } catch (error) {
      console.error('Error fetching skills:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchUserSkills()
    } else {
      setLoading(false)
    }
  }, [user?.id, fetchUserSkills])

  // Listen for session refresh event from AuthContext
  useEffect(() => {
    const handleSessionRefreshed = () => {
      if (user?.id) {
        console.log('Skills: Session refreshed, updating data...')
        fetchUserSkills()
      }
    }

    const handleSessionExpired = () => {
      console.log('Skills: Session expired')
      setSkills([])
    }

    window.addEventListener('session-refreshed', handleSessionRefreshed)
    window.addEventListener('session-expired', handleSessionExpired)
    
    return () => {
      window.removeEventListener('session-refreshed', handleSessionRefreshed)
      window.removeEventListener('session-expired', handleSessionExpired)
    }
  }, [user?.id, fetchUserSkills])

  const handleSkillAdded = () => {
    fetchUserSkills()
    setShowAddModal(false)
    success(SUCCESS_MESSAGES.SKILL_ADDED)
  }

  const handleDeleteSkill = async (skillId) => {
    if (!confirm('Are you sure you want to remove this skill?')) return

    try {
      const { error } = await supabase
        .from('user_skills')
        .update({ is_active: false })
        .eq('id', skillId)

      if (error) throw error
      
      success(SUCCESS_MESSAGES.SKILL_DELETED)
      fetchUserSkills()
    } catch (error) {
      console.error('Error deleting skill:', error)
      showError(ERROR_MESSAGES.SKILL_DELETE_ERROR)
    }
  }

  const filteredSkills = skills.filter(skill => {
    if (filter === 'all') return true
    return skill.role === filter
  })

  const teachingSkills = skills.filter(s => s.role === 'teach')
  const learningSkills = skills.filter(s => s.role === 'learn')

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">My Skills</h1>
          <p className="section-subtitle">
            Manage what you can teach and want to learn
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Skill
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">Total Skills</p>
              <p className="text-3xl font-bold text-dark-100 mt-1">{skills.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600/20 to-accent-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">Teaching</p>
              <p className="text-3xl font-bold text-primary-400 mt-1">{teachingSkills.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600/20 to-primary-800/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">Learning</p>
              <p className="text-3xl font-bold text-accent-400 mt-1">{learningSkills.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-600/20 to-accent-800/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-dark-800">
        <button
          onClick={() => setFilter('all')}
          className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
        >
          All Skills ({skills.length})
        </button>
        <button
          onClick={() => setFilter('teach')}
          className={`tab ${filter === 'teach' ? 'tab-active' : ''}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Teaching ({teachingSkills.length})
        </button>
        <button
          onClick={() => setFilter('learn')}
          className={`tab ${filter === 'learn' ? 'tab-active' : ''}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Learning ({learningSkills.length})
        </button>
      </div>

      {/* Skills List */}
      {filteredSkills.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-dark-100 mb-2">
            No skills yet
          </h3>
          <p className="text-dark-400 mb-6">
            Start by adding your first skill
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Your First Skill
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onDelete={handleDeleteSkill}
            />
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddModal && (
        <AddSkillModal
          onClose={() => setShowAddModal(false)}
          onSkillAdded={handleSkillAdded}
        />
      )}
    </div>
  )
}
