# Display Prefix Implementation Guide

**Date:** June 20, 2026  
**Status:** Ready for Testing

---

## 📋 Overview

Implemented a scalable prefix system for POS loading slips and quotations to improve item identification for warehouse workers. The system uses short prefix codes (e.g., `ANG`, `CH`, `P-CHS`) instead of full product names.

---

## 🎯 Implementation Summary

### 1. Database Changes

**Migration:** `20260620000004_add_display_prefix_to_products.sql`

- Added `display_prefix` column to `products` table (VARCHAR(10))
- Populated prefixes for all existing products based on `item_category` and `item_type`
- Created index on `display_prefix` for performance

**Prefix Mapping:**

| Category | Type | Prefix | Example Display |
|----------|------|--------|----------------|
| BASE PLATE | - | `BP` | BP 125x200x16 MM |
| HR SHEET | - | `HR` | HR 8x4-25mm |
| CR SHEET | - | `CR` | CR 8x4-1mm |
| GI SHEET | - | `GI` | GI 8x4-0.6mm |
| MS STRUCTURALS | MS ANGLE | `ANG` | ANG 100x6 MM |
| MS STRUCTURALS | MS CHANNEL | `CH` | CH 125x65 MM |
| MS STRUCTURALS | MS I BEAM | `ISMB` | ISMB 150 MM |
| MS FLAT | - | `FL` | FL 75x25 MM |
| MS PIPE | MS PIPE CHS | `P-CHS` | P-CHS 273ODx8 MM |
| MS PIPE | MS PIPE RHS | `P-RHS` | P-RHS 122x61x2 MM |
| MS PIPE | MS PIPE SHS | `P-SHS` | P-SHS 50x50x3 MM |
| MS ROUND | - | `RD` | RD DIA-16 MM |
| MS SQUARE | - | `SQ` | SQ 25 MM |
| MS BRIGHT BAR | MSBR | `BR` | BR 12 MM |
| MS BRIGHT BAR | MSBR FLAT | `BR-FL` | BR-FL 100x16 MM |
| MS BRIGHT BAR | MSBR SQUARE | `BR-SQ` | BR-SQ 6.3x6.3 MM |
| MS BRIGHT BAR | MSBR HEXAGON | `BR-HEX` | BR-HEX AF-10 MM |
| ROOFING SHEET | - | `ROOF` | ROOF PPGI-0.47-1.5ft |
| TMT ROD | - | `TMT` | TMT 12 MM |

---

## 🔧 Code Changes

### 1. Database Types (`lib/database.types.ts`)

Updated `quotation_items` type to match actual schema:
```typescript
quotation_items: {
  Row: {
    id: string
    quotation_id: string
    product_id: string | null
    description: string
    qty: number
    qty_in_kg_pc: number
    total_qty_kg: number | null
    unit_rate: number
    total_value: number
    created_at: string
    updated_at: string
    created_by: string
  }
  // ... Insert and Update types
}
```

### 2. Product Interface (`app/new-quotation/page.tsx`)

Added new fields to Product interface:
```typescript
interface Product {
  id: string
  item_name: string
  item_weight?: number
  display_prefix?: string  // NEW
  item_size?: string       // NEW
}
```

### 3. Fetch Products Function

Updated to fetch `display_prefix` and `item_size`:
```typescript
const { data, error } = await supabase
  .from('products')
  .select('id, item_name, item_weight, display_prefix, item_size')
  .order('item_name', { ascending: true });
```

### 4. Item Enrichment Helper

Added function to enrich items with product data:
```typescript
const enrichItemsWithProductData = (items: QuotationItem[]) => {
  return items.map(item => {
    if (item.productId) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        return {
          ...item,
          displayPrefix: product.display_prefix,
          itemSize: product.item_size
        };
      }
    }
    return item;
  });
};
```

### 5. POS Components

**Updated Components:**
- `components/pos-loading-slip-preview.tsx`
- `components/pos-quotation-preview.tsx`

**Changes:**
- Added `displayPrefix` and `itemSize` to QuotationItem interface
- Replaced `extractSize()` with `formatItemDisplay()` function
- Smart fallback: Uses prefix+size if available, otherwise extracts from description

