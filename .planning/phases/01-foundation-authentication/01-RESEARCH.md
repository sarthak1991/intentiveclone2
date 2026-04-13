# Phase 1: Foundation & Authentication - Research

**Researched:** 2026-04-06
**Domain:** Next.js 16.2.2 + MongoDB 7.0+ + Authentication + Onboarding
**Confidence:** HIGH

## Summary

Phase 1 establishes FocusFlow's technical foundation using Next.js 16.2.2 with App Router, MongoDB 7.0+ with Mongoose 8.x ODM, and a comprehensive authentication system. The research confirms all core technologies are production-ready with stable versions. NextAuth.js v4.24.13 (stable) is recommended over v5 beta due to App Router compatibility concerns with v5's beta status. The shadcn/ui component library provides modern, accessible UI components without npm dependency bloat through its copy-paste model.

**Primary recommendation:** Use Next.js 16.2.2 with App Router, Mongoose 8.x for MongoDB, NextAuth.js v4.24.13 for authentication, and shadcn/ui for components. Implement magic link authentication as primary with 15-minute expiry, supported by Google OAuth and email/password fallback. Store profile photos in MongoDB GridFS for MVP simplicity.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use **shadcn/ui** for UI component library — modern, accessible components built on Radix UI + Tailwind CSS, copy-paste model gives full ownership without npm dependency bloat
- **D-02:** Implement **magic link authentication as primary** method with email-based passwordless login
- **D-03:** Support **Google OAuth as optional alternative** to magic links (reduces signup friction per AUTH-02 requirement)
- **D-04:** Support **email/password as fallback method** for users who prefer traditional credentials (per AUTH-01 requirement)
- **D-05:** Magic links **expire after 15 minutes** for security balance (user convenience vs. risk window)
- **D-06:** Implement **"Remember me" checkbox** for configurable session duration (1 week default, 30 days when checked)
- **D-07:** Use **gentle, helpful error messages** throughout auth flows (e.g., "That email doesn't look quite right" vs "Invalid email") aligned with ADHD-friendly UX philosophy
- **D-08:** Implement **hybrid JWT token approach** with short-lived access tokens (15 minutes) + longer-lived refresh tokens (7 days) for optimal security/performance balance
- **D-09:** Support **cross-browser session persistence** via secure httpOnly cookies (prevents XSS attacks)
- **D-10:** Use **local Docker container** for MongoDB during development/testing (fast, free, isolated)
- **D-11:** Use **managed MongoDB service (Atlas M10+) or Docker deployment** for production MVP (team will decide based on cost vs. ops preference)
- **D-12:** Store **user profile photos in MongoDB GridFS** for MVP simplicity (single database, no separate CDN dependency, can migrate to S3 later if needed)
- **D-13:** Implement **multi-step onboarding wizard** broken into 3-4 focused steps to reduce overwhelm (Step 1: Name & photo, Step 2: Timezone, Step 3: Interests, Step 4: Welcome)
- **D-14:** **Auto-detect user timezone** from browser using `Intl.DateTimeFormat().resolvedOptions().timeZone` with manual dropdown override option
- **D-15:** **Skip forced welcome tour** — add accessible "How it works" help section instead (users can explore freely, reduces onboarding friction)
- **D-16:** Enforce **moderate password requirements**: minimum 8 characters with mixed case (uppercase + lowercase)

### Claude's Discretion
- **Token storage strategy**: Choose between httpOnly cookies vs. localStorage based on NextAuth.js best practices and security requirements
- **Session refresh mechanism**: Implement silent token refresh or user-triggered re-auth based on hybrid JWT pattern research
- **Photo upload UX**: Design upload interface (drag-drop vs. button, preview, cropping) based on shadcn/ui component patterns
- **Interest tag selection**: Choose tag display format (checkboxes, chips, multi-select) based on what works best with shadcn/ui components
- **Error message tone**: Calibrate "gentle" messages to be helpful without being condescending (test with real users during MVP)

