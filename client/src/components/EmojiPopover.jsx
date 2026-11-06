import { useEffect, useRef } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { useThemeStore } from '../store/themeStore'

/**
 * EmojiPopover — floating emoji picker.
 * Props: onEmojiClick(emoji), onClose()
 */
export default function EmojiPopover({ onEmojiClick, onClose }) {
  const ref = useRef(null)
  const isDark = useThemeStore((s) => s.isDark)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose()
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute bottom-16 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden"
    >
      <EmojiPicker
        onEmojiClick={(emojiData) => onEmojiClick(emojiData.emoji)}
        theme={isDark ? 'dark' : 'light'}
        searchDisabled={false}
        skinTonesDisabled
        height={380}
        width={320}
        previewConfig={{ showPreview: false }}
      />
    </div>
  )
}
