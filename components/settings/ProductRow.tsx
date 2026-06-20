import React, { useState, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { TableRow, TableCell } from '../../components/ui/table';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Product, ProductBase } from '../../types/product';

interface ProductRowProps {
  product: Product;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onEdit: (product: Product, field: keyof ProductBase) => void;
  isEditing: boolean;
  editingField: keyof ProductBase | null;
  editingProduct: Partial<Product> | null;
  onInputChange: (field: keyof Product, value: string | number | boolean | null) => void;
  onSave: (productId: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const ProductRow: React.FC<ProductRowProps> = ({
  product,
  onDelete,
  onToggleStatus,
  onEdit,
  isEditing,
  editingField,
  editingProduct,
  onInputChange,
  onSave,
  onCancel,
  isSubmitting,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSave(product.id);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const renderEditableCell = (field: keyof ProductBase) => {
    const isEditingField = isEditing && editingField === field;
    const value = isEditingField && editingProduct ? editingProduct[field] : product[field];

    if (isEditingField) {
      return (
        <div className="flex items-center space-x-2">
          {field === 'is_active' ? (
            <Switch
              checked={!!value}
              onCheckedChange={(checked) => onInputChange(field, checked)}
              className="ml-2"
            />
          ) : (
            <Input
              type={typeof value === 'number' ? 'number' : 'text'}
              value={value?.toString() || ''}
              onChange={(e) => onInputChange(field, e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 w-full"
              autoFocus
            />
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onSave(product.id)}
            disabled={isSubmitting}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    const formatValue = (val: any) => {
      if (val === null || val === undefined) return '-';
      if (typeof val === 'boolean') return val ? 'Active' : 'Inactive';
      return val.toString();
    };

    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-2 rounded"
        onClick={() => onEdit(product, field)}
      >
        {formatValue(value)}
      </div>
    );
  };

  return (
    <TableRow>
      <TableCell>{renderEditableCell('item_code')}</TableCell>
      <TableCell>{renderEditableCell('item_name')}</TableCell>
      <TableCell>{renderEditableCell('item_description')}</TableCell>
      <TableCell>{renderEditableCell('item_category')}</TableCell>
      <TableCell>{renderEditableCell('item_sub_category')}</TableCell>
      <TableCell>{renderEditableCell('item_type')}</TableCell>
      <TableCell>{renderEditableCell('item_size')}</TableCell>
      <TableCell>{renderEditableCell('item_unit')}</TableCell>
      <TableCell className="text-right">
        {renderEditableCell('item_weight')}
      </TableCell>
      <TableCell className="text-right">
        {renderEditableCell('item_rate')}
      </TableCell>
      <TableCell className="text-right">
        {renderEditableCell('gst_rate')}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center">
          {renderEditableCell('is_active')}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(product.id)}
            disabled={isSubmitting}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default React.memo(ProductRow);