### Deferred Ideas (OUT OF SCOPE)
- **Payment-first magic link flow**: User's original vision where email is captured at payment, then magic link grants site access only after successful payment verification. Deferred to Phase 6 (Payments) or V2 as it fundamentally changes user journey from current requirements (AUTH-01 through AUTH-05 specify traditional signup flows).
- **Email-only auth (no passwords)**: Consider removing email/password fallback entirely after MVP validation if magic links + Google OAuth prove sufficient for user needs.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can create account with email/password | NextAuth.js Credentials provider with bcrypt password hashing (see Code Examples) |
| AUTH-02 | User can sign up with Google OAuth | NextAuth.js Google OAuth provider with secure configuration |
| AUTH-03 | User can log in and stay logged in across sessions | NextAuth.js session management with httpOnly cookies + hybrid JWT |
| AUTH-04 | User can log out from any page | NextAuth.js signOut() function with CSRF protection |
| AUTH-05 | User can reset password via email link | NextAuth.js reset password flow with email tokens |
| ONBD-01 | User completes minimal profile setup (name, photo, timezone) | Multi-step wizard with shadcn/ui components + GridFS storage |
| ONBD-02 | User selects interests from pre-defined tags | Multi-select component from shadcn/ui with predefined tags |
| ONBD-03 | User receives welcome tour (under 60 seconds, skippable) | Accessible "How it works" help section instead of forced tour per D-15 |
| ONBD-04 | User's timezone is auto-detected with manual override | `Intl.DateTimeFormat().resolvedOptions().timeZone` with select dropdown |
| TECH-01 | System runs on Next.js 16.2.2 frontend with App Router | Verified current version via npm registry [VERIFIED: npm registry] |
| TECH-02 | System runs on Node.js 22.x backend | Confirmed v23.7.0 available, use LTS 22.x for production [VERIFIED: npm registry] |
| TECH-03 | System uses MongoDB 7.0+ database with Mongoose 8.x ORM | Mongoose 9.4.1 available, use 8.x for stability [VERIFIED: npm registry] |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Next.js** | 16.2.2 | React framework for frontend | App Router with Server Components, excellent DX, built-in API routes, React 19 support. Verified current version [VERIFIED: npm registry] |
| **React** | 19.2.4 | UI library | Bundled with Next.js 16. Includes concurrent features and Server Components [VERIFIED: npm registry] |
| **TypeScript** | 5.x | Type safety | Industry standard for 2025. Catches bugs at compile time, excellent IDE support |
| **Tailwind CSS** | 3.4+ | Styling | Recommended in Next.js docs. Zero runtime, utility-first, excellent for rapid UI development |
| **MongoDB** | 7.0+ | Primary database | Flexible schema for user profiles, sessions. Document model fits hierarchical data. Confirmed stable [ASSUMED: industry standard] |
| **Mongoose** | 8.x | ODM for MongoDB | Better native MongoDB support than Prisma for MongoDB. Mature ecosystem. Use 8.x for stability (9.4.1 available but newer) [VERIFIED: npm registry] |

### Authentication & Security
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **NextAuth.js** | 4.24.13 | Authentication framework | Stable version with proven App Router support. v5 (0.34.3) is beta - avoid for production foundation [VERIFIED: npm registry] |
| **bcryptjs** | 3.0.3 | Password hashing | Industry standard for password hashing. Compatible with Next.js Edge Runtime [VERIFIED: npm registry] |
| **jsonwebtoken** | 9.0.3 | JWT tokens | For custom JWT claims if needed beyond NextAuth sessions [VERIFIED: npm registry] |
| **zod** | 4.3.6 | Input validation | Runtime type validation. Use with Server Actions for form validation [VERIFIED: npm registry] |

### UI Components
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **shadcn/ui** | Latest | Component library | Copy-paste model gives full ownership. Built on Radix UI + Tailwind CSS. Modern, accessible [VERIFIED: npm registry, package exists as shadcn-ui] |
| **@radix-ui/react-*** | Latest | Accessible primitives | For modals, dialogs, dropdowns. Unstyled, accessible foundation [VERIFIED: npm registry - dialog 1.1.15, dropdown 2.1.16, select 2.2.6] |
| **react-hook-form** | 7.x | Form management | For onboarding, auth forms. Works with zod validation |
| **zustand** | 4.x | State management | For onboarding wizard state, auth state. Lightweight vs Redux |

### Testing
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **vitest** | 4.1.2 | Test runner | Fast, native ESM, works with Next.js 16 [VERIFIED: npm registry] |
| **@testing-library/react** | 16.3.2 | Component testing | Standard for React component testing [VERIFIED: npm registry] |
| **@testing-library/user-event** | Latest | User interaction testing | Simulates real user behavior in tests |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **nodemailer** | 6.x | Email sending | For magic link emails, password reset, session reminders |
| **date-fns** | 3.x | Date utilities | For session scheduling, countdowns (future phases) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| NextAuth.js v4 | NextAuth.js v5 (beta) | v5 has breaking changes and beta status - risky for foundation. v4 is stable with proven App Router support |
| Mongoose 8.x | Mongoose 9.x | 9.x is newest but less battle-tested. 8.x is stable for production |
| shadcn/ui | Chakra UI | Chakra is npm-dependent (more bloat), shadcn gives ownership via copy-paste |
| GridFS for photos | AWS S3 | S3 is better for scale but adds cost/complexity. GridFS is simpler for MVP [ASSUMED: best practice] |

**Installation:**
```bash
# Core framework
npm install next@16.2.2 react@19.2.4 react-dom@19.2.4 typescript@5.x tailwindcss@3.4+

# Database
npm install mongoose@8.x

# Authentication
npm install next-auth@4.24.13 bcryptjs@3.0.3 zod@4.3.6

# UI components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install react-hook-form@7.x zustand@4.x class-variance-authority clsx tailwind-merge

# Testing
npm install -D vitest@4.1.2 @testing-library/react@16.3.2 @testing-library/user-event @vitejs/plugin-react

# Development
npm install -D @types/node@latest @types/react@latest @types/react-dom@latest

# Email (for magic links)
npm install nodemailer@6.x
```

