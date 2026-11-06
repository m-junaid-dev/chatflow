import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Moon, Sun, LogOut, User, ChevronDown, X, Hash } from 'lucide-react'
import Avatar from './Avatar'
import ChatList from './ChatList'
import ProfileDrawer from './ProfileDrawer'
import { ConversationSkeleton } from './SkeletonLoader'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { useThemeStore } from '../store/themeStore'

export default function Sidebar({ onSelectConversation, isMobileHidden }) {
  const { user, logout } = useAuthStore()
  const {
    searchResults, isSearching,
    searchUsers, clearSearch,
    startConversation, isLoadingConversations,
  } = useChatStore()
  const { isDark, toggleTheme } = useThemeStore()

  const [query, setQuery]           = useState('')
  const [showMenu, setShowMenu]     = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const debounceRef = useRef(null)
  const menuRef     = useRef(null)

  /* Debounced search */
  const handleSearch = (e) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchUsers(q), 300)
  }

  const handleClear = () => {
    setQuery('')
    clearSearch()
  }

  /* Close profile menu on outside click */
  useEffect(() => {
    if (!showMenu) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const handleUserSelect = async (selectedUser) => {
    handleClear()
    const conv = await startConversation(selectedUser._id)
    if (conv) onSelectConversation(conv)
  }

  const isSearchMode = query.length > 0

  return (
    <>
      <div
        className={`
          w-full md:w-[380px] flex-shrink-0 h-full flex flex-col
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          ${isMobileHidden ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-lg leading-none">💬</span>
            </div>
            <span className="text-lg font-bold gradient-text tracking-tight">ChatFlow</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Dark mode */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Light mode' : 'Dark mode'}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                aria-label="Profile menu"
                aria-expanded={showMenu}
                className="flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Avatar user={user} size="sm" />
                <ChevronDown size={13} className="text-gray-400" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    className="absolute right-0 top-11 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50"
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                  >
                    <button
                      onClick={() => { setShowMenu(false); setShowProfile(true) }}
                      className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <User size={14} /> Profile
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); logout() }}
                      className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={handleSearch}
              placeholder="Search by name, email or ChatFlow ID…"
              aria-label="Search users"
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
            {query && (
              <button
                onClick={handleClear}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isSearchMode ? (
            /* Search results */
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {isSearching ? (
                <div className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">
                  Searching…
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-3xl mb-3">🔍</p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No users found</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Try a name, email, or 11-digit ChatFlow ID
                  </p>
                </div>
              ) : (
                <>
                  <p className="px-4 pt-3 pb-1 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Results
                  </p>
                  {searchResults.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => handleUserSelect(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <Avatar user={u} size="md" showOnline />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                        {u.chatflowId && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Hash size={10} className="text-teal-500 flex-shrink-0" />
                            <span className="text-xs font-mono text-teal-600 dark:text-teal-400">
                              {u.chatflowId}
                            </span>
                          </div>
                        )}
                      </div>
                      {u.isOnline && (
                        <span className="text-xs text-emerald-500 font-semibold flex-shrink-0">Online</span>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : isLoadingConversations ? (
            <ConversationSkeleton />
          ) : (
            <ChatList onSelect={onSelectConversation} />
          )}
        </div>
      </div>

      {/* Self profile drawer */}
      {showProfile && (
        <ProfileDrawer
          user={user}
          isOwnProfile
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  )
}
