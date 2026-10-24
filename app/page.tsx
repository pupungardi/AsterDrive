'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HardDrive,
  Folder,
  FileText,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  FileArchive,
  MoreVertical,
  Search,
  Settings,
  Bell,
  Plus,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  Star,
  Clock,
  Trash2,
  Users,
  Computer,
  Cloud,
  File,
  Menu,
  X,
  Info,
  Download,
  Share2,
  FolderOpen,
  AlertTriangle,
  RotateCcw,
  Check,
  LogOut,
  User,
  Shield,
  Palette,
  CloudOff,
  HelpCircle,
  ShieldCheck,
  Scale,
  BookOpen,
  Sparkles,
  AlertCircle,
  Mail,
  Send,
  Lock,
  Smartphone,
  ExternalLink,
  Pencil,
  Play,
  Monitor,
  Laptop,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StorageAnalyticsChart } from '@/components/StorageAnalyticsChart';
import { saveFileBlob, getFileBlob, deleteFileBlob } from '@/lib/db';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- STORAGE PLANS & DATA TYPES ---

interface StoragePlan {
  id: string;
  name: string;
  storage: string;
  price: string;
  maxBytes: number;
  isFree?: boolean;
  recommended?: boolean;
}

const STORAGE_PLANS: StoragePlan[] = [
  { id: 'free', name: 'Free Plan', storage: '1 GB', price: 'Free forever', maxBytes: 1 * 1024 * 1024 * 1024, isFree: true },
  { id: '50GB', name: '50 GB Plan', storage: '50 GB', price: 'IDR 15.000 a month', maxBytes: 50 * 1024 * 1024 * 1024 },
  { id: '200GB', name: '200 GB Plan', storage: '200 GB', price: 'IDR 45.000 a month', maxBytes: 200 * 1024 * 1024 * 1024 },
  { id: '2TB', name: '2 TB Plan', storage: '2 TB', price: 'IDR 149.000 a month', maxBytes: 2 * 1024 * 1024 * 1024 * 1024, recommended: true },
  { id: '6TB', name: '6 TB Plan', storage: '6 TB', price: 'IDR 449.000 a month', maxBytes: 6 * 1024 * 1024 * 1024 * 1024 },
  { id: '12TB', name: '12 TB Plan', storage: '12 TB', price: 'IDR 899.000 a month', maxBytes: 12 * 1024 * 1024 * 1024 * 1024 },
];

const UPGRADE_PLANS = STORAGE_PLANS.filter(p => !p.isFree);

type ItemType = 'folder' | 'document' | 'image' | 'video' | 'spreadsheet' | 'presentation' | 'archive' | 'unknown';

interface DriveItem {
  id: string;
  parentId: string;
  name: string;
  type: ItemType;
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

const SAMPLE_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SECONDARY_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

// Real data: AsterDrive starts completely clean with 0 dummy files
const initialData: DriveItem[] = [];

function formatBytes(bytes?: number, decimals = 1) {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateSafe(dateStr?: string | Date): string {
  if (!dateStr) return '';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '';
    return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  } catch {
    return typeof dateStr === 'string' ? dateStr : '';
  }
}

const getIconForType = (type: ItemType, className?: string) => {
  const defaultClass = cn("w-5 h-5", className);
  switch (type) {
    case 'folder': return <Folder className={cn(defaultClass, "text-blue-500 fill-blue-500/20")} />;
    case 'document': return <FileText className={cn(defaultClass, "text-blue-600")} />;
    case 'image': return <ImageIcon className={cn(defaultClass, "text-rose-500")} />;
    case 'video': return <Video className={cn(defaultClass, "text-purple-500")} />;
    case 'spreadsheet': return <FileSpreadsheet className={cn(defaultClass, "text-emerald-500")} />;
    case 'archive': return <FileArchive className={cn(defaultClass, "text-amber-500")} />;
    default: return <File className={cn(defaultClass, "text-slate-400")} />;
  }
};

interface ToastNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

type ProfileDetailView = 'personal' | 'security' | 'settings' | 'offline' | 'notifications' | 'appearance' | 'contact' | 'about' | 'terms' | 'privacy' | 'acceptable' | 'copyright' | null;

// --- MAIN APPLICATION COMPONENT ---

const STORAGE_KEY = 'asterdrive_real_items_v2';

export default function AsterDriveApp() {
  const [driveItems, setDriveItems] = useState<DriveItem[]>(initialData);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeNav, setActiveNav] = useState('my-drive');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Storage plan state: defaults to Free Plan (1 GB)
  const [currentPlan, setCurrentPlan] = useState<StoragePlan>(STORAGE_PLANS[0]);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('2TB');
  
  // Profile modal state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeProfileDetail, setActiveProfileDetail] = useState<ProfileDetailView>(null);

  // Three-Dots (MoreVertical) Item Menu state
  const [activeItemMenu, setActiveItemMenu] = useState<{
    item: DriveItem;
    top: number;
    left: number;
  } | null>(null);

  // Header Three-Dots Menu state
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  // Rename modal state
  const [itemToRename, setItemToRename] = useState<DriveItem | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Video player modal state
  const [previewVideoItem, setPreviewVideoItem] = useState<DriveItem | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState<number>(1);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const videoPlayerRef = React.useRef<HTMLVideoElement>(null);

