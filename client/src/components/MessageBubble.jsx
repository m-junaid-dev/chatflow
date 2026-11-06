import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, CheckCheck, CornerUpRight, Trash2, Copy } from 'lucide-react'
import { format } from 'date-fns'
import Avatar from './Avatar'
import ImagePreview from './ImagePreview'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { getSocket } from '../lib/socket'

/**
 * DeliveryTick — single/double grey/blue ticks.
 */
function DeliveryTick({ status }) {
  if (status === 'sent') {
    return <Check size={14} className="tick-sent flex-shrink-0" aria-label="Sent" />
  }
  if (status === 'delivered') {
    return <CheckCheck size={14} className="tick-delivered flex-shrink-0" aria-label="Delivered" />
  }
  if (status === 'read') {
    return <CheckCheck size={14} className="tick-read flex-shrink-0" aria-label="Read" />
  }
  return null
}

/**
 * MessageBubble — a single chat message.
 */
export default function MessageBubble({ message, isSent, isGrouped, onReply }) {
  const { user } = useAuthStore()
  const { deleteMessage } = useChatStore()
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const [previewImg, setPreviewImg] = useState(null)
  const menuRef = useRef(null)

  const isDeleted = message.deletedForEveryone

  const imageUrl = message.image
    ? (message.image.startsWith('http') ? message.image : `${import.meta.env.VITE_SOCKET_URL || ''}${message.image}`)
    : null

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  const openMenu = (e) => {
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
    setShowMenu(true)
  }

  const handleDelete = async (mode) => {
    setShowMenu(false)
    try {
      await deleteMessage(message._id, mode)
      if (mode === 'everyone') {
        const socket = getSocket()
        socket?.emit('message:delete', { messageId: message._id, mode })
      }
    } catch {}
  }

  const handleCopy = () => {
    setShowMenu(false)
    if (message.text) navigator.clipboard.writeText(message.text)
  }

  const timeStr = message.createdAt
    ? format(new Date(message.createdAt), 'h:mm a')
    : ''

  const replyUser = message.replyTo?.sender
  const replyText = message.replyTo?.text || (message.replyTo?.image ? '📷 Photo' : '')
  const replyName = typeof replyUser === 'object' ? replyUser?.name : 'Unknown'

  return (
    <>
      <motion.div
        className={`flex items-end gap-2 ${isSent ? 'flex-row-reverse' : ''} ${isGrouped ? 'mt-0.5' : 'mt-3'}`}
        initial={{ opacity: 0, scale: 0.85, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onContextMenu={!isDeleted ? openMenu : undefined}
      >
        {/* Avatar — only for received, non-grouped */}
        {!isSent && !isGrouped && (
          <Avatar user={message.sender} size="sm" className="mb-1 flex-shrink-0" />
        )}
        {!isSent && isGrouped && <div className="w-8 flex-shrink-0" />}

        {/* Bubble */}
        <div
          className={`
            relative max-w-[72%] sm:max-w-[60%]
            ${isSent
              ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-2xl rounded-br-sm'
              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-sm shadow-sm'
            }
            px-3 py-2 shadow-sm select-text
          `}
        >
          {/* Deleted state */}
          {isDeleted ? (
            <span className="italic text-sm opacity-70 flex items-center gap-1.5">
              🚫 This message was deleted
            </span>
          ) : (
            <>
              {/* Reply preview */}
              {message.replyTo && (
                <div className={`mb-2 px-2 py-1.5 rounded-lg border-l-2 ${isSent ? 'bg-white/20 border-white/60' : 'bg-gray-100 dark:bg-gray-600 border-teal-400'} text-xs`}>
                  <p className={`font-semibold mb-0.5 ${isSent ? 'text-white/90' : 'text-teal-600 dark:text-teal-400'}`}>
                    {replyName}
                  </p>
                  <p className={`truncate ${isSent ? 'text-white/75' : 'text-gray-500 dark:text-gray-300'}`}>
                    {replyText}
                  </p>
                </div>
              )}

              {/* Image */}
              {imageUrl && (
                <button
                  onClick={() => setPreviewImg(imageUrl)}
                  className="block w-full mb-1 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="View image"
                >
                  <img
                    src={imageUrl}
                    alt="Shared image"
                    className="w-full max-w-[240px] object-cover rounded-xl"
                    loading="lazy"
                  />
                </button>
              )}

              {/* Text */}
              {message.text && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}

              {/* Footer: time + ticks */}
              <div className={`flex items-center gap-1 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                <span className={`text-[10px] ${isSent ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                  {timeStr}
                </span>
                {isSent && <DeliveryTick status={message.status} />}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            ref={menuRef}
            className="context-menu"
            style={{
              position: 'fixed',
              top: menuPos.y,
              left: menuPos.x,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            <button
              onClick={() => { setShowMenu(false); onReply?.(message) }}
              className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              <CornerUpRight size={15} /> Reply
            </button>
            {message.text && (
              <button
                onClick={handleCopy}
                className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                <Copy size={15} /> Copy
              </button>
            )}
            <button
              onClick={() => handleDelete('me')}
              className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-2.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400"
            >
              <Trash2 size={15} /> Delete for Me
            </button>
            {isSent && (
              <button
                onClick={() => handleDelete('everyone')}
                className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-2.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400"
              >
                <Trash2 size={15} /> Delete for Everyone
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image preview modal */}
      {previewImg && (
        <ImagePreview src={previewImg} onClose={() => setPreviewImg(null)} />
      )}
    </>
  )
}
