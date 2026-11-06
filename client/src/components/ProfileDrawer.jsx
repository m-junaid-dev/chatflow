import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Edit3, Check, Copy } from 'lucide-react'
import Avatar from './Avatar'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function ProfileDrawer({ user, isOwnProfile = false, onClose }) {
  const { updateProfile } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [name, setName]     = useState(user?.name || '')
  const [about, setAbout]   = useState(user?.about || '')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile]       = useState(null)
  const [isSaving, setIsSaving]           = useState(false)
  const fileRef = useRef(null)

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('about', about)
      if (avatarFile) fd.append('avatar', avatarFile)
      await updateProfile(fd)
      setEditing(false)
      setAvatarPreview(null)
      setAvatarFile(null)
    } finally {
      setIsSaving(false)
    }
  }

  const displayUser = {
    ...user,
    name:   isOwnProfile ? name  : user?.name,
    about:  isOwnProfile ? about : user?.about,
    avatar: avatarPreview || user?.avatar,
  }

  const copyId = () => {
    if (user?.chatflowId) {
      navigator.clipboard.writeText(user.chatflowId)
      toast.success('ChatFlow ID copied!')
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end font-sans">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Drawer */}
        <motion.div
          className="relative w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl flex flex-col z-10"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white flex-shrink-0">
            <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
            <h2 className="font-bold text-base">
              {isOwnProfile ? 'My Profile' : 'Contact Info'}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Avatar section */}
            <div className="flex flex-col items-center py-8 bg-gray-50 dark:bg-gray-800">
              <div className="relative">
                <Avatar user={displayUser} size="xl" />
                {isOwnProfile && editing && (
                  <>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                      aria-label="Change avatar"
                    >
                      <Camera size={24} />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </>
                )}
              </div>

              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                {displayUser?.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>

              {/* Online badge */}
              {!isOwnProfile && (
                <span className={`mt-2 text-xs px-3 py-1 rounded-full font-medium ${
                  user?.isOnline
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {user?.isOnline ? '🟢 Online' : '⚫ Offline'}
                </span>
              )}
            </div>

            {/* Info fields */}
            <div className="p-6 space-y-6">
              {/* ChatFlow ID */}
              {user?.chatflowId && (
                <div>
                  <label className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                    ChatFlow ID
                  </label>
                  <div className="mt-1.5 flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                    <span className="font-mono text-lg font-bold tracking-widest text-gray-800 dark:text-gray-200">
                      {user.chatflowId}
                    </span>
                    <button
                      onClick={copyId}
                      aria-label="Copy ChatFlow ID"
                      className="p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 text-teal-500 transition-colors"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Share this ID so others can add you on ChatFlow.
                  </p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  Name
                </label>
                {isOwnProfile && editing ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    aria-label="Name"
                    className="mt-1.5 w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ) : (
                  <p className="mt-1.5 text-gray-900 dark:text-gray-100 font-semibold">{displayUser?.name}</p>
                )}
              </div>

              {/* About */}
              <div>
                <label className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  About
                </label>
                {isOwnProfile && editing ? (
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    maxLength={139}
                    rows={3}
                    aria-label="About"
                    className="mt-1.5 w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                ) : (
                  <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">
                    {displayUser?.about || 'Hey there! I am using ChatFlow.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          {isOwnProfile && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              {editing ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => { setEditing(false); setAvatarPreview(null); setAvatarFile(null) }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSaving
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><Check size={15} /> Save</>}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Edit3 size={15} /> Edit Profile
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
