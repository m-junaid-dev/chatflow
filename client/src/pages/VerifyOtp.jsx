import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, Smartphone } from 'lucide-react'
import OtpInput from '../components/OtpInput'
import { useAuthStore } from '../store/authStore'

export default function VerifyOtp() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { verifyOtp, resendOtp, isLoading } = useAuthStore()

  const email   = location.state?.email   || ''
  const purpose = location.state?.purpose || 'verify'

  // demoOtp is only present for demo accounts (or if the server has no email configured)
  const [demoOtp, setDemoOtp]     = useState(location.state?.demoOtp || null)
  const [otp, setOtp]             = useState('')
  const [success, setSuccess]     = useState(false)

  // 5-minute OTP expiry countdown
  const [countdown, setCountdown]         = useState(300)
  // 60-second resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0)

  const countdownRef = useRef(null)
  const cooldownRef  = useRef(null)

  /* Redirect if no email */
  useEffect(() => {
    if (!email) navigate('/login')
  }, [email, navigate])

  /* 5-min countdown */
  useEffect(() => {
    countdownRef.current = setInterval(() =>
      setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(countdownRef.current)
  }, [])

  /* 60-sec resend cooldown */
  useEffect(() => {
    if (resendCooldown <= 0) return
    cooldownRef.current = setInterval(() =>
      setResendCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(cooldownRef.current)
  }, [resendCooldown])

  /* Auto-submit when all 6 digits entered */
  useEffect(() => {
    if (otp.length === 6 && !isLoading) handleVerify(otp)
  }, [otp])

  const handleVerify = async (code = otp) => {
    if ((code || otp).length !== 6 || isLoading) return
    try {
      await verifyOtp(email, code || otp, purpose)
      setSuccess(true)
      setTimeout(() => navigate('/chat'), 1600)
    } catch {
      setOtp('')
    }
  }

  /* Resend — goes to email (on screen only for demo accounts) */
  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return
    try {
      const result = await resendOtp(email, purpose)
      setResendCooldown(60)
      setCountdown(300)
      if (result.demoOtp) setDemoOtp(result.demoOtp)
    } catch {}
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (!email) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 font-sans">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">

          {success ? (
            /* ── Success screen ── */
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={42} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Verified!</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Taking you to chat…</p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-7">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Smartphone size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {purpose === 'reset' ? 'Reset Password' : 'Verify your email'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter the 6-digit code sent to
                </p>
                <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 mt-0.5">
                  {email}
                </p>
              </div>

              {/* ── Demo OTP banner (demo accounts only) ── */}
              <AnimatePresence>
                {demoOtp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                      <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                          Demo account OTP (testing only)
                        </p>
                        <p className="text-xl font-mono font-bold tracking-[0.3em] text-amber-800 dark:text-amber-200 mt-0.5">
                          {demoOtp}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* OTP boxes */}
              <div className="mb-6">
                <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
              </div>

              {/* Countdown */}
              <div className="text-center mb-5">
                {countdown > 0 ? (
                  <span className={`text-sm font-medium ${countdown < 30 ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    Code expires in <strong>{formatTime(countdown)}</strong>
                  </span>
                ) : (
                  <span className="text-sm text-rose-500 font-semibold">
                    Code expired — please resend.
                  </span>
                )}
              </div>

              {/* Verify button */}
              <button
                onClick={() => handleVerify()}
                disabled={otp.length !== 6 || isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2 mb-4"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Verify Code'}
              </button>

              {/* ── Resend ── */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">

                {/* Normal resend (email) */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Didn't get the code?</span>
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className={`font-semibold transition-colors ${
                      resendCooldown > 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-teal-600 dark:text-teal-400 hover:underline'
                    }`}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend to email'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
