'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#7c6af5] mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">QuickDrop</h1>
          <p className="text-sm text-[#6b6b80] mt-1">Your personal clipboard, everywhere.</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#ffffff08]">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-[#7c6af520] flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#7c6af5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-white font-medium">Check your email</p>
              <p className="text-[#6b6b80] text-sm mt-1">Magic link sent to <span className="text-[#a09af5]">{email}</span></p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-[#6b6b80] mb-2 font-medium uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#0f0f12] border border-[#ffffff10] rounded-xl px-4 py-3 text-white text-sm placeholder-[#4a4a5a] focus:outline-none focus:border-[#7c6af5] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7c6af5] hover:bg-[#6a59e0] text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[#4a4a5a] mt-6">
          No password needed — login via email link
        </p>
      </div>
    </div>
  )
}
