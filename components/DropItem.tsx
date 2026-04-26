'use client'

import { useState } from 'react'
import { Drop } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

type Props = {
  drop: Drop & { _optimistic?: boolean; _uploading?: boolean }
  onDelete: (id: string) => void
}

function isImageType(type: string | null) {
  return type?.startsWith('image/')
}

function isUrl(str: string) {
  try {
    const u = new URL(str)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function formatTime(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function FileIcon({ type }: { type: string | null }) {
  if (!type) return null
  if (type.startsWith('image/')) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#a09af5" strokeWidth="1.5"/>
      <circle cx="8.5" cy="8.5" r="1.5" stroke="#a09af5" strokeWidth="1.5"/>
      <path d="M21 15l-5-5L5 21" stroke="#a09af5" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
  if (type === 'application/pdf') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#a09af5" strokeWidth="1.5"/>
      <polyline points="14,2 14,8 20,8" stroke="#a09af5" strokeWidth="1.5"/>
    </svg>
  )
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="#a09af5" strokeWidth="1.5"/>
      <polyline points="13,2 13,9 20,9" stroke="#a09af5" strokeWidth="1.5"/>
    </svg>
  )
}

export default function DropItem({ drop, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleCopy = async () => {
    const val = drop.type === 'text' ? drop.content : drop.file_url
    if (!val) return
    await navigator.clipboard.writeText(val)
    toast.success('Copied!', { duration: 1500 })
  }

  const handleDelete = async () => {
    setDeleting(true)
    onDelete(drop.id)
    const { error } = await supabase.from('drops').delete().eq('id', drop.id)
    if (error) toast.error('Delete failed')
  }

  const isOptimistic = (drop as any)._optimistic
  const isUploading = (drop as any)._uploading

  return (
    <div
      className={`group bg-[#1a1a24] border rounded-xl p-4 transition-all duration-150
        ${isOptimistic ? 'border-[#7c6af520] opacity-70' : 'border-[#ffffff08] hover:border-[#ffffff12]'}
        ${deleting ? 'opacity-40 pointer-events-none' : ''}
      `}
    >
      {/* File drop */}
      {drop.type === 'file' && (
        <div className="space-y-3">
          {/* Image preview */}
          {isImageType(drop.file_type) && drop.file_url && !imgError && (
            <div className="rounded-lg overflow-hidden bg-[#0f0f12] max-h-48">
              <img
                src={drop.file_url}
                alt={drop.file_name || 'image'}
                className="w-full h-full object-contain"
                onError={() => setImgError(true)}
              />
            </div>
          )}
          {/* File meta */}
          {isUploading ? (
            <div className="flex items-center gap-2 text-[#6b6b80] text-xs">
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Uploading {drop.file_name}...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FileIcon type={drop.file_type} />
              <span className="text-sm text-white truncate max-w-[200px]">{drop.file_name}</span>
              {drop.file_url && (
                <a
                  href={drop.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-[#6b6b80] hover:text-[#a09af5] transition-colors flex-shrink-0"
                  title="Open file"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Text drop */}
      {drop.type === 'text' && drop.content && (
        <div>
          {isUrl(drop.content) ? (
            <a
              href={drop.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#a09af5] hover:text-[#c4beff] text-sm break-all underline underline-offset-2 decoration-[#7c6af540] hover:decoration-[#7c6af5] transition-colors"
            >
              {drop.content}
            </a>
          ) : (
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">{drop.content}</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#ffffff05]">
        <span className="text-[10px] text-[#4a4a5a] tabular-nums">{formatTime(drop.created_at)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            title="Copy"
            className="p-1.5 rounded-lg text-[#6b6b80] hover:text-white hover:bg-[#ffffff08] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
          <button
            onClick={handleDelete}
            title="Delete"
            className="p-1.5 rounded-lg text-[#6b6b80] hover:text-[#f87171] hover:bg-[#f8717115] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
