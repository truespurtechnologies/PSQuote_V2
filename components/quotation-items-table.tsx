import { ItemInput } from "./ui/item-input"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Trash2 } from "lucide-react";
import { useState } from "react";

export interface QuotationItem {
  id: string;
  description: string;
  requiredQty: number;
  qtyInKgPc: number;
  totalQtyKg: number;
  unitRate: number;
  totalValue: number;
  productId?: string;
}

interface Product {
  id: string;
  item_name: string;
  item_weight?: number;
}

interface QuotationItemsTableProps {
  items: QuotationItem[];
  onItemChange: (id: string, field: keyof QuotationItem, value: string | number) => void;
  onRemoveItem: (id: string) => void;
  products: Product[];
  steelItems?: Array<{ value: string; label: string }>;
}

export function QuotationItemsTable({
  items,
  onItemChange,
  onRemoveItem,
  products = [],
  steelItems = [],
}: QuotationItemsTableProps) {
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  const handleDecimalChange = (id: string, field: 'qtyInKgPc' | 'unitRate' | 'requiredQty', value: string) => {
    // Allow numbers, single decimal point, and empty string
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setEditingValues(prev => ({
        ...prev,
        [`${id}-${field}`]: value
      }));
      
      // Only update the parent state with valid numbers
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        onItemChange(id, field, numValue);
      } else if (value === '') {
        onItemChange(id, field, 0);
      }
    }
  };

  const handleBlur = (id: string, field: 'qtyInKgPc' | 'unitRate' | 'requiredQty', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onItemChange(id, field, numValue);
    } else {
      onItemChange(id, field, 0);
    }
    // Clear the editing value
    setEditingValues(prev => {
      const newValues = { ...prev };
      delete newValues[`${id}-${field}`];
      return newValues;
    });
  };

  const getDisplayValue = (id: string, field: 'qtyInKgPc' | 'unitRate' | 'requiredQty', value: number): string => {
    const key = `${id}-${field}`;
    if (editingValues[key] !== undefined) {
      return editingValues[key];
    }
    return value === 0 ? '' : value.toString();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-red-500">
            <th className="text-left p-2 text-black font-semibold w-12">SL NO</th>
            <th className="text-left p-2 text-black font-semibold">Item Description</th>
            <th className="text-center p-2 text-black font-semibold w-24">Quantity in KG/PC</th>
            <th className="text-center p-2 text-black font-semibold w-24">Unit/Rate per KG/PC/SQ.MTR</th>
            <th className="text-center p-2 text-black font-semibold w-24">Required Quantity (In Numbers)</th>
            <th className="text-center p-2 text-black font-semibold w-24">Total Qty in KG (Approx)/Numbers</th>
            <th className="text-center p-2 text-black font-semibold w-24">Total Value</th>
            <th className="text-center p-2 text-black font-semibold w-12">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="p-2 text-center text-black font-medium">{index + 1}</td>
              <td className="p-2">
                <div className="w-full">
                  <ItemInput
                    value={item.description}
                    onValueChange={(value, data, label) => {
                      const typedLabel = label || value;
                      // Always set description to what is visible
                      onItemChange(item.id, 'description', typedLabel);

                      // Case 1: Explicit product selection from dropdown (has id or data with weight)
                      const isExplicitProduct = (data && typeof data.item_weight !== 'undefined') || products.some(p => p.id === value);
                      if (isExplicitProduct) {
                        onItemChange(item.id, 'productId', value);
                        if (data?.item_weight !== undefined) {
                          onItemChange(item.id, 'qtyInKgPc', data.item_weight);
                        }
                        return;
                      }

                      // Case 2: User typed a name that matches a product's item_name exactly (case-insensitive)
                      const byName = products.find(p => p.item_name.toLowerCase() === typedLabel.toLowerCase());
                      if (byName) {
                        onItemChange(item.id, 'productId', byName.id);
                        if (typeof byName.item_weight !== 'undefined') {
                          onItemChange(item.id, 'qtyInKgPc', byName.item_weight);
                        }
                        return;
                      }

                      // Otherwise free text: keep existing productId unchanged
                      // (we don't clear it here to avoid losing selection on minor edits)
                    }}
                    options={[
                      // Map steel items first
                      ...steelItems.map(item => ({
                        value: item.value,
                        label: item.label,
                        data: { 
                          item_name: item.label
                        }
      })),
      // Then map products
      ...products.map(p => ({
        value: p.id,
        label: p.item_name,
        data: { 
          item_weight: p.item_weight,
          item_name: p.item_name
        }
      }))]}
                    placeholder="Type or select item"
                    className="min-w-[200px]"
                  />
                </div>
              </td>
              <td className="p-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={getDisplayValue(item.id, 'qtyInKgPc', item.qtyInKgPc)}
                  onChange={(e) => handleDecimalChange(item.id, 'qtyInKgPc', e.target.value)}
                  onBlur={(e) => handleBlur(item.id, 'qtyInKgPc', e.target.value)}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500 text-center"
                />
              </td>
              <td className="p-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={getDisplayValue(item.id, 'unitRate', item.unitRate)}
                  onChange={(e) => handleDecimalChange(item.id, 'unitRate', e.target.value)}
                  onBlur={(e) => handleBlur(item.id, 'unitRate', e.target.value)}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500 text-center"
                />
              </td>
              <td className="p-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={getDisplayValue(item.id, 'requiredQty', item.requiredQty)}
                  onChange={(e) => handleDecimalChange(item.id, 'requiredQty', e.target.value)}
                  onBlur={(e) => handleBlur(item.id, 'requiredQty', e.target.value)}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500 text-center"
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={item.totalQtyKg.toFixed(3)}
                  readOnly
                  className="border-gray-300 bg-gray-50 text-center"
                />
              </td>
              <td className="p-2">
                <Input
                  value={item.totalValue.toFixed(2)}
                  readOnly
                  className="border-gray-300 bg-gray-50 text-center font-semibold"
                />
              </td>
              <td className="p-2 text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={items.length === 1}
                  className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
