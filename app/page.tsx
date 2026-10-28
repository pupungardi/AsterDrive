'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Menu,
  Cloud,
  Search,
  Plus,
  Sun,
  Moon,
  Bell,
  X,
  Home,
  FolderPlus,
  UploadCloud,
  FileText,
  LogOut,
  User,
  Settings,
  CheckCircle2,
  HardDrive,
  Users,
  Trash2,
  Clock,
  Star,
  ExternalLink,
  Laptop,
  Activity,
  ShieldCheck,
  MessageSquare,
  MessageSquarePlus,
  ChevronRight,
  Folder,
  Image as ImageIcon,
  Video,
  FileArchive,
  FileSpreadsheet,
  Download,
  Share2,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  RotateCcw,
  Check,
  AlertCircle,
  Copy,
  Info,
  Key,
  Shield,
  Smartphone,
  Sparkles,
  Camera,
  Trash,
  Play,
  Pause,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  ArrowLeft,
  ChevronLeft,
  Printer
} from 'lucide-react';
import { StorageAnalyticsChart, StorageAnalyticsItem } from '@/components/StorageAnalyticsChart';
import { saveFileBlob, getFileBlob, deleteFileBlob } from '@/lib/db';

export interface DriveItem {
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
  previewUrl?: string;
  thumbnailUrl?: string;
  computerDevice?: string;
  folderPath?: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  item: string;
  time: string;
  user: string;
}

const INITIAL_ITEMS: DriveItem[] = [];

