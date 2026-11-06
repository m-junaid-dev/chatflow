import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'
import toast from 'react-hot-toast'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      // ── Register ──────────────────────────────────────────────────────────
      register: async (name, email, password, demoAccount = false) => {
        set({ isLoading: true })
        try {
          // Default: OTP is emailed. Only a demo account gets the OTP on screen.
          const { data } = await api.post('/auth/register', { name, email, password, demoAccount })
          if (data.demoOtp) toast('Demo account created. OTP shown on screen.', { icon: '🧪' })
          else toast.success('Account created! Check your email for the OTP.')
          return { success: true, demoOtp: data.demoOtp || null }
        } catch (err) {
          const msg = err.response?.data?.message || 'Registration failed'
          toast.error(msg)
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Verify OTP ────────────────────────────────────────────────────────
      verifyOtp: async (email, otp, purpose = 'verify') => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/verify-otp', { email, otp, purpose })
          if (purpose === 'verify') {
            set({ user: data.user, token: data.token })
            toast.success(`Welcome to ChatFlow! Your ID: ${data.user?.chatflowId} 🎉`)
          }
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.message || 'Invalid OTP'
          toast.error(msg)
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Resend OTP ────────────────────────────────────────────────────────
      // Server decides: email by default, on-screen only for demo accounts.
      resendOtp: async (email, purpose = 'verify') => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/resend-otp', {
            email,
            purpose,
          })
          if (data.demoOtp) {
            toast('Demo OTP generated ✅', { icon: '🧪' })
          } else {
            toast.success('OTP sent to your email!')
          }
          return { success: true, demoOtp: data.demoOtp || null }
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to resend OTP'
          toast.error(msg)
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Login ─────────────────────────────────────────────────────────────
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          if (data.requiresVerification) {
            return { requiresVerification: true }
          }
          set({ user: data.user, token: data.token })
          toast.success(`Welcome back, ${data.user.name}! 👋`)
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed'
          toast.error(msg)
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Forgot Password ───────────────────────────────────────────────────
      forgotPassword: async (email) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/forgot-password', { email })
          if (data.demoOtp) {
            toast('Demo OTP generated ✅', { icon: '🧪' })
          } else {
            toast.success('Reset code sent to your email!')
          }
          return { success: true, demoOtp: data.demoOtp || null }
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to send reset code'
          toast.error(msg)
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Reset Password ────────────────────────────────────────────────────
      resetPassword: async (email, otp, newPassword) => {
        set({ isLoading: true })
        try {
          await api.post('/auth/reset-password', { email, otp, newPassword })
          toast.success('Password reset! Please sign in.')
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to reset password'
          toast.error(msg)
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Fetch current user ────────────────────────────────────────────────
      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.user })
          return data.user
        } catch {
          get().logout()
        }
      },

      // ── Update profile ────────────────────────────────────────────────────
      updateProfile: async (formData) => {
        set({ isLoading: true })
        try {
          const { data } = await api.put('/users/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          set({ user: data.user })
          toast.success('Profile updated!')
          return data.user
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to update profile')
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Logout ────────────────────────────────────────────────────────────
      logout: () => {
        set({ user: null, token: null })
        toast('Logged out 👋')
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
