/**
 * Avatar — shows user avatar image or initials fallback.
 * Props: user, size ('sm'|'md'|'lg'|'xl'), showOnline (bool)
 */
export default function Avatar({ user, size = 'md', showOnline = false, className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  }

  // Generate a consistent color from the user's name
  const getColor = (name = '') => {
    const colors = [
      'bg-rose-400', 'bg-orange-400', 'bg-amber-400',
      'bg-lime-500', 'bg-teal-500', 'bg-cyan-500',
      'bg-blue-500', 'bg-violet-500', 'bg-pink-500',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const avatarUrl = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_SOCKET_URL || ''}${user.avatar}`)
    : null

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user?.name || 'User'}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-white dark:ring-gray-800`}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
        />
      ) : null}
      <div
        className={`
          ${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white
          ${getColor(user?.name)}
          ${avatarUrl ? 'hidden' : 'flex'}
        `}
      >
        {initials}
      </div>
      {showOnline && user?.isOnline && (
        <span
          className={`
            absolute bottom-0 right-0 ${dotSizes[size]} rounded-full
            bg-emerald-400 border-2 border-white dark:border-gray-800
          `}
          aria-label="Online"
        />
      )}
    </div>
  )
}
