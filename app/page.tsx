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
  Pencil
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
}

const initialData: DriveItem[] = [];

function formatBytes(bytes?: number, decimals = 1) {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
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

  const handleDownloadItem = (item: DriveItem) => {
    setActiveItemMenu(null);
    showToast({
      type: 'success',
      title: 'Download Started',
      message: `Downloading "${item.name}" (${formatBytes(item.size)})`
    });
    try {
      const blob = new Blob([
        `AsterDrive Cloud Storage\nFile: ${item.name}\nSize: ${formatBytes(item.size)}\nOwner: ${item.owner}\nUploaded: ${item.updatedAt}\nPlan: ${currentPlan.name}`
      ], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
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

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  // Set webkitdirectory on client safely to prevent SSR attribute mismatch
  React.useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, []);

  // Storage calculations
  const totalUsedBytes = useMemo(() => {
    return driveItems.reduce((acc, item) => acc + (item.size || 0), 0);
  }, [driveItems]);

  const storagePercentage = useMemo(() => {
    if (!currentPlan.maxBytes) return 0;
    return Math.min(100, Math.max(0, (totalUsedBytes / currentPlan.maxBytes) * 100));
  }, [totalUsedBytes, currentPlan.maxBytes]);

  // Upload handler with quota enforcement
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

      const newItems: DriveItem[] = filesArray.map(file => ({
        id: Math.random().toString(36).substring(7),
        parentId: currentFolderId,
        name: file.name,
        type: file.type.includes('image') ? 'image' : 
              file.type.includes('video') ? 'video' : 
              file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv') ? 'spreadsheet' :
              file.type.includes('zip') || file.name.endsWith('.zip') || file.name.endsWith('.rar') ? 'archive' : 'document',
        size: file.size,
        updatedAt: new Date().toISOString(),
        owner: activeNav === 'shared' ? 'colleague@example.com' : 'me',
        source: activeNav === 'computers' ? 'computer' : 'drive'
      }));

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

  // Helper to add simulated files for easy quota and upgrade testing
  const handleAddSimulatedFile = (name: string, size: number, type: ItemType) => {
    if (totalUsedBytes + size > currentPlan.maxBytes) {
      showToast({
        type: 'warning',
        title: 'Storage Quota Exceeded',
        message: `Adding "${name}" (${formatBytes(size)}) exceeds your ${currentPlan.name} quota (${currentPlan.storage}). Currently using ${formatBytes(totalUsedBytes)} of ${currentPlan.storage}.`
      });
      setIsUpgradeModalOpen(true);
      setShowUploadMenu(false);
      return;
    }

    const newItem: DriveItem = {
      id: Math.random().toString(36).substring(7),
      parentId: currentFolderId,
      name,
      type,
      size,
      updatedAt: new Date().toISOString(),
      owner: 'me',
      source: 'drive'
    };

    setDriveItems(prev => [...prev, newItem]);
    setShowUploadMenu(false);
    showToast({
      type: 'success',
      title: 'Sample File Added',
      message: `"${name}" (${formatBytes(size)}) added to your storage.`
    });
  };

  // Upgrade simulation handler
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden select-none" suppressHydrationWarning>
      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-50 border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-transparent">
          <div className="flex items-center gap-2 text-blue-600 font-display font-semibold text-xl tracking-tight">
            <Cloud className="w-7 h-7 fill-blue-100 stroke-blue-600" />
            AsterDrive
          </div>
          <button 
            className="lg:hidden text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                setSearchQuery('');
                if (item.id === 'my-drive') setCurrentFolderId('root');
                if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeNav === item.id 
                  ? "bg-blue-100/60 text-blue-700 font-semibold" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeNav === item.id ? "text-blue-600" : "text-slate-400")} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* SIDEBAR STORAGE WIDGET */}
        <div className="p-4 m-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Cloud className="w-4 h-4 text-blue-600" />
              Storage
            </div>
            {currentPlan.isFree ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Free Plan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600" />
                {currentPlan.storage} Plan
              </span>
            )}
          </div>
          
          <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-500 ease-out",
                storagePercentage >= 95 ? "bg-rose-500" :
                storagePercentage >= 80 ? "bg-amber-500" :
                "bg-blue-600"
              )}
              style={{ width: `${storagePercentage}%` }}
              suppressHydrationWarning
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-3">
            <span>{totalUsedBytes === 0 ? '0 B' : formatBytes(totalUsedBytes)} of {currentPlan.storage} used</span>
            <span className="text-slate-400 font-mono">{Math.round(storagePercentage)}%</span>
          </div>

          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsUpgradeModalOpen(true);
            }}
            className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-colors cursor-pointer active:bg-blue-100 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            {currentPlan.isFree ? 'Upgrade storage' : 'Change plan'}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-tl-2xl border-t border-l border-slate-200 shadow-sm overflow-hidden lg:my-2 lg:mr-2">
        {/* HEADER */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-100 gap-4 shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <button 
              className="lg:hidden text-slate-500 hover:bg-slate-100 p-2 rounded-lg transition-colors -ml-2 shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative w-full">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search in Drive"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-xl text-sm outline-none transition-all"
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
            {/* Quick Storage Status Indicator */}
            <div 
              onClick={() => setIsUpgradeModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <Cloud className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-slate-600">
                {formatBytes(totalUsedBytes)} / {currentPlan.storage}
              </span>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                currentPlan.isFree ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
              )}>
                {currentPlan.isFree ? "FREE" : "PRO"}
              </span>
            </div>

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
              <span className="font-medium text-slate-800 text-lg capitalize">{activeNav.replace('-', ' ')}</span>
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
            {displayedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  {activeNav === 'computers' ? <Computer className="w-10 h-10 text-slate-300" /> :
                   activeNav === 'shared' ? <Users className="w-10 h-10 text-slate-300" /> :
                   activeNav === 'recent' ? <Clock className="w-10 h-10 text-slate-300" /> :
                   activeNav === 'starred' ? <Star className="w-10 h-10 text-slate-300" /> :
                   activeNav === 'trash' ? <Trash2 className="w-10 h-10 text-slate-300" /> :
                   <FolderOpen className="w-10 h-10 text-slate-300" />}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {activeNav === 'computers' ? 'No computers syncing' :
                   activeNav === 'shared' ? 'Nothing shared with you' :
                   activeNav === 'recent' ? 'No recent files' :
                   activeNav === 'starred' ? 'No starred files' :
                   activeNav === 'trash' ? 'Trash is empty' :
                   'Your drive is empty'}
                </h3>
                <p className="text-slate-500 max-w-sm text-sm">
                  {activeNav === 'trash' 
                    ? 'Files in trash are kept safely before being emptied.'
                    : 'Use the "+" button at the bottom right to upload files, folders, or simulate file storage under your Free Plan (1 GB).'}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Upload files
                  </button>
                  <button 
                    onClick={() => handleAddSimulatedFile('Project_Assets.zip', 400 * 1024 * 1024, 'archive')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    + Add 400 MB test file
                  </button>
                </div>
              </div>
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
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                            item.type === 'folder' ? 'bg-blue-50 group-hover:bg-blue-100' : 'bg-slate-50 group-hover:bg-slate-100'
                          )}>
                            {getIconForType(item.type, "w-6 h-6")}
                          </div>
                          <div className="flex items-center gap-1">
                            {item.starred && (
                              <Star className="w-4 h-4 text-amber-400 fill-current" />
                            )}
                            <button 
                              onClick={(e) => handleOpenItemMenu(item, e)}
                              onTouchEnd={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-slate-700 sm:opacity-0 group-hover:opacity-100 opacity-90 transition-all p-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 cursor-pointer"
                              aria-label={`More options for ${item.name}`}
                              title="More actions"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <h4 className="font-medium text-slate-900 text-sm truncate mb-1" title={item.name}>
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center justify-between mt-auto pt-2">
                          <span className="truncate mr-2">{format(new Date(item.updatedAt), 'MMM d, yyyy')}</span>
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
                              <span className="font-medium text-slate-900 truncate max-w-xs">{item.name}</span>
                              {item.starred && <Star className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 hidden sm:table-cell">
                            {item.owner}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 hidden md:table-cell">
                            {format(new Date(item.updatedAt), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono text-right">
                            {formatBytes(item.size)}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-right text-slate-400">
                            <button 
                              onClick={(e) => handleOpenItemMenu(item, e)}
                              onTouchEnd={(e) => e.stopPropagation()}
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

                    <div className="flex gap-2 mb-8">
                      <button 
                        onClick={() => showToast({ type: 'info', title: 'Share Link', message: 'Sharable link copied to clipboard.' })}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Share2 className="w-4 h-4" /> Share
                      </button>
                      <button 
                        onClick={() => showToast({ type: 'success', title: 'Download Started', message: `Downloading ${selectedItemDetails.name}` })}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Properties</h4>
                      
                      <div className="grid grid-cols-3 gap-y-4 text-sm">
                        <div className="text-slate-500">Size</div>
                        <div className="col-span-2 text-slate-900 font-medium font-mono">{formatBytes(selectedItemDetails.size)}</div>
                        
                        <div className="text-slate-500">Owner</div>
                        <div className="col-span-2 text-slate-900 font-medium capitalize">{selectedItemDetails.owner}</div>
                        
                        <div className="text-slate-500">Modified</div>
                        <div className="col-span-2 text-slate-900 font-medium">
                          {format(new Date(selectedItemDetails.updatedAt), 'MMM d, yyyy')}
                        </div>
                        
                        <div className="text-slate-500">Location</div>
                        <div className="col-span-2 text-slate-900 font-medium truncate">
                          {breadcrumbs.find(c => c.id === selectedItemDetails.parentId)?.name || 'My Drive'}
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
              <div className="p-2 bg-slate-50/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                  Simulate Quota Testing
                </span>
                <button 
                  onClick={() => handleAddSimulatedFile('Design_Assets_Bundle.zip', 400 * 1024 * 1024, 'archive')}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-white hover:shadow-xs transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    <FileArchive className="w-3.5 h-3.5 text-amber-500" />
                    + 400 MB Assets
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">400 MB</span>
                </button>
                <button 
                  onClick={() => handleAddSimulatedFile('Raw_4K_Footage.mp4', 800 * 1024 * 1024, 'video')}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-white hover:shadow-xs transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-purple-500" />
                    + 800 MB Video
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">800 MB</span>
                </button>
              </div>
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
      />
      <input 
        type="file" 
        ref={folderInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
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
                      <input type="email" defaultValue="verno7897123@gmail.com" readOnly className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                      <input type="text" placeholder="e.g. Question about 1 GB Free Plan quota" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                      <textarea rows={3} placeholder="Describe your question or issue..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" />
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
            >
              <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2.5">
                {getIconForType(activeItemMenu.item.type, "w-4 h-4 shrink-0")}
                <span className="font-semibold text-slate-800 text-xs truncate max-w-[170px]" title={activeItemMenu.item.name}>
                  {activeItemMenu.item.name}
                </span>
              </div>

              <div className="py-1">
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
