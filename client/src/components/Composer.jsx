import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smile, Paperclip, Send, X, Image as ImageIcon, CornerUpLeft } from 'lucide-react'
import EmojiPopover from './EmojiPopover'
import api from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import toast from 'react-hot-toast'
// generateId below replaces uuid

// uuid polyfill for browser
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Composer — message input area at the bottom of the chat.
 * Props: receiverId (string), conversationId (string)
 */
export default function Composer({ receiverId, conversationId }) {
  const { user } = useAuthStore()
  const { sendMessage } = useChatStore()
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef(null)
  const fileRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const socket = getSocket()

  // Expose setReplyTo to parent via window event
  useEffect(() => {
    const handler = (e) => setReplyTo(e.detail)
    window.addEventListener('chat:reply', handler)
    return () => window.removeEventListener('chat:reply', handler)
  }, [])

  const adjustHeight = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  const emitTyping = (isTyping) => {
    socket?.emit(isTyping ? 'typing:start' : 'typing:stop', { receiverId })
  }

  const handleInput = (e) => {
    setText(e.target.value)
    adjustHeight()
    // Typing indicator
    if (!typingTimeoutRef.current) {
      emitTyping(true)
    }
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false)
      typingTimeoutRef.current = null
    }, 1500)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setShowEmoji(false)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed && !imageFile) return
    if (isSending) return

    setIsSending(true)
    emitTyping(false)
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = null

    try {
      let uploadedImageUrl = null

      // Upload image first if present
      if (imageFile) {
        const formData = new FormData()
        formData.append('image', imageFile)
        const { data } = await api.post('/messages/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        uploadedImageUrl = data.imageUrl
      }

      const tempId = generateId()
      await sendMessage({
        receiverId,
        text: trimmed || null,
        image: uploadedImageUrl,
        replyTo: replyTo?._id || null,
        tempId,
      })

      setText('')
      clearImage()
      setReplyTo(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (err) {
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-3 py-2">
      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-900/30 border-l-4 border-teal-500"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CornerUpLeft size={14} className="text-teal-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                {replyTo.sender?.name || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {replyTo.text || (replyTo.image ? '📷 Photo' : '')}
              </p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              aria-label="Cancel reply"
              className="p-1 rounded-full hover:bg-teal-100 dark:hover:bg-teal-800 transition-colors"
            >
              <X size={14} className="text-teal-600 dark:text-teal-300" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            className="relative mb-2 inline-block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <img
              src={imagePreview}
              alt="To send"
              className="h-24 w-auto rounded-xl object-cover border-2 border-teal-200 dark:border-teal-700"
            />
            <button
              onClick={clearImage}
              aria-label="Remove image"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="relative flex items-end gap-2">
        {/* Emoji button */}
        <div className="relative">
          <button
            onClick={() => setShowEmoji((v) => !v)}
            aria-label="Open emoji picker"
            className="p-2 rounded-full text-gray-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
          >
            <Smile size={22} />
          </button>
          {showEmoji && (
            <EmojiPopover
              onEmojiClick={(emoji) => {
                setText((t) => t + emoji)
                textareaRef.current?.focus()
              }}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          aria-label="Message input"
          className="
            flex-1 resize-none rounded-2xl border border-gray-200 dark:border-gray-600
            bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100
            px-4 py-2.5 text-sm leading-relaxed
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
            transition-all duration-200 max-h-[120px] scrollbar-thin
          "
          style={{ height: 'auto' }}
        />

        {/* Image upload */}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleImageChange}
          aria-label="Attach image"
        />
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Attach image"
          className="p-2 rounded-full text-gray-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
        >
          <ImageIcon size={22} />
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={isSending || (!text.trim() && !imageFile)}
          aria-label="Send message"
          className="
            p-2.5 rounded-full btn-gradient
            disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center justify-center
          "
        >
          {isSending ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  )
}
