import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, ImageIcon, Code, FileDigit, CheckCircle2, Loader2, Search, X, Database, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import CameraScanner from '../components/CameraScanner';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import { useToast } from '../context/ToastContext';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null); // 'parsing', 'embedding', 'indexing', 'complete'
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useRef(null);
  const { success, error, info } = useToast();

  const [manualMode, setManualMode] = useState(false);
  const [manualData, setManualData] = useState({ content: '', title: '', tags: '', source: '' });

  const formats = [
    {
      name: 'PDF Documents',
      icon: FileDigit,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      accept: '.pdf',
      extensions: ['pdf']
    },
    {
      name: 'Images',
      icon: ImageIcon,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      accept: 'image/*',
      extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']
    },
    {
      name: 'JSON Data',
      icon: Code,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      accept: '.json',
      extensions: ['json']
    },
    {
      name: 'Camera Scanner',
      icon: Camera,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      isCamera: true
    },
    {
      name: 'Plain Text',
      icon: FileText,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      isManual: true
    },
  ];

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFiles = (incomingFiles) => {
    if (!selectedFormat || selectedFormat.isManual) return incomingFiles;

    return incomingFiles.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      const isValid = selectedFormat.extensions.includes(ext) ||
        (selectedFormat.accept.includes('/') && file.type.startsWith(selectedFormat.accept.replace('/*', '')));

      if (!isValid) {
        error(`File "${file.name}" is not a valid ${selectedFormat.name} format.`);
      }
      return isValid;
    });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(droppedFiles);
    setFiles(prev => [...prev, ...validFiles]);
  }, [selectedFormat, error]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = validateFiles(selectedFiles);
    setFiles(prev => [...prev, ...validFiles]);
    // Reset input so the same file can be selected again if removed
    e.target.value = '';
  };

  const handleUpload = async (uploadFiles, isManual = false) => {
    if (!isManual && uploadFiles.length === 0) return;
    if (isManual && !manualData.content.trim()) return;

    setIsProcessing(true);
    setStatus('parsing');
    setProgress(10);

    try {
      let payload;
      const tagsArray = manualData.tags.trim()
        ? manualData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined;

      if (isManual) {
        payload = {
          documents: [{
            content: manualData.content.trim(),
            metadata: {
              title: manualData.title.trim() || undefined,
              tags: tagsArray,
              source: manualData.source.trim() || undefined,
              fileType: 'text'
            }
          }]
        };
      } else {
        // Process files based on type
        const rawDocuments = [];
        const totalFiles = uploadFiles.length;

        for (let i = 0; i < totalFiles; i++) {
          const file = uploadFiles[i];
          const extension = file.name.split('.').pop().toLowerCase();
          const isImage = ['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(extension);

          let content = '';
          if (isImage) {
            info(`Scanning image ${i + 1}/${totalFiles}: ${file.name}...`);
            const { data: { text } } = await Tesseract.recognize(file, 'eng');
            content = text;
          } else if (extension === 'pdf') {
            info(`Extracting text from PDF ${i + 1}/${totalFiles}: ${file.name}...`);
            try {
              const arrayBuffer = await file.arrayBuffer();
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              let fullText = '';
              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
              }
              content = fullText;
            } catch (pdfErr) {
              console.error('PDF Extraction Error:', pdfErr);
              throw new Error(`Failed to extract text from PDF: ${file.name}`);
            }
          } else {
            // Default to text reading for others (JSON, TXT, etc)
            content = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = reject;
              reader.readAsText(file);
            });
          }

          if (content.trim()) {
            rawDocuments.push({
              content: content.trim(),
              metadata: {
                title: file.name,
                tags: tagsArray,
                source: manualData.source.trim() || undefined,
                fileType: extension
              }
            });
          }
          setProgress(10 + Math.floor((40 * (i + 1)) / totalFiles));
        }

        if (rawDocuments.length === 0) {
          throw new Error('No readable text found in the selected files.');
        }

        // Client-side chunking for very large documents
        const MAX_CHUNK_SIZE = 8_000_000;
        const documents = [];

        for (const doc of rawDocuments) {
          if (doc.content.length > MAX_CHUNK_SIZE) {
            let offset = 0;
            let part = 1;
            while (offset < doc.content.length) {
              const chunkContent = doc.content.slice(offset, offset + MAX_CHUNK_SIZE);
              documents.push({
                content: chunkContent,
                metadata: {
                  ...doc.metadata,
                  title: `${doc.metadata.title} (Part ${part})`
                }
              });
              offset += MAX_CHUNK_SIZE;
              part++;
            }
          } else {
            documents.push(doc);
          }
        }
        payload = { documents };
      }

      setStatus('embedding');
      setProgress(60);

      const token = localStorage.getItem('auth_token');
      const res = await fetch('/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Ingestion failed');
      }

      setStatus('complete');
      setProgress(100);
      setIsProcessing(false);
      success('Knowledge indexed successfully!');
    } catch (err) {
      console.error(err);
      setStatus(null);
      setIsProcessing(false);
      error('Failed to upload: ' + err.message);
    }
  };

  const handleFormatClick = (format) => {
    setSelectedFormat(format);
    if (format.isManual) {
      setManualMode(true);
      setFiles([]);
      setShowScanner(false);
    } else if (format.isCamera) {
      setShowScanner(true);
      setManualMode(false);
      setFiles([]);
    } else {
      setManualMode(false);
      setShowScanner(false);
      // Small timeout to ensure state is updated if we need it (though here we use input accept)
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 0);
    }
  };

  const handleScanComplete = (text) => {
    setManualData(prev => ({ ...prev, content: text }));
    setManualMode(true);
    setShowScanner(false);
    setSelectedFormat(formats.find(f => f.isManual));
  };

  const reset = () => {
    setFiles([]);
    setIsProcessing(false);
    setProgress(0);
    setStatus(null);
    setManualMode(false);
    setSelectedFormat(null);
    setManualData({ content: '', title: '', tags: '', source: '' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in text-center transition-colors duration-300">
      {/* Header section */}
      <section className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Index Your <span className="text-indigo-600 dark:text-indigo-400">Knowledge</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg font-medium">
          Upload documents to enable AI-powered semantic search across your MongoDB collections.
          We handle the chunking, embedding, and storage.
        </p>
      </section>

      {/* Format Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {formats.map((f) => (
          <button
            key={f.name}
            onClick={() => handleFormatClick(f)}
            className={`p-6 rounded-[2rem] border transition-all group flex flex-col items-center gap-4 ${(f.isManual && manualMode) || (selectedFormat?.name === f.name)
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-left scale-[1.02] shadow-indigo-100 dark:shadow-none'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm dark:shadow-none border-b-4 hover:border-b-indigo-500'
              } transition-all`}
          >
            <div className={`p-4 rounded-2xl ${f.bg} group-hover:scale-110 transition-transform shadow-inner`}>
              <f.icon className={`h-7 w-7 ${f.color}`} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedFormat?.name === f.name ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{f.name}</span>
          </button>
        ))}
      </div>

      {/* Manual Content Entry */}
      {manualMode && !isProcessing && status !== 'complete' && (
        <div className="p-8 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md space-y-8 text-left animate-fade-in shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <FileText className="h-6 w-6 text-emerald-500" />
              Manual Knowledge Entry
            </h3>
            <button onClick={() => setManualMode(false)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">DOCUMENT CONTENT *</label>
              <textarea
                value={manualData.content}
                onChange={(e) => setManualData({ ...manualData, content: e.target.value })}
                placeholder="Paste or type the full text here..."
                className="w-full h-64 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2rem] px-6 py-5 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm leading-relaxed font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">TITLE (OPTIONAL)</label>
                <input
                  type="text"
                  value={manualData.title}
                  onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                  placeholder="Doc name"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">TAGS (COMMA SEP)</label>
                <input
                  type="text"
                  value={manualData.tags}
                  onChange={(e) => setManualData({ ...manualData, tags: e.target.value })}
                  placeholder="ai, deep learning"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">SOURCE URL</label>
                <input
                  type="text"
                  value={manualData.source}
                  onChange={(e) => setManualData({ ...manualData, source: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                />
              </div>
            </div>

            <button
              onClick={() => handleUpload(null, true)}
              disabled={!manualData.content.trim()}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
            >
              Index This Document
            </button>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {!manualMode && !isProcessing && status !== 'complete' && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative group cursor-pointer border-4 border-dashed rounded-[3rem] p-16 transition-all duration-300 ${isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.02]'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/10 hover:border-indigo-400 dark:hover:border-slate-700 shadow-sm dark:shadow-none'
            }`}
        >
          <input
            type="file"
            multiple
            ref={fileInputRef}
            accept={selectedFormat?.accept}
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-6">
            <div className="h-20 w-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Upload className="h-10 w-10" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {selectedFormat ? `Upload ${selectedFormat.name}` : 'Drop files to index'}
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                {selectedFormat
                  ? `Drag and drop your ${selectedFormat.extensions?.join(', ')} files here`
                  : 'PDF, Images, or JSON Data'
                }
              </p>
            </div>
            <button className="mt-4 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
              Select Files
            </button>
          </div>
        </div>
      )}

      {/* Selected Files Preview & Metadata */}
      {!manualMode && files.length > 0 && !isProcessing && status !== 'complete' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-left shadow-sm dark:shadow-none">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">SELECTED FILES</h3>
            <div className="space-y-3">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{file.name}</span>
                  </div>
                  <button onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md space-y-8 text-left shadow-sm dark:shadow-none">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Database className="h-6 w-6 text-indigo-500" />
              Index Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">BATCH TITLE</label>
                <input
                  type="text"
                  value={manualData.title}
                  onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                  placeholder="e.g. Q4 Reports"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">TAGS (COMMA SEP)</label>
                <input
                  type="text"
                  value={manualData.tags}
                  onChange={(e) => setManualData({ ...manualData, tags: e.target.value })}
                  placeholder="finance, internal"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">SOURCE URL</label>
                <input
                  type="text"
                  value={manualData.source}
                  onChange={(e) => setManualData({ ...manualData, source: e.target.value })}
                  placeholder="https://docs.acme.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                />
              </div>
            </div>
            <button
              onClick={() => handleUpload(files)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
            >
              Start Ingestion ({files.length} Files)
            </button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md space-y-8 text-left shadow-sm dark:shadow-none animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {manualMode ? 'Ingesting manual entry...' : `Processing ${files.length} documents`}
                </h3>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Please stay on this page</p>
              </div>
            </div>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{progress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-1 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'PARSING', active: progress >= 25, complete: progress > 25 },
              { label: 'EMBEDDING', active: progress >= 60, complete: progress > 60 },
              { label: 'INDEXING', active: progress >= 85, complete: progress > 85 },
            ].map((step) => (
              <div key={step.label} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full flex items-center justify-center border ${step.complete ? 'bg-indigo-500 border-indigo-500 text-white' :
                    step.active ? 'border-indigo-500 text-indigo-500 animate-pulse' :
                      'border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-700'
                    }`}>
                    {step.complete && <CheckCircle2 className="h-3 w-3" />}
                    {!step.complete && step.active && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                  </div>
                  <span className={`text-[10px] font-black tracking-widest ${step.active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'
                    }`}>{step.label}</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate ml-6">
                  {step.label === 'PARSING' ? 'Content extracted' :
                    step.label === 'EMBEDDING' ? 'Generating vectors...' :
                      'Saving to MongoDB'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success State */}
      {status === 'complete' && (
        <div className="p-1.5 rounded-[3rem] bg-indigo-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-teal-500 shadow-2xl shadow-indigo-600/20 dark:shadow-emerald-500/20">
          <div className="bg-white dark:bg-slate-950 rounded-[2.8rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-6 text-left">
              <div className="h-20 w-20 rounded-[2.5rem] bg-indigo-50 dark:bg-emerald-500/10 flex items-center justify-center text-indigo-600 dark:text-emerald-500 shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Indexing Complete!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-lg">Your data is now fully searchable in the knowledge index.</p>
              </div>
            </div>
            <div className="flex gap-4 shrink-0">
              <button onClick={reset} className="px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                Add More
              </button>
              <Link to="/search" className="px-8 py-4 rounded-2xl bg-indigo-600 dark:bg-emerald-500 hover:bg-indigo-500 dark:hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/20 dark:shadow-emerald-500/20 hover:scale-[1.02] active:scale-95">
                Search Now
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* Camera Scanner Modal */}
      {showScanner && (
        <CameraScanner
          onScanComplete={handleScanComplete}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