```typescript
const formatItemDisplay = (item: QuotationItem): string => {
  // Priority 1: Use display_prefix + item_size
  if (item.displayPrefix && item.itemSize) {
    return `${item.displayPrefix} ${item.itemSize}`;
  }
  
  // Priority 2: Extract size from description
  const sizeMatch = item.description.match(/([0-9]+x[0-9]+...)/i);
  if (sizeMatch) {
    return sizeMatch[1];
  }
  
  // Priority 3: Return full description
  return item.description;
};
```

---

## 🚀 Deployment Steps

### Step 1: Apply Database Migration

Run in Supabase SQL Editor:
```bash
# File: supabase/migrations/20260620000004_add_display_prefix_to_products.sql
```

This will:
- Add `display_prefix` column
- Populate prefixes for all existing products
- Create index

### Step 2: Verify Migration

Check that prefixes were populated:
```sql
SELECT item_category, item_type, display_prefix, COUNT(*) as count
FROM public.products
GROUP BY item_category, item_type, display_prefix
ORDER BY item_category, item_type;
```

### Step 3: Test in Development

1. Refresh the application
2. Create a new quotation with various product types
3. View POS Loading Slip - verify prefixes appear
4. View POS Quotation - verify prefixes appear
5. Print both documents - verify readability

---

## 🎨 Example Output

### Before (Confusing):
```
LOADING ITEMS:
1) 125x200x16 MM Qty: 3
2) 8x4 Qty: 4
3) 125x65 MM Qty: 4
4) 75x25 MM Qty: 4
5) 273ODx8 MM Qty: 4
```

### After (Clear):
```
LOADING ITEMS:
1) BP 125x200x16 MM Qty: 3
2) HR 8x4-25mm Qty: 4
3) CH 125x65 MM Qty: 4
4) FL 75x25 MM Qty: 4
5) P-CHS 273ODx8 MM Qty: 4
```

---

## 🔄 Scalability

### Adding New Products

When adding new products to the catalog:

1. **If product belongs to existing category:** Prefix is automatically assigned
2. **If new category is added:** Update migration or add manual prefix:

```sql
UPDATE public.products
SET display_prefix = 'NEW'
WHERE item_category = 'NEW CATEGORY';
```

### Manual Override

To override a specific product's prefix:
```sql
UPDATE public.products
SET display_prefix = 'CUSTOM'
WHERE id = 'product-uuid';
```

---

## 📝 Prefix Quick Reference

```
ANG    = Angle          P-CHS  = Pipe Circular
CH     = Channel        P-RHS  = Pipe Rectangular  
ISMB   = I-Beam         P-SHS  = Pipe Square
FL     = Flat           BR     = Bright Bar Round
BP     = Base Plate     BR-FL  = Bright Bar Flat
HR     = HR Sheet       BR-SQ  = Bright Bar Square
CR     = CR Sheet       BR-HEX = Bright Bar Hexagon
GI     = GI Sheet       RD     = Round Bar
ROOF   = Roofing Sheet  SQ     = Square Bar
TMT    = TMT Rod        CP     = Cut Plate
```

---

## ✅ Testing Checklist

- [ ] Migration applied successfully
- [ ] All products have prefixes populated
- [ ] POS Loading Slip shows prefixes
- [ ] POS Quotation shows prefixes
- [ ] Print output is clear and readable
- [ ] New products inherit correct prefixes
- [ ] Manual prefix override works
- [ ] Fallback works for products without prefix

---

## 🐛 Troubleshooting

### Issue: Prefixes not showing in POS

**Check:**
1. Migration applied? Run verification query
2. Products fetched with prefix? Check browser console
3. Items have productId? Check item data structure

### Issue: Some products show full description

**Cause:** Product doesn't have `display_prefix` or `item_size` in database

**Fix:** Update product record or run migration again

### Issue: Wrong prefix displayed

**Fix:** Update the prefix mapping in migration or manually update:
```sql
UPDATE public.products
SET display_prefix = 'CORRECT'
WHERE item_type = 'PRODUCT TYPE';
```

---

**Implementation Complete!** 🎉

Ready for testing and deployment.
