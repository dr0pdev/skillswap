import React, { useState, useEffect, useRef } from 'react'
import { XMarkIcon, PaperAirplaneIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function ChatModal({ onClose, partner }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [threadId, setThreadId] = useState(null)
  const messagesEndRef = useRef(null)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize chat thread and fetch messages
  useEffect(() => {
    if (!user?.id || !partner?.id) {
      console.log('ChatModal: Missing user or partner', { userId: user?.id, partnerId: partner?.id })
      setLoading(false)
      return
    }

    let cancelled = false

    const initChat = async () => {
      try {
        console.log('ChatModal: Initializing chat...', { userId: user.id, partnerId: partner.id })
        setLoading(true)

        // Fallback: Manually check for existing thread or create one
        const user1Id = user.id < partner.id ? user.id : partner.id
        const user2Id = user.id < partner.id ? partner.id : user.id

        console.log('ChatModal: Checking for thread...', { user1Id, user2Id })

        // Check if thread exists
        const { data: existingThread, error: checkError } = await supabase
          .from('chat_threads')
          .select('id')
          .eq('user1_id', user1Id)
          .eq('user2_id', user2Id)
          .maybeSingle()

        if (cancelled) {
          console.log('ChatModal: Cancelled during thread check')
          return
        }

        if (checkError) {
          console.error('ChatModal: Error checking for thread:', checkError)
          throw checkError
        }

        let threadIdData = null

        if (existingThread) {
          threadIdData = existingThread.id
          console.log('ChatModal: Found existing thread:', threadIdData)
        } else {
          console.log('ChatModal: Creating new thread...')
          // Create new thread
          const { data: newThread, error: createError } = await supabase
            .from('chat_threads')
            .insert({
              user1_id: user1Id,
              user2_id: user2Id
            })
            .select('id')
            .single()

          if (cancelled) {
            console.log('ChatModal: Cancelled during thread creation')
            return
          }

          if (createError) {
            console.error('ChatModal: Error creating thread:', createError)
            throw createError
          }

          threadIdData = newThread.id
          console.log('ChatModal: Created new thread:', threadIdData)
        }

        if (!threadIdData) {
          throw new Error('Failed to get or create thread')
        }

        setThreadId(threadIdData)

        // Fetch existing messages
        console.log('ChatModal: Fetching messages for thread:', threadIdData)
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select(`
            id,
            content,
            sender_id,
            is_read,
            created_at
          `)
          .eq('thread_id', threadIdData)
          .order('created_at', { ascending: true })

        if (cancelled) {
          console.log('ChatModal: Cancelled during message fetch')
          return
        }

        if (messagesError) {
          console.error('ChatModal: Error fetching messages:', messagesError)
          // Continue anyway - show empty state
          setMessages([])
        } else {
          console.log('ChatModal: Fetched messages:', messagesData?.length || 0)
          setMessages(messagesData || [])
        }

        // Mark messages from partner as read (non-blocking)
        if (messagesData && messagesData.length > 0) {
          const unreadMessages = messagesData.filter(
            m => m.sender_id === partner.id && !m.is_read
          )
          
          if (unreadMessages.length > 0) {
            supabase
              .from('chat_messages')
              .update({ is_read: true })
              .in('id', unreadMessages.map(m => m.id))
              .then(() => console.log('ChatModal: Marked messages as read'))
              .catch(err => console.error('ChatModal: Error marking as read:', err))
          }
        }

        console.log('ChatModal: Initialization complete')
      } catch (error) {
        console.error('ChatModal: Error initializing chat:', error)
        if (!cancelled) {
          alert(`Failed to load chat: ${error.message || 'Unknown error'}`)
        }
      } finally {
        if (!cancelled) {
          console.log('ChatModal: Setting loading to false')
          setLoading(false)
        }
      }
    }

    initChat()

    return () => {
      cancelled = true
      console.log('ChatModal: Cleanup - cancelled')
    }
  }, [user?.id, partner?.id])

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!threadId) return

    const subscription = supabase
      .channel(`chat:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`
        },
        async (payload) => {
          console.log('New message received:', payload)

          // Fetch the full message with sender info
          const { data: newMsg, error } = await supabase
            .from('chat_messages')
            .select(`
              id,
              content,
              sender_id,
              is_read,
              created_at,
              sender:sender_id (
                id,
                email,
                raw_user_meta_data
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (!error && newMsg) {
            setMessages(prev => [...prev, newMsg])

            // Auto-mark as read if it's from the partner
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
  }, [threadId, partner?.id])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || sending) {
      console.log('ChatModal: Cannot send - missing message or already sending', {
        hasMessage: !!newMessage.trim(),
        sending,
        threadId
      })
      return
    }

    if (!threadId) {
      console.error('ChatModal: Cannot send - no thread ID')
      alert('Chat is still initializing. Please wait a moment and try again.')
      return
    }

    if (!user?.id) {
      console.error('ChatModal: Cannot send - no user ID')
      alert('You must be logged in to send messages.')
      return
    }

    const messageContent = newMessage.trim()
    console.log('ChatModal: Sending message...', { threadId, messageLength: messageContent.length })

    try {
      setSending(true)

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          content: messageContent
        })
        .select()
        .single()

      if (error) {
        console.error('ChatModal: Error sending message:', error)
        throw error
      }

      console.log('ChatModal: Message sent successfully:', data.id)
      
      // Optimistically add message to UI
      setMessages(prev => [...prev, {
        id: data.id,
        content: messageContent,
        sender_id: user.id,
        is_read: false,
        created_at: new Date().toISOString()
      }])

      setNewMessage('')
    } catch (error) {
      console.error('ChatModal: Error sending message:', error)
      alert(`Failed to send message: ${error.message || 'Please try again'}`)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // If rendered in Chat page (not as modal), use different styling
  const isEmbedded = !onClose || window.location.pathname === '/chat'
  
  return (
    <div className={isEmbedded 
      ? "w-full h-[600px] bg-dark-900 border border-dark-700 rounded-xl shadow-2xl flex flex-col"
      : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/70 backdrop-blur-sm animate-fade-in"
    }>
      <div className={isEmbedded 
        ? "relative w-full h-full bg-dark-900 border border-dark-700 rounded-xl shadow-2xl flex flex-col"
        : "relative w-full max-w-2xl h-[600px] mx-auto bg-dark-900 border border-dark-700 rounded-xl shadow-2xl flex flex-col"
      }>
        
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
              <UserCircleIcon className="w-10 h-10 text-dark-400" />
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
          <button 
            onClick={onClose} 
            className="text-dark-400 hover:text-dark-100 transition-colors p-1.5 hover:bg-dark-800 rounded-lg"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
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
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user.id
                const showDate = index === 0 || 
                  new Date(messages[index - 1].created_at).toDateString() !== 
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
                          : 'bg-dark-800 text-dark-100 rounded-bl-sm'
                        }
                      `}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <div className={`
                          text-[10px] mt-1 flex items-center gap-1
                          ${isMe ? 'text-primary-200' : 'text-dark-500'}
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
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || !threadId || loading}
              className="btn btn-primary h-11 px-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={!threadId ? 'Chat is initializing...' : !newMessage.trim() ? 'Type a message' : ''}
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="hidden sm:inline">Loading...</span>
                </>
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
    </div>
  )
}
