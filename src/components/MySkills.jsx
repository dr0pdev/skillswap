import { Plus, Edit2, Trash2, CheckCircle } from 'lucide-react'

const MySkills = () => {
  const skills = [
    {
      id: 1,
      title: 'React Development',
      description: 'Expert in building modern web applications with React, hooks, and state management',
      level: 'Expert',
      category: 'Development',
      status: 'active',
    },
    {
      id: 2,
      title: 'UI/UX Design',
      description: 'Creating beautiful and intuitive user interfaces with Figma and design systems',
      level: 'Intermediate',
      category: 'Design',
      status: 'active',
    },
    {
      id: 3,
      title: 'Python Programming',
      description: 'Data analysis, automation, and backend development with Python',
      level: 'Advanced',
      category: 'Development',
      status: 'active',
    },
    {
      id: 4,
      title: 'Project Management',
      description: 'Agile methodologies, team coordination, and project planning',
      level: 'Expert',
      category: 'Management',
      status: 'active',
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
          <h2 className="text-3xl font-bold text-slate-900">My Skills</h2>
          <p className="text-gray-500 mt-1">Manage your skills and what you want to learn</p>
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

