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
  Eye
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

const INITIAL_ITEMS: DriveItem[] = [
  {
    id: 'f1',
    parentId: 'root',
    name: 'Designs & Assets',
    type: 'folder',
    updatedAt: '2026-10-26T10:30:00Z',
    owner: 'Alex Driver',
    starred: true
  },
  {
    id: 'f2',
    parentId: 'root',
    name: 'Client Presentations',
    type: 'folder',
    updatedAt: '2026-10-25T14:15:00Z',
    owner: 'Alex Driver'
  },
  {
    id: 'f3',
    parentId: 'root',
    name: 'Quarterly Reports 2026',
    type: 'folder',
    updatedAt: '2026-10-24T09:00:00Z',
    owner: 'Alex Driver'
  },
  {
    id: 'doc1',
    parentId: 'root',
    name: 'AsterDrive_Architecture_Overview.pdf',
    type: 'document',
    size: 2450000,
    updatedAt: '2026-10-27T04:20:00Z',
    owner: 'Alex Driver',
    starred: true
  },
  {
    id: 'img1',
    parentId: 'root',
    name: 'Hero_Design_Concept_v3.png',
    type: 'image',
    size: 4890000,
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    updatedAt: '2026-10-26T18:45:00Z',
    owner: 'Sarah Connor',
    starred: true
  },
  {
    id: 'vid1',
    parentId: 'root',
    name: 'Product_Demo_Walkthrough.mp4',
    type: 'video',
    size: 48200000,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=400&q=80',
    updatedAt: '2026-10-25T11:10:00Z',
    owner: 'Alex Driver',
    starred: true
  },
  {
    id: 'img2',
    parentId: 'root',
    name: 'AsterDrive_Mobile_UI.jpg',
    type: 'image',
    size: 3200000,
    previewUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=400&q=80',
    updatedAt: '2026-10-26T14:20:00Z',
    owner: 'Sarah Connor'
  },
  {
    id: 'vid2',
    parentId: 'root',
    name: 'Cloud_Sync_Engine_Teaser.mp4',
    type: 'video',
    size: 15800000,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=400&q=80',
    updatedAt: '2026-10-25T16:30:00Z',
    owner: 'Alex Driver'
  },
  {
    id: 'sheet1',
    parentId: 'root',
    name: 'Q4_Cloud_Budget_Allocation.xlsx',
    type: 'spreadsheet',
    size: 890000,
    updatedAt: '2026-10-24T16:00:00Z',
    owner: 'Alex Driver'
  },
  {
    id: 'comp1',
    parentId: 'comp_root',
    name: 'Local_Project_Backup.zip',
    type: 'archive',
    size: 15400000,
    updatedAt: '2026-10-26T08:20:00Z',
    owner: 'Alex Driver',
    source: 'computer',
    computerDevice: 'MacBook Pro 16"'
  }
];