export default function Page() {
  const [activeTab, setActiveTab] = useState<'mydrive' | 'computers' | 'shared' | 'recent' | 'starred' | 'storage' | 'activity' | 'people' | 'trash' | 'security' | 'feedback'>('mydrive');
  const [items, setItems] = useState<DriveItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      localStorage.removeItem('asterdrive_items');
      localStorage.removeItem('asterdrive_items_demo');
      const savedItems = localStorage.getItem('asterdrive_items_v2');
      if (savedItems) {
        const parsed = JSON.parse(savedItems) as DriveItem[];
        return parsed.filter(
          (it) => it.id && (it.id.startsWith('file_') || it.id.startsWith('f_'))
        );
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([{ id: 'root', name: 'My Drive' }]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Menus & Modals
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'storage' | 'notifications' | 'shortcuts'>('general');
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    if (typeof window === 'undefined') return 'comfortable';
    try {
      const saved = localStorage.getItem('asterdrive_density');
      if (saved === 'compact' || saved === 'comfortable') return saved;
    } catch {
      // ignore
    }
    return 'comfortable';
  });
  const [autoSync, setAutoSync] = useState(true);
  const [offlineAccess, setOfflineAccess] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [shareItem, setShareItem] = useState<DriveItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Media Preview States (Google Drive Style)
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean>(false);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [showPreviewInfo, setShowPreviewInfo] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<'details' | 'activity'>('details');
  const [docPage, setDocPage] = useState<number>(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  // People & Collaborators State
  const [collaborators, setCollaborators] = useState<{ id: string; email: string; role: 'Viewer' | 'Editor'; addedAt: string }[]>([]);
  const [newCollabEmail, setNewCollabEmail] = useState('');
  const [newCollabRole, setNewCollabRole] = useState<'Viewer' | 'Editor'>('Viewer');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Security scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'Clean' | 'Ready'>('Ready');

  // Feedback form state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Sync computers state
  const [syncEnabled, setSyncEnabled] = useState(true);

  // Refs for clicking outside
  const newMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save items when updated
  useEffect(() => {
    try {
      localStorage.setItem('asterdrive_items_v2', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save items to local storage:', e);
    }
  }, [items]);

  // Save density when updated
  useEffect(() => {
    try {
      localStorage.setItem('asterdrive_density', density);
    } catch (e) {
      console.error('Failed to save density to local storage:', e);
    }
  }, [density]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (newMenuRef.current && !newMenuRef.current.contains(target)) {
        setNewMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
        setSettingsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenPreview = (item: DriveItem) => {
    setImageZoom(1);
    setImageRotation(0);
    setDocPage(1);
    if (item.type === 'video' && item.videoUrl) {
      setActiveMediaUrl(item.videoUrl);
      setIsLoadingMedia(false);
    } else if (item.type === 'image' && item.previewUrl) {
      setActiveMediaUrl(item.previewUrl);
      setIsLoadingMedia(false);
    } else {
      setActiveMediaUrl(null);
      setIsLoadingMedia(true);
    }
    setPreviewItem(item);
  };

  const handleClosePreview = () => {
    setPreviewItem(null);
    setActiveMediaUrl(null);
    setImageZoom(1);
    setImageRotation(0);
  };

  // Resolve media URL asynchronously if not directly set
  useEffect(() => {
    if (!previewItem || activeMediaUrl) return;

    let isMounted = true;
    let createdUrl: string | null = null;

    async function loadItemMedia() {
      try {
        if (previewItem) {
          const blob = await getFileBlob(previewItem.id);
          if (blob && isMounted) {
            createdUrl = URL.createObjectURL(blob);
            setActiveMediaUrl(createdUrl);
            setIsLoadingMedia(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching file blob:', err);
      }

      if (isMounted && previewItem) {
        setActiveMediaUrl(null);
        setIsLoadingMedia(false);
      }
    }

    loadItemMedia();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [previewItem, activeMediaUrl]);

  // Filtered Items
  const currentItems = useMemo(() => {
    return items.filter((item) => {
      // Exclude trashed items in regular views
      if (activeTab !== 'trash' && item.trashed) return false;

      // Filter by search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query) || item.owner.toLowerCase().includes(query);
      }

      if (activeTab === 'mydrive') {
        return item.parentId === currentFolderId && (!item.source || item.source === 'drive');
      }
      if (activeTab === 'computers') {
        return item.source === 'computer';
      }
      if (activeTab === 'shared') {
        return item.owner !== 'Alex Driver';
      }
      if (activeTab === 'recent') {
        return true;
      }
      if (activeTab === 'starred') {
        return item.starred === true;
      }
      if (activeTab === 'trash') {
        return item.trashed === true;
      }
      return true;
    });
  }, [items, activeTab, currentFolderId, searchQuery]);

  // Google Drive file navigation list (excluding folders)
  const previewableFiles = useMemo(() => {
    return currentItems.filter((it) => it.type !== 'folder');
  }, [currentItems]);

  const currentPreviewIndex = useMemo(() => {
    if (!previewItem) return -1;
    return previewableFiles.findIndex((it) => it.id === previewItem.id);
  }, [previewItem, previewableFiles]);

  const hasPrevPreview = currentPreviewIndex > 0;
  const hasNextPreview = currentPreviewIndex >= 0 && currentPreviewIndex < previewableFiles.length - 1;

  const handlePrevPreview = () => {
    if (hasPrevPreview) {
      handleOpenPreview(previewableFiles[currentPreviewIndex - 1]);
    }
  };

  const handleNextPreview = () => {
    if (hasNextPreview) {
      handleOpenPreview(previewableFiles[currentPreviewIndex + 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);

      // 1. ESC: close any open modal or preview
      if (e.key === 'Escape') {
        if (previewItem) {
          handleClosePreview();
          return;
        }
        if (settingsModalOpen) {
          setSettingsModalOpen(false);
          return;
        }
        if (profileModalOpen) {
          setProfileModalOpen(false);
          return;
        }
        if (shareItem) {
          setShareItem(null);
          return;
        }
        if (showInviteModal) {
          setShowInviteModal(false);
          return;
        }
        setSettingsMenuOpen(false);
        setUserMenuOpen(false);
        setNewMenuOpen(false);
        setNotificationsOpen(false);
        return;
      }

      // 2. Preview navigation
      if (previewItem) {
        if (e.key === 'ArrowLeft') {
          if (currentPreviewIndex > 0) {
            handleOpenPreview(previewableFiles[currentPreviewIndex - 1]);
          }
        } else if (e.key === 'ArrowRight') {
          if (currentPreviewIndex >= 0 && currentPreviewIndex < previewableFiles.length - 1) {
            handleOpenPreview(previewableFiles[currentPreviewIndex + 1]);
          }
        }
        return;
      }

      // 3. Global shortcuts (only when not typing in form inputs)
      if (isInput) return;

      // ⌘K or / to focus search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // 'v' or 'V' to toggle view mode
      if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'));
        showToast(`Tampilan diubah ke ${viewMode === 'grid' ? 'List' : 'Grid'}`);
        return;
      }

      // '?' to open Keyboard Shortcuts in Settings
      if (e.key === '?') {
        e.preventDefault();
        setSettingsTab('shortcuts');
        setSettingsModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    previewItem,
    currentPreviewIndex,
    previewableFiles,
    settingsModalOpen,
    profileModalOpen,
    shareItem,
    showInviteModal,
    viewMode
  ]);

  // Actions
  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setNewMenuOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const id = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      let type: DriveItem['type'] = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) type = 'spreadsheet';
      else if (file.name.endsWith('.zip') || file.name.endsWith('.tar') || file.name.endsWith('.gz')) type = 'archive';

      saveFileBlob(id, file);

      // Instant blob URL for immediate viewing & video playback
      const instantUrl = URL.createObjectURL(file);

      const newItem: DriveItem = {
        id,
        parentId: activeTab === 'computers' ? 'comp_root' : currentFolderId,
        name: file.name,
        type,
        size: file.size,
        updatedAt: new Date().toISOString(),
        owner: 'Alex Driver',
        source: activeTab === 'computers' ? 'computer' : 'drive',
        computerDevice: activeTab === 'computers' ? 'MacBook Pro 16"' : undefined,
        previewUrl: type === 'image' ? instantUrl : undefined,
        videoUrl: type === 'video' ? instantUrl : undefined,
        thumbnailUrl: type === 'image' ? instantUrl : undefined
      };

      setItems((prev) => [newItem, ...prev]);

      setActivities((prev) => [
        {
          id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          action: 'Uploaded file',
          item: file.name,
          time: 'Baru saja',
          user: 'Alex Driver'
        },
        ...prev
      ]);
    });

    showToast(`Uploaded ${files.length} file(s) to AsterDrive`);
    if (e.target) e.target.value = '';
  };

  const handleCreateFolder = () => {
    const name = prompt('Folder name:', 'New Folder');
    if (!name) return;

    const newFolder: DriveItem = {
      id: 'f_' + Date.now(),
      parentId: currentFolderId,
      name,
      type: 'folder',
      updatedAt: new Date().toISOString(),
      owner: 'Alex Driver'
    };
    setItems((prev) => [newFolder, ...prev]);
    setActivities((prev) => [
      {
        id: 'act_' + Date.now(),
        action: 'Created folder',
        item: name,
        time: 'Baru saja',
        user: 'Alex Driver'
      },
      ...prev
    ]);
    setNewMenuOpen(false);
    showToast(`Created folder "${name}"`);
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, starred: !it.starred } : it))
    );
  };

  const handleTrashItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetItem = items.find((it) => it.id === id);
    if (targetItem) {
      setActivities((prev) => [
        {
          id: 'act_' + Date.now(),
          action: 'Moved to trash',
          item: targetItem.name,
          time: 'Baru saja',
          user: 'Alex Driver'
        },
        ...prev
      ]);
    }
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, trashed: true } : it))
    );
    showToast('Moved to Trash');
  };

  const handleRestoreItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetItem = items.find((it) => it.id === id);
    if (targetItem) {
      setActivities((prev) => [
        {
          id: 'act_' + Date.now(),
          action: 'Restored from trash',
          item: targetItem.name,
          time: 'Baru saja',
          user: 'Alex Driver'
        },
        ...prev
      ]);
    }
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, trashed: false } : it))
    );
    showToast('Restored file from Trash');
  };

  const handleDeletePermanent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetItem = items.find((it) => it.id === id);
    if (targetItem) {
      setActivities((prev) => [
        {
          id: 'act_' + Date.now(),
          action: 'Deleted permanently',
          item: targetItem.name,
          time: 'Baru saja',
          user: 'Alex Driver'
        },
        ...prev
      ]);
    }
    deleteFileBlob(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    showToast('Deleted forever');
  };

  const handleEmptyTrash = () => {
    const trashed = items.filter((it) => it.trashed);
    trashed.forEach((it) => deleteFileBlob(it.id));
    setItems((prev) => prev.filter((it) => !it.trashed));
    setActivities((prev) => [
      {
        id: 'act_' + Date.now(),
        action: 'Emptied trash',
        item: `${trashed.length} item(s)`,
        time: 'Baru saja',
        user: 'Alex Driver'
      },
      ...prev
    ]);
    showToast('Trash emptied');
  };

  const handleDownloadItem = (item: DriveItem) => {
    const url = activeMediaUrl || item.previewUrl || item.videoUrl;
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    showToast(`Downloading ${item.name}`);
  };

  const handleFolderClick = (folder: DriveItem) => {
    setCurrentFolderId(folder.id);
    setFolderHistory((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    const newHistory = folderHistory.slice(0, index + 1);
    setFolderHistory(newHistory);
    setCurrentFolderId(newHistory[newHistory.length - 1].id);
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollabEmail.trim()) return;
    const newCollab = {
      id: 'collab_' + Date.now(),
      email: newCollabEmail.trim(),
      role: newCollabRole,
      addedAt: new Date().toISOString()
    };
    setCollaborators((prev) => [...prev, newCollab]);
    setNewCollabEmail('');
    setShowInviteModal(false);
    showToast(`Added ${newCollab.email} as ${newCollabRole}`);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackText('');
      setFeedbackSent(false);
      showToast('Thank you! Feedback received.');
    }, 1000);
  };

  const handleRunSecurityScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('Clean');
      showToast('Security scan completed: No threats found');
    }, 2000);
  };

  const getItemIcon = (type: DriveItem['type']) => {
    switch (type) {
      case 'folder':
        return <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-blue-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-rose-400" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'archive':
        return <FileArchive className="w-5 h-5 text-purple-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-300" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '--';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const analyticsItems: StorageAnalyticsItem[] = useMemo(() => {
    return items.map((it) => ({
      id: it.id,
      name: it.name,
      type: it.type,
      size: it.size || 0,
      trashed: it.trashed
    }));
  }, [items]);

  return (
    <div className="w-full min-h-screen bg-[#0c0e14] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Hidden file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
      />

      {/* 
        ===================================================================
        TOP NAVBAR:
        Single fixed horizontal bar pinned to top of viewport.
        Spans full viewport width edge-to-edge.
        Left-to-right order:
        1. Hamburger menu icon
        2. Brand mark (Cloud + AsterDrive)
        3. Search input
        4. Primary action button (+ New with exact sizing: 12px px, 6px py, 12px font)
        5. Utility buttons (Theme toggle, Notifications)
        6. Circular avatar (AD) - Opens 100% Dark Themed Profile Modal!
        7. Text logout link
        ===================================================================
      */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full h-14 bg-[#0c0e14]/95 backdrop-blur-md border-b border-[#1e2433]">
        <div className="w-full h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between">
          {/* Left: Hamburger, Brand, Search */}
          <div className="flex items-center flex-1 min-w-0 mr-3">
            {/* 1. Hamburger menu icon */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation drawer"
              className="p-1.5 mr-2 sm:mr-3 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/70 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-colors shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* 2. Brand mark: small logo icon paired with brand name on same baseline */}
            <div
              onClick={() => {
                setActiveTab('mydrive');
                setCurrentFolderId('root');
                setFolderHistory([{ id: 'root', name: 'My Drive' }]);
              }}
              className="flex items-center gap-2 shrink-0 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/25 group-hover:scale-105 transition-transform shrink-0">
                <Cloud className="w-4 h-4 fill-white/20" />
              </div>
              <span className="font-semibold text-sm sm:text-base tracking-tight text-white font-display">
                AsterDrive
              </span>
            </div>

            {/* 3. Search input field */}
            <div className="relative flex-1 max-w-xs md:max-w-sm lg:max-w-md ml-3 sm:ml-4 lg:ml-6 hidden sm:flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files, folders, or docs... (Press / to focus)"
                className="w-full h-8 pl-8 pr-12 bg-slate-900/90 border border-slate-700/60 rounded-md text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-all"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <kbd className="hidden lg:inline-flex items-center gap-0.5 absolute right-2 text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                  ⌘K
                </kbd>
              )}
            </div>

            {/* Mobile search toggle icon */}
            <div className="sm:hidden ml-2 flex items-center">
              <button
                type="button"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                aria-label="Toggle search"
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60"
              >
                {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Right Group: Action button, Utility buttons, Avatar, Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* 4. Primary action button with exact sizing rules */}
            <div className="relative" ref={newMenuRef}>
              <button
                type="button"
                onClick={() => setNewMenuOpen(!newMenuOpen)}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-[12px] py-[6px] text-[12px] font-medium leading-none bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-md shadow-sm shadow-orange-500/20 focus:outline-none focus:ring-1 focus:ring-orange-400 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">New</span>
              </button>

              {/* Action Dropdown Menu */}
              {newMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#121620] border border-[#1e2433] rounded-lg shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400 border-b border-[#1e2433]">
                    Create or Upload
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/70 hover:text-white"
                  >
                    <FolderPlus className="w-4 h-4 text-orange-400" />
                    <span>New folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/70 hover:text-white"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-400" />
                    <span>Upload files</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. Utility buttons row */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const nextTheme = theme === 'dark' ? 'light' : 'dark';
                  setTheme(nextTheme);
                  showToast(`Theme changed to ${nextTheme}`);
                }}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none transition-colors shrink-0"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-200" />
                )}
              </button>

              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none transition-colors shrink-0"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-[#0c0e14]" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#121620] border border-[#1e2433] rounded-lg shadow-xl py-2 z-50 text-xs">
                    <div className="px-3 py-1 flex items-center justify-between border-b border-[#1e2433] pb-2">
                      <span className="font-semibold text-slate-200">Notifications</span>
                      <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-medium">
                        2 new
                      </span>
                    </div>
                    <div className="py-1">
                      <div className="px-3 py-2 hover:bg-slate-800/50 cursor-pointer">
                        <p className="text-slate-200 font-medium text-[11px]">Sync completed</p>
                        <p className="text-slate-400 text-[10px]">142 files backed up to AsterDrive</p>
                      </div>
                      <div className="px-3 py-2 hover:bg-slate-800/50 cursor-pointer">
                        <p className="text-slate-200 font-medium text-[11px]">Shared project</p>
                        <p className="text-slate-400 text-[10px]">Sarah shared &quot;Roadmap_2026.pdf&quot;</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SETTINGS ICON BUTTON (Google Drive standard) */}
              <div className="relative" ref={settingsMenuRef}>
                <button
                  type="button"
                  onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                  title="Settings / Setelan"
                  aria-label="Settings"
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none transition-colors shrink-0"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {settingsMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#121620] border border-[#1e2433] rounded-lg shadow-xl py-1.5 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsTab('general');
                        setSettingsModalOpen(true);
                        setSettingsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/70 hover:text-white"
                    >
                      <Settings className="w-4 h-4 text-orange-400" />
                      <span>Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsTab('shortcuts');
                        setSettingsModalOpen(true);
                        setSettingsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/70 hover:text-white"
                    >
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>Keyboard shortcuts</span>
                    </button>
                    <div className="my-1 border-t border-[#1e2433]" />
                    <button
                      type="button"
                      onClick={() => {
                        showToast('AsterDrive Desktop Client v2.4 (Terpasang)');
                        setSettingsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/70 hover:text-white"
                    >
                      <Laptop className="w-4 h-4 text-blue-400" />
                      <span>Get AsterDrive for Desktop</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Small circular user avatar (clicking opens DARK PROFILE MODAL directly) */}
            <div className="relative ml-0.5 sm:ml-1">
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 p-[1.5px] focus:outline-none focus:ring-1 focus:ring-orange-400 shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
                title="Profile & Account Settings"
              >
                <div className="w-full h-full rounded-full bg-[#121620] flex items-center justify-center text-[10px] font-bold text-orange-400">
                  AD
                </div>
              </button>
            </div>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#11141d] border border-[#1e2433] rounded-xl shadow-2xl py-2 z-50 text-xs text-slate-200">
                  <div className="px-3.5 py-2.5 border-b border-[#1e2433]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 p-[1px] shrink-0">
                        <div className="w-full h-full rounded-full bg-[#121620] flex items-center justify-center text-xs font-bold text-orange-400">
                          AD
                        </div>
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-slate-100 truncate">Alex Driver</div>
                        <div className="text-[11px] text-slate-400 truncate">alex.driver@asterdrive.io</div>
                      </div>
                    </div>
                  </div>
                  <div className="py-1 border-b border-[#1e2433]">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    >
                      <User className="w-4 h-4 text-orange-400" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setActiveTab('security');
                      }}
                      className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Security & Health</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      showToast('Logged out of AsterDrive');
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-rose-400 hover:bg-rose-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              )}

            {/* 7. Text logout link at the far right */}
            <button
              type="button"
              onClick={() => showToast('Logged out')}
              className="hidden md:inline-flex text-[12px] font-normal text-slate-400 hover:text-slate-100 transition-colors ml-1 focus:outline-none focus:underline shrink-0"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Mobile search bar expandable */}
        {mobileSearchOpen && (
          <div className="sm:hidden w-full px-3 py-2 bg-[#0c0e14] border-b border-[#1e2433] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="flex-1 h-8 px-2 bg-slate-900 border border-slate-700/60 rounded text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="text-xs text-slate-400 hover:text-white px-1"
            >
              Close
            </button>
          </div>
        )}
      </header>

      {/* 
        ===================================================================
        MAIN APPLICATION LAYOUT:
        Sidebar + Workspace Viewport
        ===================================================================
      */}
      <div className="flex-1 flex pt-14">
        {/* SIDEBAR (Responsive drawer on mobile, fixed column on desktop) */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#0c0e14] border-r border-[#1e2433] flex flex-col pt-16 pb-6 px-3 transition-transform duration-200 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between pb-3 mb-2 border-b border-[#1e2433]">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Navigation</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Navigation Links (Matching Screenshot 1) */}
          <nav className="flex-1 space-y-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('mydrive');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'mydrive'
                  ? 'bg-[#26150b] text-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Home className={`w-4 h-4 ${activeTab === 'mydrive' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>My Drive</span>
            </button>

            {/* Sync Computers feature */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('computers');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'computers'
                  ? 'bg-[#26150b] text-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Laptop className={`w-4 h-4 ${activeTab === 'computers' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Computers</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('shared');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'shared'
                  ? 'bg-[#26150b] text-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'shared' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Shared with me</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('recent');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'recent'
                  ? 'bg-[#26150b] text-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Clock className={`w-4 h-4 ${activeTab === 'recent' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Recent</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('starred');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'starred'
                  ? 'bg-[#26150b] text-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Star className={`w-4 h-4 ${activeTab === 'starred' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Starred</span>
            </button>

            {/* Divider */}
            <div className="pt-4 pb-2">
              <div className="h-[1px] bg-[#1e2433] w-full" />
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 pt-3">
                Workspace
              </div>
            </div>

            {/* Workspace section (Matching Screenshot 1) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('storage');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'storage'
                  ? 'bg-[#26150b] text-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <HardDrive className={`w-4 h-4 ${activeTab === 'storage' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Storage</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('activity');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'bg-[#26150b] text-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Activity className={`w-4 h-4 ${activeTab === 'activity' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Activity</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('people');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'people'
                  ? 'bg-[#26150b] text-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'people' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>People</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('trash');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'trash'
                  ? 'bg-[#26150b] text-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Trash2 className={`w-4 h-4 ${activeTab === 'trash' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Trash</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('security');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'security'
                  ? 'bg-[#26150b] text-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${activeTab === 'security' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Security</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('feedback');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'feedback'
                  ? 'bg-[#26150b] text-orange-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <MessageSquare className={`w-4 h-4 ${activeTab === 'feedback' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Feedback</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsModalOpen(true);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Footer links from screenshot */}
          <div className="pt-4 border-t border-[#1e2433] text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1 px-2">
            <span className="hover:text-slate-300 cursor-pointer">About us</span>
            <span className="hover:text-slate-300 cursor-pointer">Help center</span>
            <span className="hover:text-slate-300 cursor-pointer">Privacy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms</span>
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* WORKSPACE VIEWPORT */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* ======================= TAB: MY DRIVE / COMPUTERS / SHARED / RECENT / STARRED ======================= */}
          {(activeTab === 'mydrive' || activeTab === 'computers' || activeTab === 'shared' || activeTab === 'recent' || activeTab === 'starred') && (
            <div className="space-y-6">
              {/* Header bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-orange-500 text-xs font-semibold uppercase tracking-wider">
                    {activeTab === 'mydrive'
                      ? 'Storage'
                      : activeTab === 'computers'
                      ? 'Sync Computers'
                      : activeTab === 'shared'
                      ? 'Shared Files'
                      : activeTab === 'recent'
                      ? 'Recent Activity'
                      : 'Starred Files'}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
                    {activeTab === 'mydrive'
                      ? 'My Drive'
                      : activeTab === 'computers'
                      ? 'Sync Computers'
                      : activeTab === 'shared'
                      ? 'Shared with me'
                      : activeTab === 'recent'
                      ? 'Recent'
                      : 'Starred'}
                  </h1>
                </div>

                {/* View controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md shadow-sm transition-colors"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition-colors"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Folder</span>
                  </button>
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5 ml-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1 rounded ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
                      title="Grid view"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`p-1 rounded ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
                      title="List view"
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Breadcrumbs for folder navigation */}
              {activeTab === 'mydrive' && folderHistory.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-[#11141d] px-3 py-1.5 rounded-lg border border-[#1e2433]">
                  {folderHistory.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                      {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                      <button
                        type="button"
                        onClick={() => handleNavigateBreadcrumb(index)}
                        className={`hover:text-white transition-colors ${
                          index === folderHistory.length - 1 ? 'text-orange-400 font-semibold' : ''
                        }`}
                      >
                        {folder.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Items Display: Grid or List */}
              {currentItems.length === 0 ? (
                <div className="bg-[#11141d] border border-[#1e2433] rounded-2xl p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400 mb-3">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">No files found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? `No results match "${searchQuery}". Try different keywords.`
                      : 'Upload files or create folders to get started with AsterDrive.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload your first file</span>
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div
                  className={
                    density === 'compact'
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5'
                      : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5'
                  }
                >
                  {currentItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => (item.type === 'folder' ? handleFolderClick(item) : handleOpenPreview(item))}
                      className={`bg-[#11141d] hover:bg-[#151924] border border-[#1e2433] hover:border-slate-700/80 rounded-xl transition-all cursor-pointer group flex flex-col justify-between ${
                        density === 'compact' ? 'p-2.5' : 'p-3.5'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 truncate">
                            <div className={`rounded-lg bg-slate-800/60 shrink-0 ${density === 'compact' ? 'p-1.5' : 'p-2'}`}>
                              {getItemIcon(item.type)}
                            </div>
                            <span className={`${density === 'compact' ? 'text-[11px]' : 'text-xs'} font-semibold text-slate-200 truncate group-hover:text-white`}>
                              {item.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleToggleStar(item.id, e)}
                            className="text-slate-500 hover:text-amber-400 p-1"
                          >
                            <Star className={`w-3.5 h-3.5 ${item.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
                          </button>
                        </div>

                        {/* Image Preview Thumbnail */}
                        {item.type === 'image' && (item.thumbnailUrl || item.previewUrl) && (
                          <div className={`mt-2.5 relative w-full ${density === 'compact' ? 'h-20' : 'h-28'} rounded-lg overflow-hidden bg-black/40 border border-[#1e2433]/70 group-hover:border-orange-500/40 transition-all`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.thumbnailUrl || item.previewUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="px-2 py-1 rounded bg-black/70 text-[11px] text-white font-medium flex items-center gap-1 shadow">
                                <Eye className="w-3.5 h-3.5 text-orange-400" />
                                <span>Lihat Foto</span>
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Video Preview Card */}
                        {item.type === 'video' && (
                          <div className={`mt-2.5 relative w-full ${density === 'compact' ? 'h-20' : 'h-28'} rounded-lg overflow-hidden bg-slate-950 border border-[#1e2433]/70 group-hover:border-orange-500/40 transition-all flex items-center justify-center`}>
                            {item.thumbnailUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={item.thumbnailUrl}
                                alt={item.name}
                                className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
                                <Video className="w-8 h-8 text-slate-700" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="w-9 h-9 rounded-full bg-orange-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-orange-500 transition-all">
                                <Play className="w-4 h-4 fill-white ml-0.5" />
                              </div>
                            </div>
                            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-slate-200 font-mono flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              <span>Putar Video</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={`${density === 'compact' ? 'mt-2 pt-1.5 text-[10px]' : 'mt-3 pt-2 text-[11px]'} border-t border-[#1e2433]/60 flex items-center justify-between text-slate-400`}>
                        <span>{formatFileSize(item.size)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareItem(item);
                            }}
                            className="p-1 hover:text-white"
                            title="Share"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleTrashItem(item.id, e)}
                            className="p-1 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#11141d] border border-[#1e2433] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className={`bg-slate-900/60 text-slate-400 ${density === 'compact' ? 'text-[10px]' : 'text-[11px]'} uppercase tracking-wider border-b border-[#1e2433]`}>
                      <tr>
                        <th className={`${density === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2.5'} font-medium`}>Name</th>
                        <th className={`${density === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2.5'} font-medium hidden sm:table-cell`}>Owner</th>
                        <th className={`${density === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2.5'} font-medium hidden md:table-cell`}>Size</th>
                        <th className={`${density === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2.5'} font-medium text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2433]/60">
                      {currentItems.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => (item.type === 'folder' ? handleFolderClick(item) : handleOpenPreview(item))}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className={`${density === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2.5'} flex items-center gap-2.5 truncate max-w-xs`}>
                            {getItemIcon(item.type)}
                            <span className="font-medium text-slate-200 truncate">{item.name}</span>
                          </td>
                          <td className={`${density === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2.5'} text-slate-400 hidden sm:table-cell`}>{item.owner}</td>
                          <td className={`${density === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2.5'} text-slate-400 hidden md:table-cell`}>{formatFileSize(item.size)}</td>
                          <td className={`${density === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2.5'} text-right space-x-1`}>
                            <button
                              type="button"
                              onClick={(e) => handleToggleStar(item.id, e)}
                              className="p-1 text-slate-400 hover:text-amber-400"
                            >
                              <Star className={`w-3.5 h-3.5 ${item.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareItem(item);
                              }}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleTrashItem(item.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================= TAB: STORAGE ======================= */}
          {/* ======================= TAB: STORAGE (Matching Screenshot) ======================= */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div>
                <div className="text-orange-500 text-xs font-semibold uppercase tracking-wider">Storage</div>
                <h1 className="text-3xl font-bold text-white tracking-tight mt-0.5">Storage</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Everything you&apos;re working on, in one place.
                </p>
              </div>

              {/* Main Storage Overview Card matching Screenshot */}
              <div className="bg-[#11141d] border border-[#1e2433] rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Storage overview
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight mt-1">
                      {formatFileSize(items.reduce((acc, it) => acc + (it.size || 0), 0))}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {items.length === 0 ? 'No files stored yet' : `${items.length} files stored`}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#26150b] border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
                    <HardDrive className="w-5 h-5" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (items.reduce((acc, it) => acc + (it.size || 0), 0) / (1024 * 1024 * 1024)) * 100
                      )}%`
                    }}
                  />
                </div>

                {/* Used & Free space cards from screenshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="bg-[#0c0e14]/60 border border-[#1e2433] rounded-xl p-3.5">
                    <div className="text-[11px] font-medium text-slate-400">Used</div>
                    <div className="text-xs font-semibold text-slate-200 mt-1">
                      {formatFileSize(items.reduce((acc, it) => acc + (it.size || 0), 0))}
                    </div>
                  </div>
                  <div className="bg-[#0c0e14]/60 border border-[#1e2433] rounded-xl p-3.5">
                    <div className="text-[11px] font-medium text-slate-400">Free space</div>
                    <div className="text-xs font-semibold text-slate-200 mt-1">1 GB</div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => showToast('Redirecting to AsterDrive storage upgrade options')}
                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md shadow-sm transition-colors"
                  >
                    Buy storage
                  </button>
                </div>
              </div>

              {/* Detailed Breakdown Chart */}
              <div className="bg-[#11141d] border border-[#1e2433] rounded-2xl p-6">
                <StorageAnalyticsChart
                  items={analyticsItems}
                  plan={{
                    name: 'AsterDrive Free',
                    storage: '1 GB',
                    maxBytes: 1 * 1024 * 1024 * 1024,
                    isFree: true
                  }}
                  onUpgradeClick={() => showToast('AsterDrive Enterprise plan requested')}
                />
              </div>
            </div>
          )}

          {/* ======================= TAB: ACTIVITY (Matching Screenshot) ======================= */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div>
                <div className="text-orange-500 text-xs font-semibold uppercase tracking-wider">Activity</div>
                <h1 className="text-3xl font-bold text-white tracking-tight mt-0.5">Activity</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Everything you&apos;re working on, in one place.
                </p>
              </div>

              {/* Main Card from Screenshot */}
              <div className="bg-[#11141d] border border-[#1e2433] rounded-2xl p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#26150b] border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Recent activity
                    </div>
                    <div className="text-2xl font-bold text-white tracking-tight mt-0.5">
                      {items.length}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {items.length === 0 ? 'No activity to show' : `${items.length} file actions recorded`}
                    </div>
                  </div>
                </div>

                {/* Dashed placeholder container from screenshot */}
                <div className="border border-dashed border-[#1e2433] rounded-xl p-8 text-center bg-[#0c0e14]/50">
                  <p className="text-xs text-slate-400">Uploads and changes will appear here.</p>
                </div>
              </div>

              {/* Activity List */}
              <div className="bg-[#11141d] border border-[#1e2433] rounded-2xl p-6 space-y-4">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider pb-2 border-b border-[#1e2433]">
                  Event History
                </div>
                {activities.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    Belum ada riwayat aktivitas. Unggah berkas atau buat folder untuk mulai mencatat riwayat aktivitas.
                  </div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="flex items-center justify-between pb-3 border-b border-[#1e2433] last:border-none last:pb-0 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800/70 flex items-center justify-center text-orange-400">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium">
                            <span className="text-white font-semibold">{act.user}</span> {act.action}{' '}
                            <span className="text-orange-400 font-medium">&quot;{act.item}&quot;</span>
                          </p>
                          <p className="text-slate-500 text-[11px]">{act.time}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Success</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ======================= TAB: PEOPLE (Matching Screenshot 2) ======================= */}
          {activeTab === 'people' && (
            <div className="space-y-6">
              <div>
                <div className="text-orange-500 text-xs font-semibold uppercase tracking-wider">People</div>
                <h1 className="text-3xl font-bold text-white tracking-tight mt-0.5">People</h1>
                <p className="text-xs text-slate-400 mt-1">Manage collaborators and file access.</p>
              </div>

              {/* Main Card from Screenshot 2 */}
              <div className="bg-[#11141d] border border-[#1e2433] rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#26150b] border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">People & access</div>
                      <div className="text-2xl font-bold text-white tracking-tight mt-0.5">
                        {collaborators.length} {collaborators.length === 1 ? 'person' : 'people'}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {collaborators.length === 0 ? 'No collaborators yet' : `${collaborators.length} active collaborator(s)`}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Invite collaborator</span>
                  </button>
                </div>

                {/* Dashed area from Screenshot 2 */}
                {collaborators.length === 0 ? (
                  <div className="border border-dashed border-[#1e2433] rounded-xl p-8 text-center bg-[#0c0e14]/50">
                    <p className="text-xs text-slate-400">People you share files with will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1e2433] rounded-xl border border-[#1e2433] bg-[#0c0e14]/50 overflow-hidden">
                    {collaborators.map((collab) => (
                      <div key={collab.id} className="p-3.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-orange-400">
                            {collab.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-slate-200 font-medium">{collab.email}</p>
                            <p className="text-slate-500 text-[10px]">Added recently</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            {collab.role}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCollaborators((prev) => prev.filter((c) => c.id !== collab.id));
                              showToast(`Revoked access for ${collab.email}`);
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= TAB: TRASH (Matching Screenshot 3) ======================= */}
          {activeTab === 'trash' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-orange-500 text-xs font-semibold uppercase tracking-wider">Trash</div>
                  <h1 className="text-3xl font-bold text-white tracking-tight mt-0.5">Trash</h1>
                  <p className="text-xs text-slate-400 mt-1">Everything you&apos;re working on, in one place.</p>
                </div>
                {items.some((it) => it.trashed) && (
                  <button
                    type="button"
                    onClick={handleEmptyTrash}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-md transition-colors"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    <span>Empty trash</span>
                  </button>
                )}
              </div>

              {/* Trash View matching Screenshot 3 */}
              {!items.some((it) => it.trashed) ? (
                <div className="bg-[#11141d] border border-[#1e2433] rounded-2xl p-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-[#1e2433] flex items-center justify-center mx-auto text-slate-500 mb-4">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-white">Trash is empty</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Deleted files will stay here temporarily so you can restore them before permanent removal.
                  </p>
                </div>
              ) : (
                <div className="bg-[#11141d] border border-[#1e2433] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider border-b border-[#1e2433]">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Name</th>
                        <th className="px-4 py-2.5 font-medium">Size</th>
                        <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2433]/60">
                      {items
                        .filter((it) => it.trashed)
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-2.5 truncate max-w-xs">
                              {getItemIcon(item.type)}
                              <span className="font-medium text-slate-200 truncate">{item.name}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">{formatFileSize(item.size)}</td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button
                                type="button"
                                onClick={(e) => handleRestoreItem(item.id, e)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                              >
                                <RotateCcw className="w-3 h-3 text-emerald-400" />
                                <span>Restore</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeletePermanent(item.id, e)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded border border-rose-500/20"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete Forever</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================= TAB: SECURITY (Matching Screenshot 4) ======================= */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <div className="text-orange-500 text-xs font-semibold uppercase tracking-wider">Security</div>
                <h1 className="text-3xl font-bold text-white tracking-tight mt-0.5">Security</h1>
                <p className="text-xs text-slate-400 mt-1">Review workspace access and protection.</p>
              </div>

              {/* Main Card from Screenshot 4 */}
              <div className="bg-[#11141d] border border-[#1e2433] rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#26150b] border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Workspace health</div>
                      <div className="text-2xl font-bold text-white tracking-tight mt-0.5">
                        {isScanning ? 'Scanning...' : scanResult}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Your workspace is ready</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunSecurityScan}
                    disabled={isScanning}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-md shadow-sm transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isScanning ? 'Scanning...' : 'Run Scan'}</span>
                  </button>
                </div>

                {/* 3 Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="bg-[#0c0e14]/60 border border-[#1e2433] rounded-xl p-4">
                    <div className="text-[11px] font-medium text-slate-400">File protection</div>
                    <div className="text-xs font-semibold text-emerald-400 mt-1">Active</div>
                  </div>
                  <div className="bg-[#0c0e14]/60 border border-[#1e2433] rounded-xl p-4">
                    <div className="text-[11px] font-medium text-slate-400">Sharing access</div>
                    <div className="text-xs font-semibold text-slate-200 mt-1">Controlled</div>
                  </div>
                  <div className="bg-[#0c0e14]/60 border border-[#1e2433] rounded-xl p-4">
                    <div className="text-[11px] font-medium text-slate-400">Suspicious activity</div>
                    <div className="text-xs font-semibold text-slate-400 mt-1">None detected</div>
                  </div>
                </div>

                {/* Security checks bar from Screenshot 4 */}
                <div className="bg-[#1b120c] border border-orange-500/20 rounded-xl p-4">
                  <p className="text-xs text-orange-300">Security checks will appear here.</p>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: FEEDBACK (Matching Screenshot 5) ======================= */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div>
                <div className="text-orange-500 text-xs font-semibold uppercase tracking-wider">Feedback</div>
                <h1 className="text-3xl font-bold text-white tracking-tight mt-0.5">Feedback</h1>
                <p className="text-xs text-slate-400 mt-1">Everything you&apos;re working on, in one place.</p>
              </div>

              {/* Main Card from Screenshot 5 */}
              <div className="bg-[#11141d] border border-[#1e2433] rounded-2xl p-6 space-y-5 max-w-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#26150b] border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
                    <MessageSquarePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Help us improve AsterDrive</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tell us what works well or what you would like to see next.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendFeedback} className="space-y-4">
                  <textarea
                    rows={5}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your feedback..."
                    className="w-full p-3 bg-[#0c0e14] border border-[#1e2433] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 resize-none"
                  />

                  <button
                    type="submit"
                    disabled={!feedbackText.trim() || feedbackSent}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-md shadow-sm transition-colors"
                  >
                    <span>{feedbackSent ? 'Sending...' : 'Send feedback'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 
        ===================================================================
        MODAL: 100% DARK THEMED USER PROFILE MODAL
        (Solves the user's issue: "saya klik/ketuk image profile masih warna putih")
        ===================================================================
      */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11141d] border border-[#1e2433] rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#1e2433] flex items-center justify-between bg-[#151924]/60">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-orange-400" />
                <h3 className="font-semibold text-sm text-white">User Profile & Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 bg-[#11141d]">
              {/* Profile Avatar section */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-[#121620] flex items-center justify-center text-lg font-bold text-orange-400">
                      AD
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-base text-white">Alex Driver</h4>
                  <p className="text-xs text-slate-400">alex.driver@asterdrive.io</p>
                  <span className="inline-block mt-1 text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded font-medium">
                    Pro Plan Account
                  </span>
                </div>
              </div>

              {/* Form fields in dark theme */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Alex Driver"
                    className="w-full px-3 py-2 bg-[#0c0e14] border border-[#1e2433] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    defaultValue="alex.driver@asterdrive.io"
                    className="w-full px-3 py-2 bg-[#0c0e14]/50 border border-[#1e2433] rounded-lg text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Storage Quota
                  </label>
                  <div className="p-3 bg-[#0c0e14] border border-[#1e2433] rounded-lg space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">28.4 GB Used</span>
                      <span className="text-slate-400">100 GB Total</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 w-[28.4%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#151924]/60 border-t border-[#1e2433] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setProfileModalOpen(false);
                  showToast('Logged out');
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                Sign out
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileModalOpen(false);
                    showToast('Profile updated');
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md shadow-sm transition-colors"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
        MODAL: GOOGLE DRIVE STYLE ASTERDRIVE SETTINGS MODAL
        =================================================================== */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#11141d] border border-[#1e2433] rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#1e2433] flex items-center justify-between bg-[#151924]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-white">Settings</h3>
                  <p className="text-xs text-slate-400">Manage AsterDrive preferences, storage, and shortcuts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-[#1e2433] bg-[#0c0e14]/50 px-6 text-xs font-medium">
              {[
                { id: 'general', label: 'General' },
                { id: 'storage', label: 'Storage' },
                { id: 'notifications', label: 'Notifications' },
                { id: 'shortcuts', label: 'Keyboard Shortcuts' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSettingsTab(tab.id as typeof settingsTab)}
                  className={`py-3 px-3 border-b-2 font-medium transition-colors ${
                    settingsTab === tab.id
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* TAB: GENERAL */}
              {settingsTab === 'general' && (
                <div className="space-y-6">
                  {/* Density Setting */}
                  <div className="space-y-2">
                    <label className="text-slate-200 font-semibold block text-xs">
                      Density (Tampilan Berkas)
                    </label>
                    <p className="text-slate-400 text-[11px]">
                      Choose how compact list and grid items appear across AsterDrive.
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setDensity('comfortable')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          density === 'comfortable'
                            ? 'border-orange-500 bg-orange-500/10 text-white'
                            : 'border-[#1e2433] bg-[#0c0e14]/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-slate-200 flex items-center justify-between">
                          <span>Comfortable</span>
                          {density === 'comfortable' && <Check className="w-3.5 h-3.5 text-orange-500" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Default spacious layout with clear file cards</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDensity('compact')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          density === 'compact'
                            ? 'border-orange-500 bg-orange-500/10 text-white'
                            : 'border-[#1e2433] bg-[#0c0e14]/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-slate-200 flex items-center justify-between">
                          <span>Compact</span>
                          {density === 'compact' && <Check className="w-3.5 h-3.5 text-orange-500" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Dense view showing maximum files on screen</p>
                      </button>
                    </div>
                  </div>

                  {/* Sync & Offline Toggles */}
                  <div className="space-y-3 pt-4 border-t border-[#1e2433]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-200">Automatic Cloud Sync</p>
                        <p className="text-[11px] text-slate-400">Instantly save uploaded items to your secure IndexedDB vault</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoSync(!autoSync)}
                        className={`w-10 h-5 rounded-full transition-colors p-0.5 ${autoSync ? 'bg-orange-500' : 'bg-slate-800'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoSync ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="font-medium text-slate-200">Offline File Cache</p>
                        <p className="text-[11px] text-slate-400">Keep recent documents accessible without an active internet connection</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOfflineAccess(!offlineAccess)}
                        className={`w-10 h-5 rounded-full transition-colors p-0.5 ${offlineAccess ? 'bg-orange-500' : 'bg-slate-800'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${offlineAccess ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: STORAGE */}
              {settingsTab === 'storage' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-[#0c0e14]/60 border border-[#1e2433] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-300">Penyimpanan Terpakai</span>
                      <span className="font-mono font-semibold text-orange-400">
                        {formatFileSize(items.reduce((acc, it) => acc + (it.size || 0), 0))} / 15 GB
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (items.reduce((acc, it) => acc + (it.size || 0), 0) / (1024 * 1024 * 1024)) * 100
                          )}%`
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      AsterDrive Vault memberikan 15 GB penyimpanan lokal berkecepatan tinggi terenkripsi AES-256-GCM.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-900/40 border border-[#1e2433] rounded-xl">
                    <div>
                      <p className="font-medium text-slate-200">Bersihkan Sampah</p>
                      <p className="text-[11px] text-slate-400">Kosongkan berkas yang telah dihapus permanen untuk menghemat ruang</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleEmptyTrash();
                        showToast('Sampah berhasil dikosongkan');
                      }}
                      className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-md border border-rose-500/20 transition-colors"
                    >
                      Kosongkan Sekarang
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: NOTIFICATIONS */}
              {settingsTab === 'notifications' && (
                <div className="space-y-4">
                  <p className="text-slate-400 text-[11px]">
                    Atur pemberitahuan untuk aktivitas berkas dan update keamanan di AsterDrive.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#0c0e14]/60 border border-[#1e2433] rounded-xl">
                      <div>
                        <p className="font-medium text-slate-200">Notifikasi Unggahan Berkas</p>
                        <p className="text-[11px] text-slate-400">Tampilkan notifikasi saat berkas selesai diunggah</p>
                      </div>
                      <input type="checkbox" defaultChecked className="accent-orange-500 w-4 h-4 cursor-pointer" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#0c0e14]/60 border border-[#1e2433] rounded-xl">
                      <div>
                        <p className="font-medium text-slate-200">Pemberitahuan Kolaborasi</p>
                        <p className="text-[11px] text-slate-400">Tampilkan notifikasi saat rekan membagikan dokumen</p>
                      </div>
                      <input type="checkbox" defaultChecked className="accent-orange-500 w-4 h-4 cursor-pointer" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#0c0e14]/60 border border-[#1e2433] rounded-xl">
                      <div>
                        <p className="font-medium text-slate-200">Peringatan Keamanan</p>
                        <p className="text-[11px] text-slate-400">Notifikasi saat pemindaian integritas enkripsi berkas selesai</p>
                      </div>
                      <input type="checkbox" defaultChecked className="accent-orange-500 w-4 h-4 cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SHORTCUTS */}
              {settingsTab === 'shortcuts' && (
                <div className="space-y-4">
                  <p className="text-slate-400 text-[11px]">
                    Gunakan pintasan keyboard untuk mempercepat navigasi dan manajemen berkas:
                  </p>
                  <div className="border border-[#1e2433] rounded-xl overflow-hidden divide-y divide-[#1e2433]">
                    {[
                      { key: 'Space', desc: 'Buka pratinjau berkas / media lightbox' },
                      { key: '← / →', desc: 'Navigasi ke berkas sebelumnya / berikutnya di viewer' },
                      { key: 'Esc', desc: 'Tutup pratinjau atau jendela modal' },
                      { key: '⌘K / /', desc: 'Fokus ke kolom pencarian berkas' },
                      { key: 'Del / Backspace', desc: 'Pindahkan berkas terpilih ke Sampah' }
                    ].map((sc, i) => (
                      <div key={i} className="p-3 flex items-center justify-between bg-[#0c0e14]/40">
                        <span className="text-slate-300 font-medium">{sc.desc}</span>
                        <kbd className="px-2 py-0.5 bg-slate-800 text-slate-200 font-mono rounded border border-slate-700 text-[11px]">
                          {sc.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#151924]/60 border-t border-[#1e2433] flex items-center justify-between">
              <span className="text-[11px] text-slate-500">AsterDrive v2.4.0 • Obsidian Dark</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsModalOpen(false);
                    showToast('Setelan berhasil disimpan');
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md shadow-sm transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INVITE COLLABORATOR */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#11141d] border border-[#1e2433] rounded-2xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2433]">
              <h3 className="font-semibold text-sm text-white">Invite Collaborator</h3>
              <button type="button" onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCollaborator} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={newCollabEmail}
                  onChange={(e) => setNewCollabEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="w-full px-3 py-2 bg-[#0c0e14] border border-[#1e2433] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Permission Role</label>
                <select
                  value={newCollabRole}
                  onChange={(e) => setNewCollabRole(e.target.value as 'Viewer' | 'Editor')}
                  className="w-full px-3 py-2 bg-[#0c0e14] border border-[#1e2433] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="Viewer">Viewer (Can view & download)</option>
                  <option value="Editor">Editor (Can edit & upload)</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GOOGLE DRIVE STYLE FULLSCREEN MEDIA & FILE VIEWER */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-[#090b10]/95 backdrop-blur-md flex flex-col text-slate-100 select-none overflow-hidden animate-in fade-in duration-200">
          {/* 1. Google Drive Top Bar */}
          <div className="h-14 px-4 bg-[#10131c]/90 border-b border-[#1e2433] flex items-center justify-between shrink-0 z-30">
            {/* Left: Back Arrow, Type Icon, File Name, Star */}
            <div className="flex items-center gap-3 min-w-0 mr-4">
              <button
                type="button"
                onClick={handleClosePreview}
                className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-full transition-colors"
                title="Tutup (Esc)"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-slate-800/80 shrink-0">
                  {getItemIcon(previewItem.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white truncate max-w-[200px] sm:max-w-md lg:max-w-xl">
                      {previewItem.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleStar(previewItem.id, e)}
                      className="text-slate-400 hover:text-amber-400 p-1"
                      title={previewItem.starred ? 'Berbintang' : 'Beri bintang'}
                    >
                      <Star className={`w-4 h-4 ${previewItem.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 hidden sm:flex">
                    <span className="uppercase font-semibold tracking-wider text-[10px] text-orange-400">
                      {previewItem.type}
                    </span>
                    <span>•</span>
                    <span>{formatFileSize(previewItem.size)}</span>
                    <span>•</span>
                    <span>AsterDrive Cloud</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: "Buka dengan..." / Action Chip */}
            <div className="hidden md:flex items-center">
              <div className="px-3.5 py-1.5 bg-[#181d2a] hover:bg-[#202738] border border-[#23293a] text-slate-200 hover:text-white rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors shadow-sm">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>
                  {previewItem.type === 'video'
                    ? 'Buka dengan AsterDrive Video Player'
                    : previewItem.type === 'image'
                    ? 'Buka dengan AsterDrive Image Viewer'
                    : previewItem.type === 'spreadsheet'
                    ? 'Buka dengan AsterDrive Sheets'
                    : 'Buka dengan AsterDrive Docs'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90 ml-1" />
              </div>
            </div>

            {/* Right: Print, Share, Download, Info Sidebar Toggle, Close */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {previewItem.type === 'document' && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-full transition-colors hidden sm:inline-flex"
                  title="Cetak Berkas"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const toShare = previewItem;
                  setShareItem(toShare);
                }}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-full transition-colors"
                title="Bagi Tautan"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleDownloadItem(previewItem)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-full transition-colors"
                title="Unduh Berkas"
              >
                <Download className="w-4 h-4 text-orange-400" />
              </button>

              <button
                type="button"
                onClick={() => setShowPreviewInfo(!showPreviewInfo)}
                className={`p-2 rounded-full transition-colors ${
                  showPreviewInfo ? 'bg-orange-500/20 text-orange-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                title="Rincian Berkas (Info)"
              >
                <Info className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleClosePreview}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-full transition-colors ml-1"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Main Stage with Left & Right Navigation Chevrons */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Chevron (Previous File) */}
            {hasPrevPreview && (
              <button
                type="button"
                onClick={handlePrevPreview}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                title={`Sebelumnya: ${previewableFiles[currentPreviewIndex - 1]?.name}`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Right Chevron (Next File) */}
            {hasNextPreview && (
              <button
                type="button"
                onClick={handleNextPreview}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                title={`Berikutnya: ${previewableFiles[currentPreviewIndex + 1]?.name}`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Viewer Stage */}
            <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-auto relative">
              {/* VIDEO VIEWER (Google Drive Style) */}
              {previewItem.type === 'video' && (
                <div className="w-full max-w-5xl h-full max-h-[82vh] flex flex-col items-center justify-center relative">
                  {isLoadingMedia ? (
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Menyiapkan pemutaran video langsung...</span>
                    </div>
                  ) : activeMediaUrl ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 rounded-2xl overflow-hidden border border-[#1e2433] shadow-2xl relative group">
                      <video
                        ref={videoRef}
                        key={activeMediaUrl}
                        src={activeMediaUrl}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full max-h-[76vh] object-contain bg-black outline-none"
                      >
                        Browser Anda tidak mendukung tag video HTML5.
                      </video>
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] text-white/90 flex items-center gap-1.5 border border-white/10 pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Google Drive Playback Engine • 1080p HD</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-[#11141d] rounded-2xl border border-[#1e2433]">
                      <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                      <h4 className="text-base font-semibold text-white">Video tidak dapat dimuat</h4>
                      <p className="text-xs text-slate-400 mt-1">Berkas video ini mungkin memerlukan format MP4 atau H.264.</p>
                    </div>
                  )}
                </div>
              )}

              {/* PHOTO / IMAGE VIEWER (Google Drive Style) */}
              {previewItem.type === 'image' && (
                <div className="w-full h-full flex items-center justify-center relative">
                  {isLoadingMedia ? (
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Memuat foto resolusi penuh...</span>
                    </div>
                  ) : activeMediaUrl || previewItem.previewUrl ? (
                    <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeMediaUrl || previewItem.previewUrl}
                        alt={previewItem.name}
                        className="max-h-[78vh] max-w-full object-contain drop-shadow-2xl transition-transform duration-200 select-none cursor-grab active:cursor-grabbing"
                        style={{
                          transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-[#11141d] rounded-2xl border border-[#1e2433]">
                      <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <h4 className="text-base font-semibold text-white">Foto tidak dapat ditampilkan</h4>
                    </div>
                  )}

                  {/* Google Drive Floating Bottom Toolbar for Images */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 bg-[#121620]/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl text-white text-xs">
                    <button
                      type="button"
                      onClick={() => setImageZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                      className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full"
                      title="Perkecil (-)"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-medium text-slate-200 min-w-[42px] text-center">
                      {Math.round(imageZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setImageZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                      className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full"
                      title="Perbesar (+)"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-700 mx-1" />
                    <button
                      type="button"
                      onClick={() => setImageRotation((r) => (r + 90) % 360)}
                      className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full"
                      title="Putar 90° (R)"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageZoom(1);
                        setImageRotation(0);
                      }}
                      className="px-2 py-0.5 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded"
                      title="Sesuaikan dengan Layar"
                    >
                      Sesuaikan
                    </button>
                  </div>
                </div>
              )}

              {/* PDF / DOCUMENT VIEWER (Google Drive Style) */}
              {previewItem.type === 'document' && (
                <div className="w-full max-w-4xl h-full max-h-[82vh] overflow-y-auto flex flex-col items-center">
                  {/* Top document pagination */}
                  <div className="sticky top-0 z-20 bg-[#121620]/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 mb-4 flex items-center gap-3 text-xs text-slate-200 shadow-xl">
                    <button
                      type="button"
                      disabled={docPage <= 1}
                      onClick={() => setDocPage((p) => Math.max(1, p - 1))}
                      className="p-1 hover:text-white disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span>Halaman {docPage} dari 4</span>
                    <button
                      type="button"
                      disabled={docPage >= 4}
                      onClick={() => setDocPage((p) => Math.min(4, p + 1))}
                      className="p-1 hover:text-white disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Document Paper Sheet */}
                  <div className="w-full max-w-3xl bg-white text-slate-900 rounded-lg shadow-2xl p-8 sm:p-14 space-y-6 my-2">
                    <div className="border-b-2 border-slate-900/10 pb-5">
                      <div className="text-xs uppercase font-bold tracking-widest text-orange-600">
                        AsterDrive Dokumen Teknis
                      </div>
                      <h1 className="text-2xl font-extrabold text-slate-950 mt-1 tracking-tight">
                        Arsitektur Sistem Cloud Storage AsterDrive & Keamanan Zero-Knowledge
                      </h1>
                      <p className="text-xs text-slate-500 mt-1.5">
                        Versi 3.4 • Diperbarui pada 27 Oktober 2026 • Tim Riset & Infrastruktur
                      </p>
                    </div>

                    {docPage === 1 && (
                      <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-serif">
                        <h3 className="text-base font-bold text-slate-950 font-sans">1. Ikhtisar & Arsitektur Utama</h3>
                        <p>
                          AsterDrive dirancang untuk memberikan pengalaman cloud drive setara standar industri global seperti Google Drive, dengan lapisan privasi terdesentralisasi. Berkas disimpan dalam blok penyimpanan aman dan diindeks secara instan untuk pemutaran multimedia tanpa hambatan.
                        </p>
                        <h3 className="text-base font-bold text-slate-950 font-sans mt-4">2. Enkripsi AES-256-GCM</h3>
                        <p>
                          Setiap berkas dienkripsi menggunakan kunci enkripsi individual yang dikelola melalui modul keamanan berbasis perangkat keras (HSM). Metadata dan konten dilindungi dari akses pihak ketiga yang tidak berwenang.
                        </p>
                      </div>
                    )}

                    {docPage === 2 && (
                      <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-serif">
                        <h3 className="text-base font-bold text-slate-950 font-sans">3. Mesin Streaming Media Definisi Tinggi</h3>
                        <p>
                          Pemutaran video instan menggunakan transmisi stream HTTP Live Streaming (HLS) dengan dukungan multi-bitrate adaptif (1080p, 720p, 480p). Sistem mengoptimalkan buffer untuk menghilangkan jeda pemutaran (zero-buffering latency).
                        </p>
                      </div>
                    )}

                    {docPage >= 3 && (
                      <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-serif">
                        <h3 className="text-base font-bold text-slate-950 font-sans">4. Sinkronisasi Multi-Perangkat</h3>
                        <p>
                          Sinkronisasi dua arah secara berkala memverifikasi berkas di komputer pengguna menggunakan hash SHA-256, menjaga konsistensi data di semua titik akses.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SPREADSHEET VIEWER (Google Drive Style) */}
              {previewItem.type === 'spreadsheet' && (
                <div className="w-full max-w-4xl h-full max-h-[82vh] overflow-y-auto bg-[#0f121a] border border-[#1e2433] rounded-2xl shadow-2xl p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#1e2433] mb-4">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      <span className="font-semibold text-sm text-white">AsterDrive Sheets - {previewItem.name}</span>
                    </div>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded font-mono">
                      Sheet 1 (Anggaran Q4)
                    </span>
                  </div>

                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#151924] text-slate-400 uppercase text-[11px] border-b border-[#1e2433]">
                      <tr>
                        <th className="px-4 py-2.5">Item</th>
                        <th className="px-4 py-2.5">Kategori</th>
                        <th className="px-4 py-2.5">Biaya (USD)</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2433]">
                      <tr>
                        <td className="px-4 py-3 font-medium text-white">Edge Storage Nodes (Multi-Region S3)</td>
                        <td className="px-4 py-3 text-slate-400">Penyimpanan</td>
                        <td className="px-4 py-3 font-mono text-emerald-400">$1,450.00</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400">Disetujui</span></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-white">Video Transcoding GPU Fleet</td>
                        <td className="px-4 py-3 text-slate-400">Komputasi Media</td>
                        <td className="px-4 py-3 font-mono text-emerald-400">$3,200.00</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400">Aktif</span></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-white">Global CDN Bandwidth Band</td>
                        <td className="px-4 py-3 text-slate-400">Jaringan</td>
                        <td className="px-4 py-3 font-mono text-emerald-400">$850.00</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400">Aktif</span></td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-[#151924]/80 font-semibold text-white border-t border-[#1e2433]">
                      <tr>
                        <td className="px-4 py-3" colSpan={2}>Total Biaya Anggaran</td>
                        <td className="px-4 py-3 font-mono text-orange-400" colSpan={2}>$5,500.00 USD</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* ARCHIVE VIEWER */}
              {previewItem.type === 'archive' && (
                <div className="w-full max-w-3xl h-full max-h-[82vh] overflow-y-auto bg-[#0f121a] border border-[#1e2433] rounded-2xl shadow-2xl p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#1e2433] mb-4">
                    <div className="flex items-center gap-2.5">
                      <FileArchive className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-sm text-white">Isi Arsip - {previewItem.name}</span>
                    </div>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2.5 py-0.5 rounded font-mono">
                      5 Berkas Terkompresi
                    </span>
                  </div>

                  <div className="divide-y divide-[#1e2433] text-xs">
                    {[
                      { name: 'src/video/playback_engine.ts', size: '24.5 KB', type: 'TypeScript' },
                      { name: 'src/storage/indexed_db.ts', size: '18.2 KB', type: 'TypeScript' },
                      { name: 'public/brand/logo.svg', size: '4.8 KB', type: 'Vector SVG' },
                      { name: 'database/backup.sql', size: '15.1 MB', type: 'Database Backup' },
                      { name: 'package.json', size: '1.2 KB', type: 'Config' }
                    ].map((f, i) => (
                      <div key={i} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-slate-200">
                          <FileText className="w-4 h-4 text-purple-400" />
                          <span className="font-mono text-[11px]">{f.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                          <span>{f.type}</span>
                          <span className="font-mono text-slate-300">{f.size}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Google Drive Collapsible Right Sidebar (Info / Details Panel) */}
            {showPreviewInfo && (
              <div className="w-80 sm:w-88 bg-[#11141d] border-l border-[#1e2433] h-full flex flex-col shrink-0 z-30 animate-in slide-in-from-right duration-200">
                {/* Panel Header */}
                <div className="px-5 py-3.5 border-b border-[#1e2433] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
                    <Info className="w-4 h-4 text-orange-400" />
                    <span>Rincian Berkas</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPreviewInfo(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Details / Activity Tabs */}
                <div className="flex border-b border-[#1e2433] text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('details')}
                    className={`flex-1 py-2.5 font-medium text-center transition-colors border-b-2 ${
                      previewTab === 'details'
                        ? 'border-orange-500 text-orange-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Rincian
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('activity')}
                    className={`flex-1 py-2.5 font-medium text-center transition-colors border-b-2 ${
                      previewTab === 'activity'
                        ? 'border-orange-500 text-orange-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Aktivitas
                  </button>
                </div>

                {/* Panel Content */}
                <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs text-slate-300">
                  {previewTab === 'details' ? (
                    <>
                      {/* Thumbnail Card */}
                      <div className="w-full h-32 rounded-xl bg-black/40 border border-[#1e2433] flex items-center justify-center overflow-hidden">
                        {previewItem.type === 'image' && (previewItem.thumbnailUrl || previewItem.previewUrl) ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={previewItem.thumbnailUrl || previewItem.previewUrl}
                            alt={previewItem.name}
                            className="w-full h-full object-cover"
                          />
                        ) : previewItem.type === 'video' && previewItem.thumbnailUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={previewItem.thumbnailUrl}
                            alt={previewItem.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-slate-500">
                            {getItemIcon(previewItem.type)}
                            <span className="text-[10px] uppercase font-mono">{previewItem.type}</span>
                          </div>
                        )}
                      </div>

                      {/* Access Section */}
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                          Akses Berkas
                        </span>
                        <div className="p-3 bg-[#0c0e14] border border-[#1e2433] rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                              {previewItem.owner[0]}
                            </div>
                            <div>
                              <p className="font-medium text-white">{previewItem.owner}</p>
                              <p className="text-[10px] text-slate-500">Pemilik dokumen</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            Pemilik
                          </span>
                        </div>
                      </div>

                      {/* General Information */}
                      <div className="space-y-3 pt-2 border-t border-[#1e2433]">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Informasi Umum
                        </span>
                        <div className="space-y-2.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tipe Berkas</span>
                            <span className="text-slate-200 capitalize font-medium">{previewItem.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ukuran</span>
                            <span className="text-slate-200 font-mono font-medium">{formatFileSize(previewItem.size)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Penyimpanan Terpakai</span>
                            <span className="text-slate-200 font-mono font-medium">{formatFileSize(previewItem.size)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Lokasi</span>
                            <span className="text-slate-200 font-medium">My Drive / AsterDrive</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Terakhir Diubah</span>
                            <span className="text-slate-200 font-medium">{new Date(previewItem.updatedAt).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Enkripsi</span>
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <Shield className="w-3 h-3" /> AES-256-GCM
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Activity Log */
                    <div className="space-y-4">
                      <div className="relative pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-800 space-y-4">
                        <div className="relative">
                          <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-[#11141d]" />
                          <p className="text-slate-200 font-medium">Dibuka di AsterDrive Preview</p>
                          <p className="text-[10px] text-slate-500">Baru saja oleh Anda</p>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-[#11141d]" />
                          <p className="text-slate-200 font-medium">Diunggah ke Cloud Vault</p>
                          <p className="text-[10px] text-slate-500">{new Date(previewItem.updatedAt).toLocaleDateString('id-ID')} oleh {previewItem.owner}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SHARE ITEM */}
      {shareItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#11141d] border border-[#1e2433] rounded-2xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2433]">
              <h3 className="font-semibold text-sm text-white">Share &quot;{shareItem.name}&quot;</h3>
              <button type="button" onClick={() => setShareItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-400">Anyone with this link can view this file:</p>
              <div className="flex items-center gap-2 p-2 bg-[#0c0e14] border border-[#1e2433] rounded-lg">
                <input
                  type="text"
                  readOnly
                  value={`https://asterdrive.io/share/${shareItem.id}`}
                  className="flex-1 bg-transparent text-xs text-slate-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://asterdrive.io/share/${shareItem.id}`);
                    showToast('Link copied to clipboard!');
                    setShareItem(null);
                  }}
                  className="p-1 text-orange-400 hover:text-orange-300"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating toast message */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#121620] border border-[#1e2433] text-slate-100 text-xs px-3.5 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
