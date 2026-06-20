# Tab Switching Reload Issue - Fix Documentation

## Problem
The application was reloading/refreshing when users switched browser tabs, causing:
- Loss of form data
- Interruption of user workflow
- Poor user experience when seeking additional information in other tabs

## Root Causes Identified

### 1. Hard Redirects Using `window.location.href`
Multiple files were using `window.location.href` for navigation, causing full page reloads instead of client-side navigation.

### 2. Unnecessary `router.refresh()` Calls
The auth context was calling `router.refresh()` after logout, forcing page refreshes.

### 3. Session Refresh Interval (PRIMARY CAUSE)
The old `useAuth` hook had a 5-minute session refresh interval (`SESSION_REFRESH_INTERVAL`) that was triggering when users switched tabs, causing redirects and reloads.

### 4. Dual Auth Systems
Both the old `useAuth` hook and the enhanced auth context were running simultaneously, causing conflicts.

## Files Modified

### Phase 1: Replace Hard Redirects with Client-Side Navigation

1. **`hooks/useAuth.ts`**
   - Lines 183, 207, 213, 257: Replaced `window.location.href = '/'` with `router.push('/')`
   - Lines 224-234: Disabled `SESSION_REFRESH_INTERVAL` (commented out)
   - Added `router` to useEffect dependency array (line 245)

2. **`components/auth/enhanced-auth-context.tsx`**
   - Line 317: Removed fallback `window.location.href = '/landing'`
   - Replaced with retry using `router.push('/landing')` with try-catch

3. **`components/auth/auth-context.tsx`**
   - Line 395: Removed `router.refresh()` call after logout

4. **`app/landing/page.tsx`**
   - Lines 223, 298: Replaced `window.location.href = '/'` with `router.push('/')`
   - Updated import to use `@/hooks/use-enhanced-auth`

5. **`components/auth/signup-form.tsx`**
   - Line 35: Replaced `window.location.href = redirectUrl` with `router.push(redirectUrl)`

## Solution Details

### Session Management
- **Disabled** manual session refresh interval in old `useAuth` hook
- **Relying on** Supabase's built-in `autoRefreshToken: true` configuration
- Supabase automatically handles token refresh without causing page reloads

### Navigation
- All navigation now uses Next.js `router.push()` for client-side transitions
- No more full page reloads during auth state changes
- Form state is preserved when switching tabs

## Testing Checklist

- [x] Tab switching no longer causes page reloads
- [x] Form data is preserved when switching tabs
- [x] Authentication flow uses smooth client-side navigation
- [x] No Fast Refresh runtime errors
- [x] Session tokens refresh automatically without user interruption

## Technical Notes

### Supabase Auto-Refresh
The Supabase client is configured with:
```typescript
auth: {
  persistSession: true,
  autoRefreshToken: true,  // Handles token refresh automatically
  detectSessionInUrl: true,
  flowType: 'pkce',
}
```

This means Supabase handles token refresh internally without requiring manual intervals.

### Auth Context Consolidation
The application now primarily uses the enhanced auth context (`@/components/auth/enhanced-auth-context.tsx`) which provides:
- Proper session management
- Client-side navigation
- No manual refresh intervals
- Better error handling

## Benefits

✅ **No more page reloads** when switching tabs
✅ **Form state preserved** during tab switches
✅ **Faster navigation** with client-side routing
✅ **Better user experience** - users can reference other tabs without losing work
✅ **Cleaner codebase** - single auth system instead of dual systems

## Date
Fixed: June 20, 2026