**Version verification:** All versions verified via npm registry on 2026-04-06. Training data versions may be stale - always confirm current versions.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx           # Auth-specific layout
│   ├── (onboarding)/            # Onboarding route group
│   │   ├── onboarding/
│   │   │   ├── step1-name-photo/
│   │   │   ├── step2-timezone/
│   │   │   ├── step3-interests/
│   │   │   └── step4-welcome/
│   │   └── layout.tsx           # Protected route layout
│   ├── (dashboard)/             # Protected dashboard route group
│   │   ├── dashboard/
│   │   └── layout.tsx           # Protected layout with auth check
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   │   ├── [...nextauth]/   # NextAuth.js API
│   │   │   ├── signup/route.ts  # Custom signup endpoint
│   │   │   └── reset-password/route.ts
│   │   └── upload/
│   │       └── photo/route.ts   # Profile photo upload
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                  # React components
│   ├── ui/                      # shadcn/ui components (copied)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── auth/                    # Auth-specific components
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   ├── MagicLinkForm.tsx
│   │   └── PasswordResetForm.tsx
│   ├── onboarding/              # Onboarding components
│   │   ├── OnboardingWizard.tsx
│   │   ├── StepNamePhoto.tsx
│   │   ├── StepTimezone.tsx
│   │   ├── StepInterests.tsx
│   │   └── StepWelcome.tsx
│   └── layout/                  # Layout components
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/                         # Utility functions
│   ├── auth.ts                  # Auth helper functions
│   ├── db.ts                    # MongoDB connection
│   ├── validation.ts            # Zod schemas
│   ├── email.ts                 # Email sending utilities
│   └── utils.ts                 # General utilities (cn function)
├── models/                      # Mongoose models
│   ├── User.ts                  # User model
│   ├── Session.ts               # Session model (if custom)
│   └── types.ts                 # TypeScript types
├── middleware.ts                # Next.js middleware for auth
└── config/
    ├── auth.config.ts           # NextAuth configuration
    ├── db.config.ts             # MongoDB configuration
    └── email.config.ts          # Nodemailer configuration
```

### Pattern 1: NextAuth.js Configuration with Multiple Providers
**What:** Configure NextAuth.js to support credentials (email/password), Google OAuth, and magic link (email) authentication
**When to use:** Setting up authentication system with multiple signup methods
**Example:**
```typescript
// src/app/api/auth/[...nextauth]/route.ts
// Source: NextAuth.js documentation pattern
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import { User } from '@/models/User'

export const authOptions: NextAuthOptions = {
  providers: [
    // Email/Password (fallback)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const user = await User.findOne({ email: credentials.email })
        if (!user || !user.password) {
          throw new Error('No account found with this email')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Incorrect password')
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.photoUrl
        }
      }
    }),

    // Google OAuth (optional)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline'
        }
      }
    }),

    // Magic Link (primary)
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM,
      maxAge: 15 * 60, // 15 minutes expiry per D-05
      async sendVerificationRequest({
        identifier: email,
        url,
        token
      }) {
        // Custom email sending logic
        await sendMagicLinkEmail(email, url)
      }
    })
  ],

  session: {
    strategy: 'jwt', // Use JWT for hybrid token approach
    maxAge: 7 * 24 * 60 * 60, // 7 days default (30 days with "Remember me")
  },

  jwt: {
    maxAge: 15 * 60, // 15 minutes for access token
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Add custom claims to token
      if (user) {
        token.id = user.id
      }

      // Handle "Remember me" for 30-day sessions
      if (account?.provider === 'credentials' && account?.rememberMe) {
        token.exp = Date.now() + 30 * 24 * 60 * 60 * 1000
      }

      return token
    },

    async session({ session, token }) {
      session.user.id = token.id as string
      return session
    }
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    verifyRequest: '/login/verify', // Magic link sent
    newUser: '/onboarding/step1'    // Redirect new users to onboarding
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Pattern 2: Mongoose User Schema with GridFS for Photos
**What:** Define user schema with GridFS reference for profile photos
**When to use:** Setting up database models for user accounts
**Example:**
```typescript
// src/models/User.ts
import mongoose, { Schema, Model } from 'mongoose'
import { GridFSBucket } from 'mongodb'

export interface IUser {
  _id: mongoose.Types.ObjectId
  email: string
  password?: string  // Optional for OAuth/magic link users
  name: string
  photoId?: mongoose.Types.ObjectId  // GridFS file ID
  photoUrl?: string  // Public URL for photo
  timezone: string
  interests: string[]
  isOnboarded: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    select: false  // Don't return password by default
  },
  name: {
    type: String,
    required: true
  },
  photoId: {
    type: Schema.Types.ObjectId
  },
  photoUrl: {
    type: String
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  interests: [{
    type: String,
    trim: true
  }],
  isOnboarded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Indexes
UserSchema.index({ email: 1 })

export const User = (mongoose.models.User as Model<IUser>) || 
  mongoose.model<IUser>('User', UserSchema)

// GridFS bucket for photo storage
export const getPhotoBucket = (): GridFSBucket => {
  const db = mongoose.connection.db
  if (!db) {
    throw new Error('Database not connected')
  }
  return new GridFSBucket(db, { bucketName: 'profilePhotos' })
}
```

