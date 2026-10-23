// Public content API — exposes only "published" items to the public site.

import { db } from '@/lib/db'

export interface PublicProfile {
  name: string
  title: string
  titles: string[] // array of multiple titles (for typing animation)
  animateTitles: boolean
  summary: string
  bio: string | null
  location: string | null
  email: string | null
  phone: string | null
  avatarUrl: string | null
  iconLetters: string | null
  resumePublicUrl: string | null
  resumeExternalUrl: string | null
  availability: string | null
}

export async function getPublicProfile(): Promise<PublicProfile | null> {
  const p = await db.profile.findUnique({ where: { id: 'singleton' } })
  if (!p) return null
  // Build titles array: prefer the multi-titles field, fall back to single title
  const titlesRaw = p.titles?.trim() || p.title
  const titles = titlesRaw.split(',').map((t) => t.trim()).filter(Boolean)
  return {
    name: p.name,
    title: p.title,
    titles,
    animateTitles: p.animateTitles,
    summary: p.summary,
    bio: p.bio,
    location: p.location,
    email: p.email,
    phone: p.phone,
    avatarUrl: p.avatarUrl,
    iconLetters: p.iconLetters,
    resumePublicUrl: p.resumePublicUrl,
    resumeExternalUrl: p.resumeExternalUrl,
    availability: p.availability,
  }
}

export async function getPublicExperience() {
  return db.experience.findMany({
    where: { status: 'published' },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getPublicProjects() {
  return db.project.findMany({
    where: { status: 'published' },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getPublicSkills() {
  return db.skill.findMany({
    where: { status: 'published' },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
}

export async function getPublicEducation() {
  return db.education.findMany({
    where: { status: 'published' },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getPublicCertifications() {
  return db.certification.findMany({
    where: { status: 'published' },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getPublicSocialLinks() {
  return db.socialLink.findMany({
    where: { status: 'published' },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getSiteSettings() {
  return db.siteSetting.findUnique({ where: { id: 'singleton' } })
}
