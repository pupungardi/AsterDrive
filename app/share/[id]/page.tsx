'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  HardDrive, 
  Download, 
  File, 
  Folder, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Archive, 
  Clock, 
  Computer, 
  CheckCircle2, 
  ArrowLeft,
  Share2,
  Sparkles
} from 'lucide-react';
import { getFileBlob } from '@/lib/db';

interface DriveItem {
  id: string;
  parentId: string;
  name: string;
  type: 'folder' | 'document' | 'image' | 'video' | 'spreadsheet' | 'archive';
  size?: number;
  updatedAt: string;
  owner: string;
  starred?: boolean;
  trashed?: boolean;
  source?: 'drive' | 'computer';
  videoUrl?: string;
  computerDevice?: string;
  folderPath?: string;
}

const STORAGE_KEY = 'asterdrive_real_items_v2';

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDateSafe(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return 'Recently';
  }
}

export default function SharedFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<DriveItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: DriveItem[] = JSON.parse(saved);
          const found = parsed.find(i => i.id === id);
          if (found) {
            setItem(found);
            // Load preview if media
            if (found.type === 'video') {
              getFileBlob(found.id).then(blob => {
                if (blob) setVideoUrl(URL.createObjectURL(blob));
                else if (found.videoUrl) setVideoUrl(found.videoUrl);
              });
            } else if (found.type === 'image') {
              getFileBlob(found.id).then(blob => {
                if (blob) setImageUrl(URL.createObjectURL(blob));
              });
            }
          }
        }
      } catch (err) {
        console.warn('Error loading shared item', err);
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [id]);

  const handleDownload = async () => {
    if (!item) return;
    setDownloading(true);
    try {
      const blob = await getFileBlob(item.id);
      let downloadBlob = blob;
      if (!downloadBlob) {
        downloadBlob = new Blob([
          `AsterDrive Shared File\nFile: ${item.name}\nSize: ${formatBytes(item.size)}\nOwner: ${item.owner}\nTimestamp: ${item.updatedAt}`
        ], { type: 'text/plain;charset=utf-8' });
      }
      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setDownloading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="w-12 h-12 text-amber-500" />;
      case 'image': return <ImageIcon className="w-12 h-12 text-blue-500" />;
      case 'video': return <Video className="w-12 h-12 text-purple-600" />;
      case 'archive': return <Archive className="w-12 h-12 text-rose-500" />;
      case 'spreadsheet': return <FileText className="w-12 h-12 text-emerald-600" />;
      default: return <File className="w-12 h-12 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <HardDrive className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">AsterDrive</span>
          <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200/60 hidden sm:inline-block">
            Public Share
          </span>
        </Link>

        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Open AsterDrive</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading shared item...</p>
          </div>
        ) : item ? (
          <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
            {/* Header / Media Banner */}
            {videoUrl ? (
              <div className="bg-black w-full aspect-video flex items-center justify-center relative">
                <video src={videoUrl} controls playsInline className="w-full h-full object-contain max-h-[450px]" />
              </div>
            ) : imageUrl ? (
              <div className="bg-slate-100 w-full max-h-[400px] flex items-center justify-center overflow-hidden border-b border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={item.name} className="max-h-[400px] w-auto object-contain" />
              </div>
            ) : (
              <div className="p-8 sm:p-12 bg-gradient-to-b from-blue-50/50 via-slate-50/50 to-white flex flex-col items-center justify-center border-b border-slate-100 text-center">
                <div className="w-24 h-24 rounded-3xl bg-white shadow-md border border-slate-200/70 flex items-center justify-center mb-4">
                  {getIcon(item.type)}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-all max-w-lg mb-2">
                  {item.name}
                </h1>
                <div className="flex items-center gap-2 flex-wrap justify-center text-xs text-slate-500">
                  <span className="font-mono">{formatBytes(item.size)}</span>
                  <span>•</span>
                  <span>Shared by {item.owner}</span>
                  <span>•</span>
                  <span>{formatDateSafe(item.updatedAt)}</span>
                </div>
              </div>
            )}

            {/* Information & Action Section */}
            <div className="p-6 sm:p-8">
              {(videoUrl || imageUrl) && (
                <div className="mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-all mb-1">
                    {item.name}
                  </h1>
                  <p className="text-xs text-slate-500 font-mono">
                    {formatBytes(item.size)} • {formatDateSafe(item.updatedAt)}
                  </p>
                </div>
              )}

              {/* Status info pills */}
              <div className="flex items-center gap-2.5 flex-wrap mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Public Verified Link
                </span>
                {item.source === 'computer' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Computer className="w-3.5 h-3.5" />
                    Backed Up from {item.computerDevice || 'PC'}
                  </span>
                )}
              </div>

              {/* Download Action */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full sm:flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70 active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloading ? 'Preparing Download...' : 'Download Original File'}</span>
                </button>
                <Link
                  href="/"
                  className="w-full sm:w-auto py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-medium text-sm transition-colors text-center cursor-pointer"
                >
                  View in Drive
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-md shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Public File Link</h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              This shared link points to file ID: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-blue-600">{id}</code>. 
              Open AsterDrive on the owner&apos;s device to view or download the real binary content.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <HardDrive className="w-4 h-4" />
              <span>Go to AsterDrive Home</span>
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        AsterDrive Cloud Storage • Secure Real Data Storage
      </footer>
    </div>
  );
}
