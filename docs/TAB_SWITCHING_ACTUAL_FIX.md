# Tab Switching Issue - Actual Root Cause & Final Fix

## Problem
Staff were being redirected to the landing page when switching browser tabs while filling out quotations, causing complete loss of form data.

## Investigation Process

### What We Tried (That Didn't Work)
1. ❌ Removed hard redirects (`window.location.href`)
2. ❌ Disabled session refresh intervals
3. ❌ Consolidated Supabase client instances
4. ❌ Removed client-side auth redirect from `use-enhanced-auth.ts`
5. ❌ Added localStorage persistence

### The Actual Root Cause
**File**: `components/auth/enhanced-auth-context.tsx`
**Lines**: 305-324

The `onAuthStateChange` handler was redirecting to `/landing` **every time** a `SIGNED_IN` event was triggered, regardless of which page the user was on.

**What was happening:**
1. User fills quotation form on `/new-quotation`
2. User switches to another browser tab
3. When returning, Supabase re-emits the `SIGNED_IN` event (normal behavior)
4. Auth handler catches this event
5. **Unconditionally redirects to `/landing`** ❌
6. All quotation form data is lost

### The Evidence
Middleware logs showed:
```
[Middleware] { path: '/new-quotation', hasSession: true }
[Middleware] { path: '/landing', hasSession: true }
```

This proved:
- ✅ Session was valid (not a session issue)
- ✅ Middleware wasn't causing the redirect
- ❌ Something on client-side was navigating to `/landing`

## The Fix

### Changed Code
**File**: `components/auth/enhanced-auth-context.tsx`
**Lines**: 305-324

**Before** (BROKEN):
```typescript
if (event === 'SIGNED_IN' && user && appSession) {
  console.log('[Auth] User signed in, updating state and redirecting...');
  stableDispatch({ type: 'SIGN_IN', payload: { user, session: appSession } });
  
  // ❌ ALWAYS redirects to /landing
  await router.push('/landing');
}
```

**After** (FIXED):
```typescript
if (event === 'SIGNED_IN' && user && appSession) {
  console.log('[Auth] User signed in, updating state');
  stableDispatch({ type: 'SIGN_IN', payload: { user, session: appSession } });
  
  // ✅ Only redirect if on login/signup page
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    const loginPages = ['/login', '/signup', '/'];
    
    if (loginPages.includes(currentPath)) {
      await router.push('/landing');
    } else {
      console.log('[Auth] Already on protected page, staying on:', currentPath);
    }
  }
}
```

### Why This Works
- **On login page**: User signs in → Redirect to `/landing` ✅
- **On `/new-quotation`**: Tab switch → `SIGNED_IN` event → Stay on page ✅
- **On `/settings`**: Tab switch → `SIGNED_IN` event → Stay on page ✅
- **On any protected page**: Tab switch → No redirect → Form data preserved ✅

## Files Modified

### 1. `components/auth/enhanced-auth-context.tsx`
- Lines 305-324: Fixed `SIGNED_IN` event handler to only redirect from login pages

### 2. `middleware.ts`
- Removed debug logging (was added for investigation)

## How It Works Now

### User Workflow
1. ✅ Staff logs in → Redirected to `/landing`
2. ✅ Clicks "New Quotation" → Navigates to `/new-quotation`
3. ✅ Fills form with customer details and items
4. ✅ Switches to another tab/application
5. ✅ Returns to quotation tab
6. ✅ **Stays on `/new-quotation`** - No redirect!
7. ✅ All form data is still there
8. ✅ Can continue filling the quotation

### Auth Events Behavior
- `SIGNED_IN` on `/login` → Redirect to `/landing` ✅
- `SIGNED_IN` on `/new-quotation` → Stay on page ✅
- `SIGNED_OUT` → Redirect to `/login` ✅
- `TOKEN_REFRESHED` → Update state, no redirect ✅
- `USER_UPDATED` → Update state, no redirect ✅

## Additional Safeguards

The localStorage persistence added earlier provides extra protection:
- Auto-saves form data every change
- Auto-restores if page accidentally reloads
- 24-hour draft retention
- Cleared on successful save

## Testing

### Test Case 1: Tab Switching on Quotation Form
1. Login to application
2. Navigate to "New Quotation"
3. Fill in customer name: "Test Customer"
4. Fill in phone: "1234567890"
5. Add item: "Steel Rod" with qty 10
6. Switch to another browser tab
7. Wait 10 seconds
8. Switch back

**Expected**: ✅ Still on `/new-quotation`, all data intact
**Actual**: ✅ PASS

### Test Case 2: Login Flow
1. Go to login page
2. Enter credentials
3. Click login

**Expected**: ✅ Redirected to `/landing`
**Actual**: ✅ PASS

### Test Case 3: Multiple Tab Switches
1. Fill quotation form
2. Switch tabs 5 times
3. Return each time

**Expected**: ✅ Always stays on `/new-quotation`
**Actual**: ✅ PASS

## Why Previous Fixes Didn't Work

### localStorage Persistence
- **Purpose**: Prevent data loss
- **Result**: Data was saved but redirect still happened
- **Conclusion**: Addressed symptom, not cause

### Removing Client-Side Redirects
- **Purpose**: Stop redirects from `use-enhanced-auth.ts`
- **Result**: That wasn't the redirect causing the issue
- **Conclusion**: Wrong redirect removed

### Disabling Session Refresh
- **Purpose**: Prevent session-related redirects
- **Result**: Session wasn't the problem
- **Conclusion**: Not related to the issue

### The Real Issue
The `SIGNED_IN` event handler in `enhanced-auth-context.tsx` was **always** redirecting, regardless of context. This was the smoking gun.

## Lessons Learned

1. **Add logging first**: Middleware logs revealed the issue wasn't server-side
2. **Check auth event handlers**: Auth state changes can trigger unexpected navigation
3. **Context matters**: Redirects should be conditional based on current page
4. **Test the actual workflow**: Reproduce the exact user scenario

## Date
Final Fix: June 20, 2026

## Status
✅ **RESOLVED** - Tab switching no longer causes redirects or data loss

## Related Documentation
- `docs/QUOTATION_FORM_PERSISTENCE_FIX.md` - localStorage persistence (still useful)
- `docs/TAB_SWITCHING_FINAL_FIX.md` - Previous attempts
- `docs/TAB_SWITCHING_FIX.md` - Initial investigation
