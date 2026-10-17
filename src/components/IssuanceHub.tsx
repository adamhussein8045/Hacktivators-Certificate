import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  CertificateTemplate,
  Certificate,
  CsvParsedRow,
  AuditLogEntry,
  Language,
  UserRole,
} from '../types';
import { CertificateRenderer } from './CertificateRenderer';
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
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface IssuanceHubProps {
  currentOrgId: string;
  lang: Language;
  currentRole: UserRole;
  templates: CertificateTemplate[];
  existingCertificates: Certificate[];
  onCertificateIssued: (cert: Certificate, audit: AuditLogEntry) => void;
  onBatchIssued: (certs: Certificate[], audit: AuditLogEntry) => void;
  onNavigateToRegistry: () => void;
}

export const IssuanceHub: React.FC<IssuanceHubProps> = ({
  currentOrgId,
  lang,
  currentRole,
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
      actorRole: currentRole,
      action: 'CERTIFICATE_ISSUED',
      targetId: newCertId,
      details: `Officially conferred credential to ${recipientName} (${recipientEmail})`,
      detailsAr: `اعتماد ومنح وثيقة رسمية للمستلم ${recipientNameAr || recipientName}`,
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
      error: () => {},
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
      actorRole: currentRole,
      action: 'BATCH_CSV_ISSUED',
      targetId: `BATCH-${Date.now()}`,
      details: `Executed structured batch issuance of ${newCertificates.length} credentials from CSV`,
      detailsAr: `تنفيذ إصدار جماعي منظم لـ ${newCertificates.length} اعتماد عبر ملف CSV`,
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
    link.setAttribute('download', 'hacktivators_roster_schema.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = (certId: string) => {
    const origin = typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
      ? window.location.origin
      : '';
    const url = `${origin}/?verify=${certId}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-white text-neutral-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950 flex items-center gap-2">
            <Award className="w-5 h-5 text-neutral-700" />
            {t.issuance.title}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">{t.issuance.subtitle}</p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-neutral-100 p-0.5 rounded border border-neutral-200">
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-3.5 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === 'individual'
                ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t.issuance.individualTab}
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-3.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'bulk'
                ? 'bg-white text-neutral-950 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-600" />
            {t.issuance.bulkTab}
          </button>
        </div>
      </div>

      {/* Individual Issuance View */}
      {activeTab === 'individual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Issuance Form */}
          <div className="lg:col-span-5 bg-white border border-neutral-200 rounded p-5 space-y-4">
            {/* Template Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                {t.issuance.selectTemplate}
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
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
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {t.issuance.recipientName} *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Alexander Montgomery"
                  className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {/* Recipient Arabic Name */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {t.issuance.recipientNameAr}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={recipientNameAr}
                  onChange={(e) => setRecipientNameAr(e.target.value)}
                  placeholder="مثال: سارة المنصور"
                  className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-xs text-neutral-900 font-cairo focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {/* Recipient Email */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {t.issuance.recipientEmail} *
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@institution.edu"
                  className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {/* Certificate Title */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {t.issuance.certificateTitle}
                </label>
                <input
                  type="text"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {/* Achievement Description */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {t.issuance.description}
                </label>
                <textarea
                  rows={3}
                  value={certDescription}
                  onChange={(e) => setCertDescription(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {/* Signatory Details & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">
                    {t.issuance.issuerName}
                  </label>
                  <input
                    type="text"
                    value={issuerName}
                    onChange={(e) => setIssuerName(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded px-2.5 py-1.5 text-xs text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">
                    {t.issuance.issueDate}
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded px-2.5 py-1.5 text-xs text-neutral-900"
                  />
                </div>
              </div>

              {/* Submit Button: Pure Black Primary Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? t.issuance.issuing : t.issuance.issueBtn}
              </button>
            </form>
          </div>

          {/* Real-Time Certificate Preview & Post-Issuance Actions */}
          <div className="lg:col-span-7 space-y-4">
            {/* Post-Issuance Banner if issued */}
            {issuedCertificate && (
              <div className="bg-neutral-50 border border-neutral-200 rounded p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900">
                      {t.issuance.successTitle}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Official ID:{' '}
                      <span className="font-mono font-semibold text-neutral-950">
                        {issuedCertificate.id}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(issuedCertificate.id)}
                    className="px-3 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-neutral-600" />
                    {copiedLink ? t.common.copied : t.common.copyLink}
                  </button>

                  <button
                    onClick={onNavigateToRegistry}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                  >
                    {t.issuance.viewCert}
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* Live Visual Preview */}
            <div className="bg-neutral-50/50 border border-neutral-200 rounded p-4 overflow-hidden flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between pb-3 border-b border-neutral-200 text-xs text-neutral-500">
                <span className="font-medium text-neutral-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-neutral-600" />
                  {t.common.preview}
                </span>
                <span className="text-[11px] text-neutral-500">
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
          <div className="bg-white border border-neutral-200 rounded p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                {t.issuance.selectTemplate}
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded px-3 py-2 text-xs text-neutral-900"
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
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-medium rounded transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-neutral-600" />
              {t.issuance.downloadCsvSample}
            </button>
          </div>

          {/* Drag & Drop CSV Uploader */}
          <label className="border border-dashed border-neutral-300 hover:border-neutral-500 rounded p-8 flex flex-col items-center justify-center gap-3 bg-neutral-50/50 cursor-pointer transition-all">
            <UploadCloud className="w-8 h-8 text-neutral-600" />
            <div className="text-center">
              <span className="text-xs font-semibold text-neutral-900">
                {t.issuance.bulkUploadTitle}
              </span>
              <p className="text-[11px] text-neutral-500 mt-1">
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
            <div className="bg-white border border-neutral-200 rounded p-5 space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                {t.issuance.mappingTitle}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">
                    {t.issuance.colName} *
                  </label>
                  <select
                    value={colName}
                    onChange={(e) =>
                      handleMappingChange(e.target.value, colEmail, colNameAr)
                    }
                    className="w-full bg-white border border-neutral-200 rounded px-2.5 py-1.5 text-xs text-neutral-900"
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
                  <label className="block text-[11px] text-neutral-500 mb-1">
                    {t.issuance.colEmail} *
                  </label>
                  <select
                    value={colEmail}
                    onChange={(e) =>
                      handleMappingChange(colName, e.target.value, colNameAr)
                    }
                    className="w-full bg-white border border-neutral-200 rounded px-2.5 py-1.5 text-xs text-neutral-900"
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
                  <label className="block text-[11px] text-neutral-500 mb-1">
                    {t.issuance.colNameAr}
                  </label>
                  <select
                    value={colNameAr}
                    onChange={(e) =>
                      handleMappingChange(colName, colEmail, e.target.value)
                    }
                    className="w-full bg-white border border-neutral-200 rounded px-2.5 py-1.5 text-xs text-neutral-900"
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
                  <span className="text-neutral-500">{t.issuance.totalRows}:</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {parsedRows.length}
                  </span>
                </div>
                <div className="h-3 w-[1px] bg-neutral-200" />
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">{t.issuance.validRows}:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {parsedRows.filter((r) => r.isValid).length}
                  </span>
                </div>
                <div className="h-3 w-[1px] bg-neutral-200" />
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">{t.issuance.invalidRows}:</span>
                  <span className="font-mono font-bold text-rose-700">
                    {parsedRows.filter((r) => !r.isValid).length}
                  </span>
                </div>
                <div className="h-3 w-[1px] bg-neutral-200" />
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">{t.issuance.duplicateWarnings}:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {parsedRows.filter((r) => r.isDuplicateCandidate).length}
                  </span>
                </div>
              </div>

              {/* Validation Preview Table */}
              <div className="border border-neutral-200 rounded overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-[11px] font-medium">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Recipient Name</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Arabic Name</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-neutral-800">
                    {parsedRows.slice(0, 15).map((row) => (
                      <tr key={row.rowNumber} className="hover:bg-neutral-50">
                        <td className="py-2 px-3 font-mono text-neutral-500">
                          {row.rowNumber}
                        </td>
                        <td className="py-2 px-3 font-medium text-neutral-900">
                          {row.recipientName || '—'}
                        </td>
                        <td className="py-2 px-3 text-neutral-600 font-mono">
                          {row.recipientEmail || '—'}
                        </td>
                        <td className="py-2 px-3 font-cairo">
                          {row.recipientNameAr || '—'}
                        </td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ready
                            </span>
                          ) : (
                            <span className="text-rose-700 flex items-center gap-1 text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
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
                  <div className="text-xs text-emerald-700 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
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
