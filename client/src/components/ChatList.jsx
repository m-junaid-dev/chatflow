import { motion } from 'framer-motion'
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns'
import Avatar from './Avatar'
import TypingDots from './TypingDots'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'

/**
 * ChatList — renders the list of conversations.
 * Props: onSelect(conversation)
 */
export default function ChatList({ onSelect }) {
  const { user } = useAuthStore()
  const { conversations, activeConversation, typingUsers, isLoadingConversations } = useChatStore()

  const getOtherUser = (conv) =>
    conv.participants?.find((p) => p._id !== user?._id) || {}

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isToday(date)) return format(date, 'h:mm a')
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'dd/MM/yy')
  }

  const getLastMessage = (conv) => {
    const msg = conv.lastMessage
    if (!msg) return 'No messages yet'
    if (msg.deletedForEveryone) return '🚫 This message was deleted'
    if (msg.deletedFor?.includes(user?._id)) return 'Message deleted'
    if (msg.image && !msg.text) return '📷 Photo'
    if (msg.image && msg.text) return `📷 ${msg.text}`
    return msg.text || ''
  }

  const getUnreadCount = (conv) => {
    if (!conv.unreadCount) return 0
    return conv.unreadCount[user?._id] || 0
  }

  if (conversations.length === 0 && !isLoadingConversations) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center py-12">
        <div className="text-5xl mb-4">💬</div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">No conversations yet</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          Search for someone above to start chatting!
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {conversations.map((conv, idx) => {
        const other = getOtherUser(conv)
        const isActive = activeConversation?._id === conv._id
        const isTyping = typingUsers[other._id]
        const unread = getUnreadCount(conv)

        return (
          <motion.button
            key={conv._id}
            onClick={() => onSelect(conv)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left
              ${isActive
                ? 'bg-teal-50 dark:bg-teal-900/30 border-r-2 border-teal-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
            aria-label={`Chat with ${other.name}`}
            aria-current={isActive ? 'true' : undefined}
          >
            <Avatar user={other} size="md" showOnline />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                  {other.name}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                  {formatTime(conv.updatedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
                  {isTyping ? (
                    <span className="text-teal-500 dark:text-teal-400 italic flex items-center gap-1">
                      typing <TypingDots />
                    </span>
                  ) : (
                    getLastMessage(conv)
                  )}
                </span>
                {unread > 0 && (
                  <span className="unread-badge ml-2 flex-shrink-0">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