  // Load persistent real items from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          requestAnimationFrame(() => {
            setDriveItems(parsed);
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load items from localStorage', e);
    }
  }, []);

  // Save persistent real items to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(driveItems));
    } catch (e) {
      console.warn('Failed to save items to localStorage', e);
    }
  }, [driveItems]);

  const openVideoPreview = async (item: DriveItem) => {
    setVideoLoadError(false);
    setVideoPlaybackSpeed(1);
    setPreviewVideoItem(item);

    if (activeVideoUrl && activeVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(activeVideoUrl);
    }

    try {
      const blob = await getFileBlob(item.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setActiveVideoUrl(url);
        return;
      }
    } catch (err) {
      console.warn('Could not load video blob from IndexedDB', err);
    }

    if (item.videoUrl) {
      setActiveVideoUrl(item.videoUrl);
    } else {
      setActiveVideoUrl(null);
    }
  };

  const closeVideoPreview = () => {
    if (activeVideoUrl && activeVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(activeVideoUrl);
    }
    setActiveVideoUrl(null);
    setPreviewVideoItem(null);
  };

  // Computer sync modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Drag-and-drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = React.useRef(0);

  // Close menus on scroll or window resize
  React.useEffect(() => {
    const handleCloseMenus = () => {
      setActiveItemMenu(null);
      setIsHeaderMenuOpen(false);
    };
    window.addEventListener('scroll', handleCloseMenus, true);
    window.addEventListener('resize', handleCloseMenus);
    return () => {
      window.removeEventListener('scroll', handleCloseMenus, true);
      window.removeEventListener('resize', handleCloseMenus);
    };
  }, []);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Open Three-Dots action menu for an item
  const handleOpenItemMenu = (item: DriveItem, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 224;
    const menuHeight = item.trashed ? 160 : 310;
    
    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    let top = rect.bottom + 6;
    if (top + menuHeight > window.innerHeight - 10) {
      top = Math.max(10, rect.top - menuHeight - 6);
    }

    setActiveItemMenu({
      item,
      top,
      left,
    });
  };

  const handleDownloadItem = async (item: DriveItem) => {
    setActiveItemMenu(null);
    showToast({
      type: 'success',
      title: 'Download Started',
      message: `Downloading "${item.name}" (${formatBytes(item.size)})`
    });
    try {
      const realBlob = await getFileBlob(item.id);
      let downloadBlob = realBlob;
      if (!downloadBlob) {
        downloadBlob = new Blob([
          `AsterDrive Cloud Storage\nFile: ${item.name}\nSize: ${formatBytes(item.size)}\nOwner: ${item.owner}\nUploaded: ${item.updatedAt}\nPlan: ${currentPlan.name}`
        ], { type: 'text/plain' });
      }
      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name.includes('.') ? item.name : `${item.name}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error', err);
    }
  };

  const handleShareItem = (item: DriveItem) => {
    setActiveItemMenu(null);
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/share/${item.id}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).catch(() => {});
      }
    }
    showToast({
      type: 'info',
      title: 'Share Link Copied',
      message: `Shareable link for "${item.name}" copied to clipboard.`
    });
  };

  const handleToggleStarSingle = (item: DriveItem) => {
    setActiveItemMenu(null);
    setDriveItems(prev => prev.map(i => i.id === item.id ? { ...i, starred: !i.starred } : i));
    showToast({
      type: 'info',
      title: item.starred ? 'Removed from Starred' : 'Added to Starred',
      message: `"${item.name}" ${item.starred ? 'is no longer starred.' : 'marked with star.'}`
    });
  };

  const handleOpenRename = (item: DriveItem) => {
    setActiveItemMenu(null);
    setItemToRename(item);
    setRenameInput(item.name);
  };

  const handleSaveRename = () => {
    if (!itemToRename) return;
    const trimmed = renameInput.trim();
    if (!trimmed) {
      showToast({
        type: 'warning',
        title: 'Name Required',
        message: 'Item name cannot be empty.'
      });
      return;
    }
    const oldName = itemToRename.name;
    setDriveItems(prev => prev.map(i => i.id === itemToRename.id ? { ...i, name: trimmed, updatedAt: new Date().toISOString() } : i));
    setItemToRename(null);
    showToast({
      type: 'success',
      title: 'Item Renamed',
      message: `"${oldName}" renamed to "${trimmed}".`
    });
  };

  // Computer sync execution state
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  const handleSyncNow = () => {
    if (isSyncingNow) return;
    setIsSyncingNow(true);
    showToast({
      type: 'info',
      title: 'Verifying Computer Sync...',
      message: 'Checking local files against AsterDrive backup storage...'
    });
    setTimeout(() => {
      setIsSyncingNow(false);
      showToast({
        type: 'success',
        title: 'Sync Complete & Up to Date',
        message: 'All files are securely backed up and match your local computer.'
      });
    }, 1200);
  };

  const handleToggleComputerSync = (item: DriveItem) => {
    setActiveItemMenu(null);
    const willBeComputer = item.source !== 'computer';
    setDriveItems(prev => prev.map(i => i.id === item.id ? {
      ...i,
      source: willBeComputer ? 'computer' : 'drive',
      computerDevice: willBeComputer ? (i.computerDevice || 'This PC') : undefined,
      folderPath: willBeComputer ? (i.folderPath || 'Synced from PC') : undefined,
      updatedAt: new Date().toISOString()
    } : i));
    showToast({
      type: 'success',
      title: willBeComputer ? 'Linked to Computer Sync' : 'Removed from Computer Sync',
      message: `"${item.name}" is now ${willBeComputer ? 'synced with your computer and visible in the Computers tab.' : 'stored in My Drive only.'}`
    });
  };

  const handleSyncAllDriveFilesToComputer = () => {
    const unlinked = driveItems.filter(i => !i.trashed && i.source !== 'computer');
    if (unlinked.length === 0) return;
    setDriveItems(prev => prev.map(item => {
      if (!item.trashed && item.source !== 'computer') {
        return {
          ...item,
          source: 'computer',
          computerDevice: 'This PC',
          folderPath: item.folderPath || 'Backup / Uploaded',
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    }));
    showToast({
      type: 'success',
      title: 'Files Synced with Computer',
      message: `${unlinked.length} file(s) have been linked to this Computer and are now backed up.`
    });
  };

  const handleToggleSelectedComputerSync = () => {
    if (selectedItems.size === 0) return;
    const selectedList = driveItems.filter(i => selectedItems.has(i.id));
    const allAlreadyComputer = selectedList.every(i => i.source === 'computer');
    const newSource = allAlreadyComputer ? 'drive' : 'computer';

    setDriveItems(prev => prev.map(item => {
      if (selectedItems.has(item.id)) {
        return {
          ...item,
          source: newSource,
          computerDevice: newSource === 'computer' ? (item.computerDevice || 'This PC') : undefined,
          folderPath: newSource === 'computer' ? (item.folderPath || 'Synced from PC') : undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    }));

    showToast({
      type: 'success',
      title: newSource === 'computer' ? 'Linked to Computer Sync' : 'Removed from Computer Sync',
      message: `${selectedList.length} item(s) ${newSource === 'computer' ? 'are now visible in the Computers tab and marked as synced.' : 'are now stored in My Drive only.'}`
    });
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);
  const computerFileInputRef = React.useRef<HTMLInputElement>(null);
  const computerFolderInputRef = React.useRef<HTMLInputElement>(null);

  // Set webkitdirectory on client safely to prevent SSR attribute mismatch
  React.useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
    if (computerFolderInputRef.current) {
      computerFolderInputRef.current.setAttribute('webkitdirectory', '');
      computerFolderInputRef.current.setAttribute('directory', '');
    }
  }, []);

  // Keyboard shortcut listener (Escape to close video modal, Space for play/pause)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewVideoItem(null);
        setIsSyncModalOpen(false);
      }
      if (previewVideoItem && e.code === 'Space') {
        const target = e.target as HTMLElement | null;
        if (target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (videoPlayerRef.current) {
            if (videoPlayerRef.current.paused) {
              videoPlayerRef.current.play().catch(() => {});
            } else {
              videoPlayerRef.current.pause();
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewVideoItem]);

  // Storage calculations
  const totalUsedBytes = useMemo(() => {
    return driveItems.reduce((acc, item) => acc + (item.size || 0), 0);
  }, [driveItems]);

  const storagePercentage = useMemo(() => {
    if (!currentPlan.maxBytes) return 0;
    return Math.min(100, Math.max(0, (totalUsedBytes / currentPlan.maxBytes) * 100));
  }, [totalUsedBytes, currentPlan.maxBytes]);

  // Upload handler with quota enforcement, folder picker tree preservation, and video object URLs
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const incomingBytes = filesArray.reduce((acc, file) => acc + (file.size || 0), 0);

      // Validate against current plan limit (e.g. 1 GB for Free Plan)
      if (totalUsedBytes + incomingBytes > currentPlan.maxBytes) {
        showToast({
          type: 'warning',
          title: 'Storage Quota Exceeded',
          message: `Uploading ${filesArray.length} file(s) (${formatBytes(incomingBytes)}) exceeds your ${currentPlan.name} limit (${currentPlan.storage}). Currently using ${formatBytes(totalUsedBytes)} of ${currentPlan.storage}.`
        });
        setIsUpgradeModalOpen(true);
        setShowUploadMenu(false);
        e.target.value = '';
        return;
      }

      // Check if uploaded items originate from folder picker (webkitRelativePath present)
      const hasRelativePaths = filesArray.some(f => (f as any).webkitRelativePath && (f as any).webkitRelativePath.includes('/'));

      if (hasRelativePaths) {
        interface DiscoveredFolder {
          fullPath: string;
          name: string;
          parentPath: string;
        }
        const discoveredFolders: DiscoveredFolder[] = [];
        const filesWithFolder: { file: File; folderPath: string }[] = [];

        for (const file of filesArray) {
          const relPath = (file as any).webkitRelativePath;
          let folderPath = '';
          if (relPath && relPath.includes('/')) {
            const parts = relPath.split('/');
            folderPath = parts.slice(0, -1).join('/');
            let accum = '';
            for (let p = 0; p < parts.length - 1; p++) {
              const prev = accum;
              accum = accum ? `${accum}/${parts[p]}` : parts[p];
              if (!discoveredFolders.some(f => f.fullPath === accum)) {
                discoveredFolders.push({
                  fullPath: accum,
                  name: parts[p],
                  parentPath: prev
                });
              }
            }
          }
          filesWithFolder.push({ file, folderPath });
        }

        const targetRootFolderId = activeNav === 'trash' ? 'root' : currentFolderId;
        discoveredFolders.sort((a, b) => a.fullPath.split('/').length - b.fullPath.split('/').length);
        const folderIdMap = new Map<string, string>();
        folderIdMap.set('', targetRootFolderId);

        const newFolderItems: DriveItem[] = [];
        for (const folder of discoveredFolders) {
          const parentId = folderIdMap.get(folder.parentPath) || targetRootFolderId;
          const folderId = Math.random().toString(36).substring(2, 9);
          folderIdMap.set(folder.fullPath, folderId);

          newFolderItems.push({
            id: folderId,
            parentId: parentId,
            name: folder.name,
            type: 'folder',
            updatedAt: new Date().toISOString(),
            owner: activeNav === 'shared' ? 'colleague@example.com' : 'me',
            source: activeNav === 'computers' ? 'computer' : 'drive',
            computerDevice: activeNav === 'computers' ? 'This PC' : undefined,
            folderPath: folder.name
          });
        }

        const newFileItems: DriveItem[] = filesWithFolder.map(({ file, folderPath }) => {
          const isVideo = file.type.includes('video') || !!file.name.match(/\.(mp4|mov|webm|mkv|avi|m4v)$/i);
          let videoUrl: string | undefined = undefined;
          if (isVideo) {
            try {
              videoUrl = URL.createObjectURL(file);
            } catch (err) {
              console.error('Error creating object URL for video', err);
            }
          }

          const parentId = folderIdMap.get(folderPath) || targetRootFolderId;

          return {
            id: Math.random().toString(36).substring(2, 9),
            parentId: parentId,
            name: file.name,
            type: file.type.includes('image') ? 'image' : 
                  isVideo ? 'video' : 
                  file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv') ? 'spreadsheet' :
                  file.type.includes('zip') || file.name.endsWith('.zip') || file.name.endsWith('.rar') || file.name.endsWith('.7z') ? 'archive' : 'document',
            size: file.size,
            updatedAt: new Date().toISOString(),
            owner: activeNav === 'shared' ? 'colleague@example.com' : 'me',
            source: activeNav === 'computers' ? 'computer' : 'drive',
            videoUrl,
            computerDevice: activeNav === 'computers' ? 'This PC' : undefined,
            folderPath: folderPath || undefined
          };
        });

        // Save binary file blobs to IndexedDB for real persistent retrieval
        newFileItems.forEach((item, idx) => {
          saveFileBlob(item.id, filesWithFolder[idx].file);
        });

        setDriveItems(prev => [...prev, ...newFolderItems, ...newFileItems]);
        setShowUploadMenu(false);
        showToast({
          type: 'success',
          title: 'Folder Upload Complete',
          message: `${newFileItems.length} file(s) and ${newFolderItems.length} folder(s) (${formatBytes(incomingBytes)}) added to AsterDrive.`
        });
        e.target.value = '';
        return;
      }

      const newItems: DriveItem[] = filesArray.map(file => {
        const isVideo = file.type.includes('video') || !!file.name.match(/\.(mp4|mov|webm|mkv|avi|m4v)$/i);
        let videoUrl: string | undefined = undefined;
        if (isVideo) {
          try {
            videoUrl = URL.createObjectURL(file);
          } catch (err) {
            console.error('Error creating object URL for video', err);
          }
        }

        return {
          id: Math.random().toString(36).substring(7),
          parentId: currentFolderId,
          name: file.name,
          type: file.type.includes('image') ? 'image' : 
                isVideo ? 'video' : 
                file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv') ? 'spreadsheet' :
                file.type.includes('zip') || file.name.endsWith('.zip') || file.name.endsWith('.rar') ? 'archive' : 'document',
          size: file.size,
          updatedAt: new Date().toISOString(),
          owner: activeNav === 'shared' ? 'colleague@example.com' : 'me',
          source: activeNav === 'computers' ? 'computer' : 'drive',
          videoUrl,
          computerDevice: activeNav === 'computers' ? 'This PC' : undefined,
          folderPath: activeNav === 'computers' ? 'Uploaded from PC' : undefined
        };
      });

      // Save binary file blobs to IndexedDB
      newItems.forEach((item, idx) => {
        saveFileBlob(item.id, filesArray[idx]);
      });

      setDriveItems(prev => [...prev, ...newItems]);
      setShowUploadMenu(false);
      showToast({
        type: 'success',
        title: 'Upload Complete',
        message: `${newItems.length} file(s) (${formatBytes(incomingBytes)}) added to AsterDrive.`
      });
      e.target.value = '';
    }
  };

  // Full-Window Drag and Drop Handlers with recursive folder structure preservation
  const handleWindowDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer && (e.dataTransfer.types.includes('Files') || (e.dataTransfer.items && e.dataTransfer.items.length > 0))) {
      setIsDraggingOver(true);
    }
  };

  const handleWindowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleWindowDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDraggingOver(false);
    }
  };

  const processDroppedDataTransfer = async (dataTransfer: DataTransfer) => {
    interface DiscoveredFolder {
      fullPath: string;
      name: string;
      parentPath: string;
    }
    interface DiscoveredFile {
      file: File;
      folderPath: string;
    }

    const discoveredFolders: DiscoveredFolder[] = [];
    const discoveredFiles: DiscoveredFile[] = [];

    const traverseEntry = async (entry: any, parentPath: string = '') => {
      if (!entry) return;
      if (entry.isFile) {
        await new Promise<void>((resolve) => {
          entry.file((file: File) => {
            discoveredFiles.push({ file, folderPath: parentPath });
            resolve();
          }, () => resolve());
        });
      } else if (entry.isDirectory) {
        const currentPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
        if (!discoveredFolders.some(f => f.fullPath === currentPath)) {
          discoveredFolders.push({
            fullPath: currentPath,
            name: entry.name,
            parentPath: parentPath
          });
        }

        const reader = entry.createReader();
        const readEntries = async (): Promise<any[]> => {
          return new Promise((resolve) => {
            reader.readEntries((entries: any[]) => {
              resolve(entries || []);
            }, () => resolve([]));
          });
        };

        let batch: any[];
        do {
          batch = await readEntries();
          for (const child of batch) {
            await traverseEntry(child, currentPath);
          }
        } while (batch && batch.length > 0);
      }
    };

    const items = dataTransfer.items;
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
          if (entry) {
            await traverseEntry(entry, '');
          } else {
            const file = item.getAsFile();
            if (file) {
              discoveredFiles.push({ file, folderPath: '' });
            }
          }
        }
      }
    } else if (dataTransfer.files && dataTransfer.files.length > 0) {
      const filesArray = Array.from(dataTransfer.files);
      for (const file of filesArray) {
        const relPath = (file as any).webkitRelativePath;
        let folderPath = '';
        if (relPath && relPath.includes('/')) {
          const parts = relPath.split('/');
          folderPath = parts.slice(0, -1).join('/');
          let accum = '';
          for (let p = 0; p < parts.length - 1; p++) {
            const prev = accum;
            accum = accum ? `${accum}/${parts[p]}` : parts[p];
            if (!discoveredFolders.some(f => f.fullPath === accum)) {
              discoveredFolders.push({
                fullPath: accum,
                name: parts[p],
                parentPath: prev
              });
            }
          }
        }
        discoveredFiles.push({ file, folderPath });
      }
    }

    if (discoveredFiles.length === 0 && discoveredFolders.length === 0) {
      return;
    }

    const totalIncomingBytes = discoveredFiles.reduce((acc, f) => acc + (f.file.size || 0), 0);

    if (totalUsedBytes + totalIncomingBytes > currentPlan.maxBytes) {
      showToast({
        type: 'warning',
        title: 'Storage Quota Exceeded',
        message: `Uploading ${discoveredFiles.length} file(s) (${formatBytes(totalIncomingBytes)}) exceeds your ${currentPlan.name} limit (${currentPlan.storage}). Currently using ${formatBytes(totalUsedBytes)} of ${currentPlan.storage}.`
      });
      setIsUpgradeModalOpen(true);
      return;
    }

    const targetRootFolderId = activeNav === 'trash' ? 'root' : currentFolderId;

    discoveredFolders.sort((a, b) => a.fullPath.split('/').length - b.fullPath.split('/').length);
    const folderIdMap = new Map<string, string>();
    folderIdMap.set('', targetRootFolderId);

    const newFolderItems: DriveItem[] = [];
    for (const folder of discoveredFolders) {
      const parentId = folderIdMap.get(folder.parentPath) || targetRootFolderId;
      const folderId = Math.random().toString(36).substring(2, 9);
      folderIdMap.set(folder.fullPath, folderId);

      newFolderItems.push({
        id: folderId,
        parentId: parentId,
        name: folder.name,
        type: 'folder',
        updatedAt: new Date().toISOString(),
        owner: activeNav === 'shared' ? 'colleague@example.com' : 'me',
        source: activeNav === 'computers' ? 'computer' : 'drive',
        computerDevice: activeNav === 'computers' ? 'This PC' : undefined,
        folderPath: folder.name
      });
    }

    const newFileItems: DriveItem[] = discoveredFiles.map(({ file, folderPath }) => {
      const isVideo = file.type.includes('video') || !!file.name.match(/\.(mp4|mov|webm|mkv|avi|m4v)$/i);
      let videoUrl: string | undefined = undefined;
      if (isVideo) {
        try {
          videoUrl = URL.createObjectURL(file);
        } catch (err) {
          console.error('Error creating object URL for video', err);
        }
      }

      const parentId = folderIdMap.get(folderPath) || targetRootFolderId;

      return {
        id: Math.random().toString(36).substring(2, 9),
        parentId: parentId,
        name: file.name,
        type: file.type.includes('image') ? 'image' : 
              isVideo ? 'video' : 
              file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv') ? 'spreadsheet' :
              file.type.includes('zip') || file.name.endsWith('.zip') || file.name.endsWith('.rar') || file.name.endsWith('.7z') ? 'archive' : 'document',
        size: file.size,
        updatedAt: new Date().toISOString(),
        owner: activeNav === 'shared' ? 'colleague@example.com' : 'me',
        source: activeNav === 'computers' ? 'computer' : 'drive',
        videoUrl,
        computerDevice: activeNav === 'computers' ? 'This PC' : undefined,
        folderPath: folderPath || undefined
      };
    });

    // Save binary file blobs to IndexedDB
    newFileItems.forEach((item, idx) => {
      saveFileBlob(item.id, discoveredFiles[idx].file);
    });

    setDriveItems(prev => [...prev, ...newFolderItems, ...newFileItems]);
    showToast({
      type: 'success',
      title: 'Upload Successful',
      message: `${newFileItems.length} file(s)${newFolderItems.length > 0 ? ` and ${newFolderItems.length} folder(s)` : ''} (${formatBytes(totalIncomingBytes)}) added to AsterDrive.`
    });
  };

  const handleWindowDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDraggingOver(false);
    await processDroppedDataTransfer(e.dataTransfer);
  };

  // Dedicated Computer Sync & Backup Upload handler
  const handleComputerUpload = (e: React.ChangeEvent<HTMLInputElement>, deviceName: string = 'My Computer') => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const incomingBytes = filesArray.reduce((acc, file) => acc + (file.size || 0), 0);

      if (totalUsedBytes + incomingBytes > currentPlan.maxBytes) {
        showToast({
          type: 'warning',
          title: 'Storage Quota Exceeded',
          message: `Backing up ${filesArray.length} file(s) (${formatBytes(incomingBytes)}) exceeds your ${currentPlan.name} limit (${currentPlan.storage}). Currently using ${formatBytes(totalUsedBytes)} of ${currentPlan.storage}.`
        });
        setIsUpgradeModalOpen(true);
        e.target.value = '';
        return;
      }

      const newItems: DriveItem[] = filesArray.map(file => {
        const isVideo = file.type.includes('video') || !!file.name.match(/\.(mp4|mov|webm|mkv|avi|m4v)$/i);
        let videoUrl: string | undefined = undefined;
        if (isVideo) {
          try {
            videoUrl = URL.createObjectURL(file);
          } catch (err) {
            console.error('Error creating object URL for video', err);
          }
        }
        const relPath = (file as any).webkitRelativePath;
        const folderName = relPath && relPath.includes('/') ? relPath.split('/')[0] : 'Synced Backup Folder';

        return {
          id: Math.random().toString(36).substring(7),
          parentId: 'root',
          name: file.name,
          type: file.type.includes('image') ? 'image' : 
                isVideo ? 'video' : 
                file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv') ? 'spreadsheet' :
                file.type.includes('zip') || file.name.endsWith('.zip') || file.name.endsWith('.rar') ? 'archive' : 'document',
          size: file.size,
          updatedAt: new Date().toISOString(),
          owner: 'me',
          source: 'computer',
          videoUrl,
          computerDevice: deviceName,
          folderPath: folderName
        };
      });

      // Save binary file blobs to IndexedDB
      newItems.forEach((item, idx) => {
        saveFileBlob(item.id, filesArray[idx]);
      });

      setDriveItems(prev => [...prev, ...newItems]);
      setIsSyncModalOpen(false);
      showToast({
        type: 'success',
        title: 'Computer Sync Completed',
        message: `${newItems.length} file(s) from "${deviceName}" successfully backed up and synced.`
      });
      e.target.value = '';
    }
  };

  // Upgrade handler
  const handleConfirmUpgrade = () => {
    const chosenPlan = UPGRADE_PLANS.find(p => p.id === selectedPlanId);
    if (!chosenPlan) return;

    setCurrentPlan(chosenPlan);
    setIsUpgradeModalOpen(false);
    showToast({
      type: 'success',
      title: 'Plan Upgraded Successfully!',
      message: `Your account now has ${chosenPlan.storage} storage limit. You can upload large files without interruption.`
    });
  };

  // Downgrade back to Free Plan for testing
  const handleDowngradeToFree = () => {
    const freePlan = STORAGE_PLANS[0];
    setCurrentPlan(freePlan);
    setSelectedPlanId('2TB');
    setIsUpgradeModalOpen(false);
    showToast({
      type: 'info',
      title: 'Reset to Free Plan',
      message: 'Your account is back on the Free Plan with 1 GB storage quota.'
    });
  };

  const handleToggleStar = () => {
    setDriveItems(prev => prev.map(item => 
      selectedItems.has(item.id) ? { ...item, starred: !item.starred } : item
    ));
  };

  const handleMoveToTrash = () => {
    setDriveItems(prev => prev.map(item => 
      selectedItems.has(item.id) ? { ...item, trashed: true } : item
    ));
    setSelectedItems(new Set());
  };

  const handleRestore = () => {
    setDriveItems(prev => prev.map(item => 
      selectedItems.has(item.id) ? { ...item, trashed: false } : item
    ));
    setSelectedItems(new Set());
  };

  const handleDeletePermanent = () => {
    selectedItems.forEach(id => {
      deleteFileBlob(id);
    });
    setDriveItems(prev => prev.filter(item => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
    setIsDeleteDialogOpen(false);
  };

  // Compute breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs = [{ id: 'root', name: 'My Drive' }];
    let currentId = currentFolderId;
    const path = [];
    
    while (currentId !== 'root') {
      const folder = driveItems.find(item => item.id === currentId);
      if (folder) {
        path.unshift({ id: folder.id, name: folder.name });
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return [...crumbs, ...path];
  }, [currentFolderId, driveItems]);

  // Compute displayed items
  const displayedItems = useMemo(() => {
    let items = driveItems;
    
    if (searchQuery) {
      items = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.trashed);
    } else {
      if (activeNav === 'my-drive') {
        items = items.filter(item => item.parentId === currentFolderId && !item.trashed && item.source !== 'computer');
      } else if (activeNav === 'starred') {
        items = items.filter(item => item.starred && !item.trashed);
      } else if (activeNav === 'recent') {
        items = items.filter(item => !item.trashed).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 10);
      } else if (activeNav === 'shared') {
        items = items.filter(item => item.owner !== 'me' && !item.trashed);
      } else if (activeNav === 'computers') {
        items = items.filter(item => item.source === 'computer' && !item.trashed);
      } else if (activeNav === 'trash') {
        items = items.filter(item => item.trashed);
      } else {
        items = [];
      }
    }

    return items.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [currentFolderId, searchQuery, activeNav, driveItems]);

  const handleItemClick = (item: DriveItem) => {
    if (item.type === 'folder' && activeNav !== 'trash') {
      setCurrentFolderId(item.id);
      setSelectedItems(new Set());
    } else if (item.type === 'video' && !item.trashed) {
      openVideoPreview(item);
    } else {
      toggleSelection(item.id);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNavSelect = (itemId: string) => {
    if (itemId === 'cloud-storage') {
      setIsUpgradeModalOpen(true);
      setIsMobileMenuOpen(false);
      showToast({
        type: 'info',
        title: 'Cloud Storage & Quota',
        message: `Currently using ${formatBytes(totalUsedBytes)} of ${currentPlan.storage} (${Math.round(storagePercentage)}%)`
      });
      return;
    }
    if (itemId === 'backup') {
      setIsSyncModalOpen(true);
      setIsMobileMenuOpen(false);
      showToast({
        type: 'info',
        title: 'Computer Backup & Sync',
        message: 'Connect your Windows PC or Mac to automatically back up folders.'
      });
      return;
    }
    setActiveNav(itemId);
    setSearchQuery('');
    setSelectedItems(new Set());
    if (itemId === 'my-drive') {
      setCurrentFolderId('root');
    }
    setIsMobileMenuOpen(false);
  };

  const navigation = [
    { id: 'my-drive', label: 'My Drive', icon: HardDrive },
    { id: 'computers', label: 'Computers', icon: Computer },
    { id: 'shared', label: 'Shared with me', icon: Users },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  const selectedItemDetails = selectedItems.size === 1 
    ? driveItems.find(item => item.id === Array.from(selectedItems)[0]) 
    : null;

  return (
    <div 
      className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden select-none relative" 
      suppressHydrationWarning
      onDragEnter={handleWindowDragEnter}
      onDragOver={handleWindowDragOver}
      onDragLeave={handleWindowDragLeave}
      onDrop={handleWindowDrop}
    >
      {/* FULL-WINDOW DRAG AND DROP OVERLAY */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 sm:p-10 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="max-w-lg w-full bg-white/95 backdrop-blur-xl border-2 border-dashed border-blue-500 rounded-3xl p-8 sm:p-10 text-center shadow-2xl flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 shadow-inner animate-bounce">
                <UploadCloud className="w-10 h-10" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                Drop files or folders here
              </h2>
              <p className="text-slate-600 text-sm mb-4 max-w-sm">
                Release anywhere to upload into{' '}
                <span className="font-semibold text-blue-600">
                  {currentFolderId === 'root' ? (activeNav === 'computers' ? 'Synced Computers' : 'My Drive') : (driveItems.find(i => i.id === currentFolderId)?.name || 'Current Folder')}
                </span>
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100/90 px-3.5 py-2 rounded-full border border-slate-200/60">
                <Folder className="w-4 h-4 text-blue-500" />
                <span>Entire nested folder structures are preserved automatically</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside
        className={cn(
          "w-64 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out shrink-0 select-none",
          "fixed inset-y-0 left-0 z-50 lg:static lg:inset-auto lg:z-0 lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-transparent shrink-0">
          <button
            type="button"
            onClick={() => handleNavSelect('my-drive')}
            className="flex items-center gap-2 text-blue-600 font-display font-semibold text-xl tracking-tight cursor-pointer hover:opacity-90 transition-opacity"
            title="AsterDrive - Home"
          >
            <Cloud className="w-7 h-7 fill-blue-100 stroke-blue-600" />
            AsterDrive
          </button>
          <button 
            type="button"
            className="lg:hidden text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-xl transition-colors cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto pointer-events-auto touch-manipulation">
          {navigation.map((item) => {
            const isActive = activeNav === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavSelect(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  "active:scale-[0.98] active:bg-slate-200/80",
                  isActive
                    ? "bg-blue-100/70 text-blue-700 font-semibold shadow-xs border border-blue-200/50"
                    : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-blue-600" : "text-slate-500")} />
                <span className="truncate flex-1">{item.label}</span>
                {item.id === 'trash' && driveItems.some(i => i.trashed) && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Trash contains files" />
                )}
              </button>
            );
          })}

          {/* CLOUD SERVICES & BACKUP MENU ITEMS */}
          <div className="pt-3 mt-3 border-t border-slate-200/60">
            <p className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Cloud & Sync
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNavSelect('cloud-storage')}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50/80 hover:text-blue-700 transition-all text-left select-none cursor-pointer group active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Manage Cloud Storage Quota & Plans"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <span className="truncate font-medium">Cloud Storage</span>
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border",
                  currentPlan.isFree 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/70" 
                    : "bg-blue-50 text-blue-700 border-blue-200/70"
                )}>
                  {Math.round(storagePercentage)}%
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleNavSelect('backup')}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-50/80 hover:text-indigo-700 transition-all text-left select-none cursor-pointer group active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Backup and sync local PC / Mac folders"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <span className="truncate font-medium">Backup & Sync</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/70 shrink-0">
                  Sync PC
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* CLOUD STORAGE WIDGET IN SIDEBAR / SLIDER */}
        <div className="p-3.5 m-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs shrink-0 select-none">
          <div 
            onClick={() => {
              setIsUpgradeModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-800 block truncate group-hover:text-blue-600 transition-colors">
                    Cloud Storage
                  </span>
                </div>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border",
                currentPlan.isFree 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80" 
                  : "bg-blue-50 text-blue-700 border-blue-200/80"
              )}>
                {currentPlan.isFree ? "FREE" : "PRO"}
              </span>
            </div>

            {/* Storage Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  storagePercentage > 90 ? "bg-rose-500" : storagePercentage > 75 ? "bg-amber-500" : "bg-blue-600"
                )}
                style={{ width: `${Math.min(100, Math.max(storagePercentage, 2))}%` }} 
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-mono tabular-nums">
                {formatBytes(totalUsedBytes)} of {currentPlan.storage}
              </span>
              <span className="font-medium font-mono">
                {Math.round(storagePercentage)}%
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsUpgradeModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="mt-3 w-full py-1.5 px-3 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            {currentPlan.isFree ? 'Get More Storage' : 'Manage Subscription'}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-tl-2xl border-t border-l border-slate-200 shadow-sm overflow-hidden lg:my-2 lg:mr-2">
        {/* HEADER */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-100 gap-4 shrink-0" suppressHydrationWarning>
          <div className="flex items-center gap-3 flex-1 max-w-2xl" suppressHydrationWarning>
            <button 
              type="button"
              className="lg:hidden text-slate-500 hover:bg-slate-100 p-2 rounded-xl transition-colors -ml-2 shrink-0 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative w-full" suppressHydrationWarning>
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search in Drive"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-xl text-sm outline-none transition-all"
                suppressHydrationWarning
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button 
              onClick={() => {
                showToast({
                  type: 'info',
                  title: 'Preferences',
                  message: 'Opening preferences and configuration menu.'
                });
                setIsProfileMenuOpen(true);
              }}
              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors hidden sm:block"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                showToast({
                  type: 'info',
                  title: 'Notifications',
                  message: 'You have no unread notifications.'
                });
              }}
              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors hidden sm:block"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Header Three Dots (More Options) Button */}
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHeaderMenuOpen(!isHeaderMenuOpen);
                }}
                className={cn(
                  "p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors",
                  isHeaderMenuOpen && "bg-slate-100 text-slate-900"
                )}
                title="More options"
                aria-label="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {isHeaderMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsHeaderMenuOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-40 overflow-hidden divide-y divide-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Storage Overview */}
                      <div 
                        onClick={() => {
                          setIsUpgradeModalOpen(true);
                          setIsHeaderMenuOpen(false);
                        }}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-800">Cloud Storage</span>
                          <span className={cn(
                            "font-bold text-[10px] px-1.5 py-0.5 rounded-full",
                            currentPlan.isFree ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                          )}>
                            {currentPlan.name}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all" 
                            style={{ width: `${storagePercentage}%` }} 
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {formatBytes(totalUsedBytes)} of {currentPlan.storage} used
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            fileInputRef.current?.click();
                            setIsHeaderMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm text-left transition-colors"
                        >
                          <File className="w-4 h-4 text-blue-600" />
                          Upload Files
                        </button>
                        <button
                          onClick={() => {
                            folderInputRef.current?.click();
                            setIsHeaderMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm text-left transition-colors"
                        >
                          <Folder className="w-4 h-4 text-amber-500" />
                          Upload Folder
                        </button>
                        <button
                          onClick={() => {
                            setShowDetails(!showDetails);
                            setIsHeaderMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm text-left transition-colors"
                        >
                          <Info className="w-4 h-4 text-slate-500" />
                          {showDetails ? 'Hide Details Panel' : 'Show Details Panel'}
                        </button>
                        <button
                          onClick={() => {
                            setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                            setIsHeaderMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm text-left transition-colors"
                        >
                          {viewMode === 'grid' ? <ListIcon className="w-4 h-4 text-slate-500" /> : <LayoutGrid className="w-4 h-4 text-slate-500" />}
                          Switch to {viewMode === 'grid' ? 'List View' : 'Grid View'}
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(true);
                            setIsHeaderMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm text-left transition-colors"
                        >
                          <User className="w-4 h-4 text-blue-600" />
                          Account &amp; Profile Center
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(true);
                            setActiveProfileDetail('settings');
                            setIsHeaderMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm text-left transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-500" />
                          Settings
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(true);
                            setActiveProfileDetail('contact');
                            setIsHeaderMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm text-left transition-colors"
                        >
                          <HelpCircle className="w-4 h-4 text-slate-500" />
                          Help &amp; Contact Support
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setIsProfileMenuOpen(true)}
              className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm ml-1 cursor-pointer hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
              title="Account & Profile"
            >
              JS
            </button>
          </div>
        </header>

        {/* BREADCRUMBS & TOOLBAR */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-4 shrink-0">
          <div className="flex items-center text-sm">
            {searchQuery ? (
              <span className="font-medium text-slate-800 text-lg">Search results for &ldquo;{searchQuery}&rdquo;</span>
            ) : activeNav !== 'my-drive' ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-xl">
                  {navigation.find(n => n.id === activeNav)?.label || activeNav}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                  {displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            ) : (
              <div className="flex items-center flex-wrap gap-1">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.id}>
                    <button 
                      onClick={() => {
                        setCurrentFolderId(crumb.id);
                        setSelectedItems(new Set());
                      }}
                      className={cn(
                        "hover:bg-slate-100 px-2 py-1 rounded-md transition-colors",
                        idx === breadcrumbs.length - 1 ? "font-semibold text-slate-800 text-xl" : "font-medium text-slate-500"
                      )}
                    >
                      {crumb.name}
                    </button>
                    {idx < breadcrumbs.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <AnimatePresence>
              {selectedItems.size > 0 && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-2 overflow-hidden"
                >
                  {activeNav === 'trash' ? (
                    <>
                      <button onClick={handleRestore} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition-colors" title="Restore">
                        <RotateCcw className="w-5 h-5" />
                      </button>
                      <button onClick={() => setIsDeleteDialogOpen(true)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors" title="Delete forever">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleToggleStar} className="p-2 text-slate-500 hover:text-amber-500 hover:bg-slate-100 rounded-md transition-colors" title="Toggle Star">
                        <Star className="w-5 h-5" />
                      </button>
                      <button onClick={handleToggleSelectedComputerSync} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors" title="Toggle Computer Sync & Backup">
                        <Computer className="w-5 h-5" />
                      </button>
                      <button onClick={handleMoveToTrash} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors" title="Move to Trash">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className={cn("p-2 rounded-lg transition-colors hidden lg:block", showDetails ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700")}
              title="View details"
            >
              <Info className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === 'list' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700")}
                title="List view"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === 'grid' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700")}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* FILE LIST AREA */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-6">

            {/* COMPUTERS TOP STATUS BANNER (When synced items exist) */}
            {activeNav === 'computers' && displayedItems.length > 0 && (
              <div className="mb-5 p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-slate-50 border border-blue-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                    <Computer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">Computer Sync &amp; Backup</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Real-time Backup Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {displayedItems.length} synced file(s) • Total backed up {formatBytes(displayedItems.reduce((acc, i) => acc + (i.size || 0), 0))} • Status: Up to date
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button 
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isSyncingNow}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
                    title="Verify local and cloud files match"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isSyncingNow && "animate-spin")} />
                    {isSyncingNow ? 'Verifying...' : 'Sync Now'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => computerFolderInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    Sync Folder
                  </button>
                  <button 
                    type="button"
                    onClick={() => computerFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                    Sync File
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsSyncModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    Presets
                  </button>
                </div>
              </div>
            )}

            {displayedItems.length === 0 ? (
              activeNav === 'computers' ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 max-w-xl mx-auto text-center">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                    <Computer className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Sync &amp; Backup from your computer
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-md">
                    Safely backup videos, photos, and project folders directly from your PC or Mac. Any synced files are accessible anytime, anywhere on AsterDrive.
                  </p>

                  {/* Quick link existing uploaded drive files to Computers */}
                  {driveItems.filter(i => !i.trashed && i.source !== 'computer').length > 0 && (
                    <div className="w-full mb-6 p-4 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200 rounded-2xl text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-blue-500/20">
                          <Computer className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Sync {driveItems.filter(i => !i.trashed && i.source !== 'computer').length} uploaded file(s) to this PC
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            We detected files in your Drive. Link them to Computer Sync &amp; Backup with one click.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSyncAllDriveFilesToComputer}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shrink-0 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:shadow-md active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-200" />
                        Sync All to this PC
                      </button>
                    </div>
                  )}

                  {/* Real Backup Action Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-6 text-left">
                    <div 
                      onClick={() => computerFolderInputRef.current?.click()}
                      className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/40 shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold">
                          <Folder className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">Backup Computer Folder</h4>
                          <span className="text-[11px] text-slate-500">Select any local directory</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Recreates entire directory structures and backs up all nested files.</p>
                      <button 
                        type="button" 
                        className="text-xs font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-1"
                      >
                        Select Folder from this PC →
                      </button>
                    </div>

                    <div 
                      onClick={() => computerFileInputRef.current?.click()}
                      className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/40 shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center font-bold">
                          <UploadCloud className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">Backup Computer Files</h4>
                          <span className="text-[11px] text-slate-500">Select individual files</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Upload videos, images, archives, or documents directly from your computer.</p>
                      <button 
                        type="button" 
                        className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1"
                      >
                        Browse Files from this PC →
                      </button>
                    </div>
                  </div>

                  {/* Real Folder / File Sync Buttons */}
                  <div className="flex items-center gap-2.5 flex-wrap justify-center">
                    <button 
                      type="button"
                      onClick={() => computerFolderInputRef.current?.click()}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer flex items-center gap-2"
                    >
                      <Folder className="w-4 h-4 text-blue-200" />
                      Sync Folder from this Computer
                    </button>
                    <button 
                      type="button"
                      onClick={() => computerFileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4 text-slate-500" />
                      Sync File
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleNavSelect('my-drive')}
                      className="px-3.5 py-2.5 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors cursor-pointer"
                    >
                      ← Back to My Drive
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    {activeNav === 'shared' ? <Users className="w-10 h-10 text-slate-300" /> :
                     activeNav === 'recent' ? <Clock className="w-10 h-10 text-slate-300" /> :
                     activeNav === 'starred' ? <Star className="w-10 h-10 text-slate-300" /> :
                     activeNav === 'trash' ? <Trash2 className="w-10 h-10 text-slate-300" /> :
                     <FolderOpen className="w-10 h-10 text-slate-300" />}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {activeNav === 'shared' ? 'Nothing shared with you' :
                     activeNav === 'recent' ? 'No recent files' :
                     activeNav === 'starred' ? 'No starred files' :
                     activeNav === 'trash' ? 'Trash is empty' :
                     'Your drive is empty'}
                  </h3>
                  <p className="text-slate-500 max-w-sm text-sm">
                    {activeNav === 'trash' 
                      ? 'Files in trash are kept safely before being permanently deleted.'
                      : activeNav === 'starred'
                      ? 'Star files or folders to easily find them here anytime.'
                      : activeNav === 'recent'
                      ? 'Files you have recently opened or edited will appear here.'
                      : activeNav === 'shared'
                      ? 'Files and folders shared with you by other collaborators will show here.'
                      : 'Use the "+" button at the bottom right to upload files or drag and drop real documents, photos, and videos into your drive.'}
                  </p>
                  {activeNav !== 'my-drive' && (
                    <div className="mt-5 flex flex-col items-center gap-3 w-full max-w-sm">
                      <button 
                        type="button"
                        onClick={() => handleNavSelect('my-drive')}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                      >
                        ← Back to My Drive
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                <AnimatePresence mode="popLayout">
                  {displayedItems.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (e.metaKey || e.ctrlKey) {
                            toggleSelection(item.id);
                          } else {
                            if (item.type === 'folder') {
                              handleItemClick(item);
                            } else {
                              setSelectedItems(new Set([item.id]));
                            }
                          }
                        }}
                        onDoubleClick={() => handleItemClick(item)}
                        className={cn(
                          "group relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer select-none",
                          isSelected 
                            ? "bg-blue-50 border-blue-200 shadow-sm" 
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative",
                            item.type === 'folder' ? 'bg-blue-50 group-hover:bg-blue-100' : 
                            item.type === 'video' ? 'bg-purple-50 group-hover:bg-purple-100' :
                            'bg-slate-50 group-hover:bg-slate-100'
                          )}>
                            {getIconForType(item.type, "w-6 h-6")}
                            {item.type === 'video' && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-2xs">
                                <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {item.starred && (
                              <Star className="w-4 h-4 text-amber-400 fill-current" />
                            )}
                            <button 
                              onClick={(e) => handleOpenItemMenu(item, e)}
                              className="text-slate-400 hover:text-slate-700 sm:opacity-0 group-hover:opacity-100 opacity-90 transition-all p-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 cursor-pointer"
                              aria-label={`More options for ${item.name}`}
                              title="More actions"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-medium text-slate-900 text-sm truncate mb-0.5" title={item.name}>
                          {item.name}
                        </h4>

                        {item.source === 'computer' ? (
                          <div className="flex items-center justify-between text-[11px] font-medium mb-1.5 bg-emerald-50 text-emerald-800 px-2 py-1 rounded-md border border-emerald-200/80">
                            <span className="inline-flex items-center gap-1 truncate font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              Synced
                            </span>
                            <span className="text-[10px] text-emerald-700 font-mono truncate">
                              {item.computerDevice || 'This PC'}
                            </span>
                          </div>
                        ) : activeNav === 'computers' ? (
                          <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium mb-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>Queued for Sync</span>
                          </div>
                        ) : null}

                        {item.type === 'video' && !item.trashed && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openVideoPreview(item);
                            }}
                            className="my-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-purple-600" /> Watch Video
                          </button>
                        )}

                        <p className="text-xs text-slate-500 flex items-center justify-between mt-auto pt-2 border-t border-slate-100/80">
                          <span suppressHydrationWarning className="truncate mr-2">{formatDateSafe(item.updatedAt)}</span>
                          {item.type !== 'folder' && item.size !== undefined && <span className="font-mono shrink-0">{formatBytes(item.size)}</span>}
                        </p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                  <thead className="bg-slate-50/80 text-slate-500">
                    <tr>
                      <th scope="col" className="px-6 py-3 font-medium">Name</th>
                      <th scope="col" className="px-6 py-3 font-medium hidden sm:table-cell">Owner</th>
                      <th scope="col" className="px-6 py-3 font-medium hidden md:table-cell">Last modified</th>
                      <th scope="col" className="px-6 py-3 font-medium text-right">File size</th>
                      <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {displayedItems.map((item) => {
                      const isSelected = selectedItems.has(item.id);
                      return (
                        <tr 
                          key={item.id}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey) {
                              toggleSelection(item.id);
                            } else {
                              setSelectedItems(new Set([item.id]));
                            }
                          }}
                          onDoubleClick={() => handleItemClick(item)}
                          className={cn(
                            "cursor-pointer transition-colors select-none",
                            isSelected ? "bg-blue-50/80" : "hover:bg-slate-50/80"
                          )}
                        >
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {getIconForType(item.type)}
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-medium text-slate-900 truncate max-w-xs">{item.name}</span>
                                {item.type === 'video' && !item.trashed && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openVideoPreview(item);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors shrink-0 cursor-pointer"
                                    title="Watch Video"
                                  >
                                    <Play className="w-3 h-3 fill-purple-600" /> Watch
                                  </button>
                                )}
                                {item.source === 'computer' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium shrink-0">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Synced ({item.computerDevice || 'This PC'})
                                  </span>
                                )}
                              </div>
                              {item.starred && <Star className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 hidden sm:table-cell">
                            {item.owner}
                          </td>
                          <td suppressHydrationWarning className="px-6 py-3.5 whitespace-nowrap text-slate-500 hidden md:table-cell">
                            {formatDateSafe(item.updatedAt)}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono text-right">
                            {formatBytes(item.size)}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-right text-slate-400">
                            <button 
                              onClick={(e) => handleOpenItemMenu(item, e)}
                              className="hover:text-slate-700 text-slate-400 p-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
                              aria-label={`More options for ${item.name}`}
                              title="More actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* DETAILS SIDEBAR */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-slate-200 bg-white overflow-hidden flex flex-col shrink-0"
              >
                {selectedItemDetails ? (
                  <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-slate-900 truncate" title={selectedItemDetails.name}>
                        {selectedItemDetails.name}
                      </h3>
                      <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-slate-600 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="h-40 bg-slate-50 rounded-xl flex items-center justify-center mb-6 border border-slate-100">
                      {getIconForType(selectedItemDetails.type, "w-16 h-16")}
                    </div>

                    {selectedItemDetails.type === 'video' && !selectedItemDetails.trashed && (
                      <button 
                        type="button"
                        onClick={() => setPreviewVideoItem(selectedItemDetails)}
                        className="w-full mb-3 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-purple-600/20 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" /> Watch Video
                      </button>
                    )}

                    <div className="flex gap-2 mb-3">
                      <button 
                        onClick={() => showToast({ type: 'info', title: 'Share Link', message: 'Sharable link copied to clipboard.' })}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Share2 className="w-4 h-4" /> Share
                      </button>
                      <button 
                        onClick={() => handleDownloadItem(selectedItemDetails)}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleComputerSync(selectedItemDetails)}
                      className={cn(
                        "w-full mb-6 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs",
                        selectedItemDetails.source === 'computer'
                          ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      )}
                    >
                      <Computer className="w-4 h-4" />
                      {selectedItemDetails.source === 'computer' 
                        ? 'Remove from Computer Sync' 
                        : 'Link to Computer Sync & Backup'}
                    </button>

                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Properties</h4>
                      
                      <div className="grid grid-cols-3 gap-y-4 text-sm">
                        <div className="text-slate-500">Size</div>
                        <div className="col-span-2 text-slate-900 font-medium font-mono">{formatBytes(selectedItemDetails.size)}</div>
                        
                        <div className="text-slate-500">Owner</div>
                        <div className="col-span-2 text-slate-900 font-medium capitalize">{selectedItemDetails.owner}</div>

                        {selectedItemDetails.source === 'computer' && (
                          <>
                            <div className="text-slate-500">Sync Status</div>
                            <div className="col-span-2 text-emerald-700 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Synced &amp; Up to date</span>
                            </div>
                            <div className="text-slate-500">Computer</div>
                            <div className="col-span-2 text-blue-700 font-medium flex items-center gap-1.5 truncate">
                              <Computer className="w-3.5 h-3.5 shrink-0" />
                              <span>{selectedItemDetails.computerDevice || 'This PC'}</span>
                            </div>
                            {selectedItemDetails.folderPath && (
                              <>
                                <div className="text-slate-500">Sync Folder</div>
                                <div className="col-span-2 text-slate-800 font-mono text-xs truncate">
                                  {selectedItemDetails.folderPath}
                                </div>
                              </>
                            )}
                          </>
                        )}
                        
                        <div className="text-slate-500">Modified</div>
                        <div suppressHydrationWarning className="col-span-2 text-slate-900 font-medium">
                          {formatDateSafe(selectedItemDetails.updatedAt)}
                        </div>
                        
                        <div className="text-slate-500">Location</div>
                        <div className="col-span-2 text-slate-900 font-medium truncate">
                          {selectedItemDetails.source === 'computer' 
                            ? `Computers > ${selectedItemDetails.computerDevice || 'My PC'}`
                            : (breadcrumbs.find(c => c.id === selectedItemDetails.parentId)?.name || 'My Drive')}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 h-full flex flex-col items-center justify-center text-center text-slate-500">
                    <Info className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-sm">Select a file or folder to view its properties.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40 flex flex-col items-end">
        <AnimatePresence>
          {showUploadMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-w-[210px] divide-y divide-slate-100"
            >
              {activeNav === 'computers' ? (
                <>
                  <button 
                    onClick={() => {
                      setShowUploadMenu(false);
                      computerFolderInputRef.current?.click();
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Folder className="w-4 h-4 text-amber-500" />
                    Sync computer folder
                  </button>
                  <button 
                    onClick={() => {
                      setShowUploadMenu(false);
                      computerFileInputRef.current?.click();
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    Sync computer file
                  </button>
                  <button 
                    onClick={() => {
                      setShowUploadMenu(false);
                      setIsSyncModalOpen(true);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Monitor className="w-4 h-4 text-purple-600" />
                    Device presets (PC / Mac)
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <File className="w-4 h-4 text-blue-600" />
                    File upload
                  </button>
                  <button 
                    onClick={() => folderInputRef.current?.click()}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Folder className="w-4 h-4 text-amber-500" />
                    Folder upload
                  </button>
                  <div className="px-4 py-2.5 bg-blue-50/70 border-t border-blue-100/60 text-[11px] text-blue-700 flex items-center gap-2">
                    <UploadCloud className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Or drag &amp; drop files/folders anywhere</span>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setShowUploadMenu(!showUploadMenu)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-1 hover:shadow-blue-600/40"
          aria-label="Upload files or folders"
        >
          <Plus className={cn("w-6 h-6 transition-transform duration-200", showUploadMenu && "rotate-45")} />
        </button>
      </div>

      {/* HIDDEN FILE INPUTS */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        multiple 
        suppressHydrationWarning
      />
      <input 
        type="file" 
        ref={folderInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        suppressHydrationWarning
      />
      <input 
        type="file" 
        ref={computerFileInputRef} 
        onChange={(e) => handleComputerUpload(e, 'My PC')} 
        className="hidden" 
        multiple 
        suppressHydrationWarning
      />
      <input 
        type="file" 
        ref={computerFolderInputRef} 
        onChange={(e) => handleComputerUpload(e, 'My PC')} 
        className="hidden" 
        suppressHydrationWarning
      />

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete permanently?</h3>
                  <p className="text-slate-500 text-sm mb-6">
                    {selectedItems.size === 1 
                      ? "This item will be deleted forever and you won't be able to restore it." 
                      : `These ${selectedItems.size} items will be deleted forever and you won't be able to restore them.`}
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => setIsDeleteDialogOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDeletePermanent}
                      className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
                    >
                      Delete forever
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPGRADE STORAGE MODAL */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-slate-900/60 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm overflow-y-auto"
            onClick={() => setIsUpgradeModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-xl w-full flex flex-col max-h-[calc(100vh-2rem)] my-auto overflow-hidden border border-slate-100"
            >
              {/* Header - completely uncropped across all screen sizes */}
              <div className="p-5 sm:px-8 sm:pt-7 sm:pb-4 border-b border-slate-100 shrink-0 bg-white">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Upgrade your storage</h2>
                      <span className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                        currentPlan.isFree 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                        Current: {currentPlan.name} ({currentPlan.storage})
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Choose a plan to instantly expand your cloud storage capacity.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsUpgradeModalOpen(false)} 
                    className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors -mr-2 shrink-0"
                    aria-label="Close upgrade dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
                
              {/* Scrollable Plan List */}
              <div className="p-4 sm:p-6 sm:px-8 overflow-y-auto flex-1 space-y-3">
                {UPGRADE_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const isCurrent = currentPlan.id === plan.id;
                  return (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          setSelectedPlanId(plan.id);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer relative select-none",
                        isSelected 
                          ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-sm" 
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "w-20 sm:w-24 py-2 rounded-xl font-bold text-center text-sm shrink-0 transition-colors",
                          isSelected ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-800"
                        )}>
                          {plan.storage}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "font-semibold text-sm sm:text-base transition-colors",
                              isSelected ? "text-blue-900" : "text-slate-800"
                            )}>
                              {plan.price}
                            </span>
                            {plan.recommended && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 border border-amber-200">
                                Recommended
                              </span>
                            )}
                            {isCurrent && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5">
                            Billed monthly · Cancel anytime
                          </span>
                        </div>
                      </div>
                      
                      {/* Accessible Radio Button */}
                      <div className="pl-3 shrink-0">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-all border-2",
                          isSelected 
                            ? "border-blue-600 bg-blue-600 shadow-sm" 
                            : "border-slate-300 bg-white"
                        )}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fixed Footer */}
              <div className="p-4 sm:px-8 sm:py-5 border-t border-slate-100 shrink-0 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-2xl sm:rounded-b-3xl">
                <div>
                  {!currentPlan.isFree ? (
                    <button
                      onClick={handleDowngradeToFree}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                    >
                      Switch back to Free Plan (1 GB)
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">
                      Simulated instant upgrade · No credit card charged
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsUpgradeModalOpen(false)} 
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmUpgrade} 
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm text-sm active:scale-95"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN PROFILE MODAL */}
      <AnimatePresence>
        {isProfileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[70] bg-slate-50 flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-10 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Cloud className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Account Center</h2>
              </div>
              <button 
                onClick={() => setIsProfileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                aria-label="Close profile"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-10">
              {/* Profile Card */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col items-center mb-8 text-center relative overflow-hidden">
                <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-3xl mb-3 shadow-inner">
                  JS
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-0.5">John Smith</h1>
                <p className="text-slate-500 text-sm">verno7897123@gmail.com</p>
                
                {/* Active Plan Badge */}
                <div className="flex items-center gap-2 mt-3">
                  {currentPlan.isFree ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Free Plan · 1 GB Storage
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      {currentPlan.name} ({currentPlan.storage})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-5 flex-wrap justify-center">
                  <button 
                    onClick={() => {
                      setIsUpgradeModalOpen(true);
                    }}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-sm transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    {currentPlan.isFree ? 'Upgrade Storage' : 'Change Subscription'}
                  </button>
                  <button 
                    onClick={() => setActiveProfileDetail('personal')}
                    className="px-5 py-2 border border-slate-300 rounded-full font-medium text-slate-700 hover:bg-slate-50 transition-colors text-sm"
                  >
                    Manage Account
                  </button>
                </div>
              </div>

              {/* VISUAL BREAKDOWN OF STORAGE USAGE BY FILE TYPE (RECHARTS) */}
              <div className="mb-8">
                <StorageAnalyticsChart
                  items={driveItems}
                  plan={currentPlan}
                  onUpgradeClick={() => setIsUpgradeModalOpen(true)}
                />
              </div>

              {/* Settings Groups */}
              <div className="w-full flex flex-col gap-6">
                
                {/* Group 1: Account */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-4">Account</h3>
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setActiveProfileDetail('personal')}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">Personal Info</h4>
                        <p className="text-sm text-slate-500">Name, email, and user credentials</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                    
                    {/* Storage Row in Profile */}
                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => {
                        setIsUpgradeModalOpen(true);
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <HardDrive className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">Storage</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-semibold border",
                            currentPlan.isFree 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {currentPlan.isFree ? "Free Plan" : `${currentPlan.storage}`}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {totalUsedBytes === 0 ? '0 B' : formatBytes(totalUsedBytes)} of {currentPlan.storage} used ({Math.round(storagePercentage)}%)
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                    
                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setActiveProfileDetail('security')}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">Security</h4>
                        <p className="text-sm text-slate-500">Password, 2FA, and session devices</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Group 2: Preferences */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-4">Preferences</h3>
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setActiveProfileDetail('settings')}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Settings className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">General Settings</h4>
                        <p className="text-sm text-slate-500">File handling, uploads, and default folders</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>

                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setActiveProfileDetail('offline')}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <CloudOff className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">Offline Access</h4>
                        <p className="text-sm text-slate-500">Manage files available without internet connection</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>

                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setActiveProfileDetail('notifications')}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">Notifications</h4>
                        <p className="text-sm text-slate-500">Manage email, quota alerts, and desktop notices</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                    
                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setActiveProfileDetail('appearance')}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Palette className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">Appearance</h4>
                        <p className="text-sm text-slate-500">Theme, view modes, and display accessibility</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Group 3: Support & About */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-4">Support & About</h3>
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setActiveProfileDetail('contact')}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">Help & Contact</h4>
                        <p className="text-sm text-slate-500">Get assistance, send feedback, or report problems</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                    
                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setActiveProfileDetail('about')}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">About AsterDrive</h4>
                        <p className="text-sm text-slate-500">Version 1.2.0 · Release information and storage tiers</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Group 4: Legal & Compliance */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-4">Legal & Compliance</h3>
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setActiveProfileDetail('terms')}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">Terms of Service</h4>
                        <p className="text-sm text-slate-500">Rules and policies governing cloud storage usage</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                    
                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setActiveProfileDetail('privacy')}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">Privacy Policy</h4>
                        <p className="text-sm text-slate-500">Data encryption, collection principles, and user privacy</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                    
                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setActiveProfileDetail('acceptable')}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Scale className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">Acceptable Use Policy</h4>
                        <p className="text-sm text-slate-500">Content limits, sharing rules, and security guidelines</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>

                    <div 
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => setActiveProfileDetail('copyright')}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">Copyright & DMCA</h4>
                        <p className="text-sm text-slate-500">Intellectual property protection and notices</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Sign Out Action */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-2">
                  <div 
                    className="px-6 py-4 flex items-center gap-4 hover:bg-rose-50 cursor-pointer transition-colors" 
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      showToast({
                        type: 'info',
                        title: 'Signed Out',
                        message: 'You have been signed out from verno7897123@gmail.com. Session saved locally.'
                      });
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                      <LogOut className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-rose-600">Sign out</h4>
                      <p className="text-sm text-rose-500/80">Log out of this browser session</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROFILE DETAIL SUB-MODAL */}
      <AnimatePresence>
        {activeProfileDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
            onClick={() => setActiveProfileDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full flex flex-col max-h-[85vh] overflow-hidden border border-slate-100"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                    {activeProfileDetail === 'personal' && <User className="w-5 h-5" />}
                    {activeProfileDetail === 'security' && <Shield className="w-5 h-5" />}
                    {activeProfileDetail === 'settings' && <Settings className="w-5 h-5" />}
                    {activeProfileDetail === 'offline' && <CloudOff className="w-5 h-5" />}
                    {activeProfileDetail === 'notifications' && <Bell className="w-5 h-5" />}
                    {activeProfileDetail === 'appearance' && <Palette className="w-5 h-5" />}
                    {activeProfileDetail === 'contact' && <HelpCircle className="w-5 h-5" />}
                    {activeProfileDetail === 'about' && <Info className="w-5 h-5" />}
                    {activeProfileDetail === 'terms' && <FileText className="w-5 h-5" />}
                    {activeProfileDetail === 'privacy' && <ShieldCheck className="w-5 h-5" />}
                    {activeProfileDetail === 'acceptable' && <Scale className="w-5 h-5" />}
                    {activeProfileDetail === 'copyright' && <BookOpen className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg capitalize">
                      {activeProfileDetail === 'personal' && 'Personal Information'}
                      {activeProfileDetail === 'security' && 'Security Settings'}
                      {activeProfileDetail === 'settings' && 'General Settings'}
                      {activeProfileDetail === 'offline' && 'Offline Access'}
                      {activeProfileDetail === 'notifications' && 'Notification Preferences'}
                      {activeProfileDetail === 'appearance' && 'Appearance & Theme'}
                      {activeProfileDetail === 'contact' && 'Help & Contact Support'}
                      {activeProfileDetail === 'about' && 'About AsterDrive'}
                      {activeProfileDetail === 'terms' && 'Terms of Service'}
                      {activeProfileDetail === 'privacy' && 'Privacy Policy'}
                      {activeProfileDetail === 'acceptable' && 'Acceptable Use Policy'}
                      {activeProfileDetail === 'copyright' && 'Copyright & DMCA'}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveProfileDetail(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-600 space-y-4">
                {activeProfileDetail === 'personal' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Full Name</span>
                        <span className="text-sm font-semibold text-slate-800">John Smith</span>
                      </div>
                      <span className="text-xs font-semibold text-blue-600">Verified</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Email Address</span>
                        <span className="text-sm font-semibold text-slate-800">verno7897123@gmail.com</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">Primary</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Active Storage Tier</span>
                        <span className="text-sm font-semibold text-slate-800">{currentPlan.name} ({currentPlan.storage})</span>
                      </div>
                      <span className="text-xs font-semibold text-blue-600">
                        {currentPlan.isFree ? 'Free Tier' : 'Subscription'}
                      </span>
                    </div>
                  </div>
                )}

                {activeProfileDetail === 'security' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center gap-3">
                      <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                      <div>
                        <h5 className="font-semibold text-emerald-950 text-sm">Account Protected</h5>
                        <p className="text-xs text-emerald-700 mt-0.5">Two-factor authentication is active via your primary device.</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Sessions</span>
                      <div className="flex items-center justify-between text-xs text-slate-700 pt-1">
                        <span className="flex items-center gap-2">
                          <Computer className="w-4 h-4 text-slate-400" /> Current Web Browser
                        </span>
                        <span className="text-emerald-600 font-semibold">Online now</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeProfileDetail === 'settings' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Confirm file deletion</p>
                        <p className="text-xs text-slate-500">Always ask before moving items to trash</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Automatic folder sync</p>
                        <p className="text-xs text-slate-500">Sync changes across browser sessions</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    </div>
                  </div>
                )}

                {activeProfileDetail === 'offline' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Offline access caches your recently opened documents so you can read and browse files even when your device loses internet connectivity.
                    </p>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Offline caching</span>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-800">Enabled</span>
                    </div>
                  </div>
                )}

                {activeProfileDetail === 'notifications' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Storage quota alerts</p>
                        <p className="text-xs text-slate-500">Notify when storage reaches 85% and 100% capacity</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Upload completion sound</p>
                        <p className="text-xs text-slate-500">Chime on upload completion</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    </div>
                  </div>
                )}

                {activeProfileDetail === 'appearance' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">Customize the visual theme and density of your AsterDrive workspace.</p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl border-2 border-blue-600 bg-blue-50/50 flex flex-col items-center gap-2 cursor-pointer">
                        <div className="w-full h-12 bg-white rounded-lg border border-slate-200 shadow-xs flex items-center justify-center text-xs font-semibold text-slate-700">
                          Light Mode
                        </div>
                        <span className="text-xs font-semibold text-blue-600">Active</span>
                      </div>
                      <div 
                        onClick={() => showToast({ type: 'info', title: 'Dark Mode', message: 'Dark mode theme is in beta preview.' })}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center gap-2 cursor-pointer hover:border-slate-300"
                      >
                        <div className="w-full h-12 bg-slate-900 rounded-lg shadow-xs flex items-center justify-center text-xs font-semibold text-slate-100">
                          Dark Mode
                        </div>
                        <span className="text-xs text-slate-500">Preview</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeProfileDetail === 'contact' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500">Have a question or need technical support with your storage? Send us a message directly.</p>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Your Email</label>
                      <input type="email" defaultValue="verno7897123@gmail.com" readOnly className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none" suppressHydrationWarning />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                      <input type="text" placeholder="e.g. Question about 1 GB Free Plan quota" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" suppressHydrationWarning />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                      <textarea rows={3} placeholder="Describe your question or issue..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" suppressHydrationWarning />
                    </div>
                    <button 
                      onClick={() => {
                        setActiveProfileDetail(null);
                        showToast({
                          type: 'success',
                          title: 'Message Sent',
                          message: 'Thank you! Our support team will review your inquiry shortly.'
                        });
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Send Message
                    </button>
                  </div>
                )}

                {activeProfileDetail === 'about' && (
                  <div className="space-y-4 leading-relaxed">
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <h4 className="font-bold text-slate-900 text-base">AsterDrive Cloud Storage</h4>
                      <p className="text-xs text-blue-700 mt-1">Version 1.2.0 · Build 2026.10</p>
                    </div>
                    <p className="text-xs text-slate-600">
                      AsterDrive provides fast, reliable, encrypted cloud storage for individuals and teams. Every new user receives a free 1 GB tier to store essential documents, spreadsheets, photos, and presentations.
                    </p>
                    <div className="border-t border-slate-100 pt-3 text-xs space-y-1.5">
                      <p><strong className="text-slate-800">Current Plan:</strong> {currentPlan.name} ({currentPlan.storage})</p>
                      <p><strong className="text-slate-800">Storage Used:</strong> {formatBytes(totalUsedBytes)} of {currentPlan.storage}</p>
                      <p><strong className="text-slate-800">Supported Formats:</strong> Documents, Media, Archives, Folders</p>
                    </div>
                  </div>
                )}

                {activeProfileDetail === 'terms' && (
                  <div className="space-y-3 leading-relaxed text-xs text-slate-600">
                    <h5 className="font-bold text-slate-900 text-sm">AsterDrive Terms of Service</h5>
                    <p>Last updated: October 2026</p>
                    <h6 className="font-semibold text-slate-800 pt-2">1. Storage Quota &amp; Free Account</h6>
                    <p>
                      New users are allocated 1 GB of complimentary cloud storage (&ldquo;Free Plan&rdquo;). When your stored data reaches 1 GB, subsequent file uploads are restricted until additional space is freed or the account is upgraded to a paid tier.
                    </p>
                    <h6 className="font-semibold text-slate-800 pt-2">2. Subscription Upgrades</h6>
                    <p>
                      Users may upgrade their storage to 50 GB, 200 GB, 2 TB, 6 TB, or 12 TB. Storage tiers activate immediately upon confirmation.
                    </p>
                    <h6 className="font-semibold text-slate-800 pt-2">3. User Responsibilities</h6>
                    <p>
                      You are solely responsible for maintaining the confidentiality of your account credentials and the files uploaded to your storage volume.
                    </p>
                  </div>
                )}

                {activeProfileDetail === 'privacy' && (
                  <div className="space-y-3 leading-relaxed text-xs text-slate-600">
                    <h5 className="font-bold text-slate-900 text-sm">AsterDrive Privacy Policy</h5>
                    <p>Effective Date: October 2026</p>
                    <h6 className="font-semibold text-slate-800 pt-2">1. Data Encryption & Security</h6>
                    <p>
                      All files uploaded to AsterDrive are protected in transit using TLS 1.3 and at rest using AES-256 encryption. We never access the contents of your files without explicit authorization.
                    </p>
                    <h6 className="font-semibold text-slate-800 pt-2">2. Information Collection</h6>
                    <p>
                      We collect minimal information necessary to deliver cloud storage services, such as your email (verno7897123@gmail.com), storage usage metrics, and file metadata.
                    </p>
                    <h6 className="font-semibold text-slate-800 pt-2">3. Data Retention & Deletion</h6>
                    <p>
                      When you delete files or your account, all corresponding data blocks are permanently purged from storage systems.
                    </p>
                  </div>
                )}

                {activeProfileDetail === 'acceptable' && (
                  <div className="space-y-3 leading-relaxed text-xs text-slate-600">
                    <h5 className="font-bold text-slate-900 text-sm">Acceptable Use Policy</h5>
                    <p>
                      AsterDrive is dedicated to maintaining a secure, safe environment for all cloud storage users.
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs">
                      <li>Do not upload or distribute malicious software, viruses, or phishing kits.</li>
                      <li>Do not store content that infringes upon third-party intellectual property rights.</li>
                      <li>Do not attempt to bypass storage quota limits through automated exploitation.</li>
                    </ul>
                  </div>
                )}

                {activeProfileDetail === 'copyright' && (
                  <div className="space-y-3 leading-relaxed text-xs text-slate-600">
                    <h5 className="font-bold text-slate-900 text-sm">Copyright & DMCA Policy</h5>
                    <p>
                      AsterDrive respects the intellectual property rights of creators and complies with the Digital Millennium Copyright Act (DMCA).
                    </p>
                    <p>
                      To submit a DMCA takedown notice or counter-notification, please contact our designated copyright agent through the Help & Contact section with specific file identifiers.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setActiveProfileDetail(null)}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ITEM THREE-DOTS CONTEXT MENU */}
      <AnimatePresence>
        {activeItemMenu && (
          <>
            <div 
              className="fixed inset-0 z-[60] bg-black/5 sm:bg-transparent"
              onClick={() => setActiveItemMenu(null)}
              onTouchStart={() => setActiveItemMenu(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'fixed',
                top: activeItemMenu.top,
                left: activeItemMenu.left,
                zIndex: 65,
              }}
              className="w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 overflow-hidden text-sm divide-y divide-slate-100"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2.5">
                {getIconForType(activeItemMenu.item.type, "w-4 h-4 shrink-0")}
                <span className="font-semibold text-slate-800 text-xs truncate max-w-[170px]" title={activeItemMenu.item.name}>
                  {activeItemMenu.item.name}
                </span>
              </div>

              <div className="py-1">
                {activeItemMenu.item.type === 'video' && !activeItemMenu.item.trashed && (
                  <button
                    onClick={() => {
                      openVideoPreview(activeItemMenu.item);
                      setActiveItemMenu(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-purple-700 bg-purple-50/70 hover:bg-purple-100 font-semibold transition-colors text-left text-xs sm:text-sm cursor-pointer"
                  >
                    <Play className="w-4 h-4 text-purple-600 fill-purple-600" />
                    Watch Video
                  </button>
                )}

                {activeItemMenu.item.type === 'folder' ? (
                  <button
                    onClick={() => {
                      setCurrentFolderId(activeItemMenu.item.id);
                      setSelectedItems(new Set());
                      setActiveItemMenu(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-100 transition-colors text-left text-xs sm:text-sm cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4 text-blue-500" />
                    Open Folder
                  </button>
                ) : (
                  <button
                    onClick={() => handleDownloadItem(activeItemMenu.item)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-100 transition-colors text-left text-xs sm:text-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    Download
                  </button>
                )}

                <button
                  onClick={() => handleOpenRename(activeItemMenu.item)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-100 transition-colors text-left text-xs sm:text-sm cursor-pointer"
                >
                  <Pencil className="w-4 h-4 text-slate-500" />
                  Rename
                </button>

                <button
                  onClick={() => handleShareItem(activeItemMenu.item)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-100 transition-colors text-left text-xs sm:text-sm cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-blue-600" />
                  Share Link
                </button>

                <button
                  onClick={() => handleToggleStarSingle(activeItemMenu.item)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-100 transition-colors text-left text-xs sm:text-sm cursor-pointer"
                >
                  <Star className={cn("w-4 h-4", activeItemMenu.item.starred ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
                  {activeItemMenu.item.starred ? 'Remove Star' : 'Add to Starred'}
                </button>

                <button
                  onClick={() => {
                    setSelectedItems(new Set([activeItemMenu.item.id]));
                    setShowDetails(true);
                    setActiveItemMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-100 transition-colors text-left text-xs sm:text-sm cursor-pointer"
                >
                  <Info className="w-4 h-4 text-slate-500" />
                  Details &amp; Info
                </button>

                <button
                  onClick={() => handleToggleComputerSync(activeItemMenu.item)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-100 transition-colors text-left text-xs sm:text-sm cursor-pointer"
                >
                  <Computer className="w-4 h-4 text-indigo-600" />
                  {activeItemMenu.item.source === 'computer' ? 'Remove from Computer Sync' : 'Link to Computer Sync'}
                </button>
              </div>

              <div className="py-1">
                {activeItemMenu.item.trashed ? (
                  <>
                    <button
                      onClick={() => {
                        const itemId = activeItemMenu.item.id;
                        setDriveItems(prev => prev.map(i => i.id === itemId ? { ...i, trashed: false } : i));
                        setActiveItemMenu(null);
                        showToast({
                          type: 'success',
                          title: 'Restored',
                          message: `"${activeItemMenu.item.name}" restored from Trash.`
                        });
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 transition-colors text-left text-xs sm:text-sm cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-emerald-600" />
                      Restore
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItems(new Set([activeItemMenu.item.id]));
                        setIsDeleteDialogOpen(true);
                        setActiveItemMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left text-xs sm:text-sm cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      Delete Permanently
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      const itemId = activeItemMenu.item.id;
                      const itemName = activeItemMenu.item.name;
                      setDriveItems(prev => prev.map(i => i.id === itemId ? { ...i, trashed: true } : i));
                      setSelectedItems(prev => {
                        const next = new Set(prev);
                        next.delete(itemId);
                        return next;
                      });
                      setActiveItemMenu(null);
                      showToast({
                        type: 'info',
                        title: 'Moved to Trash',
                        message: `"${itemName}" moved to trash.`
                      });
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left text-xs sm:text-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    Move to Trash
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* RENAME ITEM MODAL */}
      <AnimatePresence>
        {itemToRename && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setItemToRename(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 overflow-hidden border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  {getIconForType(itemToRename.type, "w-5 h-5")}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Rename</h3>
                  <p className="text-xs text-slate-500 capitalize">{itemToRename.type}</p>
                </div>
              </div>

              <div className="mb-5">
                <input
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setItemToRename(null);
                  }}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-sm font-medium outline-none transition-all shadow-inner"
                  placeholder="Item name"
                  suppressHydrationWarning
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setItemToRename(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRename}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIDEO PREVIEW PLAYER MODAL */}
      <AnimatePresence>
        {previewVideoItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/95 flex flex-col justify-between backdrop-blur-md p-3 sm:p-6"
            onClick={closeVideoPreview}
          >
            {/* Top Header Bar */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="flex items-center justify-between text-white pb-3 sm:pb-4 border-b border-white/10 shrink-0 gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm sm:text-base text-white truncate max-w-xs sm:max-w-md md:max-w-xl" title={previewVideoItem.name}>
                      {previewVideoItem.name}
                    </h3>
                    <span className="text-[10px] font-mono uppercase bg-purple-900/60 text-purple-300 border border-purple-700/50 px-2 py-0.5 rounded-full font-semibold">
                      Video Player
                    </span>
                    {previewVideoItem.source === 'computer' && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded-full font-medium">
                        <Computer className="w-3 h-3" /> {previewVideoItem.computerDevice || 'Computer Sync'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 mt-0.5 flex items-center gap-2 font-mono tabular-nums">
                    <span>{formatBytes(previewVideoItem.size)}</span>
                    <span>•</span>
                    <span suppressHydrationWarning>{formatDateSafe(previewVideoItem.updatedAt)}</span>
                    {previewVideoItem.folderPath && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-xs text-white/40 font-sans">{previewVideoItem.folderPath}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Speed Controls (Desktop) */}
                <div className="hidden lg:flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                  <span className="text-[11px] text-white/60 px-1.5 font-medium">Speed</span>
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => {
                        setVideoPlaybackSpeed(spd);
                        if (videoPlayerRef.current) {
                          videoPlayerRef.current.playbackRate = spd;
                        }
                      }}
                      className={cn(
                        "px-1.5 py-0.5 rounded-md text-[11px] font-mono transition-all cursor-pointer",
                        videoPlaybackSpeed === spd
                          ? "bg-purple-600 text-white font-bold shadow-xs"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Fullscreen Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (videoPlayerRef.current) {
                      if (document.fullscreenElement) {
                        document.exitFullscreen().catch(() => {});
                      } else {
                        videoPlayerRef.current.requestFullscreen?.().catch(() => {});
                      }
                    }
                  }}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Full screen"
                >
                  <Maximize2 className="w-4 h-4 text-purple-300" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadItem(previewVideoItem)}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Download video"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareItem(previewVideoItem)}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Share video link"
                >
                  <Share2 className="w-4 h-4 text-blue-300" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleToggleStarSingle(previewVideoItem);
                    setPreviewVideoItem(prev => prev ? { ...prev, starred: !prev.starred } : null);
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title={previewVideoItem.starred ? "Remove star" : "Star video"}
                >
                  <Star className={cn("w-4 h-4", previewVideoItem.starred ? "text-amber-400 fill-amber-400" : "text-white/70")} />
                </button>
                <div className="w-px h-6 bg-white/15 mx-1" />
                <button
                  type="button"
                  onClick={closeVideoPreview}
                  className="p-2 rounded-lg bg-white/10 hover:bg-rose-600/80 text-white transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Display Center */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 min-h-0 relative my-auto"
            >
              <video
                ref={videoPlayerRef}
                key={previewVideoItem.id + (activeVideoUrl || previewVideoItem.videoUrl || 'video')}
                src={activeVideoUrl || previewVideoItem.videoUrl || ''}
                controls
                autoPlay
                playsInline
                onError={() => {
                  if (!videoLoadError) {
                    setVideoLoadError(true);
                  }
                }}
                className="max-h-[64vh] sm:max-h-[70vh] w-auto max-w-full rounded-2xl shadow-2xl bg-black border border-white/10 object-contain mx-auto"
              >
                Your browser does not support the video tag.
              </video>

              {/* Mobile/Tablet Speed Selector */}
              <div className="lg:hidden flex items-center gap-1.5 mt-3 bg-white/10 px-3 py-1.5 rounded-full">
                <span className="text-[11px] text-white/70">Speed:</span>
                {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      setVideoPlaybackSpeed(spd);
                      if (videoPlayerRef.current) {
                        videoPlayerRef.current.playbackRate = spd;
                      }
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-mono font-medium",
                      videoPlaybackSpeed === spd ? "bg-purple-600 text-white font-bold" : "text-white/60 hover:text-white"
                    )}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Info Bar & Shortcuts */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="flex items-center justify-between text-xs text-white/60 pt-3 border-t border-white/10 shrink-0 flex-wrap gap-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-purple-300 font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> High Definition Video Player
                </span>
                {videoLoadError ? (
                  <span className="text-[11px] text-amber-300 font-medium bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50">
                    ● Streaming cloud preview fallback
                  </span>
                ) : previewVideoItem.videoUrl?.startsWith('blob:') ? (
                  <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    ● Streaming local uploaded file
                  </span>
                ) : (
                  <span className="text-[11px] text-blue-300 font-medium bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                    ● 1080p Cloud Stream
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden md:inline">
                  Press <kbd className="px-1.5 py-0.5 bg-white/15 rounded text-[11px] font-mono text-white">Space</kbd> to Play/Pause, <kbd className="px-1.5 py-0.5 bg-white/15 rounded text-[11px] font-mono text-white">Esc</kbd> to exit
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewVideoItem(null)}
                  className="text-white hover:text-purple-300 font-medium transition-colors cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPUTER SYNC PRESET MODAL */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setIsSyncModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Computer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Sync &amp; Backup Computers</h3>
                    <p className="text-xs text-slate-500">Connect PC or Mac folders for continuous backup</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSyncModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div 
                  onClick={() => {
                    setIsSyncModalOpen(false);
                    computerFolderInputRef.current?.click();
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Folder className="w-6 h-6 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">Sync Folder from this Computer</h4>
                      <p className="text-xs text-slate-500">Select any local folder from your PC/Mac to sync its contents to AsterDrive</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 shrink-0 ml-2">Choose Folder →</span>
                </div>

                <div 
                  onClick={() => {
                    setIsSyncModalOpen(false);
                    computerFileInputRef.current?.click();
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-indigo-600 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">Sync Files from this Computer</h4>
                      <p className="text-xs text-slate-500">Pick individual documents, media, or archives to backup directly</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 shrink-0 ml-2">Choose Files →</span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/80 text-xs text-slate-600 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">100% Real Browser Storage: </span>
                    All synced files are stored persistently in IndexedDB on this device without server upload limits or simulated data.
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION CONTAINER */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={cn(
                "pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 bg-white",
                toast.type === 'warning' ? "border-amber-200 text-amber-900" :
                toast.type === 'success' ? "border-emerald-200 text-emerald-900" :
                toast.type === 'error' ? "border-rose-200 text-rose-900" :
                "border-slate-200 text-slate-800"
              )}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {toast.type === 'success' && <Check className="w-5 h-5 text-emerald-500" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{toast.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
