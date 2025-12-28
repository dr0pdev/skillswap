export default function SkillCard({ skill, onDelete }) {
  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'badge-success'
      case 'intermediate':
        return 'badge-warning'
      case 'advanced':
        return 'badge-error'
      default:
        return 'badge-secondary'
    }
  }

  const getRoleInfo = (role) => {
    if (role === 'teach') {
      return {
        color: 'badge-primary',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        label: 'Teaching'
      }
    }
    return {
      color: 'bg-accent-900/30 text-accent-400 border-accent-800/50',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      label: 'Learning'
    }
  }

  const roleInfo = getRoleInfo(skill.role)

  return (
    <div className="rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 p-6" style={{ backgroundColor: '#F5F7FA' }}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-slate-900 mb-3">
            {skill.skills.name}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`badge ${roleInfo.color} flex items-center gap-1`}>
              {roleInfo.icon}
              {roleInfo.label}
            </span>
            {skill.level && (
              <span className={`badge ${getLevelColor(skill.level)}`}>
                {skill.level}
              </span>
            )}
            <span className="badge badge-secondary">
              {skill.skills.category}
            </span>
          </div>
        </div>
      </div>

      {skill.role === 'teach' && (
        <div className="space-y-2 mb-4 p-3 rounded-lg bg-white/50 border border-gray-200">
          {skill.difficulty_score && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Difficulty:</span>
              <span className="font-medium text-slate-900">
                {skill.difficulty_score}/100
              </span>
            </div>
          )}
          {skill.weekly_hours_available > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Available:</span>
              <span className="font-medium text-slate-900">
                {skill.weekly_hours_available}h/week
              </span>
            </div>
          )}
        </div>
      )}

      {skill.skills.demand_score && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Demand:</span>
            <span className="font-medium text-slate-900">
              {skill.skills.demand_score.toFixed(0)}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${skill.skills.demand_score}%` }}
            />
          </div>
        </div>
      )}

      {skill.ai_suggested_level && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-purple-600 font-medium mb-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Assessment
          </p>
          <p className="text-xs text-gray-700">
            {skill.ai_explanation || `Suggested: ${skill.ai_suggested_level}`}
          </p>
        </div>
      )}

      {skill.notes && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {skill.notes}
        </p>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          Added {new Date(skill.created_at).toLocaleDateString()}
        </span>
        <button
          onClick={() => onDelete(skill.id)}
          className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove
        </button>
      </div>
    </div>
  )
}
