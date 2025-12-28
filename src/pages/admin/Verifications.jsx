import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Verifications() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [processing, setProcessing] = useState({})

  useEffect(() => {
    fetchVerificationRequests()
  }, [filter])

  const fetchVerificationRequests = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('verification_submitted_at', { ascending: false, nullsFirst: false })

      if (filter !== 'all') {
        query = query.eq('verification_status', filter)
      } else {
        query = query.in('verification_status', ['pending', 'verified', 'rejected'])
      }

      const { data, error } = await query

      if (error) throw error

      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching verification requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    setProcessing({ ...processing, [userId]: true })
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          verification_status: 'verified',
          verification_reviewed_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Log admin activity
      await supabase.from('admin_activity_logs').insert({
        admin_id: (await supabase.auth.getUser()).data.user.id,
        action: 'approve_verification',
        target_user_id: userId,
        details: { status: 'approved' }
      })

      fetchVerificationRequests()
    } catch (error) {
      console.error('Error approving verification:', error)
      alert('Failed to approve verification: ' + error.message)
    } finally {
      setProcessing({ ...processing, [userId]: false })
    }
  }

  const handleReject = async (userId) => {
    const reason = prompt('Enter rejection reason (optional):')
    
    setProcessing({ ...processing, [userId]: true })
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          verification_status: 'rejected',
          verification_reviewed_at: new Date().toISOString(),
          verification_notes: reason || 'Document verification failed'
        })
        .eq('id', userId)

      if (error) throw error

      // Log admin activity
      await supabase.from('admin_activity_logs').insert({
        admin_id: (await supabase.auth.getUser()).data.user.id,
        action: 'reject_verification',
        target_user_id: userId,
        details: { status: 'rejected', reason }
      })

      fetchVerificationRequests()
    } catch (error) {
      console.error('Error rejecting verification:', error)
      alert('Failed to reject verification: ' + error.message)
    } finally {
      setProcessing({ ...processing, [userId]: false })
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      verified: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    }
    return badges[status] || badges.pending
  }

  const getDocumentTypeLabel = (type) => {
    return type === 'cnic' ? 'CNIC' : 'Student ID'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title">Identity Verification Requests</h1>
        <p className="section-subtitle">Review and manage user verification requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">Pending</p>
              <p className="text-2xl font-bold text-warning-400">
                {requests.filter(r => r.verification_status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-warning-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">Verified</p>
              <p className="text-2xl font-bold text-success-400">
                {filter === 'all' ? requests.filter(r => r.verification_status === 'verified').length : '-'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-success-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">Rejected</p>
              <p className="text-2xl font-bold text-error-400">
                {filter === 'all' ? requests.filter(r => r.verification_status === 'rejected').length : '-'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-error-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">Total</p>
              <p className="text-2xl font-bold text-primary-400">{requests.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-dark-800">
        {['pending', 'verified', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors capitalize ${
              filter === status
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-dark-400 hover:text-dark-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-dark-400">Loading verification requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-dark-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-dark-400">No verification requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">Document Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">Submitted</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-300">Document</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-dark-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-dark-800/50 hover:bg-dark-800/20 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-dark-100">{request.full_name || 'No name'}</p>
                        <p className="text-sm text-dark-400">{request.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="badge badge-secondary">
                        {getDocumentTypeLabel(request.verification_document_type)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border capitalize ${getStatusBadge(request.verification_status)}`}>
                        {request.verification_status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-dark-300">
                      {request.verification_submitted_at 
                        ? new Date(request.verification_submitted_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="py-4 px-4">
                      {request.verification_document_url ? (
                        <a
                          href={request.verification_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View
                        </a>
                      ) : (
                        <span className="text-dark-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {request.verification_status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={processing[request.id]}
                            className="btn btn-sm bg-success-950/30 hover:bg-success-950/50 text-success-400 border-success-800/50"
                          >
                            {processing[request.id] ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processing[request.id]}
                            className="btn btn-sm bg-error-950/30 hover:bg-error-950/50 text-error-400 border-error-800/50"
                          >
                            {processing[request.id] ? '...' : 'Reject'}
                          </button>
                        </div>
                      )}
                      {request.verification_status === 'verified' && (
                        <span className="text-sm text-success-400 flex items-center justify-end gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approved
                        </span>
                      )}
                      {request.verification_status === 'rejected' && (
                        <span className="text-sm text-error-400 flex items-center justify-end gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

