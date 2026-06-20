# Critical Fixes Task List - PSQuote Application

**Created:** June 20, 2026  
**Status:** Ready for Implementation  
**Estimated Time:** 8-12 hours

---

## 🔴 PHASE 1: CRITICAL FIXES (Must Do First)

### Task 1.1: Consolidate Supabase Client Instances
**Priority:** CRITICAL | **Time:** 1-2 hours | **Risk:** HIGH

**Problem:** 5 different Supabase client implementations causing race conditions and session conflicts.

**Files to Modify:**
- ✅ Keep: `lib/supabase/client.ts` (primary singleton)
- ✅ Keep: `lib/supabase/server.ts` (for server components)
- ❌ Delete: `lib/supabase-client.ts`
- ❌ Delete: `lib/supabase-browser.ts`
- ❌ Delete: `lib/supabase/browser-client.ts`
- ❌ Delete: `lib/supabase-server.ts` (old version)

**Steps:**
1. [ ] Audit all imports of deleted files using grep
2. [ ] Update all imports to use `@/lib/supabase/client` for browser code
3. [ ] Update all imports to use `@/lib/supabase/server` for server components
4. [ ] Delete the 4 duplicate client files
5. [ ] Test that no import errors exist

**Verification:**
```bash
# Search for old imports
grep -r "from '@/lib/supabase-client'" .
grep -r "from '@/lib/supabase-browser'" .
grep -r "from '@/lib/supabase/browser-client'" .
grep -r "from '@/lib/supabase-server'" . --exclude-dir=node_modules
```

---

### Task 1.2: Update Auth Callback Route
**Priority:** CRITICAL | **Time:** 30 minutes | **Risk:** HIGH

**Problem:** Using deprecated `@supabase/auth-helpers-nextjs` incompatible with Next.js 15.

**Files to Modify:**
- `app/auth/callback/route.ts`

**Steps:**
1. [ ] Replace `createRouteHandlerClient` with `createServerClient` from `@supabase/ssr`
2. [ ] Update cookie handling to use Next.js 15 async cookies API
3. [ ] Test OAuth callback flow

**Code Change:**
```typescript
// OLD (deprecated)
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabase = createRouteHandlerClient({ cookies });

// NEW (correct)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const cookieStore = await cookies();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  }
);
```

---

### Task 1.3: Fix Database Schema - Quotations Table
**Priority:** CRITICAL | **Time:** 1 hour | **Risk:** MEDIUM

**Problem:** Column name mismatch - table uses `user_id` but RLS policies check `created_by`.

**Files to Create:**
- `supabase/migrations/20260620000000_fix_quotations_schema.sql`

**Steps:**
1. [ ] Create new migration to rename `user_id` to `created_by` OR update all RLS policies
2. [ ] Update quotation_items RLS policies to use consistent column name
3. [ ] Test that existing quotations are still accessible

**Migration Option A (Rename column - RECOMMENDED):**
```sql
-- Rename user_id to created_by for consistency
ALTER TABLE public.quotations 
RENAME COLUMN user_id TO created_by;

-- Update index
DROP INDEX IF EXISTS idx_quotations_user_id;
CREATE INDEX idx_quotations_created_by ON public.quotations(created_by);
```

**Migration Option B (Update RLS policies):**
```sql
-- Update all RLS policies to use user_id instead of created_by
-- (Update quotation_items policies in 20240810162100_fix_quotation_items_rls.sql)
```

**Decision:** Choose Option A (rename to `created_by`) for consistency across all tables.

---

### Task 1.4: Remove Duplicate RLS Policies
**Priority:** CRITICAL | **Time:** 30 minutes | **Risk:** LOW

**Problem:** Duplicate policies on products table will cause migration failures.

**Files to Create:**
- `supabase/migrations/20260620000001_fix_duplicate_products_policies.sql`

**Steps:**
1. [ ] Create migration to drop duplicate policies
2. [ ] Keep only one version of each policy
3. [ ] Apply migration to database

**Migration:**
```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Allow update access to own products" ON public.products;
DROP POLICY IF EXISTS "Allow delete access to own products" ON public.products;

-- Recreate with correct logic (single instance)
CREATE POLICY "Allow update access to products" 
ON public.products 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow delete access to products" 
ON public.products 
FOR DELETE 
TO authenticated 
USING (true);
```

---

### Task 1.5: Remove Credentials from vercel.json
**Priority:** CRITICAL | **Time:** 15 minutes | **Risk:** HIGH (Security)

**Problem:** Placeholder credentials committed to repository.

**Files to Modify:**
- `vercel.json`

**Steps:**
1. [ ] Remove entire `env` section from vercel.json
2. [ ] Document required environment variables in README
3. [ ] Configure variables in Vercel dashboard

**Code Change:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

**Document in README:**
```markdown
## Required Environment Variables

Configure these in Vercel Dashboard > Project Settings > Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-only)
```

---

## 🟡 PHASE 2: HIGH PRIORITY FIXES

