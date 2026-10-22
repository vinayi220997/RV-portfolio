'use client'

import * as React from 'react'
import { Check, Copy, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CopyButtonProps {
  value: string
  label?: string // "Email" or "Phone Number"
  className?: string
  size?: 'sm' | 'md'
}

export function CopyButton({ value, label = 'Value', className, size = 'md' }: CopyButtonProps) {
  const [state, setState] = React.useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = async () => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value)
      } else {
        // Fallback for non-secure contexts / older browsers
        const ta = document.createElement('textarea')
        ta.value = value
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setState('copied')
      toast.success(`${label} Copied!`)
    } catch (e) {
      setState('failed')
      toast.error(`Could not copy ${label.toLowerCase()}`)
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2000)
  }

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const btnSize = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label.toLowerCase()}`}
      title={`Copy ${label.toLowerCase()}`}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 shrink-0',
        btnSize,
        state === 'copied' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        state === 'failed' && 'bg-destructive/15 text-destructive',
        state === 'idle' && 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
        className
      )}
    >
      {state === 'copied' ? <Check className={iconSize} /> : state === 'failed' ? <X className={iconSize} /> : <Copy className={iconSize} />}
    </button>
  )
}
