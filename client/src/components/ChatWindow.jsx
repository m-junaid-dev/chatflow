import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Phone, Video, MoreVertical, Info, ChevronDown } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import Avatar from './Avatar'
import MessageBubble from './MessageBubble'
import Composer from './Composer'
import DateSeparator from './DateSeparator'
import TypingDots from './TypingDots'
import ProfileDrawer from './ProfileDrawer'
import { MessageSkeleton } from './SkeletonLoader'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { getSocket } from '../lib/socket'

/**
 * Get other participant from a conversation.
 */
function getOtherUser(conv, currentUserId) {
  return conv?.participants?.find((p) => p._id !== currentUserId) || {}
}

/**
 * Format last-seen string.
 */
function formatLastSeen(user) {
  if (user?.isOnline) return 'Online'
  if (!user?.lastSeen) return 'Offline'
  const date = new Date(user.lastSeen)
  if (isToday(date)) return `last seen today at ${format(date, 'h:mm a')}`
  if (isYesterday(date)) return `last seen yesterday at ${format(date, 'h:mm a')}`
  return `last seen ${format(date, 'dd MMM')} at ${format(date, 'h:mm a')}`
}

/**
 * Get date separator label.
 */
function getDateLabel(dateStr) {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'd MMMM yyyy')
}

/**
 * ChatWindow — the main message panel.
 */
export default function ChatWindow({ conversation, onBack }) {
  const { user } = useAuthStore()
  const {
    messages: allMessages,
    isLoadingMessages,
    hasMore,
    typingUsers,
    fetchMessages,
    markAsRead,
  } = useChatStore()

  const [page, setPage] = useState(1)
  const [replyTo, setReplyTo] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const topSentinelRef = useRef(null)
  const notificationSoundRef = useRef(null)
  const prevMessageCountRef = useRef(0)

  const otherUser = getOtherUser(conversation, user?._id)
  const convId = conversation?._id
  const messages = allMessages[convId] || []
  const isTyping = typingUsers[otherUser?._id]

  // Notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...'  // placeholder tiny WAV
    )
    notificationSoundRef.current.volume = 0.5
  }, [])

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!otherUser?._id) return
    setPage(1)
    fetchMessages(otherUser._id, 1).then((data) => {
      if (data) {
        scrollToBottom('instant')
        // Mark as read
        markAsRead(convId, otherUser._id)
      }
    })
  }, [convId, otherUser?._id])

  // Scroll to bottom when new message added (only if near bottom)
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200

    if (messages.length > prevMessageCountRef.current && isNearBottom) {
      scrollToBottom('smooth')
    }
    prevMessageCountRef.current = messages.length
  }, [messages.length])

  // Infinite scroll — load older messages when scrolled to top
  useEffect(() => {
    const sentinel = topSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore[convId] && !isLoadingMessages) {
          const container = messagesContainerRef.current
          const prevScrollHeight = container?.scrollHeight || 0
          const nextPage = page + 1
          setPage(nextPage)
          await fetchMessages(otherUser._id, nextPage)
          // Restore scroll position
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight
          }
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [convId, hasMore, isLoadingMessages, page, otherUser?._id])

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' })
  }

  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    setShowScrollBtn(distFromBottom > 300)
  }

  const handleReply = (message) => {
    setReplyTo(message)
    window.dispatchEvent(new CustomEvent('chat:reply', { detail: message }))
  }

  // Date separator logic
  const renderMessages = () => {
    const elements = []
    let lastDateLabel = null

    messages.forEach((msg, idx) => {
      // Skip messages deleted for me
      if (msg.deletedFor?.includes(user?._id) && !msg.deletedForEveryone) return

      const dateLabel = msg.createdAt ? getDateLabel(msg.createdAt) : null
      if (dateLabel && dateLabel !== lastDateLabel) {
        elements.push(<DateSeparator key={`sep-${msg._id}`} label={dateLabel} />)
        lastDateLabel = dateLabel
      }

      const isSent = msg.sender?._id === user?._id || msg.sender === user?._id
      const prevMsg = messages[idx - 1]
      const isGrouped =
        prevMsg &&
        (prevMsg.sender?._id === msg.sender?._id || prevMsg.sender === msg.sender) &&
        msg.createdAt &&
        prevMsg.createdAt &&
        (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) < 2 * 60 * 1000

      elements.push(
        <MessageBubble
          key={msg._id || msg.tempId}
          message={msg}
          isSent={isSent}
          isGrouped={!!isGrouped}
          onReply={handleReply}
        />
      )
    })

    return elements
  }

  if (!conversation) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-8xl mb-6">💬</div>
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            Welcome to ChatFlow
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs">
            Select a conversation from the sidebar or search for someone to start chatting.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 relative">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          {/* Back button (mobile) */}
          <button
            onClick={onBack}
            className="md:hidden p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>

          {/* User info — click to view profile */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
            aria-label="View contact info"
          >
            <Avatar user={otherUser} size="md" showOnline />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                {otherUser.name}
              </p>
              <p
                className="text-xs truncate"
                aria-live="polite"
                style={{
                  color: isTyping ? '#14b8a6' : otherUser?.isOnline ? '#10b981' : '#9ca3af',
                }}
              >
                {isTyping ? (
                  <span className="flex items-center gap-1">
                    typing <TypingDots />
                  </span>
                ) : (
                  formatLastSeen(otherUser)
                )}
              </p>
            </div>
          </button>
        </div>

        {/* Messages area — relative so scroll-btn positions inside it */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-thin chat-wallpaper px-2 sm:px-4 py-2 relative"
          aria-label="Messages"
        >
          {/* Top sentinel for infinite scroll */}
          <div ref={topSentinelRef} className="h-1" />

          {/* Loading older messages */}
          {isLoadingMessages && page > 1 && (
            <div className="text-center py-3">
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm">
                Loading older messages…
              </span>
            </div>
          )}

          {/* Initial load skeleton */}
          {isLoadingMessages && page === 1 ? (
            <MessageSkeleton />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-4xl mb-3">👋</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Say hi to <strong>{otherUser.name}</strong>!
              </p>
            </div>
          ) : (
            renderMessages()
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              onClick={() => scrollToBottom()}
              className="absolute bottom-24 right-6 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              aria-label="Scroll to bottom"
            >
              <ChevronDown size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Composer */}
        <Composer
          receiverId={otherUser?._id}
          conversationId={convId}
        />
      </div>

      {/* Contact profile drawer */}
      {showProfile && (
        <ProfileDrawer
          user={otherUser}
          isOwnProfile={false}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  )
}
