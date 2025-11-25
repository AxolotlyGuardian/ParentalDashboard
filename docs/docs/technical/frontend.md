# Frontend (Next.js)

The Axolotly frontend is built with Next.js 15, providing a modern, responsive web interface for both parents and admins.

## Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **HTTP Client:** Fetch API
- **Build Tool:** Turbopack

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage (public)
│   ├── login/page.tsx     # Parent login
│   ├── signup/page.tsx    # Parent signup
│   ├── parent/            # Parent dashboard
│   │   └── page.tsx       # Dashboard with tabs
│   └── admin/             # Admin dashboard
│       └── page.tsx       # Admin home
├── components/            # Reusable React components
│   ├── ServiceSelection.tsx
│   ├── ContentActionModal.tsx
│   ├── DeviceList.tsx
│   └── ProfileManager.tsx
├── lib/                   # Utilities and API client
│   ├── api.ts            # API wrapper functions
│   └── utils.ts          # Helper functions
├── public/               # Static assets
│   └── images/
├── tailwind.config.js    # Tailwind configuration
└── package.json          # Dependencies
```

## Key Features

### 1. Next.js App Router

**File-Based Routing:**
- `/` → `app/page.tsx` (Homepage)
- `/login` → `app/login/page.tsx` (Login)
- `/parent` → `app/parent/page.tsx` (Dashboard)
- `/admin` → `app/admin/page.tsx` (Admin)

**Server Components (Default):**
```typescript
// app/page.tsx
export default function Homepage() {
  return (
    <div>
      <h1>Welcome to Axolotly</h1>
      {/* Static content, server-rendered */}
    </div>
  )
}
```

**Client Components (Interactive):**
```typescript
'use client'

import { useState } from 'react'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  // Interactive search component
}
```

### 2. Parent Dashboard

**Tab-Based Interface:**

```typescript
'use client'

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState('search')
  
  return (
    <div>
      <nav>
        <button onClick={() => setActiveTab('search')}>Search</button>
        <button onClick={() => setActiveTab('policies')}>Policies</button>
        <button onClick={() => setActiveTab('profiles')}>Profiles</button>
        <button onClick={() => setActiveTab('devices')}>Devices</button>
        <button onClick={() => setActiveTab('services')}>My Services</button>
      </nav>
      
      {activeTab === 'search' && <SearchTab />}
      {activeTab === 'policies' && <PoliciesTab />}
      {activeTab === 'profiles' && <ProfilesTab />}
      {activeTab === 'devices' && <DevicesTab />}
      {activeTab === 'services' && <ServicesTab />}
    </div>
  )
}
```

### 3. API Integration

**API Client (lib/api.ts):**

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    return res.json()
  },
  
  signup: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    return res.json()
  }
}

export const catalogApi = {
  search: async (query: string, token: string) => {
    const res = await fetch(`${API_BASE}/api/catalog/search?query=${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return res.json()
  }
}

export const servicesApi = {
  get: async (token: string) => {
    const res = await fetch(`${API_BASE}/api/services`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return res.json()
  },
  
  update: async (services: string[], token: string) => {
    const res = await fetch(`${API_BASE}/api/services`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ selected_services: services })
    })
    return res.json()
  }
}
```

### 4. Streaming Service Selection Component

**ServiceSelection.tsx:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { servicesApi } from '@/lib/api'

const AVAILABLE_SERVICES = [
  'Netflix',
  'Disney+',
  'Hulu',
  'Prime Video',
  'Max',
  'Peacock',
  'YouTube'
]

export default function ServiceSelection({ token }: { token: string }) {
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    // Load current selections
    servicesApi.get(token).then(data => {
      setSelected(data.selected_services || [])
    })
  }, [token])
  
  const toggleService = (service: string) => {
    setSelected(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }
  
  const saveServices = async () => {
    setLoading(true)
    await servicesApi.update(selected, token)
    setLoading(false)
  }
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">My Streaming Services</h2>
      <div className="space-y-2">
        {AVAILABLE_SERVICES.map(service => (
          <label key={service} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selected.includes(service)}
              onChange={() => toggleService(service)}
            />
            <span>{service}</span>
          </label>
        ))}
      </div>
      <button
        onClick={saveServices}
        disabled={loading}
        className="mt-4 bg-pink-500 text-white px-4 py-2 rounded"
      >
        {loading ? 'Saving...' : 'Save Services'}
      </button>
    </div>
  )
}
```

## Styling with Tailwind CSS

**Configuration (tailwind.config.js):**
```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'coral-pink': '#F77B8A',
        'light-blue': '#688ac6',
      },
    },
  },
  plugins: [],
}
```

**Usage:**
```typescript
<div className="bg-coral-pink text-white rounded-lg p-4">
  <h1 className="text-2xl font-bold">Parent Dashboard</h1>
</div>
```

## Authentication Flow

**Login Page:**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  
  const handleLogin = async () => {
    const data = await authApi.login(email, password)
    if (data.access_token) {
      // Store token (in memory, not localStorage for security)
      sessionStorage.setItem('token', data.access_token)
      router.push('/parent')
    }
  }
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Log In</button>
    </form>
  )
}
```

## Responsive Design

**Mobile-First Approach:**
```typescript
<div className="
  grid
  grid-cols-1       /* Mobile: 1 column */
  md:grid-cols-2    /* Tablet: 2 columns */
  lg:grid-cols-3    /* Desktop: 3 columns */
  gap-4
">
  {/* Content cards */}
</div>
```

## Performance Optimizations

**Image Optimization:**
```typescript
import Image from 'next/image'

<Image
  src={posterUrl}
  alt={title}
  width={300}
  height={450}
  loading="lazy"
/>
```

**Code Splitting:**
- Automatic with Next.js App Router
- Components lazy-loaded on demand

**Server-Side Rendering:**
- Fast initial page loads
- SEO-friendly

## TypeScript Types

**API Response Types:**
```typescript
interface Title {
  id: number
  tmdb_id: number
  title: string
  media_type: 'movie' | 'tv'
  poster_path: string | null
  rating: string
  providers: string[]
}

interface KidProfile {
  id: number
  name: string
  pin_hash: string
}

interface Device {
  id: number
  friendly_name: string
  paired_at: string
  last_active: string
}
```

## Environment Variables

**.env.local:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Build & Deploy

**Development:**
```bash
cd frontend
npm run dev
```

**Production Build:**
```bash
npm run build
npm run start
```

**Deploy to Vercel:**
```bash
vercel deploy
```

---

The Next.js frontend provides a modern, responsive user experience with TypeScript type safety and Tailwind CSS styling, while maintaining performance and SEO capabilities.
