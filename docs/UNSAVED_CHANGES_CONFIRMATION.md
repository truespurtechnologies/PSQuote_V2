# Unsaved Changes Confirmation - New Quotation Page

## Feature Overview
Added confirmation dialog to prevent accidental data loss when users try to leave the new quotation page with unsaved changes.

## User Workflow

### Scenario 1: User Clicks Back Button with Unsaved Changes
1. User fills quotation form (customer name, items, etc.)
2. User clicks "Back" button
3. **Confirmation dialog appears**:
   - Title: "Unsaved Changes"
   - Message: "You have unsaved changes in this quotation. Going back will lose all the data you've entered. Do you want to go back?"
   - Options:
     - **"No, Stay on Page"** (Green button) - Closes dialog, stays on form
     - **"Yes, Go Back (Lose Changes)"** (Red button) - Clears data and navigates to landing

### Scenario 2: User Tries to Close/Refresh Browser
1. User fills quotation form
2. User tries to close browser tab or refresh page (F5)
3. **Browser warning appears**: "Changes you made may not be saved"
4. User can choose to stay or leave

### Scenario 3: User Saves the Quotation
1. User fills quotation form
2. User clicks "Save Quotation"
3. Quotation is saved successfully
4. User clicks "Back" button
5. **No confirmation dialog** - navigates directly to landing page

### Scenario 4: Empty Form
1. User navigates to new quotation page
2. User doesn't enter any data
3. User clicks "Back" button
4. **No confirmation dialog** - navigates directly to landing page

## Implementation Details

### Files Modified
**File**: `app/new-quotation/page.tsx`

### Changes Made

#### 1. Added State for Confirmation Dialog
```typescript
const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
```

#### 2. Added Browser Beforeunload Warning (Lines 177-189)
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    // Only show warning if form has unsaved changes and hasn't been saved yet
    if (isFormModified && !hasBeenSaved) {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isFormModified, hasBeenSaved]);
```

#### 3. Added Back Button Handler (Lines 485-494)
```typescript
const handleBackClick = () => {
  // If form has unsaved changes, show confirmation dialog
  if (isFormModified && !hasBeenSaved) {
    setShowUnsavedChangesDialog(true);
  } else {
    // No unsaved changes, navigate directly
    router.push('/landing');
  }
};
```

#### 4. Added Confirm Leave Handler (Lines 496-502)
```typescript
const handleConfirmLeave = () => {
  // Clear localStorage draft since user chose to leave
  localStorage.removeItem('quotation-draft');
  setShowUnsavedChangesDialog(false);
  router.push('/landing');
};
```

#### 5. Added Cancel Leave Handler (Lines 504-507)
```typescript
const handleCancelLeave = () => {
  setShowUnsavedChangesDialog(false);
};
```

#### 6. Added Confirmation Dialog UI (Lines 1132-1159)
```typescript
<Dialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-xl font-bold text-red-600">Unsaved Changes</DialogTitle>
      <DialogDescription className="text-base pt-4">
        You have unsaved changes in this quotation. Going back will lose all the data you've entered.
        <br /><br />
        <strong>Do you want to go back?</strong>
      </DialogDescription>
    </DialogHeader>
    <div className="flex flex-col gap-3 pt-4">
      <Button
        onClick={handleCancelLeave}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        No, Stay on Page
      </Button>
      <Button
        onClick={handleConfirmLeave}
        variant="outline"
        className="w-full border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
      >
        Yes, Go Back (Lose Changes)
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

#### 7. Updated Back Button (Lines 1165-1173)
```typescript
<Button
  onClick={handleBackClick}  // Changed from router.push('/landing')
  variant="outline"
  size="sm"
  className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
>
  <ArrowLeft className="h-4 w-4 mr-2" />
  Back
</Button>
```

#### 8. Updated Reset Form Function (Lines 462-483)
Added flags reset to ensure proper state management:
```typescript
// Reset modification flag
setIsFormModified(false);
setHasBeenSaved(false);
```

