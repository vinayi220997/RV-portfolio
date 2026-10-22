'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sun, Moon, Monitor, Palette, Check, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  { name: 'Terracotta', value: 'oklch(0.62 0.13 35)' },
  { name: 'Sage', value: 'oklch(0.65 0.10 145)' },
  { name: 'Plum', value: 'oklch(0.50 0.18 320)' },
  { name: 'Ocean', value: 'oklch(0.55 0.15 240)' },
  { name: 'Gold', value: 'oklch(0.78 0.13 80)' },
  { name: 'Rose', value: 'oklch(0.65 0.20 15)' },
  { name: 'Forest', value: 'oklch(0.45 0.12 150)' },
  { name: 'Slate', value: 'oklch(0.45 0.05 250)' },
]

const PRESET_GRADIENTS = [
  { name: 'Sunrise', value: 'linear-gradient(135deg, oklch(0.78 0.13 80), oklch(0.62 0.13 35))' },
  { name: 'Ocean', value: 'linear-gradient(135deg, oklch(0.55 0.15 240), oklch(0.45 0.12 180))' },
  { name: 'Forest', value: 'linear-gradient(135deg, oklch(0.65 0.10 145), oklch(0.45 0.12 150))' },
  { name: 'Sunset', value: 'linear-gradient(135deg, oklch(0.65 0.20 15), oklch(0.50 0.18 320))' },
  { name: 'Mist', value: 'linear-gradient(135deg, oklch(0.85 0.02 60), oklch(0.70 0.05 250))' },
  { name: 'Aurora', value: 'linear-gradient(135deg, oklch(0.55 0.15 240), oklch(0.50 0.18 320), oklch(0.65 0.20 15))' },
]

interface ThemeSettingsProps {
  initial: {
    themeMode: string | null
    themeAccent: string | null
    themeSolidColor: string | null
    themeGradient: string | null
  }
}

export function ThemeSettings({ initial }: ThemeSettingsProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mode, setMode] = React.useState<string>(initial.themeMode || 'system')
  const [accent, setAccent] = React.useState<string>(initial.themeAccent || 'oklch(0.62 0.13 35)')
  const [solidColor, setSolidColor] = React.useState<string>(initial.themeSolidColor || '')
  const [gradient, setGradient] = React.useState<string>(initial.themeGradient || '')
  const [saving, setSaving] = React.useState(false)

  // Apply theme mode immediately for preview
  React.useEffect(() => {
    if (mode === 'light' || mode === 'dark') setTheme(mode)
    else if (mode === 'system') setTheme('system')
  }, [mode, setTheme])

  // Apply accent color immediately as a CSS variable override (preview only)
  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent-preview', accent)
  }, [accent])

  // Apply solid color background preview
  React.useEffect(() => {
    if (solidColor) {
      document.documentElement.style.setProperty('--bg-preview', solidColor)
    } else {
      document.documentElement.style.removeProperty('--bg-preview')
    }
  }, [solidColor])

  // Apply gradient background preview
  React.useEffect(() => {
    if (gradient) {
      document.documentElement.style.setProperty('--gradient-preview', gradient)
    } else {
      document.documentElement.style.removeProperty('--gradient-preview')
    }
  }, [gradient])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeMode: mode,
          themeAccent: accent,
          themeSolidColor: solidColor,
          themeGradient: gradient,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success('Theme saved')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Palette className="h-4 w-4" /> Theme &amp; appearance</CardTitle>
        <CardDescription>Applies to both the public site and admin dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme mode */}
        <div className="space-y-2">
          <Label>Theme mode</Label>
          <div className="grid grid-cols-3 gap-2">
            <ModeButton active={mode === 'light'} onClick={() => setMode('light')} icon={Sun} label="Light" />
            <ModeButton active={mode === 'dark'} onClick={() => setMode('dark')} icon={Moon} label="Dark" />
            <ModeButton active={mode === 'system'} onClick={() => setMode('system')} icon={Monitor} label="System" />
          </div>
        </div>

        {/* Accent color */}
        <div className="space-y-2">
          <Label>Accent color</Label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setAccent(c.value)}
                title={c.name}
                className={cn(
                  'h-10 rounded-lg border-2 transition-all hover:scale-105',
                  accent === c.value ? 'border-foreground' : 'border-transparent'
                )}
                style={{ background: c.value }}
              >
                {accent === c.value && <Check className="h-4 w-4 text-white mx-auto drop-shadow" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Input
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              placeholder="oklch(0.62 0.13 35) or #b35c2e"
              className="font-mono text-xs max-w-[280px]"
            />
            <input
              type="color"
              value={hexFromAny(accent)}
              onChange={(e) => setAccent(e.target.value)}
              className="h-9 w-12 rounded border border-border cursor-pointer"
            />
          </div>
          <div className="text-xs text-muted-foreground">Preview: <span className="inline-block px-2 py-0.5 rounded text-accent-foreground" style={{ background: accent }}>accent color</span></div>
        </div>

        {/* Solid background color */}
        <div className="space-y-2">
          <Label>Custom solid background (optional)</Label>
          <div className="flex items-center gap-2">
            <Input
              value={solidColor}
              onChange={(e) => setSolidColor(e.target.value)}
              placeholder="e.g. #faf8f4 or oklch(0.98 0.005 60)"
              className="font-mono text-xs max-w-[280px]"
            />
            <input
              type="color"
              value={hexFromAny(solidColor) || '#faf8f4'}
              onChange={(e) => setSolidColor(e.target.value)}
              className="h-9 w-12 rounded border border-border cursor-pointer"
            />
            {solidColor && (
              <Button variant="ghost" size="sm" onClick={() => setSolidColor('')}>Clear</Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Overrides the default background color. Leave empty to use the theme default.</p>
        </div>

        {/* Gradient background */}
        <div className="space-y-2">
          <Label>Custom gradient background (optional)</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_GRADIENTS.map((g) => (
              <button
                key={g.name}
                type="button"
                onClick={() => setGradient(g.value)}
                className={cn(
                  'h-12 rounded-lg border-2 text-xs font-medium text-white drop-shadow-sm transition-all hover:scale-105',
                  gradient === g.value ? 'border-foreground' : 'border-transparent'
                )}
                style={{ background: g.value }}
              >
                {g.name}
              </button>
            ))}
          </div>
          <Input
            value={gradient}
            onChange={(e) => setGradient(e.target.value)}
            placeholder="linear-gradient(135deg, #faf8f4, #f0e8d8)"
            className="font-mono text-xs"
          />
          {gradient && (
            <Button variant="ghost" size="sm" onClick={() => setGradient('')}>Clear gradient</Button>
          )}
          <p className="text-xs text-muted-foreground">Overrides solid background when set. Leave empty to use solid color or theme default.</p>
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save theme
        </Button>
      </CardContent>
    </Card>
  )
}

function ModeButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition',
        active ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:bg-secondary/60'
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

function hexFromAny(value: string): string {
  if (!value) return '#b35c2e'
  if (value.startsWith('#')) return value
  // For oklch/rgb values, return a fallback (browser color input doesn't support oklch)
  return '#b35c2e'
}