### Task 2.1: Update lib/supabase-server.ts (if still exists)
**Priority:** HIGH | **Time:** 30 minutes | **Risk:** MEDIUM

**Note:** This should be deleted in Task 1.1, but if any server code still needs it:

**Files to Check:**
- Verify no code imports from `lib/supabase-server.ts`
- All server code should use `lib/supabase/server.ts`

---

### Task 2.2: Fix Middleware Cookie Handling
**Priority:** HIGH | **Time:** 1 hour | **Risk:** MEDIUM

**Problem:** Creating new NextResponse on every cookie set loses previous modifications.

**Files to Modify:**
- `middleware.ts`

**Steps:**
1. [ ] Refactor cookie handlers to accumulate changes on single response
2. [ ] Test session persistence across requests

**Code Change:**
```typescript
export async function middleware(request: NextRequest) {
  try {
    // ... existing code ...
    
    let response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Don't create new response - modify existing one
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            // Don't create new response - modify existing one
            request.cookies.delete(name);
            response.cookies.delete(name);
          },
        },
      }
    );

    // ... rest of middleware logic ...
    
    return response;
  } catch (error) {
    // ... error handling ...
  }
}
```

---

### Task 2.3: Restrict Profile RLS Policies
**Priority:** HIGH | **Time:** 30 minutes | **Risk:** MEDIUM (Privacy)

**Problem:** Public read access exposes all user profiles.

**Files to Create:**
- `supabase/migrations/20260620000002_restrict_profile_access.sql`

**Steps:**
1. [ ] Create migration to update profile RLS policies
2. [ ] Test that users can only see their own profile
3. [ ] Verify admin users can still list users via service role

**Migration:**
```sql
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;

-- Create restricted policy - users can only read their own profile
CREATE POLICY "Users can read own profile" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Optional: Allow service role to read all (for admin API)
-- This is implicit with service role key, no policy needed
```

---

### Task 2.4: Simplify Auth Context - Remove Race Conditions
**Priority:** HIGH | **Time:** 2 hours | **Risk:** MEDIUM

**Problem:** Multiple auth state listeners causing race conditions and redirect loops.

**Files to Modify:**
- `components/auth/enhanced-auth-context.tsx`

**Steps:**
1. [ ] Remove redundant `visibilitychange` listener (Supabase handles this)
2. [ ] Remove redundant `storage` listener (Supabase handles cross-tab sync)
3. [ ] Simplify redirect logic - use single source of truth
4. [ ] Remove arbitrary timeout-based race condition prevention

**Code Changes:**
```typescript
// REMOVE: Lines 316-344 (visibilitychange listener)
// REMOVE: Lines 346-365 (storage listener)
// REASON: Supabase SSR already handles cross-tab sync and session refresh

// SIMPLIFY: handleAuthStateChange function
const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
  if (!isMounted.current) return;

  try {
    console.log('[Auth] Auth state changed:', { event, session: !!session });
    const appSession = mapToAppSession(session);
    const user = appSession?.user || null;

    if (event === 'SIGNED_IN' && user && appSession) {
      stableDispatch({ type: 'SIGN_IN', payload: { user, session: appSession } });
    } else if (event === 'SIGNED_OUT') {
      stableDispatch({ type: 'SIGN_OUT' });
      // Simple redirect - no race condition checks needed
      router.push('/login');
    } else if (event === 'TOKEN_REFRESHED' && appSession) {
      stableDispatch({ type: 'REFRESH_SESSION', payload: { session: appSession } });
    } else if (event === 'USER_UPDATED' && user && appSession) {
      stableDispatch({ type: 'SET_SESSION', payload: { user, session: appSession } });
    }
  } catch (error) {
    console.error('Error handling auth state change:', error);
    stableDispatch({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
}, [router, stableDispatch]);
```

---

## 🟢 PHASE 3: MEDIUM PRIORITY FIXES

### Task 3.1: Fix TypeScript Errors
**Priority:** MEDIUM | **Time:** 2-4 hours | **Risk:** MEDIUM

**Files to Modify:**
- `next.config.js`
- Various TypeScript files with errors

**Steps:**
1. [ ] Run `npm run typecheck` to identify all errors
2. [ ] Fix type errors one by one
3. [ ] Remove `ignoreBuildErrors: true` from next.config.js
4. [ ] Verify build succeeds

**Command:**
```bash
npm run typecheck 2>&1 | tee typescript-errors.log
```

---

### Task 3.2: Add Error Boundary for Client Layout
**Priority:** MEDIUM | **Time:** 1 hour | **Risk:** LOW

