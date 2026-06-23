"use client"

interface QuotationItem {
  id: string
  description: string
  requiredQty: number
  qtyInKgPc: number
  totalQtyKg: number
  unitRate: number
  totalValue: number
  productId?: string
  displayPrefix?: string
  itemSize?: string
  productName?: string
}

interface QuotationData {
  to: string
  phone: string
  date: string
  companyName: string
}

interface POSLoadingSlipPreviewProps {
  quotationData: QuotationData
  items: QuotationItem[]
  totals: {
    totalWeight: number
  }
  quotationNumber?: string
}

export function POSLoadingSlipPreview({
  quotationData,
  items,
  totals,
  quotationNumber = "QT-001",
}: POSLoadingSlipPreviewProps) {
  // Helper function to format item display with prefix
  const formatItemDisplay = (item: QuotationItem): string => {
    // Check if this is a pipe product (prefix starts with P-)
    const isPipe = item.displayPrefix?.startsWith('P-');
    // Check if this is a roofing sheet (prefix is ROOF)
    const isRoof = item.displayPrefix === 'ROOF';
    
        
    // If we have display_prefix and item_size
    if (item.displayPrefix && item.itemSize) {
      // For pipes, show only size (no prefix) + any user text
      if (isPipe) {
        let userText = '';
        if (item.description && item.productName) {
          const normalizeDesc = (desc: string) => desc.toLowerCase().trim().replace(/\s+/g, ' ');
          const descNormalized = normalizeDesc(item.description);
          const productNameNormalized = normalizeDesc(item.productName);
          
          if (descNormalized.startsWith(productNameNormalized) && descNormalized.length > productNameNormalized.length) {
            const extraText = item.description.substring(item.productName.length).trim();
            if (extraText) {
              userText = ` ${extraText}`;
            }
          }
        }
        return `${item.itemSize}${userText}`;
      }
      // For roofing sheets, extract ft value and any color/text (e.g., "10.5ft BLUE" from "PPGI-0.47-10.5ft - blue")
      if (isRoof) {
        const ftMatch = item.itemSize.match(/-([0-9.]+ft)(?:\s*-\s*(.+))?$/i);
        if (ftMatch) {
          const ftValue = ftMatch[1];
          const colorText = ftMatch[2] ? ` ${ftMatch[2].toUpperCase()}` : '';
          return `${item.displayPrefix} ${ftValue}${colorText}`;
        }
      }
      // For other products, show prefix + size + any user text
      // Check if user has added custom text after the standard product name
      let userText = '';
      if (item.description && item.productName) {
        // Extract user text by comparing description with original product name
        const normalizeDesc = (desc: string) => desc.toLowerCase().trim().replace(/\s+/g, ' ');
        const descNormalized = normalizeDesc(item.description);
        const productNameNormalized = normalizeDesc(item.productName);
        
        // If description starts with product name and is longer, extract the extra text
        if (descNormalized.startsWith(productNameNormalized) && descNormalized.length > productNameNormalized.length) {
          const extraText = item.description.substring(item.productName.length).trim();
          if (extraText) {
            userText = ` ${extraText}`;
          }
        }
      }
      
      return `${item.displayPrefix} ${item.itemSize}${userText}`;
    }
    
    // Fallback: extract size from description
    // First try roofing sheet pattern with color (e.g., "ROOFING SHEET COLOUR PPGI-0.47-10.5ft - blue" -> "ROOF 10.5ft BLUE")
    const roofMatch = item.description.match(/-([0-9.]+ft)(?:\s*-\s*(.+))?$/i);
    if (roofMatch) {
      const ftValue = roofMatch[1];
      const colorText = roofMatch[2] ? ` ${roofMatch[2].toUpperCase()}` : '';
      return `ROOF ${ftValue}${colorText}`;
    }
    
    // Then try standard size patterns (e.g., "125x200x16 MM")
    const sizeMatch = item.description.match(/([0-9]+x[0-9]+(?:x[0-9.]+)?(?:\s*(?:MM|M|CM|KG|PC|ODx|OD|x))?[0-9.]*(?:\s*(?:MM|M|CM|ft))?)/i);
    if (sizeMatch) {
      // Check if there's user text after the size pattern
      const sizePattern = sizeMatch[1];
      const remainingText = item.description.substring(sizeMatch.index! + sizePattern.length).trim();
      
      if (remainingText) {
        // Return size + user text
        return `${sizePattern} ${remainingText}`;
      } else {
        // Return just size
        return sizePattern;
      }
    }
    
    // Last resort: return full description
    return item.description;
  };
  return (
    <>
      {/* POS Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            font-size: 19px !important;
            font-weight: 700 !important;
            line-height: 1.3 !important;
            color: #000 !important;
            background: white !important;
            font-family: 'Courier New', Courier, monospace !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          #pos-loading-slip-preview {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            box-shadow: none !important;
            font-size: 19px !important;
            font-weight: 700 !important;
          }
          
          #pos-loading-slip-preview * {
            font-size: 19px !important;
            font-weight: 700 !important;
            line-height: 1.3 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          
          .pos-header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 2mm;
            margin-bottom: 2mm;
            font-size: 21px !important;
            font-weight: 700 !important;
          }
          
          .pos-header > div {
            font-size: 21px !important;
            font-weight: 700 !important;
          }
          
          .pos-section {
            margin-bottom: 2mm;
            padding-bottom: 1mm;
            font-size: 19px !important;
            font-weight: 700 !important;
          }
          
          .pos-section * {
            font-size: 19px !important;
            font-weight: 700 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          
          .pos-divider {
            border-bottom: 1px dashed #000;
            margin: 1mm 0;
            height: 1px;
          }
          
          .pos-item-row {
            font-size: 19px !important;
            font-weight: 700 !important;
            margin-bottom: 2mm;
            line-height: 1.3 !important;
          }
          
          .pos-item-row * {
            font-size: 19px !important;
            font-weight: 700 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          
          .pos-total-section {
            border-top: 1px dashed #000;
            padding-top: 1mm;
            margin-top: 2mm;
            font-size: 19px !important;
            font-weight: 700 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          div, span, p {
            font-size: 19px !important;
            font-weight: 700 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
        }
      `}} />

      <div
        className="bg-white text-black max-w-sm mx-auto border"
        id="pos-loading-slip-preview"
        style={{ width: "80mm", fontFamily: "Courier New, monospace", padding: "0", margin: "0" }}
      >
        {/* POS Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-1 mb-1 pos-header">
          <div className="text-lg font-bold">POPULAR STEELS</div>
          <div className="text-base font-bold bg-gray-200">LOADING SLIP</div>
        </div>

        {/* Document Info */}
        <div className="pos-section" style={{ marginTop: '6mm' }}>
          <div className="text-base font-bold">
            <div>
              Slip No: {quotationNumber.slice(-4)}
            </div>
            <div>
              Date: {new Date(quotationData.date).toLocaleDateString()}
            </div>
            <div>
              TO: {quotationData.to}
            </div>
            {quotationData.phone && <div>Ph: {quotationData.phone}</div>}
          </div>
        </div>

        <div className="pos-divider"></div>

        {/* Items */}
        <div className="pos-section" style={{ marginTop: '6mm' }}>
          <div className="text-base font-bold">LOADING ITEMS:</div>
          {items
            .filter(item => item.description.trim() !== '' && item.requiredQty > 0) // Filter out empty items and zero quantity
            .map((item, index) => (
              <div key={item.id} className="pos-item-row text-base font-bold" style={{ marginBottom: '2mm' }}>
                <div style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                  {index + 1}){formatItemDisplay(item)} Qty: {item.requiredQty}
                </div>
              </div>
            ))}
        </div>

        <div className="pos-divider"></div>

        {/* Footer */}
        <div className="text-center text-base" style={{ marginTop: '6mm' }}>
          <div className="font-bold">POPULAR STEELS</div>
        </div>
      </div>
    </>
  )
}
