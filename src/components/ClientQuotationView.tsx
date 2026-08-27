import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  FileCheck2,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Lock,
  Unlock,
  Percent,
  IndianRupee,
  ShieldCheck,
  CreditCard,
  QrCode
} from 'lucide-react';
import { Project, CompanySettings } from '../types';
import { formatINR, numberToWordsINR } from '../utils/calculationEngine';

interface ClientQuotationViewProps {
  project: Project;
  settings: CompanySettings;
  onUpdateProject: (updated: Project) => void;
  onBackToBOQ: () => void;
}

export const ClientQuotationView: React.FC<ClientQuotationViewProps> = ({
  project,
  settings,
  onUpdateProject,
  onBackToBOQ,
}) => {
  const quotationRef = useRef<HTMLDivElement>(null);
  const qtn = project.quotation;
  const cost = project.costSummary;

  const [discountAmount, setDiscountAmount] = useState<number>(
    qtn?.discountAmount || 0
  );
  const [isEditingTerms, setIsEditingTerms] = useState<boolean>(false);
  const [termsText, setTermsText] = useState<string>(
    (qtn?.customTerms || settings.defaultTerms).join('\n')
  );
  const [exclusionsText, setExclusionsText] = useState<string>(
    (qtn?.customExclusions || settings.defaultExclusions).join('\n')
  );

  const subtotalSelling = cost?.recommendedSellingPrice || 0;
  const netTaxable = Math.max(0, subtotalSelling - discountAmount);
  const gstAmount = Math.round(netTaxable * 0.18);
  const grandTotal = netTaxable + gstAmount;

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Download PDF handler
  const handleDownloadPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      if (!quotationRef.current) return;

      const element = quotationRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `${project.projectName.replace(/\s+/g, '_')}_Quotation_${qtn?.quotationNumber || 'Doc'}.pdf`
      );
    } catch (e) {
      console.error('PDF export fallback', e);
      window.print();
    }
  };

  // Share via WhatsApp text summary
  const handleShareWhatsApp = () => {
    const text = `*Renovation Quotation from ${settings.companyName}*\n\n` +
      `*Project:* ${project.projectName}\n` +
      `*Client:* ${project.clientName}\n` +
      `*Quotation Ref:* ${qtn?.quotationNumber || 'QTN-2026'}\n` +
      `*Total Estimate:* ${formatINR(grandTotal)} (Incl. 18% GST)\n\n` +
      `*Payment Schedule:*\n` +
      (qtn?.paymentMilestones || settings.defaultPaymentSchedule)
        .map((m) => `• ${m.stageName} (${m.percentage}%): ${formatINR((grandTotal * m.percentage) / 100)}`)
        .join('\n') +
      `\n\nValid until: ${qtn?.validUntilDate || '15 days'}\n` +
      `Contact: ${settings.phone} | ${settings.email}`;

    const url = `https://wa.me/${project.clientPhone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Save changes to project quotation
  const handleSaveTerms = () => {
    const updatedTerms = termsText.split('\n').filter((t) => t.trim().length > 0);
    const updatedExclusions = exclusionsText.split('\n').filter((e) => e.trim().length > 0);

    const updated: Project = {
      ...project,
      status: 'Quotation Generated',
      quotation: {
        ...project.quotation!,
        discountAmount,
        customTerms: updatedTerms,
        customExclusions: updatedExclusions,
      },
    };

    onUpdateProject(updated);
    setIsEditingTerms(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Ribbon (Hidden in Print) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 p-4 sm:p-6 shadow-xs print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black text-[#EBA224]">
              <FileCheck2 className="w-3 h-3" />
              <span>Client Quotation</span>
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              {qtn?.quotationNumber || 'QTN-2026-0842'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Internal margins concealed. Formatted for client approval.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsEditingTerms(!isEditingTerms)}
            className="flex-1 sm:flex-none px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 text-black transition cursor-pointer border border-neutral-300 min-h-[38px] text-center"
          >
            {isEditingTerms ? 'Close Terms' : 'Edit Terms'}
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 transition cursor-pointer min-h-[38px]"
          >
            <Share2 className="w-3.5 h-3.5 text-[#EBA224]" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-white transition cursor-pointer min-h-[38px]"
          >
            <Download className="w-3.5 h-3.5 text-[#EBA224]" />
            <span>PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#EBA224] hover:bg-[#d8921b] text-black shadow-xs transition cursor-pointer min-h-[38px] active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Edit Terms & Discount Drawer */}
      {isEditingTerms && (
        <div className="bg-neutral-50 border border-black/10 rounded-3xl p-6 print:hidden space-y-5 text-xs">
          <div className="font-bold text-black text-base">
            Customize Quotation Parameters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block font-bold text-black uppercase tracking-wider mb-1.5">
                Special Discount (₹)
              </label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                placeholder="e.g. 10000"
                className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-full font-mono font-bold text-black focus:ring-2 focus:ring-[#EBA224] outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-black uppercase tracking-wider mb-1.5">
                Terms & Conditions (One per line)
              </label>
              <textarea
                rows={3}
                value={termsText}
                onChange={(e) => setTermsText(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-2xl text-black focus:ring-2 focus:ring-[#EBA224] outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-black uppercase tracking-wider mb-1.5">
                Exclusions List (One per line)
              </label>
              <textarea
                rows={3}
                value={exclusionsText}
                onChange={(e) => setExclusionsText(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-2xl text-black focus:ring-2 focus:ring-[#EBA224] outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleSaveTerms}
              className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-[#EBA224] font-bold uppercase tracking-wider rounded-full shadow-xs cursor-pointer transition"
            >
              Apply to Quotation
            </button>
          </div>
        </div>
      )}

      {/* A4 PRINTABLE QUOTATION CONTAINER */}
      <div
        ref={quotationRef}
        className="bg-white rounded-3xl border border-black/10 shadow-sm p-8 sm:p-12 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 text-black font-sans"
      >
        {/* Company Header */}
        <div className="border-b border-black/20 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EBA224] text-black flex items-center justify-center font-extrabold text-xl">
                  {settings.companyName.charAt(0)}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
                  {settings.companyName}
                </h1>
              </div>
              <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider mt-1.5">
                {settings.tagline || 'Interior Architecture & Renovation Contractors'}
              </p>
              <div className="text-xs text-neutral-500 mt-2 space-y-0.5">
                <p>{settings.address}</p>
                <p>Phone: {settings.phone} • Email: {settings.email}</p>
                {settings.gstNumber && <p>GSTIN: <strong className="text-black font-mono">{settings.gstNumber}</strong> • PAN: {settings.panNumber}</p>}
              </div>
            </div>

            {/* Quotation Meta Box */}
            <div className="bg-neutral-50 border border-black/10 rounded-2xl p-4 sm:text-right shrink-0">
              <div className="text-xs font-bold text-black uppercase tracking-widest">
                Formal Quotation
              </div>
              <div className="text-base font-bold text-black font-mono mt-0.5">
                {qtn?.quotationNumber || 'QTN-2026-0842'}
              </div>
              <div className="text-xs text-neutral-500 mt-2 space-y-0.5">
                <p>Date: <strong className="text-black font-mono">{qtn?.generatedDate || new Date().toISOString().split('T')[0]}</strong></p>
                <p>Valid Until: <strong className="text-black">{qtn?.validUntilDate || '15 Days'}</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Client & Project Details Strip */}
        <div className="py-6 border-b border-black/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-neutral-50 p-4 rounded-2xl border border-black/10 space-y-1">
            <div className="font-bold text-neutral-500 uppercase tracking-widest text-[10px]">
              Quotation Issued To:
            </div>
            <div className="font-extrabold text-base text-black">
              {project.clientName}
            </div>
            <div className="text-neutral-600 space-y-0.5">
              {project.clientPhone && <p>Phone: {project.clientPhone}</p>}
              {project.clientEmail && <p>Email: {project.clientEmail}</p>}
              <p>Site: {project.siteLocation}</p>
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-2xl border border-black/10 space-y-1">
            <div className="font-bold text-neutral-500 uppercase tracking-widest text-[10px]">
              Project Scope & Dimensions:
            </div>
            <div className="font-extrabold text-base text-black">
              {project.projectName}
            </div>
            <div className="text-neutral-600 space-y-0.5">
              <p>Type: {project.projectType} ({project.qualityTier} Quality Tier)</p>
              <p>
                Room Area: {project.dimensions?.calculatedFloorAreaSqFt || 400} sq.ft. (Ceiling: {project.dimensions?.calculatedCeilingAreaSqFt || 400} sq.ft.)
              </p>
            </div>
          </div>
        </div>

        {/* Itemized BOQ Table for Client */}
        <div className="py-6 space-y-6">
          {(project.boqSections || []).map((section) => {
            return (
              <div key={section.id} className="space-y-3">
                <div className="text-xs font-extrabold text-black bg-neutral-100 px-4 py-2 rounded-xl border border-black/5">
                  {section.name}
                </div>

                <div className="overflow-x-auto -mx-2 px-2">
                  <table className="w-full text-left text-xs border-collapse min-w-[520px]">
                    <thead>
                      <tr className="border-b border-black/10 text-neutral-500 uppercase font-bold text-[10px]">
                        <th className="py-2.5 w-10 text-center">#</th>
                        <th className="py-2.5 pr-4">Work Description & Material Specifications</th>
                        <th className="py-2.5 w-16 text-center">Qty</th>
                        <th className="py-2.5 w-16 text-center">Unit</th>
                        <th className="py-2.5 w-24 text-right">Rate (₹)</th>
                        <th className="py-2.5 w-28 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {section.items.map((it, idx) => {
                        // Client effective selling rate
                        const clientSellingRate = Math.round(
                          (it.materialRate * (1 + it.wastagePercent / 100) + it.labourRate) * 1.28
                        );
                        const clientAmount = Math.round(it.quantity * clientSellingRate);

                        return (
                          <tr key={it.id} className="text-black">
                            <td className="py-3 text-center font-mono text-neutral-400 font-semibold">
                              {idx + 1}
                            </td>
                            <td className="py-3 pr-4">
                              <div className="font-bold text-sm text-black">
                                {it.workDescription}
                              </div>
                              <div className="text-[11px] text-neutral-500">
                                {it.specification}
                              </div>
                            </td>
                            <td className="py-3 text-center font-mono font-semibold">
                              {it.quantity}
                            </td>
                            <td className="py-3 text-center text-neutral-600 font-medium">
                              {it.unit}
                            </td>
                            <td className="py-3 text-right font-mono font-medium text-black">
                              {formatINR(clientSellingRate)}
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-black">
                              {formatINR(clientAmount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Financial Summary & Total Box */}
        <div className="border-t border-black/20 pt-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            {/* Payment Schedule */}
            <div className="sm:w-1/2 space-y-3">
              <div className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#EBA224]" />
                <span>Staged Payment Schedule</span>
              </div>
              <div className="space-y-2 text-xs text-black">
                {(qtn?.paymentMilestones || settings.defaultPaymentSchedule).map((m, i) => (
                  <div key={i} className="flex justify-between border-b border-black/5 pb-1.5">
                    <span>
                      <strong className="text-black">{m.stageName}</strong> ({m.percentage}%):
                    </span>
                    <span className="font-mono font-bold text-black">
                      {formatINR((grandTotal * m.percentage) / 100)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Total Column */}
            <div className="sm:w-5/12 bg-neutral-50 p-5 rounded-2xl border border-black/10 space-y-2.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Total Scope Subtotal:</span>
                <span className="font-mono font-semibold text-black">{formatINR(subtotalSelling)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-black font-semibold">
                  <span>Special Discount:</span>
                  <span className="font-mono">- {formatINR(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>Net Taxable Value:</span>
                <span className="font-mono font-semibold text-black">{formatINR(netTaxable)}</span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Output GST (18%):</span>
                <span className="font-mono font-semibold text-black">{formatINR(gstAmount)}</span>
              </div>

              <div className="pt-3 border-t border-black/10 flex justify-between items-baseline font-bold">
                <span className="text-sm text-black uppercase tracking-tight">Grand Total:</span>
                <span className="font-mono text-2xl text-black font-extrabold">
                  {formatINR(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div className="mt-5 p-4 bg-neutral-100 rounded-2xl border border-black/10 text-xs">
            <span className="font-bold text-black uppercase tracking-wider">Amount in Words: </span>
            <span className="text-neutral-700 font-medium">
              {numberToWordsINR(grandTotal)}
            </span>
          </div>
        </div>

        {/* Bank Details & Terms */}
        <div className="border-t border-black/10 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          {/* Bank Account Details */}
          <div className="space-y-2 bg-neutral-50 p-4 rounded-2xl border border-black/10">
            <div className="font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#EBA224]" />
              <span>Bank & Payment Details</span>
            </div>
            <div className="text-black space-y-1 font-mono text-[11px]">
              <p>Account Name: <strong className="text-black">{settings.accountHolder || settings.companyName}</strong></p>
              <p>Bank: {settings.bankName}</p>
              <p>A/C Number: {settings.accountNumber}</p>
              <p>IFSC Code: {settings.ifscCode}</p>
              {settings.upiId && <p>UPI ID: {settings.upiId}</p>}
            </div>
          </div>

          {/* Authorized Signatory Block */}
          <div className="flex flex-col justify-between text-right p-4">
            <div className="text-neutral-600 font-semibold">
              For <strong className="text-black">{settings.companyName}</strong>
            </div>
            <div className="mt-8">
              <div className="w-44 border-b border-black ml-auto mb-1.5" />
              <div className="font-bold text-black">Authorized Signatory</div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Seal & Signature</div>
            </div>
          </div>
        </div>

        {/* Standard Terms & Exclusions */}
        <div className="border-t border-black/10 pt-5 mt-5 space-y-4 text-[11px] text-neutral-600">
          <div>
            <strong className="text-black font-bold block mb-1.5">Terms & Conditions:</strong>
            <ul className="list-disc pl-4 space-y-1">
              {(qtn?.customTerms || settings.defaultTerms).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>

          <div>
            <strong className="text-black font-bold block mb-1.5">Standard Exclusions:</strong>
            <ul className="list-disc pl-4 space-y-1">
              {(qtn?.customExclusions || settings.defaultExclusions).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