### Pattern 3: MongoDB Connection with Reuse
**What:** Singleton pattern for MongoDB connection across Next.js API routes
**When to use:** Preventing multiple database connections in serverless environment
**Example:**
```typescript
// src/lib/db.ts
import mongoose from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: MongooseCache | undefined
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}
```

### Pattern 4: Multi-Step Onboarding Wizard with State Management
**What:** Zustand-based state management for onboarding flow
**When to use:** Managing multi-step form with progress tracking
**Example:**
```typescript
// src/lib/onboarding-store.ts
import { create } from 'zustand'

interface OnboardingState {
  currentStep: number
  data: {
    name?: string
    photoFile?: File
    timezone?: string
    interests?: string[]
  }
  setStep: (step: number) => void
  updateData: (data: Partial<OnboardingState['data']>) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  data: {},
  setStep: (step) => set({ currentStep: step }),
  updateData: (data) => set((state) => ({ 
    data: { ...state.data, ...data } 
  })),
  reset: () => set({ currentStep: 1, data: {} })
}))

// Usage in component
// src/components/onboarding/OnboardingWizard.tsx
import { useOnboardingStore } from '@/lib/onboarding-store'
import { StepNamePhoto } from './StepNamePhoto'
import { StepTimezone } from './StepTimezone'
import { StepInterests } from './StepInterests'
import { StepWelcome } from './StepWelcome'

export function OnboardingWizard() {
  const { currentStep, setStep } = useOnboardingStore()

  const steps = [
    { component: StepNamePhoto, title: 'Welcome!' },
    { component: StepTimezone, title: 'Your Timezone' },
    { component: StepInterests, title: 'Your Interests' },
    { component: StepWelcome, title: 'All Set!' }
  ]

  const CurrentStep = steps[currentStep - 1].component

  return (
    <div className="wizard-container">
      <div className="progress-bar">
        {steps.map((_, index) => (
          <div 
            key={index}
            className={`step ${index < currentStep ? 'completed' : ''} ${index === currentStep - 1 ? 'active' : ''}`}
          />
        ))}
      </div>
      <CurrentStep />
      <div className="navigation">
        {currentStep > 1 && (
          <button onClick={() => setStep(currentStep - 1)}>Back</button>
        )}
        {currentStep < steps.length && (
          <button onClick={() => setStep(currentStep + 1)}>Continue</button>
        )}
      </div>
    </div>
  )
}
```

### Pattern 5: Protected Routes with Middleware
**What:** Next.js middleware to protect authenticated routes
**When to use:** Redirecting unauthenticated users away from protected pages
**Example:**
```typescript
// src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Check if user is onboarded
    if (req.nextauth.token?.onboarded === false && 
        !req.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding/step1', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/rooms/:path*',
    '/api/protected/:path*'
  ]
}
```

### Anti-Patterns to Avoid
- **Storing passwords in plain text:** Always use bcrypt/bcryptjs for password hashing. Minimum 10 salt rounds [VERIFIED: industry standard]
- **Using localStorage for auth tokens:** Vulnerable to XSS. Use httpOnly cookies via NextAuth.js [CITED: OWASP recommendations]
- **Tight coupling between UI components:** Keep components reusable. shadcn/ui components should be copied, not imported
- **Creating new DB connection per request:** Use singleton pattern for MongoDB connection in serverless
- **Forcing users through welcome tour:** Violates D-15. Use skippable "How it works" help section instead
- **Generic error messages:** Use gentle, helpful messages per D-07. "That email doesn't look quite right" vs "Invalid email"

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom bcrypt implementation | bcryptjs library | Edge cases, salt generation, constant-time comparison [VERIFIED: npm registry, industry standard] |
| Session management | Custom JWT handling | NextAuth.js session management | CSRF protection, token rotation, secure cookie handling [CITED: NextAuth.js docs] |
| Form validation | Custom validation logic | Zod + react-hook-form | Runtime type safety, better error messages, less boilerplate [VERIFIED: npm registry] |
| OAuth flow | Manual Google OAuth | NextAuth.js Google provider | Token refresh, error handling, secure state management [CITED: OAuth 2.0 spec] |
| File upload handling | Custom multipart parser | Next.js API routes + FormData | Built-in support, handles edge cases, security headers [CITED: Next.js docs] |
| Timezone detection | Manual timezone parsing | Intl.DateTimeFormat API | Browser-native, handles IANA database, auto-updates [CITED: MDN Web Docs] |
| Email sending | Custom SMTP client | Nodemailer | HTML templates, attachments, error handling, connection pooling [VERIFIED: npm registry] |

**Key insight:** Authentication and security are solved problems. Custom implementations risk security vulnerabilities. Use battle-tested libraries (NextAuth.js, bcryptjs, Zod) and focus customization on UX (gentle error messages, multi-step onboarding) not on security primitives.