export default function Page() {
  const [activeTab, setActiveTab] = useState<'mydrive' | 'computers' | 'shared' | 'recent' | 'starred' | 'storage' | 'activity' | 'people' | 'trash' | 'security' | 'feedback'>('mydrive');
  const [items, setItems] = useState<DriveItem[]>(INITIAL_ITEMS);
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [shareItem, setShareItem] = useState<DriveItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Media Preview States
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean>(false);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [previewTab, setPreviewTab] = useState<'preview' | 'details'>('preview');
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
  const userMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (newMenuRef.current && !newMenuRef.current.contains(target)) {
        setNewMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotificationsOpen(false);
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
    setPreviewTab('preview');
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
        if (previewItem.type === 'video') {
          setActiveMediaUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        } else if (previewItem.type === 'image') {
          setActiveMediaUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80');
        }
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
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, trashed: true } : it))
    );
    showToast('Moved to Trash');
  };

  const handleRestoreItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, trashed: false } : it))
    );
    showToast('Restored file from Trash');
  };

  const handleDeletePermanent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFileBlob(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    showToast('Deleted forever');
  };

  const handleEmptyTrash = () => {
    const trashed = items.filter((it) => it.trashed);
    trashed.forEach((it) => deleteFileBlob(it.id));
    setItems((prev) => prev.filter((it) => !it.trashed));
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
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files, folders, or docs..."
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {currentItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => (item.type === 'folder' ? handleFolderClick(item) : handleOpenPreview(item))}
                      className="bg-[#11141d] hover:bg-[#151924] border border-[#1e2433] hover:border-slate-700/80 rounded-xl p-3.5 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="p-2 rounded-lg bg-slate-800/60 shrink-0">
                              {getItemIcon(item.type)}
                            </div>
                            <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
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
                          <div className="mt-3 relative w-full h-28 rounded-lg overflow-hidden bg-black/40 border border-[#1e2433]/70 group-hover:border-orange-500/40 transition-all">
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
                          <div className="mt-3 relative w-full h-28 rounded-lg overflow-hidden bg-slate-950 border border-[#1e2433]/70 group-hover:border-orange-500/40 transition-all flex items-center justify-center">
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

                      <div className="mt-3 pt-2 border-t border-[#1e2433]/60 flex items-center justify-between text-[11px] text-slate-400">
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
                    <thead className="bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider border-b border-[#1e2433]">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Name</th>
                        <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Owner</th>
                        <th className="px-4 py-2.5 font-medium hidden md:table-cell">Size</th>
                        <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2433]/60">
                      {currentItems.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => (item.type === 'folder' ? handleFolderClick(item) : handleOpenPreview(item))}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-2.5 flex items-center gap-2.5 truncate max-w-xs">
                            {getItemIcon(item.type)}
                            <span className="font-medium text-slate-200 truncate">{item.name}</span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 hidden sm:table-cell">{item.owner}</td>
                          <td className="px-4 py-2.5 text-slate-400 hidden md:table-cell">{formatFileSize(item.size)}</td>
                          <td className="px-4 py-2.5 text-right space-x-1">
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
                {[
                  { action: 'Uploaded file', item: 'AsterDrive_Architecture_Overview.pdf', time: '10 minutes ago', user: 'Alex Driver' },
                  { action: 'Shared with viewer', item: 'Hero_Design_Concept_v3.png', time: '1 hour ago', user: 'Sarah Connor' },
                  { action: 'Synced from MacBook', item: 'Local_Project_Backup.zip', time: '3 hours ago', user: 'Alex Driver' },
                  { action: 'Created folder', item: 'Designs & Assets', time: 'Yesterday', user: 'Alex Driver' }
                ].map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-3 border-b border-[#1e2433] last:border-none last:pb-0 text-xs">
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
                ))}
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

      {/* MODAL: PREVIEW ITEM (Full Media Player & File Viewer) */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#11141d] border border-[#1e2433] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[92vh]">
            {/* Header */}
            <div className="px-5 py-3.5 bg-[#151924]/80 border-b border-[#1e2433] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-slate-800/80 shrink-0">
                  {getItemIcon(previewItem.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white truncate max-w-xs sm:max-w-md">
                      {previewItem.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleStar(previewItem.id, e)}
                      className="text-slate-400 hover:text-amber-400"
                      title={previewItem.starred ? 'Starred' : 'Add star'}
                    >
                      <Star className={`w-3.5 h-3.5 ${previewItem.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="uppercase text-[10px] font-semibold tracking-wider px-1.5 py-0.5 bg-slate-800 text-orange-400 rounded">
                      {previewItem.type}
                    </span>
                    <span>•</span>
                    <span>{formatFileSize(previewItem.size)}</span>
                    <span>•</span>
                    <span>{new Date(previewItem.updatedAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Tabs switcher: Preview vs Details */}
                <div className="flex items-center bg-[#0c0e14] border border-[#1e2433] rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('preview')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                      previewTab === 'preview' ? 'bg-orange-500 text-white font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('details')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                      previewTab === 'details' ? 'bg-orange-500 text-white font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Details</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadItem(previewItem)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5 text-orange-400" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                  aria-label="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {previewTab === 'details' ? (
                /* Metadata Details View */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e2433]">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">File Properties</h4>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-medium">
                      Encrypted AES-256
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-[#0c0e14] border border-[#1e2433] rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">File Name</span>
                      <p className="text-slate-200 font-semibold break-all">{previewItem.name}</p>
                    </div>
                    <div className="p-3 bg-[#0c0e14] border border-[#1e2433] rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Content Type</span>
                      <p className="text-slate-200 capitalize font-medium">{previewItem.type} file</p>
                    </div>
                    <div className="p-3 bg-[#0c0e14] border border-[#1e2433] rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Exact Size</span>
                      <p className="text-slate-200 font-medium">{previewItem.size ? `${previewItem.size.toLocaleString()} bytes (${formatFileSize(previewItem.size)})` : 'Folder / Dynamic'}</p>
                    </div>
                    <div className="p-3 bg-[#0c0e14] border border-[#1e2433] rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Owner</span>
                      <p className="text-slate-200 font-medium">{previewItem.owner}</p>
                    </div>
                    <div className="p-3 bg-[#0c0e14] border border-[#1e2433] rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Last Modified</span>
                      <p className="text-slate-200 font-medium">{new Date(previewItem.updatedAt).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="p-3 bg-[#0c0e14] border border-[#1e2433] rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Storage Location</span>
                      <p className="text-slate-200 font-medium">{previewItem.source === 'computer' ? `Synced from ${previewItem.computerDevice || 'Local PC'}` : 'AsterDrive Cloud Vault'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Interactive Preview View */
                <div>
                  {/* VIDEO PLAYER */}
                  {previewItem.type === 'video' && (
                    <div className="space-y-3">
                      <div className="relative bg-black rounded-xl overflow-hidden border border-[#1e2433] flex flex-col items-center justify-center min-h-[320px] max-h-[60vh] shadow-2xl">
                        {isLoadingMedia ? (
                          <div className="flex flex-col items-center gap-3 text-slate-400 py-16">
                            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Memuat streaming video AsterDrive...</span>
                          </div>
                        ) : activeMediaUrl ? (
                          <video
                            ref={videoRef}
                            key={activeMediaUrl}
                            src={activeMediaUrl}
                            controls
                            autoPlay
                            playsInline
                            className="w-full max-h-[56vh] object-contain bg-black outline-none"
                          >
                            Browser Anda tidak mendukung tag video HTML5.
                          </video>
                        ) : (
                          <div className="text-center py-12">
                            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-300">Sumber video tidak tersedia</p>
                          </div>
                        )}
                      </div>

                      {/* Video Bar Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0c0e14] p-3 rounded-xl border border-[#1e2433] text-xs">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-slate-300 font-medium">Direct Video Streaming</span>
                          <span className="text-slate-600 hidden sm:inline">•</span>
                          <span className="text-slate-400 hidden sm:inline">1080p Full HD • AAC Audio</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Kecepatan:</span>
                          {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <button
                              key={speed}
                              type="button"
                              onClick={() => {
                                if (videoRef.current) {
                                  videoRef.current.playbackRate = speed;
                                  showToast(`Kecepatan: ${speed}x`);
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
                            >
                              {speed}x
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              if (videoRef.current) {
                                if (videoRef.current.requestFullscreen) {
                                  videoRef.current.requestFullscreen();
                                }
                              }
                            }}
                            className="ml-2 px-2.5 py-1 rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 flex items-center gap-1 text-[11px] font-medium transition-colors"
                            title="Layar Penuh"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Layar Penuh</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IMAGE / PHOTO VIEWER */}
                  {previewItem.type === 'image' && (
                    <div className="space-y-3">
                      {/* Image toolbar */}
                      <div className="flex items-center justify-between bg-[#0c0e14] px-4 py-2 rounded-xl border border-[#1e2433] text-xs">
                        <span className="text-slate-400 text-[11px]">
                          Zoom: <span className="text-white font-medium">{Math.round(imageZoom * 100)}%</span> • Rotasi: <span className="text-white font-medium">{imageRotation}°</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setImageZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                            title="Perkecil (-)"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                            title="Perbesar (+)"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageRotation((r) => (r + 90) % 360)}
                            title="Putar 90°"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImageZoom(1);
                              setImageRotation(0);
                            }}
                            title="Reset"
                            className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-[11px] transition-colors"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Image Viewer Container */}
                      <div className="relative bg-[#07090e] rounded-xl border border-[#1e2433] p-4 flex items-center justify-center min-h-[320px] max-h-[60vh] overflow-hidden shadow-2xl">
                        {isLoadingMedia ? (
                          <div className="flex flex-col items-center gap-3 text-slate-400 py-16">
                            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Memuat foto...</span>
                          </div>
                        ) : activeMediaUrl || previewItem.previewUrl ? (
                          <div className="w-full h-full flex items-center justify-center overflow-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={activeMediaUrl || previewItem.previewUrl}
                              alt={previewItem.name}
                              className="max-h-[54vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
                              style={{
                                transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`
                              }}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-300">Foto tidak dapat dimuat</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DOCUMENT (PDF / DOC) READER */}
                  {previewItem.type === 'document' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-[#0c0e14] px-4 py-2 rounded-xl border border-[#1e2433] text-xs">
                        <div className="flex items-center gap-2 text-slate-300">
                          <FileText className="w-4 h-4 text-orange-400" />
                          <span className="font-medium">AsterDrive PDF Document Reader</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">Halaman 1 dari 4 • Mode Baca</span>
                      </div>

                      <div className="bg-[#151924] border border-[#23293a] rounded-xl p-6 sm:p-8 space-y-5 text-slate-200 shadow-xl max-h-[56vh] overflow-y-auto">
                        <div className="border-b border-[#23293a] pb-4">
                          <div className="text-[11px] font-semibold text-orange-400 uppercase tracking-widest">
                            Whitepaper Teknis
                          </div>
                          <h2 className="text-xl font-bold text-white mt-1">
                            AsterDrive: Arsitektur Cloud Storage Terdesentralisasi & Enkripsi Zero-Knowledge
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">
                            Disusun oleh Tim Arsitektur AsterDrive • Tanggal rilis: Oktober 2026
                          </p>
                        </div>

                        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                          <h3 className="text-sm font-semibold text-white">1. Ringkasan Eksekutif</h3>
                          <p>
                            AsterDrive menyediakan penyimpanan awan dengan standar keamanan militer AES-256-GCM. Berkas Anda dipecah menjadi blok terenkripsi sebelum meninggalkan perangkat, memastikan bahwa tidak ada pihak ketiga yang dapat membaca data Anda.
                          </p>

                          <h3 className="text-sm font-semibold text-white mt-4">2. Mesin Streaming Media Definisi Tinggi</h3>
                          <p>
                            Fitur pemutaran video langsung (Direct Playback) memanfaatkan pipeline HTTP Live Streaming (HLS) dan kontainer MP4 terindeks byte-range, memungkinkan pengguna memutar video 1080p/4K tanpa perlu mengunduh keseluruhan berkas terlebih dahulu.
                          </p>

                          <h3 className="text-sm font-semibold text-white mt-4">3. Sinkronisasi Antar Perangkat</h3>
                          <p>
                            Koneksi peer-to-peer terenkripsi memastikan sinkronisasi instan antara komputer desktop (macOS / Windows / Linux) dan cloud vault dengan verifikasi integritas checksum SHA-256.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SPREADSHEET VIEWER */}
                  {previewItem.type === 'spreadsheet' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-[#0c0e14] px-4 py-2 rounded-xl border border-[#1e2433] text-xs">
                        <div className="flex items-center gap-2 text-slate-300">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <span className="font-medium">Data Spreadsheet: Alokasi Anggaran Q4</span>
                        </div>
                        <span className="text-[11px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                          5 Baris Terindeks
                        </span>
                      </div>

                      <div className="bg-[#0c0e14] border border-[#1e2433] rounded-xl overflow-hidden shadow-xl">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-[#151924] text-slate-400 text-[11px] uppercase tracking-wider border-b border-[#1e2433]">
                            <tr>
                              <th className="px-4 py-2.5 font-medium">Pos Anggaran</th>
                              <th className="px-4 py-2.5 font-medium">Kapasitas</th>
                              <th className="px-4 py-2.5 font-medium">Estimasi (USD)</th>
                              <th className="px-4 py-2.5 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e2433]">
                            <tr>
                              <td className="px-4 py-2.5 font-medium text-white">Edge Storage Nodes (Multi-Region S3)</td>
                              <td className="px-4 py-2.5 text-slate-400">100 TB</td>
                              <td className="px-4 py-2.5 font-mono text-emerald-400">$1,450.00</td>
                              <td className="px-4 py-2.5"><span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Disetujui</span></td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2.5 font-medium text-white">Video Transcoding GPU Fleet</td>
                              <td className="px-4 py-2.5 text-slate-400">8x A100 Nodes</td>
                              <td className="px-4 py-2.5 font-mono text-emerald-400">$3,200.00</td>
                              <td className="px-4 py-2.5"><span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Aktif</span></td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2.5 font-medium text-white">Global CDN Bandwidth Band</td>
                              <td className="px-4 py-2.5 text-slate-400">50 TB Egress</td>
                              <td className="px-4 py-2.5 font-mono text-emerald-400">$850.00</td>
                              <td className="px-4 py-2.5"><span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Aktif</span></td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2.5 font-medium text-white">KMS Hardware Security Modules (HSM)</td>
                              <td className="px-4 py-2.5 text-slate-400">Dedicated</td>
                              <td className="px-4 py-2.5 font-mono text-emerald-400">$420.00</td>
                              <td className="px-4 py-2.5"><span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Tervalidasi</span></td>
                            </tr>
                          </tbody>
                          <tfoot className="bg-[#151924]/60 font-semibold text-white border-t border-[#1e2433]">
                            <tr>
                              <td className="px-4 py-2.5" colSpan={2}>Total Anggaran</td>
                              <td className="px-4 py-2.5 font-mono text-orange-400" colSpan={2}>$5,920.00 USD</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ARCHIVE (ZIP) VIEWER */}
                  {previewItem.type === 'archive' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-[#0c0e14] px-4 py-2 rounded-xl border border-[#1e2433] text-xs">
                        <div className="flex items-center gap-2 text-slate-300">
                          <FileArchive className="w-4 h-4 text-purple-400" />
                          <span className="font-medium">Struktur Arsip Cadangan (ZIP)</span>
                        </div>
                        <span className="text-[11px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-mono">
                          Kompresi 62%
                        </span>
                      </div>

                      <div className="bg-[#0c0e14] border border-[#1e2433] rounded-xl p-4 divide-y divide-[#1e2433] text-xs">
                        {[
                          { name: 'src/storage/engine.ts', size: '24.5 KB', type: 'TypeScript' },
                          { name: 'src/video/h264_streamer.ts', size: '18.2 KB', type: 'TypeScript' },
                          { name: 'public/brand/logo.svg', size: '4.8 KB', type: 'Vector SVG' },
                          { name: 'database/asterdrive_dump.sql', size: '15.1 MB', type: 'SQL Backup' },
                          { name: 'package.json', size: '1.2 KB', type: 'Config' }
                        ].map((f, i) => (
                          <div key={i} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                            <div className="flex items-center gap-2 text-slate-300">
                              <FileText className="w-3.5 h-3.5 text-purple-400" />
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
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-[#151924]/80 border-t border-[#1e2433] flex items-center justify-between gap-3 text-xs">
              <div className="text-slate-400 text-[11px] hidden sm:block">
                <span>Ukuran: <strong className="text-slate-200">{formatFileSize(previewItem.size)}</strong></span>
                <span className="mx-2">•</span>
                <span>Pemilik: <strong className="text-slate-200">{previewItem.owner}</strong></span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    const toShare = previewItem;
                    setPreviewItem(null);
                    setShareItem(toShare);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagi Tautan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadItem(previewItem)}
                  className="px-3.5 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Berkas</span>
                </button>
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
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
