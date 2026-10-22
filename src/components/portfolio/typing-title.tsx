'use client'

import * as React from 'react'

interface TypingTitleProps {
  titles: string[]
  enabled: boolean
  className?: string
  separator?: string
}

// Typing animation that types → pauses → erases → next title → loops.
// Respects prefers-reduced-motion (falls back to comma-separated display).
export function TypingTitle({ titles, enabled, className = '', separator = ' · ' }: TypingTitleProps) {
  const [display, setDisplay] = React.useState('')
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const idxRef = React.useRef(0)
  const charRef = React.useRef(0)
  const phaseRef = React.useRef<'typing' | 'pausing' | 'erasing' | 'between'>('typing')

  React.useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  // If animation is disabled OR reduced-motion is preferred OR only one title, show static
  const shouldAnimate = enabled && !reducedMotion && titles.length > 1

  React.useEffect(() => {
    if (!shouldAnimate) {
      setDisplay(titles.join(separator))
      return
    }
    let timeout: ReturnType<typeof setTimeout>
    const tick = () => {
      const current = titles[idxRef.current] || ''
      if (phaseRef.current === 'typing') {
        charRef.current++
        setDisplay(current.slice(0, charRef.current))
        if (charRef.current >= current.length) {
          phaseRef.current = 'pausing'
          timeout = setTimeout(tick, 1800) // pause when full
          return
        }
        timeout = setTimeout(tick, 70)
      } else if (phaseRef.current === 'pausing') {
        phaseRef.current = 'erasing'
        timeout = setTimeout(tick, 100)
      } else if (phaseRef.current === 'erasing') {
        charRef.current--
        if (charRef.current <= 0) {
          phaseRef.current = 'between'
          timeout = setTimeout(tick, 300)
          return
        }
        setDisplay(current.slice(0, charRef.current))
        timeout = setTimeout(tick, 40)
      } else {
        // between: advance to next title
        idxRef.current = (idxRef.current + 1) % titles.length
        charRef.current = 0
        phaseRef.current = 'typing'
        setDisplay('')
        timeout = setTimeout(tick, 200)
      }
    }
    timeout = setTimeout(tick, 300)
    return () => clearTimeout(timeout)
  }, [shouldAnimate, titles.join('|'), separator])

  return (
    <span className={className}>
      {display}
      {shouldAnimate && <span className="inline-block w-[2px] h-[0.8em] ml-1 bg-current animate-pulse align-middle" aria-hidden />}
    </span>
  )
}