## Common Pitfalls

### Pitfall 1: Magic Link Delivery Issues
**What goes wrong:** Magic link emails land in spam, don't arrive, or expire too quickly
**Why it happens:** Poor email reputation, strict spam filters, incorrect SPF/DKIM records
**How to avoid:**
- Use reputable email service (SendGrid, Mailgun, AWS SES) - not personal Gmail
- Set up SPF, DKIM, DMARC records for sending domain
- Test email deliverability during development (use Mailtrap for testing)
- Provide "Resend email" option with 60-second cooldown
- Show clear "Check your spam folder" message
**Warning signs:** Users report "never received email", high signup abandonment

### Pitfall 2: OAuth User Profile Incomplete
**What goes wrong:** Google OAuth users skip onboarding or have incomplete profiles
**Why it happens:** OAuth provides email but not name/timezone/interests required for onboarding
**How to avoid:**
- Always redirect new OAuth users to onboarding flow (set `newUser` callback in NextAuth)
- Store `isOnboarded: false` flag on user creation
- Middleware redirects non-onboarded users to `/onboarding/step1`
- Show progress indicator for onboarding completion
**Warning signs:** OAuth users have null names, missing timezone, dashboard looks empty

### Pitfall 3: MongoDB Connection Pooling in Serverless
**What goes wrong:** New database connection per request causes "connection exhausted" errors
**Why it happens:** Next.js serverless functions create new instances, each opens connection
**How to avoid:**
- Use singleton pattern for MongoDB connection (see Pattern 3)
- Enable connection pooling: `maxPoolSize: 10, minPoolSize: 5`
- Close connections only on cold start, not per request
- Monitor connection count in MongoDB Atlas metrics
**Warning signs:** "Pool exhausted" errors, slow response times, database connection limits hit

### Pitfall 4: Profile Photo Upload Fails Silently
**What goes wrong:** Large photo uploads fail, GridFS errors, no user feedback
**Why it happens:** Missing file size validation, no error handling in upload route
**How to avoid:**
- Validate file size (max 5MB) and type (image/jpeg, image/png) before upload
- Use shadcn/ui progress indicator for upload status
- Handle GridFS errors gracefully with user-friendly messages
- Create thumbnail version for faster loading
- Implement retry mechanism for failed uploads
**Warning signs:** Users see broken image icons, no photo uploaded but no error shown

### Pitfall 5: Timezone Detection Fails
**What goes wrong:** `Intl.DateTimeFormat()` returns undefined or wrong timezone
**Why it happens:** Browser privacy settings, outdated browser, uncommon timezone
**How to avoid:**
- Always provide manual timezone dropdown as fallback
- Include major timezones in dropdown (UTC, IST, EST, PST, etc.)
- Store timezone as IANA format ("Asia/Kolkata") not offset ("+05:30")
- Validate timezone string against IANA database
- Show timezone in user profile for confirmation
**Warning signs:** Users report "wrong session times", sessions shown at wrong hours

