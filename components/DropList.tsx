'use client'

import { Drop } from '@/lib/supabase'
import DropItem from './DropItem'

type Props = {
  drops: (Drop & { _optimistic?: boolean; _uploading?: boolean })[]
  onDelete: (id: string) => void
  loading: boolean
}

export default function DropList({ drops, onDelete, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[#1a1a24] border border-[#ffffff08] rounded-xl p-4 animate-pulse">
            <div className="h-3 bg-[#ffffff08] rounded w-3/4 mb-2" />
            <div className="h-3 bg-[#ffffff06] rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (drops.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-[#1a1a24] flex items-center justify-center mx-auto mb-4 border border-[#ffffff08]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4a4a5a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-[#4a4a5a] text-sm">Nothing here yet</p>
        <p className="text-[#3a3a48] text-xs mt-1">Paste or type something to drop it</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {drops.map((drop) => (
        <DropItem key={drop.id} drop={drop} onDelete={onDelete} />
      ))}
    </div>
  )
}
