'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { invoicesApi } from '@/lib/api';

type FileStatus = 'queued' | 'uploading' | 'extracting' | 'done' | 'error';

interface FileItem {
  file: File;
  name: string;
  size: string;
  status: FileStatus;
  invoiceId?: string;
  error?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter((f) => {
      const ok = f.type === 'application/pdf' || f.type.startsWith('image/');
      return ok;
    });

    setFiles((prev) => {
      const combined = [...prev, ...valid.map((f) => ({
        file: f,
        name: f.name,
        size: formatSize(f.size),
        status: 'queued' as FileStatus,
      }))].slice(0, 50);
      return combined;
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  async function uploadAll() {
    if (files.length === 0 || uploading) return;
    setUploading(true);

    const pending = files.filter((f) => f.status === 'queued');

    if (pending.length === 1) {
      // Single file: redirect to invoice detail
      const fileItem = pending[0];
      setFiles((prev) =>
        prev.map((f) => f.name === fileItem.name ? { ...f, status: 'extracting' } : f)
      );
      try {
        const base64 = await fileToBase64(fileItem.file);
        const res = await invoicesApi.upload({
          file_data: base64,
          file_name: fileItem.file.name,
          media_type: fileItem.file.type as 'application/pdf' | 'image/jpeg' | 'image/png',
        }) as { invoice_id: string };
        setFiles((prev) =>
          prev.map((f) => f.name === fileItem.name ? { ...f, status: 'done', invoiceId: res.invoice_id } : f)
        );
        router.push(`/app/invoices/${res.invoice_id}`);
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) => f.name === fileItem.name
            ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
            : f
          )
        );
        setUploading(false);
      }
      return;
    }

    // Batch: process 5 at a time
    const chunks: FileItem[][] = [];
    for (let i = 0; i < pending.length; i += 5) {
      chunks.push(pending.slice(i, i + 5));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (fileItem) => {
          setFiles((prev) =>
            prev.map((f) => f.name === fileItem.name ? { ...f, status: 'extracting' } : f)
          );
          try {
            const base64 = await fileToBase64(fileItem.file);
            const res = await invoicesApi.upload({
              file_data: base64,
              file_name: fileItem.file.name,
              media_type: fileItem.file.type as 'application/pdf' | 'image/jpeg' | 'image/png',
            }) as { invoice_id: string };
            setFiles((prev) =>
              prev.map((f) => f.name === fileItem.name ? { ...f, status: 'done', invoiceId: res.invoice_id } : f)
            );
          } catch (err) {
            setFiles((prev) =>
              prev.map((f) =>
                f.name === fileItem.name
                  ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Failed' }
                  : f
              )
            );
          }
        })
      );
    }
    setUploading(false);
  }

  const statusIcon = {
    queued: <span className="text-ark-text-faint">○</span>,
    uploading: <svg className="animate-spin h-4 w-4 text-ark-primary" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>,
    extracting: <svg className="animate-spin h-4 w-4 text-ark-accent" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>,
    done: <span className="text-ark-success text-sm">✓</span>,
    error: <span className="text-ark-danger text-sm">✕</span>,
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ark-text-primary">Upload Invoices</h1>
        <p className="text-ark-text-muted text-sm mt-1">
          Claude AI extracts every field automatically in under 3 seconds.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-ark-primary bg-ark-primary-muted shadow-glow-primary-sm'
            : 'border-ark-border hover:border-ark-border-bright hover:bg-ark-bg-elevated'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
        />
        <div className="text-4xl mb-3">📤</div>
        <h3 className="font-semibold text-ark-text-primary mb-1">
          {dragOver ? 'Drop to upload' : 'Drag & drop invoices here'}
        </h3>
        <p className="text-sm text-ark-text-muted mb-2">
          PDF, JPG, or PNG · up to 50 files
        </p>
        <span className="text-ark-primary text-sm font-medium">or click to browse</span>

        {files.length > 0 && (
          <div className="absolute top-3 right-3 bg-ark-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {files.length} / 50
          </div>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 bg-ark-bg-card border border-ark-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ark-border">
            <span className="text-sm font-semibold text-ark-text-primary">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setFiles([])}
                className="text-xs text-ark-text-faint hover:text-ark-text-muted transition-colors"
                disabled={uploading}
              >
                Clear
              </button>
              <button
                onClick={uploadAll}
                disabled={uploading || files.every((f) => f.status !== 'queued')}
                className="bg-ark-primary hover:bg-ark-primary-hover disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
              >
                {uploading ? 'Processing…' : 'Upload All'}
              </button>
            </div>
          </div>

          <div className="divide-y divide-ark-border max-h-80 overflow-y-auto">
            {files.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-3 hover:bg-ark-bg-elevated transition-colors"
              >
                <div className="flex-shrink-0 w-5 flex justify-center">
                  {statusIcon[f.status]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ark-text-primary truncate">{f.name}</div>
                  <div className="text-xs text-ark-text-faint">
                    {f.size} · {f.status === 'extracting' ? 'Claude extracting…' : f.status === 'error' ? f.error : f.status}
                  </div>
                </div>
                {f.status === 'done' && f.invoiceId && (
                  <a
                    href={`/app/invoices/${f.invoiceId}`}
                    className="text-xs text-ark-primary hover:underline flex-shrink-0"
                  >
                    Review →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