**Files to Create:**
- `components/ErrorBoundary.tsx` (already exists, verify it's used)

**Files to Modify:**
- `app/client-layout.tsx`

**Steps:**
1. [ ] Wrap client layout with proper error boundary
2. [ ] Add error reporting (e.g., Sentry)
3. [ ] Provide user-friendly error messages

**Code:**
```typescript
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
    // TODO: Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### Task 3.3: Standardize Session Storage
**Priority:** MEDIUM | **Time:** 1 hour | **Risk:** MEDIUM

**Problem:** Inconsistent storage configurations across clients.

**Files to Modify:**
- `lib/supabase/client.ts` (verify it uses default cookie storage)

**Steps:**
1. [ ] Ensure all clients use cookie-based storage (SSR default)
2. [ ] Remove custom localStorage implementations
3. [ ] Test cross-tab synchronization

**Verification:**
- All auth should use cookies (not localStorage)
- Middleware can read session from cookies
- Cross-tab logout works correctly

---

### Task 3.4: Add Input Validation to API Routes
**Priority:** MEDIUM | **Time:** 2 hours | **Risk:** LOW

**Files to Modify:**
- `app/api/users/route.ts`

**Steps:**
1. [ ] Install validation library (e.g., zod)
2. [ ] Add schema validation for POST requests
3. [ ] Add email format validation
4. [ ] Add password strength requirements

**Code:**
```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN', 'MANAGER']),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createUserSchema.parse(body);
    
    // ... rest of the code using validatedData
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    // ... other error handling
  }
}
```

---

## 🔵 PHASE 4: LOW PRIORITY IMPROVEMENTS

### Task 4.1: Remove Production Console Logs
**Priority:** LOW | **Time:** 1 hour | **Risk:** LOW

**Steps:**
1. [ ] Search for all console.log statements
2. [ ] Replace with proper logger that respects NODE_ENV
3. [ ] Keep console.error for actual errors

**Command:**
```bash
grep -r "console.log" app/ components/ lib/ --exclude-dir=node_modules
```

---

### Task 4.2: Add Rate Limiting to API Routes
**Priority:** LOW | **Time:** 2 hours | **Risk:** LOW

**Files to Create:**
- `lib/rate-limit.ts`

**Steps:**
1. [ ] Install rate limiting library (e.g., @upstash/ratelimit)
2. [ ] Add rate limiting middleware
3. [ ] Apply to sensitive endpoints

**Code:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function rateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

---

## ✅ PHASE 5: VERIFICATION & TESTING

### Task 5.1: Test Authentication Flow
**Priority:** CRITICAL | **Time:** 1 hour

**Test Cases:**
1. [ ] Sign up new user
2. [ ] Sign in existing user
3. [ ] Sign out
4. [ ] Password reset flow
5. [ ] OAuth callback (if applicable)
6. [ ] Session persistence across page refresh
7. [ ] Cross-tab logout
8. [ ] Middleware protection of routes

---

### Task 5.2: Test Database Operations
**Priority:** CRITICAL | **Time:** 1 hour

**Test Cases:**
1. [ ] Create quotation
2. [ ] Read own quotations
3. [ ] Update quotation
4. [ ] Delete quotation
5. [ ] Verify RLS prevents access to other users' data
6. [ ] Test quotation items CRUD
7. [ ] Test products CRUD

---

### Task 5.3: Test Cross-Tab Synchronization
**Priority:** HIGH | **Time:** 30 minutes

**Test Cases:**
1. [ ] Open app in two tabs
2. [ ] Sign out in one tab
3. [ ] Verify other tab redirects to login
4. [ ] Sign in in one tab
5. [ ] Verify other tab updates session

---

## 📊 PROGRESS TRACKING

### Summary
- **Total Tasks:** 18
- **Critical:** 5
- **High:** 4
- **Medium:** 4
- **Low:** 2
- **Verification:** 3

### Estimated Timeline
- **Phase 1 (Critical):** 3-4 hours
- **Phase 2 (High):** 4-5 hours
- **Phase 3 (Medium):** 6-8 hours
- **Phase 4 (Low):** 3-4 hours
- **Phase 5 (Verification):** 2-3 hours
- **Total:** 18-24 hours

### Dependencies
```
Phase 1 (All tasks can run in parallel)
  ↓
Phase 2 (Depends on Phase 1 completion)
  ↓
Phase 3 (Can start after Phase 2.1 and 2.2)
  ↓
Phase 4 (Can run anytime)
  ↓
Phase 5 (Must be last)
```

---

## 🚨 ROLLBACK PLAN

If any critical issue occurs during implementation:

1. **Git Strategy:**
   - Create branch: `fix/critical-issues`
   - Commit after each completed task
   - Tag stable points: `stable-after-task-1.1`, etc.

2. **Database Migrations:**
   - Test migrations on development database first
   - Keep backup of production database
   - Migrations are reversible (create DOWN migrations)

3. **Deployment:**
   - Deploy to staging environment first
   - Run full test suite
   - Monitor error rates for 24 hours
   - Keep previous deployment ready for rollback

---

## 📝 NOTES

- **DO NOT** skip Phase 1 tasks - they are critical for app stability
- **TEST** each phase thoroughly before moving to next
- **BACKUP** database before running migrations
- **DOCUMENT** any deviations from this plan
- **COMMUNICATE** progress and blockers to team

---

**Last Updated:** June 20, 2026  
**Next Review:** After Phase 1 completion
