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

interface QuotationPreviewProps {
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

export function QuotationPreview({
  quotationData,
  items,
  charges,
  termsConditions,
  totals,
  quotationNumber = "QT-001",
  className = "",
  ...props
}: QuotationPreviewProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-white p-6 max-w-4xl mx-auto print:p-0 print:max-w-full print:shadow-none ${className || ''}`} {...props}>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.3;
            color: #000 !important;
            background: white !important;
          }
          
          #quotation-preview {
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
          
          .print-summary-box {
            border: 1px solid #000 !important;
            background: #f8f9fa !important;
            padding: 6px !important;
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

      <div id="quotation-preview">
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
              <div className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm">QUOTATION</div>
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
                <span className="font-bold text-sm">QUOTATION TO: </span>
                <span className="text-lg font-bold text-blue-800">{quotationData.to}</span>
                {quotationData.phone && <span className="text-sm text-gray-600 ml-2">Ph: {quotationData.phone}</span>}
              </div>
              <div className="text-right text-sm">
                <div>
                  <span className="font-bold">No: </span>
                  <span className="text-red-600 font-bold">{quotationNumber}</span>
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
          <div className="bg-red-600 text-white p-2 print-section-header">
            <h3 className="text-sm font-bold">QUOTATION DETAILS</h3>
          </div>
          <table className="w-full border-collapse print-table">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left text-xs font-bold">SL</th>
                <th className="border border-gray-400 p-2 text-left text-xs font-bold">ITEM DESCRIPTION</th>
                <th className="border border-gray-400 p-2 text-center text-xs font-bold">REQ QTY</th>
                <th className="border border-gray-400 p-2 text-center text-xs font-bold">KG/PC</th>
                <th className="border border-gray-400 p-2 text-center text-xs font-bold">TOTAL KG</th>
                <th className="border border-gray-400 p-2 text-center text-xs font-bold">RATE</th>
                <th className="border border-gray-400 p-2 text-center text-xs font-bold">VALUE</th>
              </tr>
            </thead>
            <tbody>
              {items
                .filter(item => item.description.trim() !== '') // Filter out items with empty descriptions
                .map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-400 p-2 text-center text-xs">{index + 1}</td>
                    <td className="border border-gray-400 p-2 text-xs">{item.description}</td>
                    <td className="border border-gray-400 p-2 text-center text-xs">{item.requiredQty}</td>
                    <td className="border border-gray-400 p-2 text-center text-xs">{item.qtyInKgPc.toFixed(3)}</td>
                    <td className="border border-gray-400 p-2 text-center text-xs">{item.totalQtyKg.toFixed(3)}</td>
                    <td className="border border-gray-400 p-2 text-center text-xs">₹{item.unitRate.toFixed(2)}</td>
                    <td className="border border-gray-400 p-2 text-center text-xs font-bold">
                      ₹{item.totalValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Compact Summary Section */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="print-summary-box">
            <p className="text-sm">
              <span className="font-bold">Total Weight: </span>
              <span className="font-bold text-blue-700">{totals.totalWeight.toFixed(2)} KG</span>
            </p>
          </div>
          <div className="print-summary-box">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Basic Total:</span>
                <span className="font-bold">₹{totals.basicTotal.toFixed(2)}</span>
              </div>
              {charges.loading > 0 && (
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <span className="font-bold">₹{charges.loading.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST @{charges.gstRate}%:</span>
                <span className="font-bold">₹{totals.gstAmount.toFixed(2)}</span>
              </div>
              {totals.roundOff !== 0 && (
                <div className="flex justify-between text-sm">
                  <span>Rounded off:</span>
                  <span className="font-bold">₹{Math.abs(totals.roundOff).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1 text-sm">
                <span className="font-bold">TOTAL:</span>
                <span className="font-bold text-red-600">₹{totals.finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Terms & Conditions */}
        <div className="mb-6 print-section">
          <div className="bg-gray-800 text-white p-2 print-section-header">
            <h3 className="text-sm font-bold">TERMS & CONDITIONS</h3>
          </div>
          <div className="p-3 print-section-content">
            <div className="grid grid-cols-2 gap-4 text-xs">
              {termsConditions.map((term, index) => (
                <div key={index} className="flex">
                  <span className="font-bold mr-1">{index + 1}.</span>
                  <span>{term}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compact Bank Details */}
        <div className="mb-6 print-section">
          <div className="bg-green-600 text-white p-2 print-section-header">
            <h3 className="text-sm font-bold">BANK DETAILS</h3>
          </div>
          <div className="p-3 print-section-content">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold">Company: </span>
                {quotationData.companyName}
                <br />
                <span className="font-bold">A/C: </span>
                {quotationData.accountNo}
              </div>
              <div>
                <span className="font-bold">Bank: </span>
                {quotationData.bankName}
                <br />
                <span className="font-bold">IFSC: </span>
                {quotationData.ifscCode}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Signature */}
        <div className="border-t border-gray-800 pt-4 print-signature">
          <div className="flex justify-between items-end">
            <div className="text-xs text-gray-600">
              <p>Thank you for your business.</p>
              <p className="mt-1 font-semibold text-blue-600">Visit us: WWW.PopularSteels.co.in</p>
            </div>
            <div className="text-center">
              <p className="text-red-600 font-bold mb-6">For POPULAR STEELS</p>
              <div className="border-b border-gray-400 w-32 mb-1"></div>
              <p className="text-xs text-gray-600">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