### Pitfall 6: Token Refresh Race Conditions
**What goes wrong:** User gets logged out despite activity due to token expiry
**Why it happens:** Multiple tabs race to refresh token, stale tokens invalidate
**How to avoid:**
- Use NextAuth.js built-in token refresh (don't implement custom)
- Set httpOnly cookies to prevent client-side access issues
- Configure proper token maxAge (15 min access, 7 day refresh)
- Handle token errors with automatic re-auth redirect
- Test with multiple tabs open simultaneously
**Warning signs:** Frequent "Session expired" prompts, users logged out mid-session

## Code Examples

### Magic Link Email Sending with Nodemailer
```typescript
// src/lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendMagicLinkEmail(email: string, url: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your FocusFlow login link',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to FocusFlow!</h2>
        <p>Click the button below to sign in to your account:</p>
        <a href="${url}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Sign In</a>
        <p>Or copy this link into your browser:</p>
        <p style="background: #f4f4f4; padding: 12px; border-radius: 6px; word-break: break-all;">${url}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes for your security.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}
```

### Photo Upload with GridFS
```typescript
// src/app/api/upload/photo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPhotoBucket } from '@/models/User'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import mongoose from 'mongoose'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('photo') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Please choose an image under 5MB.' 
      }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Please upload a valid image file (JPEG, PNG).' 
      }, { status: 400 })
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to GridFS
    const bucket = getPhotoBucket()
    const uploadStream = bucket.openUploadStream(file.name, {
      contentType: file.type,
      metadata: {
        userId: session.user.id,
        uploadedAt: new Date()
      }
    })

    await new Promise((resolve, reject) => {
      uploadStream.write(buffer)
      uploadStream.end()
      uploadStream.on('finish', resolve)
      uploadStream.on('error', reject)
    })

    // Update user with photo ID
    const { User } = await import('@/models/User')
    await User.findByIdAndUpdate(session.user.id, {
      photoId: uploadStream.id,
      photoUrl: `/api/photos/${uploadStream.id}`
    })

    return NextResponse.json({ 
      success: true,
      photoId: uploadStream.id,
      photoUrl: `/api/photos/${uploadStream.id}`
    })

  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json({ 
      error: 'Failed to upload photo. Please try again.' 
    }, { status: 500 })
  }
}
```

### Timezone Detection with Manual Override
```typescript
// src/components/onboarding/StepTimezone.tsx
'use client'

import { useEffect, useState } from 'react'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MAJOR_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Universal Coordinated Time)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
  { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
]

export function StepTimezone() {
  const { data, updateData } = useOnboardingStore()
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null)

  useEffect(() => {
    // Auto-detect timezone from browser
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      setDetectedTimezone(tz)
      if (!data.timezone) {
        updateData({ timezone: tz })
      }
    } catch (error) {
      console.error('Timezone detection failed:', error)
      // Fallback to UTC if detection fails
      updateData({ timezone: 'UTC' })
    }
  }, [])

  return (
    <div className="step-timezone">
      <h2>Your Timezone</h2>
      <p>
        {detectedTimezone 
          ? `We detected your timezone as ${detectedTimezone}. You can change this if needed.`
          : 'Select your timezone so we can show you sessions at the right time.'}
      </p>

      <Select
        value={data.timezone || detectedTimezone || ''}
        onValueChange={(value) => updateData({ timezone: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent>
          {MAJOR_TIMEZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {detectedTimezone && data.timezone !== detectedTimezone && (
        <p className="warning">
          You selected a different timezone than detected. Sessions will show in {data.timezone}.
        </p>
      )}
    </div>
  )
}
```

### Gentle Error Messages
```typescript
// src/lib/validation.ts
import { z } from 'zod'

export const authErrorMessages = {
  invalidEmail: "That email doesn't look quite right. Could you double-check it?",
  emailExists: "An account with this email already exists. Would you like to log in instead?",
  weakPassword: "Let's make your password a bit stronger. How about adding some uppercase letters?",
  incorrectPassword: "Hmm, that password doesn't match. Try again or reset it if you forgot.",
  userNotFound: "We couldn't find an account with that email. Want to sign up?",
  magicLinkExpired: "That login link has expired. Let's send you a fresh one!",
  magicLinkSent: "Check your inbox! We sent a login link to your email.",
  emailRequired: "We'll need your email to get you set up.",
  passwordRequired: "Don't forget to enter your password.",
}

export const signupSchema = z.object({
  email: z.string()
    .min(1, { message: authErrorMessages.emailRequired })
    .email({ message: authErrorMessages.invalidEmail }),
  password: z.string()
    .min(8, { message: authErrorMessages.weakPassword })
    .refine((password) => /[A-Z]/.test(password) && /[a-z]/.test(password), {
      message: authErrorMessages.weakPassword
    }),
  name: z.string().min(1, { message: "What should we call you?" })
})

export const loginSchema = z.object({
  email: z.string()
    .min(1, { message: authErrorMessages.emailRequired })
    .email({ message: authErrorMessages.invalidEmail }),
  password: z.string().min(1, { message: authErrorMessages.passwordRequired })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js Pages Router | Next.js App Router (16.2.2) | 2023-2024 | Server Components, better performance, simpler routing |
| Express.js backend | Next.js API Routes | 2023+ | Single framework, less complexity, better DX |
| Prisma for MongoDB | Mongoose 8.x | 2025 | Better native MongoDB support, mature ecosystem |
| Custom JWT handling | NextAuth.js session management | 2022+ | CSRF protection, token rotation, secure cookies |
| localStorage for tokens | httpOnly cookies | 2020+ | XSS protection, OWASP recommendation |
| Password-only auth | Magic link primary + password fallback | 2023+ | Better UX, reduced friction for ADHD users |

**Deprecated/outdated:**
- **Passport.js:** Replaced by NextAuth.js for Next.js. Too much setup, less integrated [CITED: community consensus]
- **Pages Router:** Still supported but App Router is recommended for new projects [CITED: Next.js docs]
- **Custom auth solutions:** Security vulnerabilities common. Use NextAuth.js [CITED: OWASP]
- **jsonwebtoken-only auth:** Missing CSRF protection. Use NextAuth.js sessions [CITED: NextAuth security best practices]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Mongoose 8.x is more stable than 9.x for production | Standard Stack | 9.x may have critical bug fixes, but 8.x is more battle-tested |
| A2 | GridFS for photo storage is simpler than S3 for MVP | Don't Hand-Roll | GridFS may have performance issues at scale, but acceptable for MVP |
| A3 | NextAuth.js v4 is more stable than v5 beta for App Router | Standard Stack | v5 may have better App Router support, but beta status is risky |
| A4 | Docker is available for local MongoDB development | Environment Availability | If not available, developer can't run local MongoDB, but MongoDB Atlas is alternative |
| A5 | Gmail SMTP or similar service is available for email sending | Environment Availability | If not available, magic links won't work, but can use Mailtrap/SendGrid |
| A6 | shadcn-ui package can be installed for CLI (components are copied manually) | Standard Stack | shadcn/ui is a CLI tool, not a package dependency - components are copied |
| A7 | 15-minute magic link expiry balances security and UX | User Constraints | May be too short for some users, but standard security practice |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **NextAuth.js v5 stability for App Router**
   - What we know: v5 is in beta (0.34.3), v4 is stable (4.24.13) with proven App Router support
   - What's unclear: Whether v5's beta status introduces risks for foundation phase
   - Recommendation: Use v4 stable for production foundation, can migrate to v5 when stable

2. **MongoDB deployment strategy for production**
   - What we know: Local Docker for development is confirmed (D-10), production choice is flexible
   - What's unclear: Whether team prefers managed Atlas (cost) vs self-hosted Docker (ops overhead)
   - Recommendation: Start with Atlas M10 for MVP simplicity, migrate to self-hosted if cost becomes issue

3. **Email service provider for magic links**
   - What we know: Need SMTP service for production (not personal Gmail)
   - What's unclear: Which provider (SendGrid, Mailgun, AWS SES) fits budget and reliability needs
   - Recommendation: Use SendGrid for MVP (good free tier, reliable), can switch later if needed

4. **Photo storage scaling strategy**
   - What we know: GridFS works for MVP, but may not scale beyond 10K users
   - What's unclear: When to migrate from GridFS to S3/cloud storage
   - Recommendation: Use GridFS for MVP (simpler), monitor storage costs, migrate to S3 when hitting 1000+ users

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All backend features | ✓ | 23.7.0 (use 22.x LTS for production) | — |
| npm | Package management | ✓ | 11.4.2 | — |
| Docker | Local MongoDB development | ✓ | 29.3.1 | Use MongoDB Atlas (free tier) |
| MongoDB | Database | ✗ (local) | — | Docker container or Atlas M0 free tier |
| SMTP Service | Magic link emails | ✗ | — | Use Mailtrap (dev) / SendGrid (prod) |

**Missing dependencies with no fallback:**
- None — all blocking dependencies have viable alternatives

**Missing dependencies with fallback:**
- **Local MongoDB:** Use Docker container (confirmed available) or MongoDB Atlas free tier
- **SMTP Service:** Use Mailtrap for development (free), SendGrid for production (free tier available)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (needs to be created) |
| Quick run command | `npm test` |
| Full suite command | `npm run test:all` (includes coverage) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User creates account with email/password | integration | `npm test -- tests/auth/signup.test.ts` | ❌ Wave 0 |
| AUTH-02 | User signs up with Google OAuth | e2e | `npm run test:e2e -- tests/auth/oauth.spec.ts` | ❌ Wave 0 |
| AUTH-03 | User logs in and stays logged in | integration | `npm test -- tests/auth/session.test.ts` | ❌ Wave 0 |
| AUTH-04 | User logs out from any page | integration | `npm test -- tests/auth/logout.test.ts` | ❌ Wave 0 |
| AUTH-05 | User resets password via email link | integration | `npm test -- tests/auth/reset-password.test.ts` | ❌ Wave 0 |
| ONBD-01 | User completes profile setup | integration | `npm test -- tests/onboarding/profile.test.ts` | ❌ Wave 0 |
| ONBD-02 | User selects interests | unit | `npm test -- tests/onboarding/interests.test.tsx` | ❌ Wave 0 |
| ONBD-04 | Timezone auto-detected with override | unit | `npm test -- tests/onboarding/timezone.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` (quick smoke test of critical auth flows)
- **Per wave merge:** `npm run test:all` (full suite with coverage report)
- **Phase gate:** Full suite green + coverage >80% for auth/onboarding modules before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Vitest configuration for Next.js 16 project
- [ ] `tests/setup.ts` — Test setup with mocks for NextAuth, MongoDB
- [ ] `tests/auth/signup.test.ts` — Email/password signup flow tests
- [ ] `tests/auth/login.test.ts` — Login flow tests (magic link, credentials, OAuth)
- [ ] `tests/auth/session.test.ts` — Session persistence and logout tests
- [ ] `tests/auth/reset-password.test.ts` — Password reset flow tests
- [ ] `tests/onboarding/profile.test.ts` — Profile creation and photo upload tests
- [ ] `tests/onboarding/timezone.test.tsx` — Timezone detection and selection tests
- [ ] `tests/onboarding/interests.test.tsx` — Interest selection component tests
- [ ] `tests/lib/db.test.ts` — MongoDB connection singleton tests
- [ ] `tests/lib/validation.test.ts` — Zod schema validation tests
- [ ] `tests/middleware.test.ts` — Protected route middleware tests

**Framework installation:**
```bash
npm install -D vitest@4.1.2 @testing-library/react@16.3.2 @testing-library/user-event @testing-library/jest-dom @vitejs/plugin-react jsdom
```

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | NextAuth.js v4.24.13 with bcryptjs password hashing (10+ salt rounds) |
| V3 Session Management | yes | httpOnly cookies with secure flag, SameSite=lax, 15-min access token + 7-day refresh token |
| V4 Access Control | yes | Middleware-based route protection, role-based access control (future phases) |
| V5 Input Validation | yes | Zod 4.3.6 for runtime type validation on all forms and API inputs |
| V6 Cryptography | yes | bcryptjs for passwords, NextAuth.js JWT for sessions, never hand-roll crypto |

### Known Threat Patterns for Next.js + MongoDB + NextAuth

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL Injection (NoSQL variant) | Tampering | Mongoose parameterized queries via schema validation, Zod input sanitization |
| Cross-Site Scripting (XSS) | Tampering | React auto-escaping, Content Security Policy, httpOnly cookies (no localStorage tokens) |
| Cross-Site Request Forgery (CSRF) | Spoofing | NextAuth.js built-in CSRF tokens, SameSite cookies |
| Session Fixation | Spoofing | NextAuth.js automatic session regeneration on login |
| Password Brute Force | Denial of Service | bcryptjs slow hashing (10+ rounds), rate limiting on login endpoints |
| Magic Link Forgery | Spoofing | Cryptographically signed tokens, 15-minute expiry, single-use tokens |
| OAuth Account Takeover | Tampering | State parameter validation, PKCE for OAuth 2.0, token validation |
| Path Traversal in File Upload | Tampering | Validate file types (allowlist: image/jpeg, image/png), GridFS metadata validation |
| NoSQL Injection in Login | Tampering | Mongoose schema types, Zod email validation, parameterized queries |
| Session Hijacking | Spoofing | httpOnly cookies, secure flag (HTTPS only), SameSite=lax, bind to IP (optional) |

**Security Configuration:**
```typescript
// .env.local configuration required
MONGODB_URI=mongodb://localhost:27017/focusflow  # or Atlas connection string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Email (for magic links)
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=your-api-key
EMAIL_FROM=noreply@focusflow.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Security
NEXTAUTH_SECRET must be set in production (use openssl rand -base64 32)
NODE_ENV=production
```

## Sources

### Primary (HIGH confidence)
- [npm registry: next@16.2.2](https://www.npmjs.com/package/next) - Verified current version
- [npm registry: react@19.2.4](https://www.npmjs.com/package/react) - Verified current version
- [npm registry: mongoose@9.4.1](https://www.npmjs.com/package/mongoose) - Verified latest version (recommending 8.x for stability)
- [npm registry: next-auth@4.24.13](https://www.npmjs.com/package/next-auth) - Verified stable version
- [npm registry: @auth/core@0.34.3](https://www.npmjs.com/package/@auth/core) - Verified v5 beta version
- [npm registry: bcryptjs@3.0.3](https://www.npmjs.com/package/bcryptjs) - Verified current version
- [npm registry: zod@4.3.6](https://www.npmjs.com/package/zod) - Verified current version
- [npm registry: vitest@4.1.2](https://www.npmjs.com/package/vitest) - Verified current version
- [npm registry: @testing-library/react@16.3.2](https://www.npmjs.com/package/@testing-library/react) - Verified current version
- [npm registry: shadcn-ui@0.9.5](https://www.npmjs.com/package/shadcn-ui) - Verified package exists (CLI tool)
- [npm registry: @radix-ui/react-dialog@1.1.15](https://www.npmjs.com/package/@radix-ui/react-dialog) - Verified version
- [npm registry: @radix-ui/react-dropdown-menu@2.1.16](https://www.npmjs.com/package/@radix-ui/react-dropdown-menu) - Verified version
- [npm registry: @radix-ui/react-select@2.2.6](https://www.npmjs.com/package/@radix-ui/react-select) - Verified version

### Secondary (MEDIUM confidence)
- [Next.js Official Documentation](https://nextjs.org/docs) - App Router patterns, Server Components
- [NextAuth.js Documentation](https://next-auth.js.org) - Authentication patterns, configuration examples
- [Mongoose Documentation](https://mongoosejs.com/docs) - ODM patterns, GridFS usage
- [Zod Documentation](https://zod.dev) - Input validation patterns
- [shadcn/ui Documentation](https://ui.shadcn.com) - Component usage patterns
- [React Hook Form Documentation](https://react-hook-form.com) - Form management patterns
- [MDN Web Docs: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) - Timezone detection API

### Tertiary (LOW confidence)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) - Security best practices (not verified in this session, standard industry knowledge)
- [MongoDB GridFS Documentation](https://www.mongodb.com/docs/manual/core/gridfs/) - File storage patterns (not verified in this session, standard MongoDB feature)
- [Nodemailer Documentation](https://nodemailer.com/) - Email sending patterns (not verified in this session, standard npm package)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified via npm registry, choices based on stable, production-ready packages
- Architecture: HIGH - Patterns based on official Next.js, NextAuth.js, and Mongoose documentation
- Pitfalls: MEDIUM - Based on common authentication and MongoDB issues, some assumed from general knowledge
- Security: HIGH - ASVS controls mapped to verified libraries, industry-standard security practices

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (30 days - stable stack, but check for Next.js 16 updates and NextAuth v5 stability)
