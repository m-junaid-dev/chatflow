import { useEffect, useRef } from 'react'
import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket'
import toast from 'react-hot-toast'

export default function Chat() {
  const { user, token, fetchMe } = useAuthStore()
  const {
    activeConversation,
    setActiveConversation,
    fetchConversations,
    addMessage,
    replaceOptimisticMessage,
    updateMessageStatus,
    updateMessageDeleted,
    setTyping,
    setUserOnline,
    setUserOffline,
    upsertConversation,         // ← new: instant sidebar update
    markAsRead,
  } = useChatStore()

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const socketInitRef = useRef(false)

  // Responsive
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Initial data
  useEffect(() => {
    fetchMe()
    fetchConversations()
  }, [])

  // Socket setup
  useEffect(() => {
    if (!token || socketInitRef.current) return
    socketInitRef.current = true

    const socket = connectSocket(token)

    // ── NEW MESSAGE ───────────────────────────────────────────────────────
    socket.on('message:new', ({ message, conversation, isNewConversation }) => {
      // 1. Add message to store
      addMessage(message)

      // 2. Update or add the conversation in sidebar INSTANTLY (no fetch needed)
      if (conversation) {
        upsertConversation(conversation)
      }

      // 3. If this conversation is active → mark as read immediately
      const activeConv = useChatStore.getState().activeConversation
      if (activeConv?._id === message.conversationId) {
        const senderId = message.sender?._id || message.sender
        markAsRead(message.conversationId, senderId)
      }

      // 4. If tab is not focused → notification
      if (document.hidden) {
        playNotificationBeep()
        showBrowserNotification(message)
      }
    })

    // ── SENT CONFIRMATION (sender side) ──────────────────────────────────
    socket.on('message:sent', ({ tempId, message, conversation }) => {
      replaceOptimisticMessage(tempId, message)
      // Update sender's sidebar too
      if (conversation) upsertConversation(conversation)
    })

    // ── DELIVERED ─────────────────────────────────────────────────────────
    socket.on('message:delivered', ({ messageIds, deliveredTo }) => {
      // Update status for each delivered message
      if (Array.isArray(messageIds)) {
        messageIds.forEach((id) => updateMessageStatus(id, 'delivered'))
      }
    })

    // ── READ ──────────────────────────────────────────────────────────────
    socket.on('message:read', ({ conversationId, readBy }) => {
      updateMessageStatus(null, 'read', conversationId)
    })

    // ── DELETED ───────────────────────────────────────────────────────────
    socket.on('message:deleted', ({ messageId, mode }) => {
      updateMessageDeleted(messageId, mode === 'everyone')
    })

    // ── TYPING ────────────────────────────────────────────────────────────
    socket.on('typing', ({ senderId, isTyping }) => {
      setTyping(senderId, isTyping)
    })

    // ── ONLINE / OFFLINE ──────────────────────────────────────────────────
    socket.on('user:online', ({ userId }) => setUserOnline(userId))
    socket.on('user:offline', ({ userId, lastSeen }) => setUserOffline(userId, lastSeen))

    return () => {
      disconnectSocket()
      socketInitRef.current = false
    }
  }, [token])

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv)
    // Mark messages as read
    const other = conv.participants?.find((p) => p._id !== user?._id)
    if (other && conv._id) {
      markAsRead(conv._id, other._id)
      // Reset unread badge locally
      useChatStore.setState((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === conv._id
            ? { ...c, unreadCount: { ...(c.unreadCount || {}), [user._id]: 0 } }
            : c
        ),
      }))
    }
  }

  const handleBack = () => setActiveConversation(null)

  const showSidebar = !isMobile || !activeConversation
  const showChat    = !isMobile || !!activeConversation

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-950 font-sans">
      <div className="flex w-full h-full max-w-[1600px] mx-auto shadow-2xl">
        {showSidebar && (
          <Sidebar
            onSelectConversation={handleSelectConversation}
            isMobileHidden={!showSidebar}
          />
        )}
        {showChat && (
          <ChatWindow
            conversation={activeConversation}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function playNotificationBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.value = 0.12
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.stop(ctx.currentTime + 0.25)
  } catch {}
}

function showBrowserNotification(message) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    const name = message.sender?.name || 'Someone'
    const body = message.text || (message.image ? '📷 Photo' : 'New message')
    new Notification(`💬 ${name}`, { body, tag: 'chatflow-msg' })
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission()
  }
}
