import { useState } from 'react'
import { Plus, Edit2, Trash2, CheckCircle, Brain, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

const MySkills = () => {
  const [expandedAssessments, setExpandedAssessments] = useState({})

  const toggleAssessment = (skillId) => {
    setExpandedAssessments(prev => ({
      ...prev,
      [skillId]: !prev[skillId]
    }))
  }
  const skills = [
    {
      id: 1,
      title: 'React Development',
      description: 'Expert in building modern web applications with React, hooks, and state management',
      level: 'Advanced',
      category: 'Development',
      status: 'active',
      aiAssessment: {
        isValid: true,
        score: 85,
        levelMatch: 'matches',
        claimedLevel: 'Advanced',
        feedback: ['Your answers validate your Advanced experience level claim'],
        strengths: ['Well-detailed project examples', 'Strong understanding of advanced concepts'],
        concerns: []
      }
    },
    {
      id: 2,
      title: 'UI/UX Design',
      description: 'Creating beautiful and intuitive user interfaces with Figma and design systems',
      level: 'Intermediate',
      category: 'Design',
      status: 'active',
      aiAssessment: {
        isValid: true,
        score: 72,
        levelMatch: 'matches',
        claimedLevel: 'Intermediate',
        feedback: ['Your answers validate your Intermediate experience level claim'],
        strengths: ['Good project descriptions', 'Clear understanding of design tools'],
        concerns: ['Consider adding more details about design processes']
      }
    },
    {
      id: 3,
      title: 'Python Programming',
      description: 'Data analysis, automation, and backend development with Python',
      level: 'Advanced',
      category: 'Development',
      status: 'active',
      aiAssessment: {
        isValid: true,
        score: 90,
        levelMatch: 'exceeds',
        claimedLevel: 'Advanced',
        feedback: ['Your answers suggest you might have Advanced or higher experience'],
        strengths: ['Excellent technical depth', 'Strong practical examples', 'Community contributions mentioned'],
        concerns: []
      }
    },
    {
      id: 4,
      title: 'Project Management',
      description: 'Agile methodologies, team coordination, and project planning',
      level: 'Intermediate',
      category: 'Management',
      status: 'active',
      aiAssessment: {
        isValid: false,
        score: 55,
        levelMatch: 'may not match',
        claimedLevel: 'Intermediate',
        feedback: ['Your answers need more detail to fully validate your Intermediate experience level'],
        strengths: ['Basic understanding demonstrated'],
        concerns: ['Answers were too brief for Intermediate level', 'Consider providing more detailed project examples']
      }
    },
  ]

  const wantedSkills = [
    {
      id: 1,
      title: 'Machine Learning',
      description: 'Looking to learn ML fundamentals and practical applications',
      level: 'Beginner',
      category: 'Data Science',
    },
    {
      id: 2,
      title: 'Graphic Design',
      description: 'Want to improve my design skills and learn Adobe Creative Suite',
      level: 'Beginner',
      category: 'Design',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#0C243D] mt-1">My Skills</h2>
          <p className="text-[#0C243D] mt-1">Manage your skills and what you want to learn</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors" style={{ backgroundColor: '#27496A' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a52'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27496A'}>
          <Plus className="w-5 h-5" />
          Add Skill
        </button>
      </div>

      {/* Skills I Offer */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Skills I Offer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 text-lg">{skill.title}</h4>
                  <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {skill.category}
                  </span>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded" style={{ backgroundColor: 'rgba(39, 73, 106, 0.1)', color: '#27496A' }}>
                  {skill.level}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{skill.description}</p>

              {/* AI Assessment Display */}
              {skill.aiAssessment && (
                <div className="mb-4">
                  <div 
                    className="p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow" 
                    style={{
                      borderColor: skill.aiAssessment.isValid ? '#10b981' : '#ef4444',
                      backgroundColor: skill.aiAssessment.isValid ? '#f0fdf4' : '#fef2f2'
                    }}
                    onClick={() => toggleAssessment(skill.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4" style={{ color: skill.aiAssessment.isValid ? '#10b981' : '#ef4444' }} />
                        <span className="text-xs font-semibold text-slate-900">AI Assessment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {skill.aiAssessment.isValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm font-bold" style={{ color: skill.aiAssessment.isValid ? '#10b981' : '#ef4444' }}>
                          {skill.aiAssessment.score}%
                        </span>
                        {expandedAssessments[skill.id] ? (
                          <ChevronUp className="w-4 h-4 text-gray-500 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>Level: {skill.aiAssessment.claimedLevel} - {skill.aiAssessment.levelMatch}</p>
                      {skill.aiAssessment.strengths.length > 0 && (
                        <p className="text-emerald-600">✓ {skill.aiAssessment.strengths[0]}</p>
                      )}
                      {skill.aiAssessment.concerns.length > 0 && (
                        <p className="text-amber-600">⚠ {skill.aiAssessment.concerns[0]}</p>
                      )}
                    </div>
                  </div>

                  {/* Expanded Assessment Details */}
                  {expandedAssessments[skill.id] && (
                    <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
                      {/* Feedback */}
                      {skill.aiAssessment.feedback.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-slate-900 mb-2">Assessment Feedback</h5>
                          <div className="space-y-1">
                            {skill.aiAssessment.feedback.map((item, index) => (
                              <p key={index} className="text-xs text-gray-700">{item}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strengths */}
                      {skill.aiAssessment.strengths.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Strengths
                          </h5>
                          <ul className="space-y-1">
                            {skill.aiAssessment.strengths.map((strength, index) => (
                              <li key={index} className="text-xs text-emerald-700 flex items-start gap-1">
                                <span>•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Concerns */}
                      {skill.aiAssessment.concerns.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Areas for Improvement
                          </h5>
                          <ul className="space-y-1">
                            {skill.aiAssessment.concerns.map((concern, index) => (
                              <li key={index} className="text-xs text-amber-700 flex items-start gap-1">
                                <span>•</span>
                                <span>{concern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills I Want */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Skills I Want to Learn</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wantedSkills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 text-lg">{skill.title}</h4>
                  <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {skill.category}
                  </span>
                </div>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded">
                  {skill.level}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{skill.description}</p>
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-white rounded transition-colors" style={{ backgroundColor: '#27496A' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a52'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27496A'}>
                  <CheckCircle className="w-4 h-4" />
                  Find Match
                </button>
                <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MySkills

