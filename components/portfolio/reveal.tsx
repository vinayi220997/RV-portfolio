'use client'

import * as React from 'react'

// IntersectionObserver-based reveal animation. Respects prefers-reduced-motion.
export function Reveal({
  children,
  delay = 0,
  as: Component = 'div',
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  as?: React.ElementType
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mql.matches) {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true)
            obs.disconnect()
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <Component
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Component>
  )
}

// Animated text reveal for headings — splits words and staggers.
export function RevealText({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const words = text.split(' ')
  const ref = React.useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mql.matches) {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true)
            obs.disconnect()
          }
        }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block transition-all duration-700 ease-out"
          style={{
            transitionDelay: `${i * 60}ms`,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  )
}

// Smooth scroll progress indicator at top of page
export function ScrollProgress() {
  const [progress, setProgress] = React.useState(0)
  React.useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[2px] bg-accent/60 z-50 origin-left transition-transform duration-150"
      style={{ transform: `scaleX(${progress / 100})` }}
    />
  )
}
