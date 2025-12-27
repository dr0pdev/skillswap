import { Search, Send, MoreVertical } from 'lucide-react'
import { useState } from 'react'

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState(1)

  const conversations = [
    {
      id: 1,
      name: 'Sarah Chen',
      avatar: 'SC',
      lastMessage: 'Sounds great! When would you like to start?',
      timestamp: '2h ago',
      unread: 2,
      isOnline: true,
    },
    {
      id: 2,
      name: 'Mike Johnson',
      avatar: 'MJ',
      lastMessage: 'I can help you with React hooks and state management',
      timestamp: '5h ago',
      unread: 0,
      isOnline: false,
    },
    {
      id: 3,
      name: 'Emma Wilson',
      avatar: 'EW',
      lastMessage: 'Thanks for the session yesterday!',
      timestamp: '1d ago',
      unread: 0,
      isOnline: true,
    },
    {
      id: 4,
      name: 'David Lee',
      avatar: 'DL',
      lastMessage: 'Let me know if you have any questions',
      timestamp: '2d ago',
      unread: 1,
      isOnline: false,
    },
  ]

  const messages = [
    {
      id: 1,
      sender: 'Sarah Chen',
      text: 'Hi! I saw your profile and I think we could have a great skill swap. I can teach you UI/UX Design in exchange for React Development.',
      timestamp: '2 days ago',
      isMe: false,
    },
    {
      id: 2,
      sender: 'You',
      text: 'That sounds perfect! I\'ve been wanting to improve my design skills. When would you like to start?',
      timestamp: '2 days ago',
      isMe: true,
    },
    {
      id: 3,
      sender: 'Sarah Chen',
      text: 'How about we schedule our first session for next week? I can share some resources beforehand.',
      timestamp: '1 day ago',
      isMe: false,
    },
    {
      id: 4,
      sender: 'You',
      text: 'Perfect! I\'ll prepare some React basics to share with you as well.',
      timestamp: '1 day ago',
      isMe: true,
    },
    {
      id: 5,
      sender: 'Sarah Chen',
      text: 'Sounds great! When would you like to start?',
      timestamp: '2h ago',
      isMe: false,
    },
  ]

  const selectedConversation = conversations.find((c) => c.id === selectedChat)

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)] border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Conversations List */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedChat(conversation.id)}
              className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                selectedChat === conversation.id ? '' : ''
              }`}
              style={selectedChat === conversation.id ? { backgroundColor: 'rgba(39, 73, 106, 0.1)' } : {}}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(39, 73, 106, 0.1)' }}>
                    <span className="font-semibold" style={{ color: '#27496A' }}>{conversation.avatar}</span>
                  </div>
                  {conversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-900 truncate">{conversation.name}</h3>
                    <span className="text-xs text-gray-400">{conversation.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                  {conversation.unread > 0 && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-white text-xs rounded-full" style={{ backgroundColor: '#27496A' }}>
                      {conversation.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(39, 73, 106, 0.1)' }}>
                    <span className="font-semibold" style={{ color: '#27496A' }}>{selectedConversation.avatar}</span>
                  </div>
                  {selectedConversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedConversation.name}</h3>
                  <p className="text-xs text-gray-500">
                    {selectedConversation.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.isMe
                        ? 'text-white'
                        : 'bg-gray-100 text-slate-900'
                    }`}
                    style={message.isMe ? { backgroundColor: '#27496A' } : {}}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.isMe ? 'text-white text-opacity-80' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button className="p-2 text-white rounded-lg transition-colors" style={{ backgroundColor: '#27496A' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a52'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27496A'}>
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Messages

