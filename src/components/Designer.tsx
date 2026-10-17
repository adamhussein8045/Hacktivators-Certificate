import React, { useState, useRef } from 'react';
import {
  CertificateTemplate,
  CertificateElement,
  ElementType,
  TemplateOrientation,
  TemplateBorder,
  TemplateBackground,
  Language,
} from '../types';
import { CertificateRenderer } from './CertificateRenderer';
import { exportElementToPdf, exportElementToPng } from '../utils/exportEngine';
import { translations } from '../i18n/translations';
import {
  Type,
  Maximize2,
  Trash2,
  Download,
  Save,
  Eye,
  Plus,
  QrCode,
  Image as ImageIcon,
  Check,
  ZoomIn,
  ZoomOut,
  Layers,
  Sparkles,
  Upload,
} from 'lucide-react';

interface DesignerProps {
  currentOrgId: string;
  lang: Language;
  templates: CertificateTemplate[];
  onSaveTemplate: (template: CertificateTemplate) => void;
}

export const Designer: React.FC<DesignerProps> = ({
  currentOrgId,
  lang,
  templates,
  onSaveTemplate,
}) => {
  const t = translations[lang];

  // Active template being edited
  const [activeTemplate, setActiveTemplate] = useState<CertificateTemplate>(() => {
    return templates[0] || {
      id: `tpl-${Date.now()}`,
      orgId: currentOrgId,
      title: 'New Certificate Template',
      titleAr: 'قالب شهادة جديد',
      description: 'Official credential issued for outstanding achievement.',
      version: 1,
      orientation: 'landscape',
      backgroundColor: 'cream_parchment',
      borderColor: '#D4AF37',
      accentColor: '#B45309',
      borderStyle: 'classic_gold',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      elements: [],
    };
  });

  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    activeTemplate.elements[0]?.id || null
  );
  const [zoomScale, setZoomScale] = useState<number>(0.72);
  const [previewLanguage, setPreviewLanguage] = useState<Language>(lang);
  const [isExporting, setIsExporting] = useState<'pdf' | 'png' | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const selectedElement = activeTemplate.elements.find(
    (el) => el.id === selectedElementId
  );

  // Switch template
  const handleSelectTemplate = (templateId: string) => {
    const found = templates.find((tpl) => tpl.id === templateId);
    if (found) {
      setActiveTemplate(JSON.parse(JSON.stringify(found)));
      setSelectedElementId(found.elements[0]?.id || null);
    }
  };

  // Add new element
  const handleAddElement = (type: ElementType) => {
    const newId = `el-${Date.now()}`;
    let newElement: CertificateElement = {
      id: newId,
      type,
      text: type === 'custom_text' ? 'Sample Text' : t.designer.elementsList[type],
      x: 50,
      y: 50,
      fontSize: 16,
      fontFamily: lang === 'ar' ? 'Cairo' : 'Plus Jakarta Sans',
      fontWeight: '600',
      color: '#0F172A',
      textAlign: 'center',
      visible: true,
    };

    if (type === 'qr_code') {
      newElement.width = 14;
      newElement.height = 14;
      newElement.x = 80;
      newElement.y = 80;
    } else if (type === 'recipient') {
      newElement.fontSize = 32;
      newElement.text = previewLanguage === 'ar' ? 'محمد بن عبد الله الزهراني' : 'Alex R. Montgomery';
      newElement.fontFamily = previewLanguage === 'ar' ? 'Amiri' : 'Playfair Display';
      newElement.fontWeight = 'bold';
      newElement.y = 48;
    } else if (type === 'title') {
      newElement.fontSize = 34;
      newElement.text = previewLanguage === 'ar' ? 'شهادة إتمام معتمدة' : 'Certificate of Achievement';
      newElement.fontWeight = 'bold';
      newElement.y = 28;
    }

    setActiveTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setSelectedElementId(newId);
  };

  // Update selected element property
  const handleUpdateSelected = (patch: Partial<CertificateElement>) => {
    if (!selectedElementId) return;
    setActiveTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === selectedElementId ? { ...el, ...patch } : el
      ),
    }));
  };

  // Update position
  const handleUpdatePosition = (elementId: string, x: number, y: number) => {
    setActiveTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === elementId ? { ...el, x, y } : el
      ),
    }));
  };

  // Delete element
  const handleDeleteElement = (elementId: string) => {
    setActiveTemplate((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== elementId),
    }));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  // Handle image uploads (Logo / Signature)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, or SVG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      const elementId = `el-${type}-${Date.now()}`;
      const newElement: CertificateElement = {
        id: elementId,
        type,
        src: dataUrl,
        x: type === 'logo' ? 50 : 25,
        y: type === 'logo' ? 14 : 75,
        fontSize: 12,
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'center',
        visible: true,
      };

      setActiveTemplate((prev) => ({
        ...prev,
        elements: [...prev.elements, newElement],
      }));
      setSelectedElementId(elementId);
    };
    reader.readAsDataURL(file);
  };

  // Save template
  const handleSave = () => {
    const updated: CertificateTemplate = {
      ...activeTemplate,
      version: activeTemplate.version + 1,
      updatedAt: new Date().toISOString(),
    };
    onSaveTemplate(updated);
    setActiveTemplate(updated);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Export tests
  const handleExportPng = async () => {
    if (!printRef.current) return;
    try {
      setIsExporting('png');
      await exportElementToPng(printRef.current, {
        fileName: `${activeTemplate.title.toLowerCase().replace(/\s+/g, '-')}-preview.png`,
        scale: 2.5,
      });
    } catch (err) {
      console.error('PNG export failed', err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!printRef.current) return;
    try {
      setIsExporting('pdf');
      await exportElementToPdf(printRef.current, {
        fileName: `${activeTemplate.title.toLowerCase().replace(/\s+/g, '-')}-preview.pdf`,
        orientation: activeTemplate.orientation,
        scale: 2.5,
      });
    } catch (err) {
      console.error('PDF export failed', err);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] bg-slate-950 text-slate-100">
      {/* Top Studio Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">{t.common.org}:</span>
            <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded">
              Hacktivators Team
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Template Selector */}
          <select
            value={activeTemplate.id}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {lang === 'ar' ? tpl.titleAr || tpl.title : tpl.title} (v{tpl.version})
              </option>
            ))}
          </select>
        </div>

        {/* Center: Language preview switch & Zoom */}
        <div className="flex items-center gap-3">
          {/* Bilingual Preview Switch */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setPreviewLanguage('en')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                previewLanguage === 'en'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English Preview
            </button>
            <button
              onClick={() => setPreviewLanguage('ar')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                previewLanguage === 'ar'
                  ? 'bg-indigo-600 text-white font-cairo'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              معاينة بالعربية
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setZoomScale((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
              className="p-1 hover:text-indigo-400"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-mono tabular-nums text-slate-300">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((z) => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
              className="p-1 hover:text-indigo-400"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Actions: Save & Export */}
        <div className="flex items-center gap-2">
          {saveSuccessMsg && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fade-in">
              <Check className="w-3.5 h-3.5" /> {t.designer.savedSuccess}
            </span>
          )}

          <button
            onClick={handleExportPdf}
            disabled={isExporting !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            {isExporting === 'pdf' ? t.common.loading : 'Export PDF'}
          </button>

          <button
            onClick={handleExportPng}
            disabled={isExporting !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            {isExporting === 'png' ? t.common.loading : 'Export PNG'}
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {t.designer.saveTemplate} (v{activeTemplate.version})
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: Sidebar + Central Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar / Element Inspector */}
        <div className="w-80 border-r border-slate-800 bg-slate-900/60 overflow-y-auto flex flex-col p-4 gap-5">
          {/* Page & Frame Settings */}
          <div className="space-y-3 pb-4 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              {t.designer.pageSettings}
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {t.common.orientation}
                </label>
                <select
                  value={activeTemplate.orientation}
                  onChange={(e) =>
                    setActiveTemplate((prev) => ({
                      ...prev,
                      orientation: e.target.value as TemplateOrientation,
                    }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200"
                >
                  <option value="landscape">{t.common.landscape}</option>
                  <option value="portrait">{t.common.portrait}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {t.designer.background}
                </label>
                <select
                  value={activeTemplate.backgroundColor}
                  onChange={(e) =>
                    setActiveTemplate((prev) => ({
                      ...prev,
                      backgroundColor: e.target.value as TemplateBackground,
                    }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200"
                >
                  <option value="cream_parchment">Parchment</option>
                  <option value="clean_white">Clean White</option>
                  <option value="dark_slate">Dark Slate</option>
                  <option value="royal_navy">Royal Navy</option>
                  <option value="soft_emerald">Soft Emerald</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {t.designer.borderStyle}
              </label>
              <select
                value={activeTemplate.borderStyle}
                onChange={(e) =>
                  setActiveTemplate((prev) => ({
                    ...prev,
                    borderStyle: e.target.value as TemplateBorder,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="classic_gold">{t.designer.borders.classic_gold}</option>
                <option value="cyber_tech">{t.designer.borders.cyber_tech}</option>
                <option value="arabic_geometric">{t.designer.borders.arabic_geometric}</option>
                <option value="ornate_diploma">{t.designer.borders.ornate_diploma}</option>
                <option value="modern_minimal">{t.designer.borders.modern_minimal}</option>
                <option value="none">{t.designer.borders.none}</option>
              </select>
            </div>
          </div>

          {/* Add Elements Quick Palette */}
          <div className="space-y-3 pb-4 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              {t.designer.addElement}
            </h3>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleAddElement('title')}
                className="px-2.5 py-1.5 text-left bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs rounded border border-slate-700/80 transition-colors"
              >
                + Certificate Title
              </button>
              <button
                onClick={() => handleAddElement('recipient')}
                className="px-2.5 py-1.5 text-left bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs rounded border border-slate-700/80 transition-colors"
              >
                + Recipient Name
              </button>
              <button
                onClick={() => handleAddElement('description')}
                className="px-2.5 py-1.5 text-left bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs rounded border border-slate-700/80 transition-colors"
              >
                + Achievement Text
              </button>
              <button
                onClick={() => handleAddElement('org_name')}
                className="px-2.5 py-1.5 text-left bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs rounded border border-slate-700/80 transition-colors"
              >
                + Organization
              </button>
              <button
                onClick={() => handleAddElement('issuer_name')}
                className="px-2.5 py-1.5 text-left bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs rounded border border-slate-700/80 transition-colors"
              >
                + Signatory Name
              </button>
              <button
                onClick={() => handleAddElement('qr_code')}
                className="px-2.5 py-1.5 text-left bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs rounded border border-slate-700/80 transition-colors flex items-center gap-1"
              >
                <QrCode className="w-3 h-3 text-indigo-400" /> + QR Code
              </button>
              <button
                onClick={() => handleAddElement('badge')}
                className="px-2.5 py-1.5 text-left bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs rounded border border-slate-700/80 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-400" /> + Official Seal
              </button>
              <button
                onClick={() => handleAddElement('custom_text')}
                className="px-2.5 py-1.5 text-left bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs rounded border border-slate-700/80 transition-colors"
              >
                + Custom Text
              </button>
            </div>

            {/* Upload Logo and Signature */}
            <div className="pt-2 flex flex-col gap-2">
              <label className="flex items-center justify-between p-2 rounded-lg border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/40 cursor-pointer text-xs text-slate-300">
                <span className="flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  {t.designer.uploadLogo}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  className="hidden"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/40 cursor-pointer text-xs text-slate-300">
                <span className="flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  {t.designer.uploadSignature}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'signature')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Selected Element Property Inspector */}
          {selectedElement ? (
            <div className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Type className="w-3.5 h-3.5" />
                  Inspector: {selectedElement.type}
                </h3>
                <button
                  onClick={() => handleDeleteElement(selectedElement.id)}
                  className="text-rose-400 hover:text-rose-300 p-1"
                  title="Remove Element"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text input */}
              {selectedElement.type !== 'qr_code' &&
                selectedElement.type !== 'logo' &&
                selectedElement.type !== 'signature' && (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Text Value
                    </label>
                    <textarea
                      rows={2}
                      value={selectedElement.text || ''}
                      onChange={(e) => handleUpdateSelected({ text: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-xs text-slate-100"
                    />
                  </div>
                )}

              {/* Font Family */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {t.designer.fontFamily}
                </label>
                <select
                  value={selectedElement.fontFamily}
                  onChange={(e) => handleUpdateSelected({ fontFamily: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200"
                >
                  <optgroup label="Arabic Typography">
                    <option value="Cairo">Cairo (العصرية)</option>
                    <option value="Amiri">Amiri (الخط الأميري التراثي)</option>
                    <option value="Alexandria">Alexandria (الإسكندرية الهندسي)</option>
                  </optgroup>
                  <optgroup label="Latin Typography">
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Clean Modern)</option>
                    <option value="Playfair Display">Playfair Display (Editorial Serif)</option>
                    <option value="Cinzel">Cinzel (Classical Luxury)</option>
                  </optgroup>
                </select>
              </div>

              {/* Font Size & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    {t.designer.fontSize} ({selectedElement.fontSize}px)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="64"
                    value={selectedElement.fontSize}
                    onChange={(e) =>
                      handleUpdateSelected({ fontSize: Number(e.target.value) })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    {t.designer.fontWeight}
                  </label>
                  <select
                    value={selectedElement.fontWeight}
                    onChange={(e) =>
                      handleUpdateSelected({
                        fontWeight: e.target.value as CertificateElement['fontWeight'],
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200"
                  >
                    <option value="normal">Normal</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">SemiBold (600)</option>
                    <option value="bold">Bold (700)</option>
                    <option value="800">ExtraBold (800)</option>
                  </select>
                </div>
              </div>

              {/* Alignment & Color */}
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    {t.designer.textAlign}
                  </label>
                  <div className="flex bg-slate-800 rounded border border-slate-700 p-0.5">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => handleUpdateSelected({ textAlign: align })}
                        className={`flex-1 py-1 text-[10px] font-medium rounded capitalize ${
                          selectedElement.textAlign === align
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    {t.designer.textColor}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedElement.color}
                      onChange={(e) => handleUpdateSelected({ color: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                    />
                    <span className="font-mono text-xs text-slate-300">
                      {selectedElement.color}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-400 text-[11px]">
                <div className="flex items-center justify-between bg-slate-800/60 p-1.5 rounded">
                  <span>X Position:</span>
                  <span className="font-mono text-slate-200">{selectedElement.x}%</span>
                </div>
                <div className="flex items-center justify-between bg-slate-800/60 p-1.5 rounded">
                  <span>Y Position:</span>
                  <span className="font-mono text-slate-200">{selectedElement.y}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              Click any element on canvas to inspect and edit its style.
            </div>
          )}

          {/* Layers List */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {t.designer.elements} ({activeTemplate.elements.length})
            </h4>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
              {activeTemplate.elements.map((el) => (
                <button
                  key={el.id}
                  onClick={() => setSelectedElementId(el.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded text-left transition-colors ${
                    selectedElementId === el.id
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                      : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate max-w-[170px] capitalize">
                    {el.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {el.x}%, {el.y}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Central Visual Canvas Surface */}
        <div className="flex-1 bg-slate-950 p-6 overflow-auto flex items-center justify-center relative">
          <div className="relative p-4 transition-all">
            <CertificateRenderer
              innerRef={printRef}
              template={activeTemplate}
              selectedElementId={selectedElementId}
              onSelectElement={(id) => setSelectedElementId(id)}
              onUpdateElementPosition={handleUpdatePosition}
              isInteractive={true}
              scale={zoomScale}
              previewLang={previewLanguage}
              certificateId="HCK-2026-STUDIO-DEMO"
            />
          </div>

          {/* Floating Canvas Guide */}
          <div className="absolute bottom-4 left-6 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] text-slate-400 pointer-events-none backdrop-blur">
            {t.designer.dragHint}
          </div>
        </div>
      </div>
    </div>
  );
};
