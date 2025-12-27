import { useState } from 'react'
import { Send, Inbox, CheckCircle, XCircle, Clock, MessageCircle, User, Calendar } from 'lucide-react'

const SwapRequests = ({ requests, onAcceptRequest, onDeclineRequest, onCancelRequest, onMessageClick }) => {
  const [activeTab, setActiveTab] = useState('received') // 'received' or 'sent'

  const receivedRequests = requests.filter(r => r.type === 'received')
  const sentRequests = requests.filter(r => r.type === 'sent')

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock },
      accepted: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle },
      declined: { bg: 'bg-red-50', text: 'text-red-600', icon: XCircle },
      expired: { bg: 'bg-gray-50', text: 'text-gray-600', icon: Clock },
    }
    const style = styles[status] || styles.pending
    const Icon = style.icon

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#0C243D] mt-1">Swap Requests</h2>
        <p className="text-[#0C243D] mt-1">Manage your sent and received skill swap requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'received'
              ? 'text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            <span>Received</span>
            {receivedRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                {receivedRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </div>
          {activeTab === 'received' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'sent'
              ? 'text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            <span>Sent</span>
            {sentRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                {sentRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </div>
          {activeTab === 'sent' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
      </div>

      {/* Received Requests */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          {receivedRequests.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-gray-200" style={{ backgroundColor: '#F5F7FA' }}>
              <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No received requests</p>
            </div>
          ) : (
            receivedRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: '#F5F7FA' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#27496A' }}>
                      {request.fromName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{request.fromName}</h3>
                      <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="mb-4 space-y-3">
                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-600 mb-1">THEY OFFER</p>
                    <p className="font-semibold text-slate-900">{request.theirSkill}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-600 mb-1">YOU OFFER</p>
                    <p className="font-semibold text-slate-900">{request.yourSkill}</p>
                  </div>
                </div>

                {request.message && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{request.message}</p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onAcceptRequest(request.id)}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => onDeclineRequest(request.id)}
                      className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                    <button
                      onClick={() => onMessageClick(request.fromId)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {request.status === 'accepted' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onMessageClick(request.fromId)}
                      className="flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#27496A' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a52'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27496A'}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Start Chat
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Sent Requests */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {sentRequests.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-gray-200" style={{ backgroundColor: '#F5F7FA' }}>
              <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No sent requests</p>
            </div>
          ) : (
            sentRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: '#F5F7FA' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#27496A' }}>
                      {request.toName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{request.toName}</h3>
                      <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="mb-4 space-y-3">
                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-600 mb-1">YOU OFFER</p>
                    <p className="font-semibold text-slate-900">{request.yourSkill}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-600 mb-1">THEY OFFER</p>
                    <p className="font-semibold text-slate-900">{request.theirSkill}</p>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onCancelRequest(request.id)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel Request
                    </button>
                    <button
                      onClick={() => onMessageClick(request.toId)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                  </div>
                )}

                {request.status === 'accepted' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onMessageClick(request.toId)}
                      className="flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#27496A' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a52'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27496A'}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Start Chat
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default SwapRequests

