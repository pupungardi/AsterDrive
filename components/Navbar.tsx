'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Cloud,
  Search,
  Plus,
  Sun,
  Moon,
  Bell,
  X,
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
} from 'lucide-react';

interface NavbarProps {
  onLogout?: () => void;
  brandName?: string;
}

export default function Navbar({ onLogout, brandName = 'AsterDrive' }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
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

  // Keyboard shortcut for search (⌘K / Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setMobileSearchOpen(true);
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setMobileSearchOpen(false);
        setNewMenuOpen(false);
        setNotificationsOpen(false);
        setUserMenuOpen(false);
        setDrawerOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(`Switched to ${nextTheme} mode`);
  };

  const handleLogoutAction = () => {
    setUserMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      showToast('Logged out successfully');
    }
  };

  return (
    <>
      {/* 
        Primary navbar:
        Single fixed horizontal bar pinned to top of the viewport.
        Spans full viewport width edge-to-edge with no surrounding page padding and no enclosing max-width container.
      */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full h-14 bg-[#0c0e14]/95 backdrop-blur-md border-b border-[#1e2433] select-none text-slate-100">
        <div className="w-full h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between">
          
          {/* Left section: Hamburger, Brand Mark, Search */}
          <div className="flex items-center flex-1 min-w-0 mr-3">
            
            {/* 1. Hamburger menu icon */}
            <button
              type="button"
              onClick={() => setDrawerOpen(!drawerOpen)}
              aria-label="Toggle navigation drawer"
              className="p-1.5 mr-2 sm:mr-3 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/70 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-colors shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* 2. Brand mark: small logo icon paired with brand name on same baseline */}
            <div
              onClick={() => showToast('AsterDrive Cloud Storage')}
              className="flex items-center gap-2 shrink-0 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/25 group-hover:scale-105 transition-transform shrink-0">
                <Cloud className="w-4 h-4 fill-white/20" />
              </div>
              <span className="font-semibold text-sm sm:text-base tracking-tight text-white font-display">
                {brandName}
              </span>
            </div>

            {/* 3. Search input field (desktop / tablet) */}
            <div className="relative flex-1 max-w-xs md:max-w-sm lg:max-w-md ml-3 sm:ml-4 lg:ml-6 hidden sm:flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
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

            {/* Mobile search toggle icon button (condensed behind icon on narrow viewports) */}
            <div className="sm:hidden ml-2 flex items-center">
              <button
                type="button"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                aria-label="Toggle search bar"
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none transition-colors"
              >
                {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Right section: Primary action button, utility icons, avatar, logout */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* 
              4. Compact primary action button:
              Sizing rule:
              12px horizontal padding (px-[12px]), 6px vertical padding (py-[6px]),
              label text at 12px (text-[12px]) in a medium font weight (font-medium),
              leading plus icon aligned to label vertical center.
              On narrow viewports: collapses to icon-only.
            */}
            <div className="relative" ref={newMenuRef}>
              <button
                type="button"
                onClick={() => setNewMenuOpen(!newMenuOpen)}
                aria-label="Create new item"
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
                    onClick={() => {
                      setNewMenuOpen(false);
                      showToast('Creating new folder...');
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/70 hover:text-white"
                  >
                    <FolderPlus className="w-4 h-4 text-orange-400" />
                    <span>New folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewMenuOpen(false);
                      showToast('Uploading files...');
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/70 hover:text-white"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-400" />
                    <span>Upload files</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewMenuOpen(false);
                      showToast('Creating document...');
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-200 hover:bg-slate-800/70 hover:text-white"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>New document</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. Row of small icon-only utility buttons sitting side by side on same baseline */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              
              {/* Theme toggle utility button */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle color theme"
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none focus:ring-1 focus:ring-orange-500/40 transition-colors shrink-0"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-200" />
                )}
              </button>

              {/* Notification bell utility button */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  aria-label="Notifications"
                  className="relative p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none focus:ring-1 focus:ring-orange-500/40 transition-colors shrink-0"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-[#0c0e14]" />
                </button>

                {/* Notifications Dropdown */}
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

            {/* 6. Small circular user avatar */}
            <div className="relative ml-0.5 sm:ml-1" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User account menu"
                className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 p-[1.5px] focus:outline-none focus:ring-1 focus:ring-orange-400 shrink-0 hover:opacity-90 transition-opacity"
              >
                <div className="w-full h-full rounded-full bg-[#121620] flex items-center justify-center text-[10px] font-bold text-orange-400">
                  AD
                </div>
              </button>

              {/* User Account Popover */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#121620] border border-[#1e2433] rounded-lg shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-[#1e2433]">
                    <div className="font-semibold text-slate-100">Alex Driver</div>
                    <div className="text-[11px] text-slate-400 truncate">alex.driver@asterdrive.io</div>
                  </div>
                  <div className="py-1 border-b border-[#1e2433]">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        showToast('Opened Profile');
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        showToast('Opened Settings');
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Settings</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoutAction}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-400 hover:bg-rose-500/10"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>

            {/* 7. Text logout link at the far right */}
            <button
              type="button"
              onClick={handleLogoutAction}
              className="hidden md:inline-flex text-[12px] font-normal text-slate-400 hover:text-slate-100 transition-colors ml-1 focus:outline-none focus:underline shrink-0"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Mobile search bar expandable drawer (shown when mobile search icon is toggled) */}
        {mobileSearchOpen && (
          <div className="sm:hidden w-full px-3 py-2 bg-[#0c0e14] border-b border-[#1e2433] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files, folders, or docs..."
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

      {/* Hamburger Navigation Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}>
          <div
            className="fixed top-0 left-0 bottom-0 w-64 bg-[#0e111a] border-r border-[#1e2433] z-50 flex flex-col pt-16 px-4 pb-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1e2433]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-white">
                  <Cloud className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-sm text-white">{brandName}</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="mt-4 flex-1 space-y-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  showToast('My Files selected');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-200 hover:bg-slate-800/60 font-medium"
              >
                <HardDrive className="w-4 h-4 text-orange-400" />
                <span>My Files</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  showToast('Shared with me selected');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Shared with me</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  showToast('Recent selected');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              >
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Recent</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  showToast('Starred selected');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              >
                <Star className="w-4 h-4 text-slate-400" />
                <span>Starred</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  showToast('Trash selected');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              >
                <Trash2 className="w-4 h-4 text-slate-400" />
                <span>Trash</span>
              </button>
            </nav>

            <div className="pt-4 border-t border-[#1e2433]">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Storage</span>
                <span>28.4 GB of 100 GB</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 w-[28.4%]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating feedback toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#121620] border border-[#1e2433] text-slate-100 text-xs px-3 py-2 rounded-lg shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
