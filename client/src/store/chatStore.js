import { create } from 'zustand'
import api from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuthStore } from './authStore'
import toast from 'react-hot-toast'

export const useChatStore = create((set, get) => ({
  conversations:            [],
  activeConversation:       null,
  messages:                 {},   // { conversationId: [msg, ...] }
  hasMore:                  {},   // { conversationId: boolean }
  typingUsers:              {},   // { userId: boolean }
  onlineUsers:              new Set(),
  isLoadingConversations:   false,
  isLoadingMessages:        false,
  searchResults:            [],
  isSearching:              false,

  // ── Conversations ──────────────────────────────────────────────────────
  fetchConversations: async () => {
    set({ isLoadingConversations: true })
    try {
      const { data } = await api.get('/conversations')
      set({ conversations: data.conversations })
    } catch (err) {
      console.error('fetchConversations:', err)
    } finally {
      set({ isLoadingConversations: false })
    }
  },

  setActiveConversation: (conv) => set({ activeConversation: conv }),

  startConversation: async (receiverId) => {
    try {
      const { data } = await api.post('/conversations/start', { receiverId })
      const conv = data.conversation
      set((state) => {
        const exists = state.conversations.find((c) => c._id === conv._id)
        return {
          activeConversation: conv,
          conversations: exists
            ? state.conversations
            : [conv, ...state.conversations],
        }
      })
      return conv
    } catch (err) {
      toast.error('Could not start conversation')
      throw err
    }
  },

  /**
   * Upsert a conversation in the list (add if new, update if existing).
   * Called from socket events so new chats appear instantly.
   */
  upsertConversation: (conv) => {
    if (!conv || !conv._id) return
    set((state) => {
      const idx = state.conversations.findIndex((c) => c._id === conv._id)
      let updated
      if (idx === -1) {
        // Brand new conversation — add at top
        updated = [conv, ...state.conversations]
      } else {
        // Update existing entry
        updated = [...state.conversations]
        updated[idx] = { ...updated[idx], ...conv }
      }
      // Sort by updatedAt descending
      updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      return { conversations: updated }
    })
  },

  // ── Messages ───────────────────────────────────────────────────────────
  fetchMessages: async (userId, page = 1) => {
    set({ isLoadingMessages: true })
    try {
      const { data } = await api.get(`/messages/${userId}?page=${page}&limit=30`)
      const msgs = data.messages || []
      const convId = data.conversationId
      set((state) => {
        const existing = state.messages[convId] || []
        return {
          messages: {
            ...state.messages,
            [convId]: page === 1 ? msgs : [...msgs, ...existing],
          },
          hasMore: {
            ...state.hasMore,
            [convId]: data.hasMore,
          },
        }
      })
      return data
    } catch (err) {
      console.error('fetchMessages:', err)
    } finally {
      set({ isLoadingMessages: false })
    }
  },

  /**
   * Add a message to the store. Deduplicates by _id.
   * Also replaces any optimistic message that has matching tempId.
   */
  addMessage: (message) => {
    const convId = message.conversationId
    if (!convId) return
    set((state) => {
      const existing = state.messages[convId] || []
      if (existing.some((m) => m._id === message._id)) return state // dedup

      // Replace optimistic entry
      const filtered = message.tempId
        ? existing.filter((m) => m.tempId !== message.tempId)
        : existing

      return {
        messages: { ...state.messages, [convId]: [...filtered, message] },
      }
    })
  },

  replaceOptimisticMessage: (tempId, realMessage) => {
    const convId = realMessage.conversationId
    set((state) => {
      const existing = state.messages[convId] || []
      const replaced = existing.map((m) => (m.tempId === tempId ? realMessage : m))
      return { messages: { ...state.messages, [convId]: replaced } }
    })
  },

  sendMessage: ({ receiverId, text, image, replyTo, tempId }) => {
    const socket = getSocket()
    if (!socket) return

    // Optimistic bubble
    const { user } = useAuthStore.getState()
    const convId = get().activeConversation?._id

    if (convId) {
      const optimistic = {
        _id: tempId,
        tempId,
        conversationId: convId,
        sender: user,
        receiver: { _id: receiverId },
        text: text || null,
        image: image || null,
        replyTo: replyTo || null,
        status: 'sent',
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      }
      set((state) => ({
        messages: {
          ...state.messages,
          [convId]: [...(state.messages[convId] || []), optimistic],
        },
      }))
    }

    socket.emit('message:send', { receiverId, text, image, replyTo, tempId })
  },

  deleteMessage: async (messageId, mode) => {
    try {
      await api.delete(`/messages/${messageId}?mode=${mode}`)
      set((state) => {
        const updated = {}
        for (const cid in state.messages) {
          updated[cid] = state.messages[cid].map((m) =>
            m._id === messageId
              ? mode === 'everyone'
                ? { ...m, deletedForEveryone: true, text: null, image: null }
                : { ...m, _deleted_for_me: true }
              : m
          )
        }
        return { messages: updated }
      })
    } catch (err) {
      toast.error('Failed to delete message')
      throw err
    }
  },

  updateMessageStatus: (messageId, status, conversationId) => {
    set((state) => {
      if (conversationId) {
        // Bulk read — update all in this conversation
        const msgs = state.messages[conversationId]
        if (!msgs) return state
        return {
          messages: {
            ...state.messages,
            [conversationId]: msgs.map((m) =>
              m.status !== 'read' ? { ...m, status } : m
            ),
          },
        }
      }
      // Single message
      const updated = {}
      for (const cid in state.messages) {
        updated[cid] = state.messages[cid].map((m) =>
          m._id === messageId ? { ...m, status } : m
        )
      }
      return { messages: updated }
    })
  },

  updateMessageDeleted: (messageId, deletedForEveryone) => {
    set((state) => {
      const updated = {}
      for (const cid in state.messages) {
        updated[cid] = state.messages[cid].map((m) =>
          m._id === messageId
            ? { ...m, deletedForEveryone, text: deletedForEveryone ? null : m.text }
            : m
        )
      }
      return { messages: updated }
    })
  },

  markAsRead: (conversationId, senderId) => {
    const socket = getSocket()
    if (socket && conversationId && senderId) {
      socket.emit('message:read', { conversationId, senderId })
    }
  },

  // ── Typing ─────────────────────────────────────────────────────────────
  setTyping: (userId, isTyping) => {
    set((state) => ({ typingUsers: { ...state.typingUsers, [userId]: isTyping } }))
    // Auto-clear after 3s
    if (isTyping) {
      setTimeout(() => {
        set((state) => ({ typingUsers: { ...state.typingUsers, [userId]: false } }))
      }, 3000)
    }
  },

  // ── Online status ──────────────────────────────────────────────────────
  setUserOnline: (userId) => {
    set((state) => {
      const next = new Set(state.onlineUsers)
      next.add(userId)
      return {
        onlineUsers: next,
        conversations: state.conversations.map((c) => ({
          ...c,
          participants: c.participants?.map((p) =>
            p._id === userId ? { ...p, isOnline: true } : p
          ),
        })),
      }
    })
  },

  setUserOffline: (userId, lastSeen) => {
    set((state) => {
      const next = new Set(state.onlineUsers)
      next.delete(userId)
      return {
        onlineUsers: next,
        conversations: state.conversations.map((c) => ({
          ...c,
          participants: c.participants?.map((p) =>
            p._id === userId ? { ...p, isOnline: false, lastSeen } : p
          ),
        })),
      }
    })
  },

  // ── User search ────────────────────────────────────────────────────────
  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false })
      return
    }
    set({ isSearching: true })
    try {
      const { data } = await api.get(`/users?search=${encodeURIComponent(query)}`)
      set({ searchResults: data.users })
    } catch {
      set({ searchResults: [] })
    } finally {
      set({ isSearching: false })
    }
  },

  clearSearch: () => set({ searchResults: [], isSearching: false }),
}))
