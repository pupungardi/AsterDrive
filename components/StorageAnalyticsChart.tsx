'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { HardDrive, Sparkles, Video, FileText, Archive, Image as ImageIcon, Table, File } from 'lucide-react';

export interface StorageAnalyticsItem {
  id: string;
  name: string;
  type: string;
  size?: number;
  trashed?: boolean;
}

interface StorageAnalyticsChartProps {
  items: StorageAnalyticsItem[];
  plan: {
    name: string;
    storage: string;
    maxBytes: number;
    isFree?: boolean;
  };
  onUpgradeClick?: () => void;
}

function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface CategoryData {
  key: string;
  name: string;
  bytes: number;
  count: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  percentage: number;
}

const emptySubscribe = () => () => {};
const getClientTrue = () => true;
const getServerFalse = () => false;

function StorageCustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isFree = data.key === 'free';
    const totalMax = data.totalMaxBytes || 1;
    const pctOfTotal = ((data.value / totalMax) * 100).toFixed(1);

    return (
      <div className="bg-slate-900/95 text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700/60 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-semibold text-slate-100">{data.name}</span>
        </div>
        <div className="space-y-0.5 text-slate-300 font-mono tabular-nums">
          <p className="text-white font-bold">{formatBytes(data.value)}</p>
          <p className="text-[11px] text-slate-400">
            {isFree ? 'Unallocated capacity' : `${data.count} item(s) · ${pctOfTotal}% of total`}
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function StorageAnalyticsChart({ items, plan, onUpgradeClick }: StorageAnalyticsChartProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, getClientTrue, getServerFalse);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const { categories, totalUsedBytes, freeBytes, usedPercentage } = useMemo(() => {
    const activeItems = items.filter(i => !i.trashed && i.type !== 'folder');
    let videoBytes = 0, videoCount = 0;
    let docBytes = 0, docCount = 0;
    let archiveBytes = 0, archiveCount = 0;
    let imgBytes = 0, imgCount = 0;
    let sheetBytes = 0, sheetCount = 0;
    let otherBytes = 0, otherCount = 0;

    for (const item of activeItems) {
      const size = item.size || 0;
      switch (item.type) {
        case 'video':
          videoBytes += size;
          videoCount++;
          break;
        case 'document':
        case 'presentation':
          docBytes += size;
          docCount++;
          break;
        case 'archive':
          archiveBytes += size;
          archiveCount++;
          break;
        case 'image':
          imgBytes += size;
          imgCount++;
          break;
        case 'spreadsheet':
          sheetBytes += size;
          sheetCount++;
          break;
        default:
          otherBytes += size;
          otherCount++;
          break;
      }
    }

    const totalUsed = videoBytes + docBytes + archiveBytes + imgBytes + sheetBytes + otherBytes;
    const maxB = plan.maxBytes || (1 * 1024 * 1024 * 1024);
    const free = Math.max(0, maxB - totalUsed);
    const pct = Math.min(100, Math.max(0, (totalUsed / maxB) * 100));

    const list: CategoryData[] = [
      {
        key: 'video',
        name: 'Videos',
        bytes: videoBytes,
        count: videoCount,
        color: '#3b82f6', // Tailwind blue-500
        icon: Video,
        percentage: totalUsed > 0 ? (videoBytes / totalUsed) * 100 : 0
      },
      {
        key: 'document',
        name: 'Documents',
        bytes: docBytes,
        count: docCount,
        color: '#f59e0b', // Tailwind amber-500
        icon: FileText,
        percentage: totalUsed > 0 ? (docBytes / totalUsed) * 100 : 0
      },
      {
        key: 'archive',
        name: 'Archives',
        bytes: archiveBytes,
        count: archiveCount,
        color: '#10b981', // Tailwind emerald-500
        icon: Archive,
        percentage: totalUsed > 0 ? (archiveBytes / totalUsed) * 100 : 0
      },
      {
        key: 'image',
        name: 'Images',
        bytes: imgBytes,
        count: imgCount,
        color: '#ec4899', // Tailwind pink-500
        icon: ImageIcon,
        percentage: totalUsed > 0 ? (imgBytes / totalUsed) * 100 : 0
      },
      {
        key: 'spreadsheet',
        name: 'Spreadsheets',
        bytes: sheetBytes,
        count: sheetCount,
        color: '#06b6d4', // Tailwind cyan-500
        icon: Table,
        percentage: totalUsed > 0 ? (sheetBytes / totalUsed) * 100 : 0
      },
      {
        key: 'other',
        name: 'Other Files',
        bytes: otherBytes,
        count: otherCount,
        color: '#8b5cf6', // Tailwind violet-500
        icon: File,
        percentage: totalUsed > 0 ? (otherBytes / totalUsed) * 100 : 0
      }
    ].filter(c => c.count > 0 || c.bytes > 0);

    return {
      categories: list,
      totalUsedBytes: totalUsed,
      freeBytes: free,
      usedPercentage: pct
    };
  }, [items, plan.maxBytes]);

  // Chart data: active categories with usage, plus available space
  const chartData = useMemo(() => {
    if (categories.length === 0) {
      return [{ name: 'Free Storage', value: plan.maxBytes, color: '#e2e8f0', key: 'free', count: 0, totalMaxBytes: plan.maxBytes }];
    }
    const data = categories.map(cat => ({
      name: cat.name,
      value: cat.bytes,
      color: cat.color,
      key: cat.key,
      count: cat.count,
      totalMaxBytes: plan.maxBytes
    }));

    if (freeBytes > 0) {
      data.push({
        name: 'Available Storage',
        value: freeBytes,
        color: '#e2e8f0',
        key: 'free',
        count: 0,
        totalMaxBytes: plan.maxBytes
      });
    }

    return data;
  }, [categories, freeBytes, plan.maxBytes]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-7 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Storage Breakdown</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual breakdown of storage usage by file type across your AsterDrive cloud
          </p>
        </div>

        {onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{plan.isFree ? 'Upgrade' : 'Manage Tier'}</span>
          </button>
        )}
      </div>

      {/* Main visualization grid: Donut Chart on left, Details on right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Donut Chart Viewport */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative min-h-[220px]">
          {isMounted ? (
            <div className="w-full h-52 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<StorageCustomTooltip />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={chartData.length > 1 ? 2 : 0}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                    onMouseEnter={(data: any) => setHoveredKey(data?.key ? String(data.key) : null)}
                    onMouseLeave={() => setHoveredKey(null)}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={`cell-${entry.key}`}
                        fill={entry.color}
                        opacity={hoveredKey === null || hoveredKey === entry.key ? 1 : 0.45}
                        className="transition-opacity duration-200 cursor-pointer outline-none"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metrics in Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums leading-tight">
                  {Math.round(usedPercentage)}%
                </span>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Used
                </span>
              </div>
            </div>
          ) : (
            <div className="w-40 h-40 rounded-full border-8 border-slate-100 border-t-blue-500 animate-spin" />
          )}

          {/* Aggregate Quota Line */}
          <div className="mt-2 text-center text-xs text-slate-600 font-mono tabular-nums">
            <span className="font-semibold text-slate-800">{formatBytes(totalUsedBytes)}</span>
            {' of '}
            <span className="font-semibold text-slate-800">{plan.storage}</span>
            <span className="text-slate-400"> ({formatBytes(freeBytes)} free)</span>
          </div>
        </div>

        {/* Category Breakdown Legend */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-2.5">
          {categories.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
              No files uploaded yet. Drag and drop files to populate your drive storage.
            </div>
          ) : (
            categories.map((cat) => {
              const IconComp = cat.icon;
              const isHovered = hoveredKey === cat.key;
              const quotaFraction = ((cat.bytes / plan.maxBytes) * 100).toFixed(1);

              return (
                <div
                  key={cat.key}
                  onMouseEnter={() => setHoveredKey(cat.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className={`p-2.5 rounded-xl transition-all border flex items-center justify-between gap-3 ${
                    isHovered
                      ? 'bg-slate-50 border-slate-300 shadow-xs'
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {cat.name}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          {cat.count} {cat.count === 1 ? 'file' : 'files'}
                        </span>
                      </div>
                      {/* Sub-bar */}
                      <div className="w-24 sm:w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                            backgroundColor: cat.color
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-slate-900 font-mono tabular-nums block">
                      {formatBytes(cat.bytes)}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono tabular-nums">
                      {quotaFraction}% quota
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Free Space Indicator Row */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block shrink-0" />
              <span className="font-medium text-slate-600">Available Storage</span>
            </div>
            <div className="text-right font-mono tabular-nums text-slate-500">
              <span className="font-semibold text-slate-700">{formatBytes(freeBytes)}</span>
              {' '}
              <span className="text-[10px]">({Math.max(0, 100 - Math.round(usedPercentage))}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
