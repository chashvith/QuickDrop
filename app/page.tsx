'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, Drop } from '@/lib/supabase'
import InputBar from '@/components/InputBar'
import DropList from '@/components/DropList'
import AuthPage from '@/components/AuthPage'
import toast from 'react-hot-toast'
import type { User } from '@supabase/supabase-js'

const PAGE_SIZE = 20

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [drops, setDrops] = useState<(Drop & { _optimistic?: boolean; _uploading?: boolean; _replaceId?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Fetch drops
  const fetchDrops = useCallback(async (userId: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('drops')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    setLoading(false)
    if (error) {
      toast.error('Failed to load drops')
    } else {
      setDrops(data ?? [])
    }
  }, [])

  // Realtime subscription
  useEffect(() => {
    if (!user) return

    fetchDrops(user.id)

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`drops:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'drops', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newDrop = payload.new as Drop
          setDrops((prev) => {
            // If it's replacing an optimistic item, skip (already handled)
            const exists = prev.some((d) => d.id === newDrop.id)
            if (exists) return prev
            // Remove any optimistic that matches content+type
            const filtered = prev.filter((d) => !d._optimistic || d.type !== newDrop.type)
            return [newDrop, ...filtered]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'drops', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setDrops((prev) => prev.filter((d) => d.id !== (payload.old as Drop).id))
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchDrops])

  const handleOptimisticAdd = useCallback((drop: any) => {
    setDrops((prev) => [drop, ...prev])
  }, [])

  const handleOptimisticRemove = useCallback((tempId: string) => {
    setDrops((prev) => prev.filter((d) => d.id !== tempId))
  }, [])

  const handleDropAdded = useCallback((drop: any) => {
    setDrops((prev) => {
      const filtered = prev.filter((d) => d.id !== drop._replaceId)
      const exists = filtered.some((d) => d.id === drop.id)
      if (exists) return filtered
      return [{ ...drop, _replaceId: undefined }, ...filtered]
    })
  }, [])

  const handleDelete = useCallback((id: string) => {
    setDrops((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setDrops([])
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#7c6af5] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <div className="min-h-screen bg-[#0f0f12]">
      <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-0">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7c6af5] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-base tracking-tight">QuickDrop</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#4a4a5a] text-xs hidden sm:block truncate max-w-[140px]">{user.email}</span>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-[#6b6b80] hover:text-[#f87171] transition-colors p-1.5 rounded-lg hover:bg-[#f8717110]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Input */}
        <div className="mb-4">
          <InputBar
            userId={user.id}
            onDropAdded={handleDropAdded}
            onOptimisticAdd={handleOptimisticAdd}
            onOptimisticRemove={handleOptimisticRemove}
          />
        </div>

        {/* Count badge */}
        {drops.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#4a4a5a] text-xs">{drops.filter(d => !d._optimistic).length} drops</span>
            <span className="text-[#3a3a48] text-xs">7-day auto-expiry</span>
          </div>
        )}

        {/* List */}
        <DropList drops={drops} onDelete={handleDelete} loading={loading} />
      </div>
    </div>
  )
}
