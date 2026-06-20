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

interface LoadingSlipPreviewProps {
  quotationData: QuotationData
  items: QuotationItem[]
  totals: {
    totalWeight: number
  }
  quotationNumber?: string
}

export function LoadingSlipPreview({
  quotationData,
  items,
  totals,
  quotationNumber = "QT-001",
}: LoadingSlipPreviewProps) {
  return (
    <>
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.3;
            color: #000 !important;
            background: white !important;
          }
          
          #loading-slip-preview {
            max-width: none !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
          }
          
          .print-header {
            border: 2px solid #000 !important;
            background: white !important;
            page-break-inside: avoid;
            margin-bottom: 8px !important;
          }
          
          .print-header-compact {
            background: #f8f9fa !important;
            border-bottom: 1px solid #000 !important;
            padding: 6px 8px !important;
          }
          
          .print-company-compact {
            background: white !important;
            border-bottom: 1px solid #000 !important;
            padding: 4px 8px !important;
            font-size: 10px !important;
          }
          
          .print-doc-compact {
            background: white !important;
            padding: 6px 8px !important;
          }
          
          .print-table {
            border: 1px solid #000 !important;
            page-break-inside: avoid;
          }
          
          .print-table th {
            background: #f0f0f0 !important;
            border: 1px solid #000 !important;
            padding: 4px !important;
            font-weight: bold !important;
            font-size: 10px !important;
          }
          
          .print-table td {
            border: 1px solid #000 !important;
            padding: 4px !important;
            font-size: 10px !important;
          }
          
          .print-section {
            border: 1px solid #000 !important;
            background: white !important;
            margin-bottom: 6px !important;
            page-break-inside: avoid;
          }
          
          .print-section-header {
            background: #f0f0f0 !important;
            border-bottom: 1px solid #000 !important;
            padding: 4px 6px !important;
            font-weight: bold !important;
            font-size: 11px !important;
          }
          
          .print-section-content {
            padding: 6px !important;
            background: white !important;
          }
          
          .print-signature {
            border-top: 1px solid #000 !important;
            padding-top: 10px !important;
            page-break-inside: avoid;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white text-black p-8 max-w-4xl mx-auto" id="loading-slip-preview">
        {/* Compact Professional Header */}
        <div className="border-2 border-gray-800 mb-6 print-header">
          {/* Compact Top Header */}
          <div className="bg-gray-100 p-3 print-header-compact">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src="/images/popular-steels-logo.png"
                  alt="Popular Steels Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-800">POPULAR STEELS</h1>
                  <p className="text-xs text-gray-600 font-medium">
                    High Quality | Affordable Price | Satisfaction Guaranteed
                  </p>
                </div>
              </div>
              <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-sm">LOADING SLIP</div>
            </div>
          </div>

          {/* Compact Company Details */}
          <div className="bg-white px-3 py-2 border-b border-gray-300 print-company-compact">
            <div className="text-xs space-y-1">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold">GST: 33AEPPG7635E1ZI</span>
                <span>NO.625/1, M K N ROAD, GUINDY, CHENNAI-32</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span>PH: 9884035106, 9940335106</span>
                <span>EMAIL: popular_steels@rediffmail.com</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-blue-600">WEBSITE: WWW.PopularSteels.co.in</span>
              </div>
            </div>
          </div>

          {/* Compact Document Info */}
          <div className="bg-white px-3 py-2 print-doc-compact">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-sm">DELIVERY TO: </span>
                <span className="text-lg font-bold text-green-800">{quotationData.to}</span>
                {quotationData.phone && <span className="text-sm text-gray-600 ml-2">Ph: {quotationData.phone}</span>}
              </div>
              <div className="text-right text-sm">
                <div>
                  <span className="font-bold">Slip No: </span>
                  <span className="text-blue-600 font-bold">LS-{quotationNumber.replace("QT-", "")}</span>
                </div>
                <div>
                  <span className="font-bold">Date: </span>
                  <span>{new Date(quotationData.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6 print-section">
          <div className="bg-blue-600 text-white p-2 print-section-header">
            <h3 className="text-sm font-bold">LOADING DETAILS</h3>
          </div>
          <table className="w-full border-collapse print-table">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left text-xs font-bold">SL</th>
                <th className="border border-gray-400 p-2 text-left text-xs font-bold">ITEM DESCRIPTION</th>
                <th className="border border-gray-400 p-2 text-center text-xs font-bold">QTY</th>
                <th className="border border-gray-400 p-2 text-center text-xs font-bold">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {items
                .filter(item => item.description.trim() !== '' && item.requiredQty > 0) // Filter out empty items and zero quantity
                .map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-400 p-2 text-center text-xs">{index + 1}</td>
                    <td className="border border-gray-400 p-2 text-xs">{item.description}</td>
                    <td className="border border-gray-400 p-2 text-center text-xs">{item.requiredQty}</td>
                    <td className="border border-gray-400 p-2 text-center text-xs"></td>
                  </tr>
                ))}
              <tr className="bg-blue-100 font-bold">
                <td className="border border-gray-400 p-2 text-center text-xs" colSpan={3}>
                  TOTAL
                </td>
                <td className="border border-gray-400 p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Compact Loading Instructions */}
        <div className="mb-6 print-section">
          <div className="bg-orange-600 text-white p-2 print-section-header">
            <h3 className="text-sm font-bold">LOADING INSTRUCTIONS</h3>
          </div>
          <div className="p-3 print-section-content">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>• Handle with care during loading</div>
              <div>• Check all items before loading</div>
              <div>• Ensure proper securing of materials</div>
              <div>• Contact office for discrepancies</div>
            </div>
          </div>
        </div>

        {/* Compact Transport Details */}
        <div className="mb-6 print-section">
          <div className="bg-gray-800 text-white p-2 print-section-header">
            <h3 className="text-sm font-bold">TRANSPORT DETAILS</h3>
          </div>
          <div className="p-3 print-section-content">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="font-bold">Vehicle No:</span>
                <div className="border-b border-gray-400 h-4 mt-1"></div>
              </div>
              <div>
                <span className="font-bold">Driver:</span>
                <div className="border-b border-gray-400 h-4 mt-1"></div>
              </div>
              <div>
                <span className="font-bold">License:</span>
                <div className="border-b border-gray-400 h-4 mt-1"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Signatures */}
        <div className="border-t border-gray-800 pt-4 print-signature">
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <p className="font-bold mb-4">PREPARED BY</p>
              <div className="border-b border-gray-400 mb-1"></div>
              <p className="text-gray-600">Name & Signature</p>
            </div>
            <div>
              <p className="font-bold mb-4">CHECKED BY</p>
              <div className="border-b border-gray-400 mb-1"></div>
              <p className="text-gray-600">Name & Signature</p>
            </div>
            <div>
              <p className="font-bold mb-4">DRIVER</p>
              <div className="border-b border-gray-400 mb-1"></div>
              <p className="text-gray-600">Name & Signature</p>
              <p className="text-blue-600 font-semibold mt-2">WWW.PopularSteels.co.in</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
