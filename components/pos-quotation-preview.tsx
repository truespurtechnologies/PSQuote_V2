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
  accountNo: string
  bankName: string
  ifscCode: string
}

interface POSQuotationPreviewProps {
  quotationData: QuotationData
  items: QuotationItem[]
  charges: {
    loading: number
    gstRate: number
    roundOff: number
  }
  termsConditions: string[]
  totals: {
    totalWeight: number
    basicTotal: number
    afterLoading: number
    gstAmount: number
    roundOff: number
    finalTotal: number
  }
  quotationNumber?: string
}

export function POSQuotationPreview({
  quotationData,
  items,
  charges,
  termsConditions,
  totals,
  quotationNumber = "QT-001",
}: POSQuotationPreviewProps) {
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
          
          #pos-quotation-preview {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            box-shadow: none !important;
            font-size: 19px !important;
            font-weight: 700 !important;
          }
          
          #pos-quotation-preview * {
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
        id="pos-quotation-preview"
        style={{ width: "80mm", fontFamily: "Courier New, monospace", padding: "0", margin: "0" }}
      >
        {/* POS Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-1 mb-1 pos-header">
          <div className="text-lg font-bold">POPULAR STEELS</div>
          <div className="text-base">GST: 33AEPPG7635E1ZI</div>
          <div className="text-base">NO.625/1, M K N ROAD</div>
          <div className="text-base">GUINDY, CHENNAI-32</div>
          <div className="text-base">PH: 9884035106, 9940335106</div>
          <div className="text-base font-bold bg-gray-200">QUOTATION</div>
        </div>

        {/* Document Info */}
        <div className="pos-section" style={{ marginTop: '6mm' }}>
          <div className="text-base font-bold">
            <div>
              No: {quotationNumber.slice(-4)}
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
          <div className="text-base font-bold">ITEMS:</div>
          {items
            .filter(item => item.description.trim() !== '' && item.requiredQty > 0) // Filter out empty items and zero quantity
            .map((item, index) => (
              <div key={item.id} className="pos-item-row text-base font-bold" style={{ marginBottom: '2mm' }}>
                <div className="font-bold" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                  {index + 1}){extractSize(item.description)}
                </div>
                <div className="font-bold" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                  Qty: {item.requiredQty} Wt: {item.totalQtyKg.toFixed(2)}kg
                </div>
                <div className="font-bold" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                  Rate: ₹{item.unitRate.toFixed(2)} ₹{item.totalValue.toFixed(2)}
                </div>
              </div>
            ))}
        </div>

        <div className="pos-divider"></div>

        {/* Totals */}
        <div className="pos-total-section" style={{ marginTop: '6mm' }}>
          <div className="text-base font-bold">
            <div className="font-bold">
              Total Weight: {totals.totalWeight.toFixed(2)} KG
            </div>
            <div className="font-bold">
              Basic Total: ₹{totals.basicTotal.toFixed(2)}
            </div>
            {charges.loading > 0 && (
              <div className="font-bold">
                Loading: ₹{charges.loading.toFixed(2)}
              </div>
            )}
            <div className="font-bold">
              GST @{charges.gstRate}%: ₹{totals.gstAmount.toFixed(2)}
            </div>
            <div className="border-t border-dashed pt-1 font-bold">
              TOTAL: ₹{totals.finalTotal.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="pos-divider"></div>

        {/* Terms */}
        <div className="pos-section" style={{ marginTop: '6mm' }}>
          <div className="text-base font-bold">TERMS & CONDITIONS:</div>
          <div className="text-base font-bold">
            {termsConditions.slice(0, 4).map((term, index) => (
              <div key={index} className="font-bold" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {index + 1}){term}
              </div>
            ))}
          </div>
        </div>

        <div className="pos-divider"></div>

        {/* Bank Details */}
        <div className="pos-section" style={{ marginTop: '6mm' }}>
          <div className="text-base font-bold">BANK DETAILS:</div>
          <div className="text-base font-bold">
            <div className="font-bold">A/C: {quotationData.accountNo}</div>
            <div className="font-bold">{quotationData.bankName}</div>
            <div className="font-bold">IFSC: {quotationData.ifscCode}</div>
          </div>
        </div>

        <div className="pos-divider"></div>

        {/* Footer */}
        <div className="text-center text-base font-bold" style={{ marginTop: '6mm' }}>
          <div className="font-bold">For POPULAR STEELS</div>
          <div className="font-bold">Authorized Signature</div>
          <div className="font-bold">Thank you for your business!</div>
          <div className="font-bold">WWW.PopularSteels.co.in</div>
        </div>
      </div>
    </>
  )
}
