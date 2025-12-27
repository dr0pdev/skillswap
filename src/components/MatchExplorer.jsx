import { useState } from 'react'
import { Search, Filter, Star, MessageCircle, User, ArrowLeftRight, Info } from 'lucide-react'
import confetti from 'canvas-confetti'

const MatchExplorer = () => {
  const [hoveredCard, setHoveredCard] = useState(null)

  // User's skills (this would come from user profile in a real app)
  const userSkills = {
    offer: 'Python Programming',
    want: 'UI/UX Design',
  }

  const matches = [
    {
      id: 1,
      name: 'Sarah Chen',
      avatar: 'SC',
      offerSkill: 'UI/UX Design',
      wantSkill: 'Python Programming',
      matchScore: 95,
      fairnessScore: 98,
      location: 'San Francisco, CA',
      rating: 4.9,
      reviews: 24,
      isFairMatch: true,
      matchLogic: 'Both skills require ~10 hours/week and have high market demand parity. Experience levels align perfectly.',
      timeCommitment: '10 hours/week',
      marketDemand: 'High',
    },
    {
      id: 2,
      name: 'Mike Johnson',
      avatar: 'MJ',
      offerSkill: 'React Development',
      wantSkill: 'Python Programming',
      matchScore: 88,
      fairnessScore: 92,
      location: 'New York, NY',
      rating: 4.7,
      reviews: 18,
      isFairMatch: true,
      matchLogic: 'Both skills require ~8 hours/week. Similar complexity levels and market value.',
      timeCommitment: '8 hours/week',
      marketDemand: 'High',
    },
    {
      id: 3,
      name: 'Emma Wilson',
      avatar: 'EW',
      offerSkill: 'Data Analysis',
      wantSkill: 'Python Programming',
      matchScore: 82,
      fairnessScore: 85,
      location: 'Austin, TX',
      rating: 4.8,
      reviews: 31,
      isFairMatch: true,
      matchLogic: 'Both skills require ~12 hours/week. Complementary skill sets with balanced exchange value.',
      timeCommitment: '12 hours/week',
      marketDemand: 'Medium-High',
    },
    {
      id: 4,
      name: 'David Lee',
      avatar: 'DL',
      offerSkill: 'Machine Learning',
      wantSkill: 'Python Programming',
      matchScore: 79,
      fairnessScore: 78,
      location: 'Seattle, WA',
      rating: 4.6,
      reviews: 15,
      isFairMatch: false,
      matchLogic: 'Time commitment differs slightly (~15 vs 10 hours/week). Market demand is similar.',
      timeCommitment: '15 hours/week',
      marketDemand: 'High',
    },
    {
      id: 5,
      name: 'Lisa Park',
      avatar: 'LP',
      offerSkill: 'Graphic Design',
      wantSkill: 'Python Programming',
      matchScore: 91,
      fairnessScore: 95,
      location: 'Los Angeles, CA',
      rating: 5.0,
      reviews: 42,
      isFairMatch: true,
      matchLogic: 'Perfect time alignment (~10 hours/week). Both skills have excellent market demand parity.',
      timeCommitment: '10 hours/week',
      marketDemand: 'High',
    },
    {
      id: 6,
      name: 'Alex Rivera',
      avatar: 'AR',
      offerSkill: 'Python Programming',
      wantSkill: 'UI/UX Design',
      matchScore: 87,
      fairnessScore: 96,
      location: 'Boston, MA',
      rating: 4.9,
      reviews: 28,
      isFairMatch: true,
      matchLogic: 'Ideal swap match! Both skills require ~10 hours/week with identical market demand levels.',
      timeCommitment: '10 hours/week',
      marketDemand: 'High',
    },
  ]

  const handleMouseEnter = (matchId) => {
    setHoveredCard(matchId)
  }

  const handleMouseLeave = () => {
    setHoveredCard(null)
  }

  const handleSendSwapRequest = (matchId) => {
    // Trigger confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
    })

    // Show success message (you could add a toast notification here)
    setTimeout(() => {
      alert(`Swap request sent to ${matches.find(m => m.id === matchId)?.name}! 🎉`)
    }, 500)
  }

  const getFairnessLabel = (score) => {
    if (score >= 95) return 'Perfect Match'
    if (score >= 90) return 'Excellent Match'
    if (score >= 85) return 'Great Match'
    if (score >= 80) return 'Good Match'
    return 'Fair Match'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#0C243D] mt-1">Match Explorer</h2>
          <p className="text-[#0C243D] mt-1">Discover potential skill swap partners with AI-powered fairness scoring</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by skill, location, or name..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Match Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <div
            key={match.id}
            className="relative bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            onMouseEnter={() => handleMouseEnter(match.id)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Top: User Avatar and Name */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center border-2" style={{ backgroundColor: 'rgba(39, 73, 106, 0.1)', borderColor: 'rgba(39, 73, 106, 0.3)' }}>
                <span className="font-bold text-lg" style={{ color: '#27496A' }}>{match.avatar}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-lg">{match.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-600 font-medium">{match.rating}</span>
                  <span className="text-sm text-gray-400">({match.reviews} reviews)</span>
                </div>
              </div>
            </div>

            {/* Middle: Swap Equation Visualization */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(39, 73, 106, 0.1)', borderColor: 'rgba(39, 73, 106, 0.2)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#27496A' }}>YOU OFFER</p>
                  <p className="font-semibold text-slate-900">{userSkills.offer}</p>
                </div>
                <div className="flex items-center justify-center my-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                    <ArrowLeftRight className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium mb-1">THEY OFFER</p>
                  <p className="font-semibold text-slate-900">{match.offerSkill}</p>
                </div>
              </div>
            </div>

            {/* Bottom: Fairness Score Badge */}
            <div className="mb-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-indigo-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Fairness Score</p>
                    <p className="text-lg font-bold text-slate-900">{match.fairnessScore}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-semibold">
                    {getFairnessLabel(match.fairnessScore)}
                  </span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>{match.location}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleSendSwapRequest(match.id)}
                className="flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: '#27496A' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a52'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27496A'}
              >
                <span>Send Swap Request</span>
              </button>
              <button className="px-4 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Hover Tooltip */}
            {hoveredCard === match.id && (
              <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-4 text-white rounded-lg shadow-xl pointer-events-none" style={{ backgroundColor: '#27496A' }}>
                <div className="flex items-start gap-2 mb-2">
                  <Info className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold mb-1">Match Logic</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{match.matchLogic}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Time Commitment:</span>
                    <span className="text-white font-medium">{match.timeCommitment}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Market Demand:</span>
                    <span className="text-emerald-400 font-medium">{match.marketDemand}</span>
                  </div>
                </div>
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent" style={{ borderTopColor: '#27496A' }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MatchExplorer
