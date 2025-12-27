import { useState } from 'react'
import { Award, ArrowLeftRight, Sparkles, Edit2, Save, X } from 'lucide-react'

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    location: 'San Francisco, CA',
    timezone: 'Pacific Standard Time (PST)',
    age: '28',
  })

  const [editData, setEditData] = useState(profileData)

  const stats = [
    { label: 'Reputation', value: '4.8', icon: Award, bgColor: 'bg-amber-50', iconColor: 'text-amber-600', subtitle: 'Based on 3 completed swaps' },
    { label: 'Swaps', value: '3', icon: ArrowLeftRight, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { label: 'Skills Listed', value: '8', icon: Sparkles, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  ]

  const handleEdit = () => {
    setEditData(profileData)
    setIsEditing(true)
  }

  const handleSave = () => {
    setProfileData(editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData(profileData)
    setIsEditing(false)
  }

  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white" style={{ backgroundColor: '#27496A' }}>
            {profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          
          {/* Name and Email */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{profileData.fullName}</h1>
            <p className="text-gray-600 mt-1">{profileData.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Personal Information Box */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Personal Information</h3>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#27496A' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a52'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27496A'}
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#27496A' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a52'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27496A'}
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-700">{profileData.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-700">{profileData.email}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-700">{profileData.location}</p>
              )}
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Timezone
              </label>
              {isEditing ? (
                <select
                  value={editData.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Pacific Standard Time (PST)">Pacific Standard Time (PST)</option>
                  <option value="Mountain Standard Time (MST)">Mountain Standard Time (MST)</option>
                  <option value="Central Standard Time (CST)">Central Standard Time (CST)</option>
                  <option value="Eastern Standard Time (EST)">Eastern Standard Time (EST)</option>
                  <option value="Coordinated Universal Time (UTC)">Coordinated Universal Time (UTC)</option>
                  <option value="Greenwich Mean Time (GMT)">Greenwich Mean Time (GMT)</option>
                </select>
              ) : (
                <p className="text-gray-700">{profileData.timezone}</p>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Age
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  min="18"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-700">{profileData.age}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

