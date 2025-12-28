import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ChatView from '../components/chat/ChatView'
import { UserCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

export default function Chat() {
  const { user } = useAuth()
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState(null)
  const [selectedPartner, setSelectedPartner] = useState(null)

  useEffect(() => {
    if (user?.id) {
      fetchThreads()
      
      // Subscribe to new messages - update only the affected thread
      const subscription = supabase
        .channel('chat-threads-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages'
          },
          async (payload) => {
            const messageThreadId = payload.new.thread_id
            const senderId = payload.new.sender_id
            
            // Only update the specific thread that changed, not all threads
            setThreads(prevThreads => {
              const updatedThreads = prevThreads.map(thread => {
                if (thread.id === messageThreadId) {
                  // Update last message and unread count for this thread
                  const isFromPartner = senderId !== user.id
                  
                  return {
                    ...thread,
                    lastMessage: {
                      content: payload.new.content,
                      created_at: payload.new.created_at,
                      sender_id: senderId,
                      is_read: payload.new.is_read
                    },
                    last_message_at: payload.new.created_at,
                    unreadCount: isFromPartner 
                      ? (thread.unreadCount || 0) + 1 
                      : thread.unreadCount
                  }
                }
                return thread
              })
              
              // Sort threads by last_message_at (most recent first)
              return updatedThreads.sort((a, b) => {
                const timeA = new Date(a.last_message_at || 0).getTime()
                const timeB = new Date(b.last_message_at || 0).getTime()
                return timeB - timeA
              })
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages'
          },
          async (payload) => {
            const messageThreadId = payload.new.thread_id
            
            // If message was marked as read, update unread count
            if (payload.new.is_read && payload.old.is_read === false) {
              setThreads(prevThreads => {
                return prevThreads.map(thread => {
                  if (thread.id === messageThreadId) {
                    return {
                      ...thread,
                      unreadCount: Math.max(0, (thread.unreadCount || 0) - 1)
                    }
                  }
                  return thread
                })
              })
            }
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user?.id])

  const fetchThreads = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Fetch all threads where user is participant
      const { data: userThreads, error: threadsError } = await supabase
        .from('chat_threads')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (threadsError) throw threadsError

      // Fetch partner info and last message for each thread
      const threadsWithDetails = await Promise.all(
        (userThreads || []).map(async (thread) => {
          const partnerId = thread.user1_id === user.id ? thread.user2_id : thread.user1_id

          if (!partnerId) {
            console.warn('Chat: No partnerId found for thread:', thread.id)
            return {
              ...thread,
              partner: { id: null, full_name: 'Unknown User', email: null },
              lastMessage: null,
              unreadCount: 0
            }
          }

          // Get partner info - try multiple query methods
          let partnerData = null
          let partnerError = null
          
          // Method 1: Try with specific columns (avatar_url doesn't exist, so exclude it)
          try {
            const result = await supabase
              .from('users')
              .select('id, full_name, email')
              .eq('id', partnerId)
              .maybeSingle()
            
            partnerData = result.data
            partnerError = result.error
            
            // Method 2: If that fails, try selecting all columns
            if (partnerError || !partnerData) {
              console.warn('Chat: First query failed, trying select all:', partnerError?.message)
              const result2 = await supabase
                .from('users')
                .select('*')
                .eq('id', partnerId)
                .maybeSingle()
              
              if (!result2.error && result2.data) {
                partnerData = result2.data
                partnerError = null
                console.log('Chat: Success with select all')
              } else {
                partnerError = result2.error || partnerError
              }
            }
            
            if (partnerError) {
              console.error('Chat: Error fetching partner:', {
                error: partnerError,
                partnerId,
                message: partnerError.message,
                code: partnerError.code,
                details: partnerError.details,
                hint: partnerError.hint
              })
            }
          } catch (err) {
            console.error('Chat: Exception fetching partner:', err)
            partnerError = err
          }
          
          // Final partner data with better fallback
          const finalPartnerData = partnerData || {
            id: partnerId,
            full_name: partnerId ? `User ${partnerId.substring(0, 8)}` : 'Unknown User',
            email: null
          }
          
          if (!partnerData) {
            console.warn('Chat: Using fallback partner data:', {
              threadId: thread.id,
              partnerId,
              fallbackName: finalPartnerData.full_name
            })
          }

          // Get last message
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select('content, created_at, sender_id, is_read')
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('thread_id', thread.id)
            .eq('sender_id', partnerId)
            .eq('is_read', false)

          return {
            ...thread,
            partner: finalPartnerData || { 
              id: partnerId, 
              full_name: 'Unknown User',
              email: null
            },
            lastMessage: lastMessage || null,
            unreadCount: unreadCount || 0
          }
        })
      )

      setThreads(threadsWithDetails)
    } catch (error) {
      console.error('Error fetching threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChat = (thread) => {
    setSelectedPartner(thread.partner)
    setSelectedThread(thread)
  }

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0C243D] flex items-center gap-3 ">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-primary-500 " />
            Messages
          </h1>
          <p className="text-[#0C243D] mt-1">
            Connect with your swap partners
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="bg-dark-900 rounded-lg shadow-lg h-[calc(100vh-200px)] flex flex-col">
            {/* List Header */}
            <div className="p-4 border-b border-dark-800/40">
              <h2 className="text-lg font-semibold text-dark-100">
                Conversations
              </h2>
              <p className="text-xs text-dark-500 mt-1">
                {threads.length} {threads.length === 1 ? 'conversation' : 'conversations'}
              </p>
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mb-4">
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-dark-500" />
                  </div>
                  <p className="text-dark-300 font-medium mb-2">No conversations yet</p>
                  <p className="text-sm text-dark-500">
                    Start chatting from swap cards or proposals
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-dark-800/40">
                  {threads.map((thread) => {
                    const isSelected = selectedThread?.id === thread.id
                    const isUnread = thread.unreadCount > 0

                    return (
                      <button
                        key={thread.id}
                        onClick={() => handleOpenChat(thread)}
                        className={`
                          w-full p-4 text-left hover:bg-dark-800/50 transition-colors
                          ${isSelected ? 'bg-dark-800 border-l-2 border-primary-500' : ''}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          {thread.partner?.avatar_url ? (
                            <img
                              src={thread.partner.avatar_url}
                              alt={thread.partner.full_name}
                              className="w-12 h-12 rounded-full ring-2 ring-dark-700 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center flex-shrink-0">
                              <UserCircleIcon className="w-8 h-8 text-dark-500" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={`
                                text-sm font-semibold truncate
                                ${isUnread ? 'text-dark-100' : 'text-dark-300'}
                              `}>
                                {thread.partner?.full_name || 'Unknown User'}
                              </h3>
                              {thread.lastMessage && (
                                <span className="text-xs text-dark-500 flex-shrink-0 ml-2">
                                  {formatLastMessageTime(thread.lastMessage.created_at)}
                                </span>
                              )}
                            </div>

                            {thread.lastMessage ? (
                              <p className={`
                                text-sm truncate
                                ${isUnread ? 'text-dark-200 font-medium' : 'text-dark-500'}
                              `}>
                                {thread.lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-xs text-dark-500 italic">
                                No messages yet
                              </p>
                            )}

                            {/* Unread Badge */}
                            {isUnread && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-semibold rounded-full">
                                  {thread.unreadCount} {thread.unreadCount === 1 ? 'new' : 'new'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat View */}
        <div className="lg:col-span-2">
          {selectedPartner ? (
            <div className="h-[calc(100vh-200px)]">
              <ChatView
                partner={selectedPartner}
                threadId={selectedThread?.id}
                onClose={() => {
                  setSelectedPartner(null)
                  setSelectedThread(null)
                  // No need to refetch - real-time updates handle this
                }}
              />
            </div>
          ) : (
            <div className="bg-dark-900 rounded-lg shadow-lg h-[calc(100vh-200px)] flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-4">
                  <ChatBubbleLeftRightIcon className="w-10 h-10 text-dark-500" />
                </div>
                <h3 className="text-xl font-semibold text-dark-200 mb-2">
                  Select a conversation
                </h3>
                <p className="text-dark-500">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

