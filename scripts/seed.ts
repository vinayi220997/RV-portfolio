// Seed script — populates the database from the user's résumé.
// Run with: bun run scripts/seed.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ---------- Reserved #admin code ----------
  const adminCodeExists = await db.adminCode.findUnique({ where: { code: '#admin' } })
  if (!adminCodeExists) {
    await db.adminCode.create({
      data: {
        code: '#admin',
        label: 'Primary Administrator',
        isActive: true,
        isReserved: true,
      },
    })
    console.log('  Created reserved #admin code')
  }

  // ---------- Bootstrap admin user ----------
  const userCount = await db.user.count()
  if (userCount === 0) {
    const loginId = process.env.BOOTSTRAP_LOGIN_ID || 'admin_user'
    const password = process.env.BOOTSTRAP_PASSWORD || 'admin_password@58'
    const hash = await bcrypt.hash(password, 12)
    await db.user.create({
      data: {
        loginId,
        passwordHash: hash,
        mustChangePwd: true,
      },
    })
    console.log(`  Created bootstrap admin: ${loginId} (CHANGE PASSWORD AFTER FIRST LOGIN)`)
  }

  // ---------- Profile ----------
  await db.profile.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      name: 'Ramathota Vinay',
      title: 'UI/UX Designer · Visual Designer',
      summary:
        'UI/UX Designer with 3+ years of hands-on experience delivering intuitive, visually appealing digital products. Strong in design systems and Figma, with a user-centered approach to solving intricate design challenges through research, prototyping, and iterative processes. Experienced in cross-functional collaboration to build scalable, accessible, and performance-driven interfaces. Familiar with dynamic theming, design tokens, and emerging technologies including generative AI.',
      bio: 'I craft digital products where clarity meets craft. My work spans healthcare, cybersecurity, and consumer platforms — always grounded in research, validated through testing, and shipped with engineering teams who care about details. I believe great design earns its place by being both usable and beautiful, and I obsess over the small things: spacing systems, accessible color, micro-interactions, and the words on a button. Outside of work I explore generative AI for design automation, sketch interface concepts, and study how design systems scale across products and teams.',
      location: 'Visakhapatnam, India',
      email: 'vinayi220997@gmail.com',
      phone: '+91 9966782923',
      avatarUrl: '/avatar.png',
      resumePublicUrl: null,
      availability: 'Open to selected freelance and full-time UI/UX roles.',
    },
  })
  console.log('  Created profile')

  // ---------- Site settings ----------
  await db.siteSetting.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      siteTitle: 'Ramathota Vinay — UI/UX Designer',
      siteDescription:
        'Portfolio of Ramathota Vinay, a UI/UX Designer with 3+ years crafting intuitive, accessible digital products.',
      siteUrl: '',
      faviconUrl: '/avatar.png',
      themeAccent: 'terracotta',
      footerText: 'Designed & built with care. © 2026 Ramathota Vinay.',
      metaKeywords: ['UI/UX Designer', 'Portfolio', 'Figma', 'Design Systems'],
    },
  })
  console.log('  Created site settings')

  // ---------- Experience ----------
  const experiences = [
    {
      company: 'MST Networks',
      role: 'UI/UX Designer Engineer',
      location: 'Visakhapatnam, India',
      startDate: 'Jan 2025',
      endDate: null,
      description:
        'Lead UI/UX design for an internal cybersecurity tool and adjacent service platforms, partnering closely with engineering to ship accessible interfaces across desktop and mobile.',
      achievements: [
        'Led UI/UX design for a cybersecurity tool and internal service platforms.',
        'Designed accessible interfaces across desktop and mobile platforms.',
        'Reduced design turnaround by 20% through close dev collaboration.',
        'Created graphics and banners that enhanced brand visibility.',
      ],
      technologies: ['Figma', 'Design Systems', 'Accessibility', 'Prototyping'],
      order: 0,
    },
    {
      company: 'Intelleap IT Systems',
      role: 'UI/UX Designer',
      location: 'Visakhapatnam, India',
      startDate: 'Jul 2024',
      endDate: 'Nov 2024',
      description:
        'Owned icon and component design at scale, optimizing interfaces that served a large end-user base.',
      achievements: [
        'Designed over 100 icons, improving UI clarity and development handoff by 20%.',
        'Optimized product interfaces for 50K+ end users.',
      ],
      technologies: ['Iconography', 'Figma', 'Component Libraries'],
      order: 1,
    },
    {
      company: 'Vivify Healthcare',
      role: 'UI/UX Designer',
      location: 'Visakhapatnam, India',
      startDate: 'Feb 2023',
      endDate: 'Jul 2024',
      description:
        'Conducted user research and usability testing, then designed responsive healthcare interfaces that improved the user experience through iterative feedback loops.',
      achievements: [
        'Conducted user research and usability testing.',
        'Designed responsive interfaces for healthcare applications.',
        'Used feedback loops and iterations to enhance user experience.',
      ],
      technologies: ['User Research', 'Usability Testing', 'Responsive Design', 'Figma'],
      order: 2,
    },
    {
      company: 'Aristocrat IT Solutions',
      role: 'UI Designer Intern',
      location: 'Remote',
      startDate: 'Nov 2022',
      endDate: 'Jan 2023',
      description:
        'Designed UI for promotional products, driving measurable engagement and conversion improvements.',
      achievements: [
        'Created UI designs for promotional products.',
        'Improved engagement by 30% and conversion by 20%.',
      ],
      technologies: ['UI Design', 'Promotional UX'],
      order: 3,
    },
    {
      company: 'Busibud Solutions',
      role: 'UI/UX Designer Intern',
      location: 'Remote',
      startDate: 'Aug 2022',
      endDate: 'Oct 2022',
      description:
        'Developed SaaS wireframes and web mockups in collaboration with product and engineering teams.',
      achievements: [
        'Developed SaaS wireframes and web mockups.',
      ],
      technologies: ['Wireframing', 'SaaS', 'Mockups'],
      order: 4,
    },
  ]
  for (const exp of experiences) {
    await db.experience.create({ data: { ...exp, status: 'published' } })
  }
  console.log(`  Created ${experiences.length} experiences`)

  // ---------- Projects ----------
  const projects = [
    {
      title: 'Healthcare App',
      slug: 'healthcare-app',
      description:
        'End-to-end product UI for a student health tracking application. Improved accessibility by 15% across critical flows.',
      longDescription:
        'A complete redesign of a student health tracking platform covering onboarding, daily check-ins, appointment scheduling, and provider communication. Established a baseline accessibility audit, then shipped a refreshed component system with focus indicators, color-contrast passes, and screen-reader labels. Improved accessibility score by 15% across the critical user journey.',
      role: 'Lead UI/UX Designer',
      technologies: ['Figma', 'Design Systems', 'Accessibility', 'Prototyping'],
      category: 'Product Design',
      isFeatured: true,
      startDate: '2023',
      endDate: '2024',
      order: 0,
    },
    {
      title: 'AI Chatbot — ATS Integration',
      slug: 'ai-chatbot-ats-integration',
      description:
        'Designed chatbot UI flows supporting applicant screening for an applicant tracking system.',
      longDescription:
        'A one-month engagement to design conversational UI flows for an AI chatbot integrated with an ATS. Mapped applicant journeys from initial chat through scheduling, balanced automation with human handoff, and validated flows with stakeholders.',
      role: 'UI/UX Designer',
      technologies: ['Conversational UI', 'Figma', 'User Flows'],
      category: 'Conversational UI',
      isFeatured: false,
      startDate: '2023',
      endDate: '2023',
      order: 1,
    },
    {
      title: 'Political Analytics Dashboard',
      slug: 'political-analytics-dashboard',
      description:
        'Designed dashboards for data visualization and insight delivery across multiple data sources.',
      longDescription:
        'Built a multi-source analytics dashboard for political data teams. Designed filter systems, chart layouts, and saved-view interactions to help analysts move from raw data to insight faster.',
      role: 'UI/UX Designer',
      technologies: ['Data Visualization', 'Figma', 'Dashboard Design'],
      category: 'Data Visualization',
      isFeatured: true,
      startDate: '2023',
      endDate: '2024',
      order: 2,
    },
    {
      title: 'SetDose',
      slug: 'setdose',
      description: 'UI design for a medication dosing companion application.',
      longDescription:
        'A focused UI design engagement for a medication dosing app. Explored minimalist layouts that surface the next dose, history, and reminders without overwhelming the user.',
      role: 'UI Designer',
      technologies: ['UI Design', 'Figma', 'Mobile'],
      category: 'Mobile UI',
      isFeatured: false,
      startDate: '2024',
      endDate: null,
      order: 3,
    },
    {
      title: 'IRCTC Redesign',
      slug: 'irctc-redesign',
      description:
        'Conceptual redesign adding Break Journey and One Click Return Tickets without disrupting the existing flow.',
      longDescription:
        'A personal study of the IRITC booking experience. Added two new features — Break Journey and One Click Return Tickets — without changing the existing flow. Validated the additions with paper prototypes before moving to high fidelity.',
      role: 'Conceptual UI/UX Designer',
      technologies: ['Concept Design', 'Figma', 'Prototyping'],
      category: 'Conceptual',
      isFeatured: false,
      startDate: '2024',
      endDate: null,
      order: 4,
    },
    {
      title: 'SEO Engine',
      slug: 'seo-engine',
      description: 'A search-optimization engine interface with keyword clustering and rank tracking.',
      longDescription:
        'Designed the dashboard and reporting interface for an SEO engine. Focused on making dense keyword data legible through clustering, trend lines, and configurable views.',
      role: 'UI/UX Designer',
      technologies: ['Dashboard', 'Figma', 'Data Visualization'],
      category: 'Product Design',
      isFeatured: false,
      startDate: '2024',
      endDate: null,
      order: 5,
    },
    {
      title: 'Doctors Management UI',
      slug: 'doctors-management-ui',
      description: 'Internal management UI for healthcare provider scheduling and patient routing.',
      longDescription:
        'An internal management tool for healthcare administrators. Designed for fast scanning of provider availability, patient assignment, and shift conflicts.',
      role: 'UI Designer',
      technologies: ['Internal Tools', 'Figma'],
      category: 'Product Design',
      isFeatured: false,
      startDate: '2023',
      endDate: null,
      order: 6,
    },
    {
      title: 'Resume Builder UI',
      slug: 'resume-builder-ui',
      description: 'A focused resume-builder interface with live preview and template switching.',
      longDescription:
        'Designed the editor and template-switching experience for a resume-builder tool. Prioritized live preview and an uncluttered editor surface.',
      role: 'UI Designer',
      technologies: ['Editor UX', 'Figma'],
      category: 'Product Design',
      isFeatured: false,
      startDate: '2023',
      endDate: null,
      order: 7,
    },
    {
      title: 'Food Order Mobile App UI',
      slug: 'food-order-mobile-ui',
      description: 'A mobile-first food ordering interface emphasizing quick reorder and dietary filters.',
      longDescription:
        'A mobile UI exploration for a food-ordering app. Emphasized quick reorder, dietary filters, and a frictionless checkout.',
      role: 'UI Designer',
      technologies: ['Mobile UI', 'Figma'],
      category: 'Mobile UI',
      isFeatured: false,
      startDate: '2023',
      endDate: null,
      order: 8,
    },
    {
      title: 'Yahoo Redesign UI',
      slug: 'yahoo-redesign-ui',
      description: 'Conceptual redesign of the Yahoo homepage with a focus on content hierarchy.',
      longDescription:
        'A personal study reimagining the Yahoo homepage. Re-prioritized content modules and refreshed the visual language.',
      role: 'Conceptual UI Designer',
      technologies: ['Concept Design', 'Figma'],
      category: 'Conceptual',
      isFeatured: false,
      startDate: '2023',
      endDate: null,
      order: 9,
    },
  ]
  for (const p of projects) {
    await db.project.create({ data: { ...p, status: 'published' } })
  }
  console.log(`  Created ${projects.length} projects`)

  // ---------- Skills ----------
  const skills = [
    { name: 'User Experience Design', category: 'UX', description: 'Crafting seamless, user-centered experiences across web and mobile by applying usability principles, user journeys, and persona development.', proficiency: 'Advanced', order: 0 },
    { name: 'User Flow', category: 'UX', description: 'Mapping end-to-end flows including empathy and journey maps to align teams around the user.', proficiency: 'Advanced', order: 1 },
    { name: 'Wireframing & Prototyping', category: 'Design Craft', description: 'Low- to high-fidelity wireframes and clickable prototypes in Figma and Adobe XD to validate concepts before development.', proficiency: 'Advanced', order: 2 },
    { name: 'Interactive Prototypes', category: 'Design Craft', description: 'Building interactive flows and mockups that communicate motion and state transitions.', proficiency: 'Advanced', order: 3 },
    { name: 'Design Systems', category: 'Systems', description: 'Building and maintaining consistent design systems, style guides, and reusable component libraries across products.', proficiency: 'Advanced', order: 4 },
    { name: 'Design Tokens', category: 'Systems', description: 'Token-based theming and dynamic theming to scale visual consistency across platforms.', proficiency: 'Advanced', order: 5 },
    { name: 'Component Libraries', category: 'Systems', description: 'Maintaining UI kits that scale with product and engineering needs.', proficiency: 'Advanced', order: 6 },
    { name: 'Accessibility & Responsive Design', category: 'Quality', description: 'Ensuring inclusive and accessible design following WCAG and optimizing UI for various screen sizes and devices.', proficiency: 'Intermediate', order: 7 },
    { name: 'Responsive Grid Systems', category: 'Quality', description: 'Applying the 60:30:10 rule and responsive grids for balanced, accessible layouts.', proficiency: 'Advanced', order: 8 },
    { name: 'Usability Testing', category: 'Research', description: 'Conducting user testing sessions and iterating based on feedback to improve usability and product-market fit.', proficiency: 'Advanced', order: 9 },
    { name: 'A/B Testing', category: 'Research', description: 'Designing and analyzing A/B tests, with feedback analysis and iterative design.', proficiency: 'Intermediate', order: 10 },
    { name: 'HTML & CSS', category: 'Engineering', description: 'Working knowledge of HTML5, CSS3, Flexbox, and Grid for tighter collaboration with developers and cleaner design handoff.', proficiency: 'Intermediate', order: 11 },
    { name: 'Responsive Web Design', category: 'Engineering', description: 'Designing responsive, web-native layouts that translate cleanly into code.', proficiency: 'Intermediate', order: 12 },
    { name: 'Cross-functional Collaboration', category: 'Working Style', description: 'Working closely with developers, product managers, and stakeholders to translate business goals into design solutions.', proficiency: 'Advanced', order: 13 },
    { name: 'Strategic Thinking & AI Exposure', category: 'Working Style', description: 'Leveraging design strategy and exploring emerging technologies like generative AI and design automation to stay ahead of trends.', proficiency: 'Intermediate', order: 14 },
  ]
  for (const s of skills) {
    await db.skill.create({ data: { ...s, status: 'published' } })
  }
  console.log(`  Created ${skills.length} skills`)

  // ---------- Education ----------
  await db.education.create({
    data: {
      institution: 'Raghu Engineering College',
      qualification: 'BTech',
      field: 'Mechanical Engineering',
      startDate: '2016',
      endDate: '2021',
      description: 'Completed undergraduate studies in Mechanical Engineering, building a foundation in problem-solving that later translated into a design career.',
      credentialUrl: null,
      order: 0,
      status: 'published',
    },
  })
  console.log('  Created education entry')

  // ---------- Certifications ----------
  const certs = [
    { name: 'Certified UI/UX Designer', issuer: 'Certification Body', date: '2021', credentialUrl: null, order: 0 },
    { name: 'Certified WordPress Designer', issuer: 'Certification Body', date: '2024', credentialUrl: null, order: 1 },
    { name: 'AI in Design (Workshop)', issuer: 'Workshop', date: '2025', credentialUrl: null, order: 2 },
  ]
  for (const c of certs) {
    await db.certification.create({ data: { ...c, status: 'published' } })
  }
  console.log(`  Created ${certs.length} certifications`)

  // ---------- Social links ----------
  const socials = [
    { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/ramathota-vinay', icon: 'linkedin', label: 'LinkedIn', order: 0 },
    { platform: 'Behance', url: 'https://www.behance.net/vinayairamatho', icon: 'behance', label: 'Behance', order: 1 },
    { platform: 'Email', url: 'mailto:vinayi220997@gmail.com', icon: 'mail', label: 'Email', order: 2 },
    { platform: 'Phone', url: 'tel:+919966782923', icon: 'phone', label: 'Phone', order: 3 },
  ]
  for (const s of socials) {
    await db.socialLink.create({ data: { ...s, status: 'published' } })
  }
  console.log(`  Created ${socials.length} social links`)

  // ---------- Initial resume version (private) ----------
  // Store encrypted (matching the upload route's behavior) so publish/download work correctly.
  const fs = await import('fs')
  const path = await import('path')
  const { encrypt } = await import('../src/lib/crypto')
  const { writePrivateUpload } = await import('../src/lib/storage')
  const resumeSrcPath = path.join(process.cwd(), 'data', 'private', 'ramathota-vinay-resume-original.pdf')
  if (fs.existsSync(resumeSrcPath)) {
    const buf = fs.readFileSync(resumeSrcPath)
    const encrypted = encrypt(buf)
    const encName = 'ramathota-vinay-resume-original-' + Date.now() + '.pdf.enc'
    const encPath = await writePrivateUpload(encName, encrypted)
    await db.resumeVersion.create({
      data: {
        versionLabel: 'Original Upload (October 2026)',
        filename: 'ramathota-vinay-resume-original.pdf',
        mimeType: 'application/pdf',
        fileSize: buf.length,
        storagePath: encPath,
        notes: 'Original résumé uploaded by portfolio owner. Private — not publicly accessible.',
        isPublished: false,
        publicUrl: null,
      },
    })
    console.log('  Stored original résumé as private version')
  }

  console.log('\nSeed completed. Default login: admin_user / admin_password@58 (change immediately)')
  console.log('Access admin: enter "#admin" in the footer #code field')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
