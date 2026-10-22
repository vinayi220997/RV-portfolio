'use client'

import * as React from 'react'

interface ThemeApplierProps {
  themeMode: string | null // 'light' | 'dark' | 'system'
  themeAccent: string | null // CSS color value (oklch, hex, etc.)
  themeSolidColor: string | null
  themeGradient: string | null
}

// Applies saved theme settings (accent, background color/gradient) as CSS variables.
// Theme mode (light/dark/system) is handled by next-themes via the ThemeProvider.
export function ThemeApplier({ themeMode, themeAccent, themeSolidColor, themeGradient }: ThemeApplierProps) {
  React.useEffect(() => {
    const root = document.documentElement
    if (themeAccent) {
      root.style.setProperty('--accent', themeAccent)
      // Also derive a softer accent for hover states
      root.style.setProperty('--ring', themeAccent)
    }
    if (themeGradient) {
      root.style.setProperty('--background', themeGradient)
      document.body.style.background = themeGradient
    } else if (themeSolidColor) {
      root.style.setProperty('--background', themeSolidColor)
      document.body.style.background = themeSolidColor
    }
    return () => {
      // Reset on unmount (for preview changes)
      if (themeAccent) {
        root.style.removeProperty('--accent')
        root.style.removeProperty('--ring')
      }
      if (themeGradient || themeSolidColor) {
        root.style.removeProperty('--background')
        document.body.style.background = ''
      }
    }
  }, [themeAccent, themeSolidColor, themeGradient])
  return null
}
