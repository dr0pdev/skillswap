import { TrendingUp, Users, MessageCircle, Sparkles, Award, Inbox } from 'lucide-react'

const Dashboard = ({ swapRequests = [], pendingRequestsCount = 0, notifications = [] }) => {
  const activeSwaps = swapRequests.filter(r => r.status === 'accepted').length
  const totalRequests = swapRequests.length

  const stats = [
    { 
      label: 'Active Swaps', 
      value: activeSwaps.toString(), 
      icon: Users, 
      gradient: 'from-indigo-500 to-purple-600',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
      shadowColor: 'shadow-indigo-100'
    },
    { 
      label: 'Skills Listed', 
      value: '8', 
      icon: Sparkles, 
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      shadowColor: 'shadow-emerald-100'
    },
    { 
      label: 'Pending Requests', 
      value: pendingRequestsCount.toString(), 
      icon: Inbox, 
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      shadowColor: 'shadow-amber-100'
    },
    { 
      label: 'Total Requests', 
      value: totalRequests.toString(), 
      icon: MessageCircle, 
      gradient: 'from-blue-500 to-cyan-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      shadowColor: 'shadow-blue-100'
    },
    { 
      label: 'Reputation Score', 
      value: '4.8', 
      icon: Award, 
      gradient: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      shadowColor: 'shadow-purple-100',
      subtitle: 'Based on 3 completed swaps' 
    },
  ]

  // Get recent requests for activity feed
  const recentRequests = swapRequests
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const recentMatches = [
    { name: 'Sarah Chen', skill: 'UI/UX Design', match: '95%', status: 'fair' },
    { name: 'Mike Johnson', skill: 'React Development', match: '88%', status: 'fair' },
    { name: 'Emma Wilson', skill: 'Data Analysis', match: '82%', status: 'good' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-[#0C243D] mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={`group relative overflow-hidden rounded-xl border-2 ${stat.borderColor} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              style={{ backgroundColor: '#F5F7FA' }}
            >
              {/* Gradient Background Accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:opacity-20 transition-opacity`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
                    )}
                  </div>
                </div>
                
                {/* Icon with gradient background */}
                <div className="flex items-center justify-between mt-4">
                  <div className={`p-3 rounded-xl ${stat.iconBg} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                  </div>
                  
                  {/* Decorative element */}
                  <div className={`w-12 h-1 rounded-full bg-gradient-to-r ${stat.gradient} opacity-60`} />
                </div>
              </div>
              
              {/* Hover effect border */}
              <div className={`absolute inset-0 rounded-xl border-2 ${stat.borderColor} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Matches */}
        <div className="rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: '#F5F7FA' }}>
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

        {/* Recent Requests Activity */}
        <div className="rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: '#F5F7FA' }}>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-slate-900">Recent Requests</h3>
          </div>
          <div className="p-6">
            {recentRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Inbox className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No recent requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900">
                          {request.type === 'sent' ? request.toName : request.fromName}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          request.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
                          request.status === 'declined' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {request.type === 'sent' ? 'You sent' : 'You received'} a request
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

