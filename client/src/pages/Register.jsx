import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, FlaskConical } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

function getStrength(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColors  = ['', 'bg-rose-400', 'bg-amber-400', 'bg-teal-400', 'bg-emerald-500']

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [agreed, setAgreed] = useState(false)
  // Demo account option (OTP shown on screen). Hidden unless the server enables it.
  const [demoEnabled, setDemoEnabled] = useState(false)
  const [demoAccount, setDemoAccount] = useState(false)

  useEffect(() => {
    api.get('/auth/config')
      .then(({ data }) => setDemoEnabled(!!data.demoAccountsEnabled))
      .catch(() => setDemoEnabled(false))
  }, [])
  const [errors, setErrors] = useState({})
  const strength = getStrength(form.password)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    else if (form.name.trim().length < 2) e.name = 'Name is too short'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Minimum 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    if (!agreed) e.agreed = 'You must agree to continue'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      const result = await register(form.name.trim(), form.email, form.password, demoEnabled && demoAccount)
      navigate('/verify-otp', {
        state: { email: form.email, purpose: 'verify', demoOtp: result.demoOtp },
      })
    } catch {}
  }

  const InputField = ({ label, name, type = 'text', placeholder, icon: Icon, autoComplete, extra, error }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type={type}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-label={label}
          className={`w-full pl-10 ${extra ? 'pr-10' : 'pr-4'} py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
            error ? 'border-rose-400' : 'border-gray-200 dark:border-gray-600'
          }`}
        />
        {extra}
      </div>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  )

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── Left gradient ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-400 to-teal-600 flex-col items-center justify-center p-16 text-white">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm space-y-10"
        >
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <span className="text-5xl">💬</span>
            </div>
            <div className="text-center">
              <h1 className="text-5xl font-bold tracking-tight">Join ChatFlow</h1>
              <p className="mt-3 text-lg text-white/80 leading-relaxed">
                Create your free account and start connecting with people instantly.
              </p>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-5 space-y-3">
            <p className="text-sm font-semibold text-white/90 uppercase tracking-wider">What you get</p>
            {['Unique 11-digit ChatFlow ID', 'Real-time encrypted messaging', 'File & image sharing', 'Typing indicators & read receipts'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">✓</span>
                <span className="text-sm text-white/90">{f}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right form ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950 overflow-y-auto">
        <motion.div
          className="w-full max-w-sm py-6"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <span className="text-xl">💬</span>
            </div>
            <span className="text-2xl font-bold gradient-text">ChatFlow</span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Create account
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
              It's free and only takes a minute
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name"
                    maxLength={50}
                    autoComplete="name"
                    aria-label="Full name"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${errors.name ? 'border-rose-400' : 'border-gray-200 dark:border-gray-600'}`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-label="Email"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${errors.email ? 'border-rose-400' : 'border-gray-200 dark:border-gray-600'}`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    aria-label="Password"
                    className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${errors.password ? 'border-rose-400' : 'border-gray-200 dark:border-gray-600'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColors[strength] : 'bg-gray-200 dark:bg-gray-600'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strength <= 1 ? 'text-rose-500' : strength <= 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {strengthLabels[strength]}
                    </p>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    aria-label="Confirm password"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${errors.confirm ? 'border-rose-400' : 'border-gray-200 dark:border-gray-600'}`}
                  />
                </div>
                {errors.confirm && <p className="mt-1 text-xs text-rose-500">{errors.confirm}</p>}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-teal-500 cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  I agree to the{' '}
                  <span className="text-teal-600 dark:text-teal-400 font-medium hover:underline cursor-pointer">Terms of Service</span>
                  {' '}and{' '}
                  <span className="text-teal-600 dark:text-teal-400 font-medium hover:underline cursor-pointer">Privacy Policy</span>
                </span>
              </label>
              {errors.agreed && <p className="text-xs text-rose-500 -mt-2">{errors.agreed}</p>}

              {/* Demo account (optional, off by default → OTP is emailed) */}
              {demoEnabled && (
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    demoAccount
                      ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={demoAccount}
                    onChange={(e) => setDemoAccount(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-sm leading-relaxed">
                    <span className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-200">
                      <FlaskConical size={14} className="text-amber-500" /> Set up as demo account
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      For testing only: your OTP appears on screen instead of email. Don't use a real email address.
                    </span>
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
