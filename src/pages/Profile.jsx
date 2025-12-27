import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants'

export default function Profile() {
  const { profile, updateProfile } = useAuth()
  const { success, error: showError } = useToast()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    timezone: profile?.timezone || '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await updateProfile(formData)
    
    if (error) {
      showError(ERROR_MESSAGES.PROFILE_UPDATE_ERROR)
    } else {
      success(SUCCESS_MESSAGES.PROFILE_UPDATED)
      setEditing(false)
    }
    
    setLoading(false)
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      timezone: profile?.timezone || '',
    })
    setEditing(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">Profile</h1>
          <p className="section-subtitle">Manage your account information</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="btn btn-primary gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Avatar & Header Card */}
      <div className="card-glass">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl">
            {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-dark-100 mb-1">
              {profile?.full_name || 'Anonymous User'}
            </h2>
            <p className="text-dark-400 mb-3">{profile?.email}</p>
            <div className="flex flex-wrap gap-2">
              {profile?.location && (
                <span className="badge badge-secondary gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile.location}
                </span>
              )}
              {profile?.timezone && (
                <span className="badge badge-secondary gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {profile.timezone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-glass text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warning-600/20 to-warning-800/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-dark-100 mb-1">
            {profile?.reputation_score?.toFixed(1) || '50.0'}
          </div>
          <div className="text-sm text-dark-400">Reputation</div>
        </div>

        <div className="card-glass text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-success-600/20 to-success-800/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-dark-100 mb-1">
            {profile?.total_swaps_completed || 0}
          </div>
          <div className="text-sm text-dark-400">Swaps</div>
        </div>

        <div className="card-glass text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600/20 to-primary-800/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-dark-100 mb-1">
            {profile?.total_hours_taught?.toFixed(1) || '0.0'}
          </div>
          <div className="text-sm text-dark-400">Hours Taught</div>
        </div>

        <div className="card-glass text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-600/20 to-accent-800/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-dark-100 mb-1">
            {profile?.total_hours_learned?.toFixed(1) || '0.0'}
          </div>
          <div className="text-sm text-dark-400">Hours Learned</div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card">
        <h2 className="text-xl font-bold text-dark-100 mb-6">
          Personal Information
        </h2>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="input"
                rows="4"
                placeholder="Tell others about yourself, your interests, and what you're looking to learn or teach..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>

              <div>
                <label className="label">Timezone</label>
                <input
                  type="text"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., America/Los_Angeles"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="spinner-small"></div>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-dark-500 font-medium mb-1 block">Email</label>
                <p className="text-dark-100">{profile?.email}</p>
              </div>

              <div>
                <label className="text-sm text-dark-500 font-medium mb-1 block">Full Name</label>
                <p className="text-dark-100">
                  {profile?.full_name || 'Not set'}
                </p>
              </div>

              <div>
                <label className="text-sm text-dark-500 font-medium mb-1 block">Location</label>
                <p className="text-dark-100">
                  {profile?.location || 'Not set'}
                </p>
              </div>

              <div>
                <label className="text-sm text-dark-500 font-medium mb-1 block">Timezone</label>
                <p className="text-dark-100">
                  {profile?.timezone || 'Not set'}
                </p>
              </div>
            </div>

            {profile?.bio && (
              <div>
                <label className="text-sm text-dark-500 font-medium mb-2 block">Bio</label>
                <p className="text-dark-200 leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account Information */}
      <div className="card">
        <h2 className="text-xl font-bold text-dark-100 mb-4">
          Account Information
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-dark-800">
            <div>
              <p className="text-dark-200 font-medium">Account Status</p>
              <p className="text-sm text-dark-400">Your account is active</p>
            </div>
            <span className="badge badge-success">Active</span>
          </div>
          
          <div className="flex justify-between items-center pb-4 border-b border-dark-800">
            <div>
              <p className="text-dark-200 font-medium">Email Verified</p>
              <p className="text-sm text-dark-400">Your email is confirmed</p>
            </div>
            <span className="badge badge-success gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Verified
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-dark-200 font-medium">Member Since</p>
              <p className="text-sm text-dark-400">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
