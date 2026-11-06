import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import OtpInput from '../components/OtpInput'
import { useAuthStore } from '../store/authStore'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { forgotPassword, resetPassword, resendOtp, isLoading } = useAuthStore()

  const [step, setStep]           = useState(1) // 1=email, 2=otp+pw, 3=success
  const [email, setEmail]         = useState('')
  const [otp, setOtp]             = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [demoOtp, setDemoOtp]     = useState(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [errors, setErrors]       = useState({})

  /* Start cooldown timer */
  const startCooldown = () => {
    setResendCooldown(60)
    const t = setInterval(() =>
      setResendCooldown((c) => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Enter a valid email' }); return
    }
    try {
      const result = await forgotPassword(email)
      if (result.demoOtp) setDemoOtp(result.demoOtp)
      startCooldown()
      setStep(2)
    } catch {}
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return
    try {
      const result = await resendOtp(email, 'reset')
      if (result.demoOtp) setDemoOtp(result.demoOtp)
      startCooldown()
    } catch {}
  }

  const handleReset = async (e) => {
    e.preventDefault()
    const errs = {}
    if (otp.length !== 6) errs.otp = 'Enter all 6 digits'
    if (!newPassword) errs.password = 'New password is required'
    else if (newPassword.length < 8) errs.password = 'Minimum 8 characters'
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      await resetPassword(email, otp, newPassword)
      setStep(3)
    } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 font-sans">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">

          {/* Logo row */}
          <div className="flex items-center gap-3 mb-7">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <span className="text-lg">💬</span>
            </div>
            <span className="text-lg font-bold gradient-text">ChatFlow</span>
          </div>

          {/* ── Step 1: Enter email ── */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Forgot password?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
                Enter your email and we'll send you a reset code.
              </p>
              <form onSubmit={handleSendOtp} noValidate className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      aria-label="Email"
                      className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${errors.email ? 'border-rose-400' : 'border-gray-200 dark:border-gray-600'}`}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2"
                >
                  {isLoading
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : 'Send Reset Code'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Enter OTP + new password ── */}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 mb-6 transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Reset password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Enter the code sent to{' '}
                <span className="text-teal-600 dark:text-teal-400 font-semibold">{email}</span>
              </p>

              {/* Demo OTP banner */}
              <AnimatePresence>
                {demoOtp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                      <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Demo account OTP</p>
                        <p className="text-xl font-mono font-bold tracking-[0.3em] text-amber-800 dark:text-amber-200 mt-0.5">
                          {demoOtp}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleReset} noValidate className="space-y-5">
                {/* OTP boxes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Enter OTP
                  </label>
                  <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
                  {errors.otp && <p className="mt-2 text-xs text-rose-500 text-center">{errors.otp}</p>}
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      aria-label="New password"
                      className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${errors.password ? 'border-rose-400' : 'border-gray-200 dark:border-gray-600'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2"
                >
                  {isLoading
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : 'Reset Password'}
                </button>
              </form>

              {/* Resend */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm">
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
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={42} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Password reset!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Your password has been changed successfully.
              </p>
              <Link
                to="/login"
                className="inline-block px-8 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                Sign In
              </Link>
            </motion.div>
          )}

          {step !== 3 && (
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Remember your password?{' '}
              <Link to="/login" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
