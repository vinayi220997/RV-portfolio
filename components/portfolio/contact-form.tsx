'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Send, CheckCircle2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Please enter your name (at least 2 characters)').max(80),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().max(120).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  consent: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export function ContactForm({ email }: { email: string | null }) {
  const [submitted, setSubmitted] = React.useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', subject: '', message: '', consent: false } })

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not send your message. Please try again.')
        return
      }
      toast.success('Message sent. I will get back to you soon.')
      setSubmitted(true)
      reset()
    } catch (e) {
      toast.error('Network error. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-accent/15 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-accent" />
        </div>
        <h3 className="mt-4 font-serif text-2xl">Message delivered</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Thanks for reaching out. I will reply to your message as soon as possible.
        </p>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => setSubmitted(false)}>
          Send another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" autoComplete="name" placeholder="Your name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input id="subject" placeholder="What is this about?" {...register('subject')} />
        {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={6} placeholder="Tell me about your project, question, or opportunity..." {...register('message')} />
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>
      <div className="flex items-start gap-2">
        <Checkbox id="consent" {...register('consent')} />
        <Label htmlFor="consent" className="text-xs text-muted-foreground font-normal leading-relaxed cursor-pointer">
          I consent to having this information stored for the purpose of responding to my inquiry. I can request deletion at any time.
        </Label>
      </div>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> Send message
            </>
          )}
        </Button>
        {email && (
          <a href={`mailto:${email}`} className="text-sm text-muted-foreground hover:text-foreground transition">
            or email directly → {email}
          </a>
        )}
      </div>
    </form>
  )
}
