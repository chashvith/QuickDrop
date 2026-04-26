'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

type Props = {
  userId: string
  onDropAdded: (drop: any) => void
  onOptimisticAdd: (drop: any) => void
  onOptimisticRemove: (tempId: string) => void
}

export default function InputBar({ userId, onDropAdded, onOptimisticAdd, onOptimisticRemove }: Props) {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'failed'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Ctrl+V global paste handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const active = document.activeElement
      const isInInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA'
      if (isInInput) return // let browser handle normal paste in inputs

      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) {
            await uploadFile(file)
            return
          }
        }
        if (item.kind === 'string' && item.type === 'text/plain') {
          item.getAsString(async (str) => {
            if (str.trim()) await sendText(str.trim())
          })
          return
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [userId])

  const sendText = useCallback(async (content: string) => {
    if (!content.trim()) return
    const tempId = `temp-${Date.now()}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const optimistic = {
      id: tempId,
      user_id: userId,
      type: 'text' as const,
      content,
      file_url: null,
      file_name: null,
      file_type: null,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      _optimistic: true,
    }

    onOptimisticAdd(optimistic)
    setText('')

    const { data, error } = await supabase.from('drops').insert({
      user_id: userId,
      type: 'text',
      content,
      expires_at: expiresAt.toISOString(),
    }).select().single()

    if (error) {
      onOptimisticRemove(tempId)
      toast.error('Failed to send')
    } else {
      onDropAdded({ ...data, _replaceId: tempId })
    }
  }, [userId, onOptimisticAdd, onOptimisticRemove, onDropAdded])

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    setUploadStatus('uploading')

    const tempId = `temp-${Date.now()}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const optimistic = {
      id: tempId,
      user_id: userId,
      type: 'file' as const,
      content: file.name,
      file_url: null,
      file_name: file.name,
      file_type: file.type,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      _optimistic: true,
      _uploading: true,
    }
    onOptimisticAdd(optimistic)

    const { error: storageError } = await supabase.storage.from('files').upload(path, file)
    if (storageError) {
      setUploadStatus('failed')
      onOptimisticRemove(tempId)
      toast.error('Upload failed')
      setUploading(false)
      setTimeout(() => setUploadStatus('idle'), 2000)
      return
    }

    const { data: urlData } = supabase.storage.from('files').getPublicUrl(path)
    const fileUrl = urlData.publicUrl

    const { data, error } = await supabase.from('drops').insert({
      user_id: userId,
      type: 'file',
      content: file.name,
      file_url: fileUrl,
      file_name: file.name,
      file_type: file.type,
      expires_at: expiresAt.toISOString(),
    }).select().single()

    setUploading(false)
    if (error) {
      setUploadStatus('failed')
      onOptimisticRemove(tempId)
      toast.error('Failed to save file')
      setTimeout(() => setUploadStatus('idle'), 2000)
    } else {
      setUploadStatus('done')
      onDropAdded({ ...data, _replaceId: tempId })
      toast.success('File uploaded')
      setTimeout(() => setUploadStatus('idle'), 2000)
    }
  }, [userId, onOptimisticAdd, onOptimisticRemove, onDropAdded])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendText(text)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="bg-[#1a1a24] border border-[#ffffff08] rounded-2xl p-3">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste text, links, anything... (or Ctrl+V anywhere)"
        rows={1}
        className="w-full bg-transparent text-white text-sm placeholder-[#4a4a5a] resize-none focus:outline-none leading-relaxed min-h-[40px] max-h-[160px] overflow-y-auto"
        style={{ fieldSizing: 'content' } as any}
      />
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#ffffff06]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Upload file"
            className="flex items-center gap-1.5 text-[#6b6b80] hover:text-[#a09af5] transition-colors text-xs disabled:opacity-40 p-1.5 rounded-lg hover:bg-[#ffffff06]"
          >
            {uploadStatus === 'uploading' ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : uploadStatus === 'done' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : uploadStatus === 'failed' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span>
              {uploadStatus === 'uploading' ? 'Uploading...' : uploadStatus === 'done' ? 'Done' : uploadStatus === 'failed' ? 'Failed' : 'File'}
            </span>
          </button>
        </div>
        <button
          onClick={() => sendText(text)}
          disabled={!text.trim()}
          className="flex items-center gap-1.5 bg-[#7c6af5] hover:bg-[#6a59e0] disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Send
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="*/*"
        />
      </div>
    </div>
  )
}