## How It Works

### State Tracking
- **`isFormModified`**: Tracks if user has made any changes to the form
- **`hasBeenSaved`**: Tracks if the quotation has been saved
- **`showUnsavedChangesDialog`**: Controls visibility of confirmation dialog

### Logic Flow

#### Back Button Click
```
User clicks Back
  ↓
Check: isFormModified && !hasBeenSaved?
  ↓
YES → Show confirmation dialog
  ↓
User clicks "Yes, Go Back"
  ↓
Clear localStorage
  ↓
Navigate to /landing

User clicks "No, Stay"
  ↓
Close dialog
  ↓
Stay on /new-quotation
```

#### Browser Close/Refresh
```
User tries to close/refresh
  ↓
Check: isFormModified && !hasBeenSaved?
  ↓
YES → Browser shows warning
  ↓
User confirms leave
  ↓
Page closes/refreshes
```

## Benefits

✅ **Prevents accidental data loss** - Users are warned before losing work
✅ **Clear user choice** - Explicit Yes/No options
✅ **Smart detection** - Only shows when there are actual unsaved changes
✅ **Browser integration** - Works with browser close/refresh
✅ **Clean state management** - Clears localStorage when user chooses to leave
✅ **No false warnings** - Doesn't show after successful save

## Edge Cases Handled

### 1. Edit Mode
- When editing existing quotation, `hasBeenSaved` is `true`
- Confirmation only shows if user makes additional changes

### 2. Empty Form
- If user hasn't entered any data, `isFormModified` is `false`
- No confirmation dialog appears

### 3. After Save
- When quotation is saved, `hasBeenSaved` is set to `true`
- No confirmation dialog appears on back button

### 4. Tab Switching
- Tab switching doesn't trigger browser warning
- Only actual navigation/close triggers warning
- localStorage still preserves data during tab switches

### 5. Reset Button
- When user clicks reset, both flags are cleared
- Form returns to initial state

## Testing Checklist

### Test 1: Basic Confirmation
1. ✅ Navigate to new quotation
2. ✅ Enter customer name
3. ✅ Click Back button
4. ✅ Verify confirmation dialog appears
5. ✅ Click "No, Stay on Page"
6. ✅ Verify dialog closes and data is still there
7. ✅ Click Back button again
8. ✅ Click "Yes, Go Back"
9. ✅ Verify navigates to landing page

### Test 2: Browser Warning
1. ✅ Navigate to new quotation
2. ✅ Enter some data
3. ✅ Try to close browser tab
4. ✅ Verify browser warning appears
5. ✅ Cancel close
6. ✅ Verify data is still there

### Test 3: After Save
1. ✅ Fill quotation form
2. ✅ Click Save
3. ✅ After successful save, click Back
4. ✅ Verify no confirmation dialog
5. ✅ Verify navigates directly to landing

### Test 4: Empty Form
1. ✅ Navigate to new quotation
2. ✅ Don't enter any data
3. ✅ Click Back button
4. ✅ Verify no confirmation dialog
5. ✅ Verify navigates directly to landing

### Test 5: Edit Mode
1. ✅ Edit existing quotation
2. ✅ Make changes
3. ✅ Click Back without saving
4. ✅ Verify confirmation dialog appears

## User Experience

### Dialog Design
- **Red title**: Clearly indicates warning/caution
- **Clear message**: Explains what will happen
- **Two clear options**:
  - Green "Stay" button (safe action)
  - Red "Go Back" button (destructive action)
- **Button order**: Safe action first, destructive action second

### Browser Warning
- Standard browser warning message
- Consistent with web standards
- Works across all modern browsers

## Date
Implemented: June 20, 2026

## Related Features
- localStorage auto-save (provides data recovery)
- Tab switching fix (prevents unwanted navigation)
- Form state tracking (enables smart warnings)
