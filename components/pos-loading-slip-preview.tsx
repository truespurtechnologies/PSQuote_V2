"use client"

interface QuotationItem {
  id: string
  description: string
  requiredQty: number
  qtyInKgPc: number
  totalQtyKg: number
  unitRate: number
  totalValue: number
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
  // Helper function to extract size from description (e.g., "MS PIPE SHS 72x72x2 MM" -> "72x72x2 MM")
  const extractSize = (description: string): string => {
    // Pattern to match size specifications like "72x72x2 MM", "50x50x1.6 MM", etc.
    const sizeMatch = description.match(/([0-9]+x[0-9]+(?:x[0-9.]+)?\s*(?:MM|M|CM|KG|PC)?)/i);
    return sizeMatch ? sizeMatch[1] : description;
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
                  {index + 1}){extractSize(item.description)} Qty: {item.requiredQty}
                </div>
              </div>
            ))}
        </div>

        <div className="pos-divider"></div>
        {/* Total Weight removed */}

        {/* Footer */}
        <div className="text-center text-base" style={{ marginTop: '6mm' }}>
          <div className="font-bold">POPULAR STEELS</div>
        </div>
      </div>
    </>
  )
}
