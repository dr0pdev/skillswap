import { TrendingUp, Users, MessageCircle, Sparkles, Award } from 'lucide-react'

const Dashboard = () => {
  const stats = [
    { label: 'Active Matches', value: '12', icon: Users, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { label: 'Skills Listed', value: '8', icon: Sparkles, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Messages', value: '24', icon: MessageCircle, bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Match Rate', value: '85%', icon: TrendingUp, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { label: 'Reputation Score', value: '4.8', icon: Award, bgColor: 'bg-amber-50', iconColor: 'text-amber-600', subtitle: 'Based on 3 completed swaps' },
  ]

  const recentMatches = [
    { name: 'Sarah Chen', skill: 'UI/UX Design', match: '95%', status: 'fair' },
    { name: 'Mike Johnson', skill: 'React Development', match: '88%', status: 'fair' },
    { name: 'Emma Wilson', skill: 'Data Analysis', match: '82%', status: 'good' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#0C243D] mt-1">Dashboard</h2>
        <p className="text-[#0C243D] mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Matches */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-slate-900">Recent Matches</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentMatches.map((match, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{match.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{match.skill}</p>
                </div>
                <div className="flex items-center gap-3">
                  {match.status === 'fair' && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
                      Fair Match
                    </span>
                  )}
                  <span className="text-sm font-semibold text-slate-900">{match.match}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

