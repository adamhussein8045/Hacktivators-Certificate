import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  CertificateTemplate,
  Certificate,
  CsvParsedRow,
  AuditLogEntry,
  Language,
} from '../types';
import { CertificateRenderer } from './CertificateRenderer';
import { exportElementToPdf, exportElementToPng } from '../utils/exportEngine';
import { generateVerificationHash, generateVerificationQr } from '../utils/qrGenerator';
import { translations } from '../i18n/translations';
import {
  Award,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface IssuanceHubProps {
  currentOrgId: string;
  lang: Language;
  templates: CertificateTemplate[];
  existingCertificates: Certificate[];
  onCertificateIssued: (cert: Certificate, audit: AuditLogEntry) => void;
  onBatchIssued: (certs: Certificate[], audit: AuditLogEntry) => void;
  onNavigateToRegistry: () => void;
}

export const IssuanceHub: React.FC<IssuanceHubProps> = ({
  currentOrgId,
  lang,
  templates,
  existingCertificates,
  onCertificateIssued,
  onBatchIssued,
  onNavigateToRegistry,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'individual' | 'bulk'>('individual');

  // Selected template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || ''
  );
  const selectedTemplate =
    templates.find((tpl) => tpl.id === selectedTemplateId) || templates[0];

  // Individual Form State
  const [recipientName, setRecipientName] = useState('Sarah Mansour');
  const [recipientNameAr, setRecipientNameAr] = useState('سارة المنصور');
  const [recipientEmail, setRecipientEmail] = useState('sarah.m@example.com');
  const [certTitle, setCertTitle] = useState('Certificate of Distinguished Excellence');
  const [certDescription, setCertDescription] = useState(
    'In recognition of exceptional contributions, innovative problem-solving, and exemplary leadership in software engineering.'
  );
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [issuerName, setIssuerName] = useState('Eng. Adam Hussein');
  const [issuerTitle, setIssuerTitle] = useState('Lead Architect & Director');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedCertificate, setIssuedCertificate] = useState<Certificate | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Bulk CSV State
  const [csvRawData, setCsvRawData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [colName, setColName] = useState<string>('');
  const [colEmail, setColEmail] = useState<string>('');
  const [colNameAr, setColNameAr] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<CsvParsedRow[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchSuccessCount, setBatchSuccessCount] = useState<number | null>(null);

  const previewCertRef = useRef<HTMLDivElement>(null);

  // Helper: Generate Secure, Non-Guessable Cert ID
  const generateSecureCertId = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `HCK-2026-${randomHex}`;
  };

  // Submit Individual Issuance
  const handleIssueIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !recipientName || !recipientEmail) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    const newCertId = generateSecureCertId();
    const qrDataUrl = await generateVerificationQr(newCertId);
    const hash = generateVerificationHash(newCertId, currentOrgId, issueDate);

    // Deep immutable clone of the template snapshot
    const templateSnapshot: CertificateTemplate = JSON.parse(
      JSON.stringify(selectedTemplate)
    );

    const newCertificate: Certificate = {
      id: newCertId,
      orgId: currentOrgId,
      templateId: selectedTemplate.id,
      templateSnapshot,
      recipientName,
      recipientEmail,
      recipientNameAr: recipientNameAr || undefined,
      title: certTitle,
      description: certDescription,
      issueDate,
      issuerName,
      issuerTitle,
      status: 'valid',
      qrCodeDataUrl: qrDataUrl,
      verificationHash: hash,
      createdAt: new Date().toISOString(),
    };

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      orgId: currentOrgId,
      actorName: 'Adam Hussein',
      actorEmail: 'adamhussein8045@gmail.com',
      actorRole: 'platform_owner',
      action: 'CERTIFICATE_ISSUED',
      targetId: newCertId,
      details: `Issued individual certificate to ${recipientName} (${recipientEmail})`,
      detailsAr: `إصدار شهادة فردية للمستلم ${recipientNameAr || recipientName}`,
      timestamp: new Date().toISOString(),
    };

    onCertificateIssued(newCertificate, auditEntry);
    setIssuedCertificate(newCertificate);
    setIsSubmitting(false);
  };

  // Handle CSV file upload
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const headers: string[] = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvRawData(results.data);

        // Auto-detect columns
        const foundName = headers.find((h: string) =>
          /name|recipient|full_name/i.test(h)
        );
        const foundEmail = headers.find((h: string) => /email|mail/i.test(h));
        const foundNameAr = headers.find((h: string) => /arabic|name_ar/i.test(h));

        if (foundName) setColName(foundName);
        if (foundEmail) setColEmail(foundEmail);
        if (foundNameAr) setColNameAr(foundNameAr);

        runValidation(results.data, foundName || '', foundEmail || '', foundNameAr || '');
      },
      error: (err: any) => {
        alert(`Failed to parse CSV file: ${err.message}`);
      },
    });
  };

  // Run validation on CSV records
  const runValidation = (
    data: any[],
    nameKey: string,
    emailKey: string,
    arKey: string
  ) => {
    const rows: CsvParsedRow[] = data.map((row, idx) => {
      const name = (row[nameKey] || '').trim();
      const email = (row[emailKey] || '').trim();
      const nameAr = arKey ? (row[arKey] || '').trim() : undefined;
      const errors: string[] = [];

      if (!name) errors.push('Missing recipient name');
      if (!email) {
        errors.push('Missing recipient email');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format');
      }

      // Duplicate check against existing database
      const isDuplicate = existingCertificates.some(
        (c) =>
          c.recipientEmail.toLowerCase() === email.toLowerCase() &&
          c.status === 'valid'
      );

      return {
        rowNumber: idx + 1,
        recipientName: name,
        recipientEmail: email,
        recipientNameAr: nameAr,
        isValid: errors.length === 0,
        errors,
        isDuplicateCandidate: isDuplicate,
      };
    });

    setParsedRows(rows);
  };

  // Trigger re-validation when mapping changes
  const handleMappingChange = (
    newNameCol: string,
    newEmailCol: string,
    newArCol: string
  ) => {
    setColName(newNameCol);
    setColEmail(newEmailCol);
    setColNameAr(newArCol);
    runValidation(csvRawData, newNameCol, newEmailCol, newArCol);
  };

  // Process Batch Issuance
  const handleProcessBatch = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows found to issue.');
      return;
    }

    setIsProcessingBatch(true);
    const newCertificates: Certificate[] = [];

    for (const r of validRows) {
      const newCertId = generateSecureCertId();
      const qrDataUrl = await generateVerificationQr(newCertId);
      const hash = generateVerificationHash(newCertId, currentOrgId, issueDate);

      newCertificates.push({
        id: newCertId,
        orgId: currentOrgId,
        templateId: selectedTemplate.id,
        templateSnapshot: JSON.parse(JSON.stringify(selectedTemplate)),
        recipientName: r.recipientName,
        recipientEmail: r.recipientEmail,
        recipientNameAr: r.recipientNameAr,
        title: certTitle,
        description: certDescription,
        issueDate,
        issuerName,
        issuerTitle,
        status: 'valid',
        qrCodeDataUrl: qrDataUrl,
        verificationHash: hash,
        createdAt: new Date().toISOString(),
      });
    }

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      orgId: currentOrgId,
      actorName: 'Adam Hussein',
      actorEmail: 'adamhussein8045@gmail.com',
      actorRole: 'platform_owner',
      action: 'BATCH_CSV_ISSUED',
      targetId: `BATCH-${Date.now()}`,
      details: `Issued batch of ${newCertificates.length} certificates from CSV`,
      detailsAr: `إصدار دفعة جماعية من ${newCertificates.length} شهادة عبر CSV`,
      timestamp: new Date().toISOString(),
    };

    onBatchIssued(newCertificates, auditEntry);
    setBatchSuccessCount(newCertificates.length);
    setIsProcessingBatch(false);
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const sampleContent =
      'recipient_name,recipient_email,name_arabic,organization\n' +
      'Zaid Al-Harbi,zaid@example.com,زيد الحربي,Hacktivators\n' +
      'Lina Al-Hassan,lina@example.com,لينا الحسن,Hacktivators\n' +
      'Faisal Al-Qahtani,faisal@example.com,فيصل القحطاني,Hacktivators\n' +
      'Reem Al-Shammari,reem@example.com,ريم الشمري,Hacktivators\n';

    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hacktivators_recipients_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = (certId: string) => {
    const url = `${window.location.origin}/?verify=${certId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            {t.issuance.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">{t.issuance.subtitle}</p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'individual'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.issuance.individualTab}
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'bulk'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {t.issuance.bulkTab}
          </button>
        </div>
      </div>

      {/* Individual Issuance View */}
      {activeTab === 'individual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Issuance Form */}
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            {/* Template Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.issuance.selectTemplate}
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {lang === 'ar' ? tpl.titleAr || tpl.title : tpl.title}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleIssueIndividual} className="space-y-4">
              {/* Recipient English Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.issuance.recipientName} *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Alex Montgomery"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Recipient Arabic Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.issuance.recipientNameAr}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={recipientNameAr}
                  onChange={(e) => setRecipientNameAr(e.target.value)}
                  placeholder="مثال: سارة المنصور"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-cairo focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Recipient Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.issuance.recipientEmail} *
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@company.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Certificate Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.issuance.certificateTitle}
                </label>
                <input
                  type="text"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Achievement Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.issuance.description}
                </label>
                <textarea
                  rows={3}
                  value={certDescription}
                  onChange={(e) => setCertDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Signatory Details & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {t.issuance.issuerName}
                  </label>
                  <input
                    type="text"
                    value={issuerName}
                    onChange={(e) => setIssuerName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {t.issuance.issueDate}
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-100"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? t.issuance.issuing : t.issuance.issueBtn}
              </button>
            </form>
          </div>

          {/* Real-Time Certificate Preview & Post-Issuance Actions */}
          <div className="lg:col-span-7 space-y-4">
            {/* Post-Issuance Banner if issued */}
            {issuedCertificate && (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-emerald-300">
                      {t.issuance.successTitle}
                    </h3>
                    <p className="text-[11px] text-emerald-200/80">
                      Certificate ID:{' '}
                      <span className="font-mono font-bold text-white">
                        {issuedCertificate.id}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(issuedCertificate.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    {copiedLink ? t.common.copied : t.common.copyLink}
                  </button>

                  <button
                    onClick={onNavigateToRegistry}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1"
                  >
                    {t.issuance.viewCert}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Live Visual Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  {t.common.preview}
                </span>
                <span className="text-[11px] text-slate-500">
                  {selectedTemplate?.title}
                </span>
              </div>

              <div className="py-4 flex justify-center w-full overflow-x-auto">
                <div className="scale-[0.52] sm:scale-[0.62] origin-top">
                  <CertificateRenderer
                    innerRef={previewCertRef}
                    template={selectedTemplate}
                    recipientName={recipientName}
                    recipientNameAr={recipientNameAr}
                    titleOverride={certTitle}
                    descriptionOverride={certDescription}
                    issueDateOverride={issueDate}
                    certificateId={issuedCertificate?.id || 'HCK-2026-PREVIEW-ID'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Bulk CSV Issuance View */
        <div className="space-y-6">
          {/* Template selection & Sample CSV download */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.issuance.selectTemplate}
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {lang === 'ar' ? tpl.titleAr || tpl.title : tpl.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDownloadSampleCsv}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              {t.issuance.downloadCsvSample}
            </button>
          </div>

          {/* Drag & Drop CSV Uploader */}
          <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-900/40 cursor-pointer transition-all">
            <UploadCloud className="w-10 h-10 text-indigo-400" />
            <div className="text-center">
              <span className="text-sm font-semibold text-slate-200">
                {t.issuance.bulkUploadTitle}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                {t.issuance.bulkUploadDesc}
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileUpload}
              className="hidden"
            />
          </label>

          {/* Column Mapping Section if headers loaded */}
          {csvHeaders.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {t.issuance.mappingTitle}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {t.issuance.colName} *
                  </label>
                  <select
                    value={colName}
                    onChange={(e) =>
                      handleMappingChange(e.target.value, colEmail, colNameAr)
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="">Select Column...</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {t.issuance.colEmail} *
                  </label>
                  <select
                    value={colEmail}
                    onChange={(e) =>
                      handleMappingChange(colName, e.target.value, colNameAr)
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="">Select Column...</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {t.issuance.colNameAr}
                  </label>
                  <select
                    value={colNameAr}
                    onChange={(e) =>
                      handleMappingChange(colName, colEmail, e.target.value)
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="">(Optional) Select Arabic Column...</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Summary Stats */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{t.issuance.totalRows}:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {parsedRows.length}
                  </span>
                </div>
                <div className="h-3 w-[1px] bg-slate-700" />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{t.issuance.validRows}:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {parsedRows.filter((r) => r.isValid).length}
                  </span>
                </div>
                <div className="h-3 w-[1px] bg-slate-700" />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{t.issuance.invalidRows}:</span>
                  <span className="font-mono font-bold text-rose-400">
                    {parsedRows.filter((r) => !r.isValid).length}
                  </span>
                </div>
                <div className="h-3 w-[1px] bg-slate-700" />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{t.issuance.duplicateWarnings}:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {parsedRows.filter((r) => r.isDuplicateCandidate).length}
                  </span>
                </div>
              </div>

              {/* Validation Preview Table */}
              <div className="border border-slate-800 rounded-lg overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700 text-[11px]">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Recipient Name</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Arabic Name</th>
                      <th className="py-2 px-3">Status / Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {parsedRows.slice(0, 15).map((row) => (
                      <tr key={row.rowNumber} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono text-slate-500">
                          {row.rowNumber}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-100">
                          {row.recipientName || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {row.recipientEmail || '—'}
                        </td>
                        <td className="py-2 px-3 font-cairo">
                          {row.recipientNameAr || '—'}
                        </td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {row.errors.join(', ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Batch Action Button */}
              <div className="flex items-center justify-between pt-2">
                {batchSuccessCount !== null ? (
                  <div className="text-xs text-emerald-400 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {batchSuccessCount} {t.issuance.batchSuccess}
                  </div>
                ) : (
                  <div />
                )}

                <button
                  onClick={handleProcessBatch}
                  disabled={
                    isProcessingBatch ||
                    parsedRows.filter((r) => r.isValid).length === 0
                  }
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isProcessingBatch
                    ? t.issuance.batchProcessing
                    : `${t.issuance.startBatch} (${
                        parsedRows.filter((r) => r.isValid).length
                      })`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
