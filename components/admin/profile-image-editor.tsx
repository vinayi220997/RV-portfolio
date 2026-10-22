'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Upload, RotateCw, FlipHorizontal, FlipVertical, Crop, RefreshCw, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ImageEditorProps {
  currentUrl: string | null
}

// Aspect ratio presets for the crop
const ASPECT_RATIOS = [
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
]

export function ProfileImageEditor({ currentUrl }: ImageEditorProps) {
  const router = useRouter()
  const [original, setOriginal] = React.useState<HTMLImageElement | null>(null)
  const [rotation, setRotation] = React.useState(0)
  const [flipH, setFlipH] = React.useState(false)
  const [flipV, setFlipV] = React.useState(false)
  const [aspectRatio, setAspectRatio] = React.useState(1)
  const [cropX, setCropX] = React.useState(0.1)
  const [cropY, setCropY] = React.useState(0.1)
  const [cropW, setCropW] = React.useState(0.8)
  const [cropH, setCropH] = React.useState(0.8)
  const [busy, setBusy] = React.useState(false)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Re-render preview whenever transforms change
  React.useEffect(() => {
    if (!original || !canvasRef.current) return
    renderPreview()
  }, [original, rotation, flipH, flipV, aspectRatio, cropX, cropY, cropW, cropH])

  const renderPreview = () => {
    const canvas = canvasRef.current
    if (!canvas || !original) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Adjust crop to match aspect ratio
    const imgW = original.naturalWidth
    const imgH = original.naturalHeight
    const cropAspect = aspectRatio
    let cw = cropW
    let ch = cropH
    // Make crop match the aspect ratio
    if (cw / ch > cropAspect) {
      ch = cw / cropAspect
      if (cropY + ch > 1) ch = 1 - cropY
    } else {
      cw = ch * cropAspect
      if (cropX + cw > 1) cw = 1 - cropX
    }

    const srcX = cropX * imgW
    const srcY = cropY * imgH
    const srcW = cw * imgW
    const srcH = ch * imgH

    // Output canvas size (max 800px on longest side)
    const maxOut = 800
    let outW = srcW
    let outH = srcH
    if (outW > outH && outW > maxOut) {
      outH = (outH / outW) * maxOut
      outW = maxOut
    } else if (outH > maxOut) {
      outW = (outW / outH) * maxOut
      outH = maxOut
    }
    canvas.width = outW
    canvas.height = outH

    // Clear
    ctx.clearRect(0, 0, outW, outH)

    // Apply transforms (rotation, flip)
    ctx.save()
    ctx.translate(outW / 2, outH / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
    ctx.drawImage(original, srcX, srcY, srcW, srcH, -outW / 2, -outH / 2, outW, outH)
    ctx.restore()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are supported')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        setOriginal(img)
        setRotation(0)
        setFlipH(false)
        setFlipV(false)
        setCropX(0.1)
        setCropY(0.1)
        setCropW(0.8)
        setCropH(0.8)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const reset = () => {
    setOriginal(null)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setCropX(0.1)
    setCropY(0.1)
    setCropW(0.8)
    setCropH(0.8)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const save = async () => {
    if (!canvasRef.current || !original) return
    setBusy(true)
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b), 'image/png', 0.92)
      })
      if (!blob) throw new Error('Failed to render image')
      const formData = new FormData()
      formData.append('file', blob, 'avatar.png')
      const res = await fetch('/api/admin/profile/avatar', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      toast.success('Profile image saved')
      reset()
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile image</CardTitle>
        <CardDescription>Upload, crop, rotate, and flip your profile image. Supports JPG, PNG, and WebP.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUrl && !original && (
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-lg overflow-hidden border border-border">
              <img src={currentUrl} alt="Current avatar" className="h-full w-full object-cover" />
            </div>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Replace image
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
        {!currentUrl && !original && (
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Upload image
          </Button>
        )}
        {original && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start gap-4">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Preview</div>
                <div className="rounded-lg border border-border overflow-hidden bg-secondary/30 p-2">
                  <canvas
                    ref={canvasRef}
                    className="max-w-[240px] max-h-[240px] block"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[200px] space-y-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Aspect ratio</div>
                  <div className="flex flex-wrap gap-1">
                    {ASPECT_RATIOS.map((ar) => (
                      <button
                        key={ar.label}
                        type="button"
                        onClick={() => setAspectRatio(ar.value)}
                        className={cn(
                          'px-3 h-8 text-xs rounded-md border transition',
                          aspectRatio === ar.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary/60'
                        )}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Transforms</div>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => setRotation((r) => (r + 90) % 360)}>
                      <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Rotate 90°
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setFlipH((v) => !v)} className={cn(flipH && 'bg-accent/15 text-accent border-accent/40')}>
                      <FlipHorizontal className="h-3.5 w-3.5 mr-1.5" /> Flip H
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setFlipV((v) => !v)} className={cn(flipV && 'bg-accent/15 text-accent border-accent/40')}>
                      <FlipVertical className="h-3.5 w-3.5 mr-1.5" /> Flip V
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Crop position</div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-muted-foreground">
                      X: <input type="range" min={0} max={0.9} step={0.05} value={cropX} onChange={(e) => setCropX(Number(e.target.value))} className="w-full" />
                    </label>
                    <label className="text-xs text-muted-foreground">
                      Y: <input type="range" min={0} max={0.9} step={0.05} value={cropY} onChange={(e) => setCropY(Number(e.target.value))} className="w-full" />
                    </label>
                    <label className="text-xs text-muted-foreground">
                      Width: <input type="range" min={0.1} max={1} step={0.05} value={cropW} onChange={(e) => setCropW(Number(e.target.value))} className="w-full" />
                    </label>
                    <label className="text-xs text-muted-foreground">
                      Height: <input type="range" min={0.1} max={1} step={0.05} value={cropH} onChange={(e) => setCropH(Number(e.target.value))} className="w-full" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Save image
              </Button>
              <Button variant="outline" onClick={reset} disabled={busy}>
                <RefreshCw className="h-4 w-4 mr-2" /> Reset
              </Button>
              <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                <Upload className="h-4 w-4 mr-2" /> Choose another
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
