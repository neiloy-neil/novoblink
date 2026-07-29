"use client"

import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = createClient()
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
    } catch { /* swallow — we always show success to prevent enumeration */ }
    setSubmitted(true)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md space-y-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-novo-text-muted hover:text-novo-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div>
          <h1 className="text-3xl font-heading font-bold text-novo-black mb-2">Reset Password</h1>
          <p className="text-sm text-novo-text-muted">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 bg-novo-muted rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-novo-blue/10 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-novo-blue" />
            </div>
            <h2 className="font-heading font-bold text-xl">Check your inbox</h2>
            <p className="text-sm text-novo-text-muted">
              If <span className="font-medium text-novo-black">{email}</span> is registered, you'll receive a reset link within a few minutes.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 text-sm font-bold underline underline-offset-4 hover:text-novo-blue transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-novo-black text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-novo-blue hover:shadow-lg hover:shadow-novo-blue/20 transition-all duration-300 rounded-full text-xs"
            >
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
