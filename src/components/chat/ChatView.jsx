import React, { useState, useEffect, useRef } from 'react'
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Inline Chat View Component (for Chat page, not modal)
 */
export default function ChatView({ partner, threadId: initialThreadId, onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [threadId, setThreadId] = useState(initialThreadId)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!user?.id || !partner?.id) {
      setLoading(false)
      return
    }

    let cancelled = false

    const initChat = async () => {
      try {
        setLoading(true)

        let currentThreadId = initialThreadId

        if (!currentThreadId) {
          // Get or create thread
          const user1Id = user.id < partner.id ? user.id : partner.id
          const user2Id = user.id < partner.id ? partner.id : user.id

          const { data: existingThread } = await supabase
            .from('chat_threads')
            .select('id')
            .eq('user1_id', user1Id)
            .eq('user2_id', user2Id)
            .maybeSingle()

          if (existingThread) {
            currentThreadId = existingThread.id
          } else {
            const { data: newThread } = await supabase
              .from('chat_threads')
              .insert({ user1_id: user1Id, user2_id: user2Id })
              .select('id')
              .single()
            currentThreadId = newThread?.id
          }
        }

        if (cancelled || !currentThreadId) {
          setLoading(false)
          return
        }

        setThreadId(currentThreadId)

        // Fetch messages
        const { data: messagesData } = await supabase
          .from('chat_messages')
          .select('id, content, sender_id, is_read, created_at')
          .eq('thread_id', currentThreadId)
          .order('created_at', { ascending: true })

        if (!cancelled) {
          // Deduplicate messages by ID
          const uniqueMessages = (messagesData || []).reduce((acc, msg) => {
            if (!acc.find(m => m.id === msg.id)) {
              acc.push(msg)
            }
            return acc
          }, [])
          setMessages(uniqueMessages)
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    initChat()

    return () => {
      cancelled = true
    }
  }, [user?.id, partner?.id, initialThreadId])

  // Subscribe to real-time updates
  useEffect(() => {
    const currentThreadId = initialThreadId || threadId
    if (!currentThreadId) return

    const subscription = supabase
      .channel(`chat:${currentThreadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${currentThreadId}`
        },
        async (payload) => {
          const { data: newMsg } = await supabase
            .from('chat_messages')
            .select('id, content, sender_id, is_read, created_at')
            .eq('id', payload.new.id)
            .single()

          if (newMsg) {
            // Prevent duplicates: check if message already exists
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === newMsg.id)
              if (exists) {
                console.log('Chat: Message already exists, skipping duplicate:', newMsg.id)
                return prev
              }
              return [...prev, newMsg]
            })
            
            if (newMsg.sender_id === partner.id) {
              await supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('id', newMsg.id)
            }
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [initialThreadId, threadId, partner?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    const currentThreadId = initialThreadId || threadId
    if (!newMessage.trim() || !currentThreadId || sending) return

    const messageContent = newMessage.trim()
    setSending(true)

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: currentThreadId,
          sender_id: user.id,
          content: messageContent
        })
        .select()
        .single()

      if (error) throw error

      // Add message optimistically, but real-time will also add it
      // So we'll deduplicate in the real-time handler
      const optimisticMessage = {
        id: data.id,
        content: messageContent,
        sender_id: user.id,
        is_read: false,
        created_at: data.created_at || new Date().toISOString()
      }

      setMessages(prev => {
        // Check if already exists (from real-time)
        const exists = prev.some(msg => msg.id === optimisticMessage.id)
        if (exists) {
          return prev
        }
        return [...prev, optimisticMessage]
      })

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert(`Failed to send: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="w-full h-full bg-dark-900 border border-dark-700 rounded-xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-dark-800 bg-dark-900/95">
        <div className="flex items-center gap-3">
          {partner?.avatar_url ? (
            <img
              src={partner.avatar_url}
              alt={partner.full_name}
              className="w-10 h-10 rounded-full ring-2 ring-primary-600/50"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center">
              <span className="text-dark-300 font-semibold">
                {partner?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-dark-100">
              {partner?.full_name || 'User'}
            </h3>
            <p className="text-xs text-dark-400">
              {partner?.email || ''}
            </p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-dark-400 hover:text-dark-100 transition-colors p-1.5 hover:bg-dark-800 rounded-lg"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-dark-950/30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-dark-300 font-medium mb-2">Start the conversation</p>
            <p className="text-sm text-dark-500">
              Send a message to connect with {partner?.full_name || 'this user'}
            </p>
          </div>
        ) : (
          <>
            {/* Deduplicate messages by ID before rendering */}
            {messages
              .filter((msg, index, self) => 
                index === self.findIndex(m => m.id === msg.id)
              )
              .map((msg, index, filteredMessages) => {
                const isMe = msg.sender_id === user.id
                const showDate = index === 0 || 
                  new Date(filteredMessages[index - 1]?.created_at).toDateString() !== 
                  new Date(msg.created_at).toDateString()

                return (
                  <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 text-xs font-medium text-dark-400 bg-dark-800/50 rounded-full">
                        {new Date(msg.created_at).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                      max-w-[70%] rounded-2xl px-4 py-2.5
                      ${isMe 
                        ? 'bg-primary-600 text-white rounded-br-sm' 
                        : 'bg-dark-800 rounded-bl-sm'
                      }
                    `}>
                      <p className="text-sm whitespace-pre-wrap break-words text-white">
                        {msg.content}
                      </p>
                      <div className={`
                        text-[10px] mt-1 flex items-center gap-1
                        ${isMe ? 'text-primary-200' : 'text-white/70'}
                      `}>
                        <span>{formatTime(msg.created_at)}</span>
                        {isMe && (
                          <span className="ml-1">
                            {msg.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              )
              })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-800 bg-dark-900/95">
        <div className="flex items-end gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(e)
              }
            }}
            placeholder={`Message ${partner?.full_name || 'user'}...`}
            className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={sending || !(initialThreadId || threadId)}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !(initialThreadId || threadId) || loading}
            className="btn btn-primary h-11 px-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <span className="hidden sm:inline">Send</span>
                <PaperAirplaneIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-dark-500 mt-2 ml-1">
          Press Enter to send, Shift + Enter for new line
        </p>
      </form>
    </div>
  )
}

