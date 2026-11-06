import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * OtpInput — 6-box OTP input with auto-advance, backspace, paste support.
 * Props:
 *   value: string (6 chars)
 *   onChange: (value: string) => void
 *   disabled?: boolean
 */
export default function OtpInput({ value = '', onChange, disabled = false }) {
  const [otp, setOtp] = useState(Array(6).fill(''))
  const refs = useRef([])

  // Sync external value
  useEffect(() => {
    if (value.length === 0) {
      setOtp(Array(6).fill(''))
    }
  }, [value])

  const notify = (arr) => {
    onChange(arr.join(''))
  }

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = val
    setOtp(next)
    notify(next)
    if (val && idx < 5) {
      refs.current[idx + 1]?.focus()
    }
  }

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (otp[idx]) {
        const next = [...otp]
        next[idx] = ''
        setOtp(next)
        notify(next)
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus()
        const next = [...otp]
        next[idx - 1] = ''
        setOtp(next)
        notify(next)
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      refs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < 5) {
      refs.current[idx + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = Array(6).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    notify(next)
    const focusIdx = Math.min(pasted.length, 5)
    refs.current[focusIdx]?.focus()
  }

  // Auto-focus first box
  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handlePaste}>
      {otp.map((digit, idx) => (
        <motion.input
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          disabled={disabled}
          aria-label={`OTP digit ${idx + 1}`}
          className="
            w-11 h-12 sm:w-12 sm:h-13 text-center text-xl font-bold rounded-xl border-2
            border-gray-200 dark:border-gray-600
            bg-white dark:bg-gray-700
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30
            transition-all duration-200 caret-teal-500
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
      ))}
    </div>
  )
}
