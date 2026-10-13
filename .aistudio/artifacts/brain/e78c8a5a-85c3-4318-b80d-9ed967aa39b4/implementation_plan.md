# Drag-and-Drop Folder Upload & Storage Analytics Dashboard

Enable seamless drag-and-drop uploading of files and entire folder hierarchies into AsterDrive, complemented by an interactive Recharts storage breakdown visualization in the Account & Profile Center.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following key user preferences were confirmed during Phase 1 clarification:
> - **Drop Zone Presentation**: Full-window backdrop overlay with active drop animation (`motion/react`) featuring blur scrim and glowing dashed target zone.
> - **Visual Analytics**: Interactive Recharts Donut Chart in the Account & Profile Center displaying categorical storage allocation (Videos, Documents, Archives, Images, Spreadsheets, Free Space).
> - **Folder Structure Handling**: Automatically recreate nested directory trees in AsterDrive using HTML5 `FileSystemDirectoryEntry` recursion, placing files in their corresponding parent folders.

---

## 1. Overview & Core Concept

- **What It Does**: Users can drag files and full nested directories from their desktop into AsterDrive's window to upload them directly into the current folder, with nested folder structures recreated automatically. In the Account & Profile Center, users gain an interactive storage analytics panel with a color-coded donut chart powered by Recharts, showing real-time usage by file category and remaining quota.
- **Target Audience / Persona**: Power users, videographers, and professionals managing mixed media libraries who need fast batch ingestion and clear visibility into cloud storage allocation.
- **Key Value**: Eliminates repetitive single-file picking, streamlines folder migrations from desktop computers, and gives immediate visual clarity on quota consumption.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Drag-and-Drop Ingestion**:
   - User drags one or more files or nested folders from their operating system anywhere over the AsterDrive window.
   - A smooth backdrop overlay fades in with an illuminated drop target: *"Drop files or folders here to upload"*.
   - Releasing the drop parses all entries (files and directories recursively), calculates aggregate size, and checks against remaining plan quota (e.g. 1 GB Free Plan).
   - If quota is exceeded, an actionable warning toast is displayed and the upgrade modal opens.
   - If quota is sufficient, new folders and files are instantly committed to state with object URLs generated for video playback, and a success notification highlights the total item count and bytes ingested.

2. **Storage Analytics in Account Center**:
   - User clicks their profile avatar in the top header or navigates to the Account & Profile Center.
   - A dedicated "Storage Breakdown & Analytics" card sits prominently below the profile summary, featuring an interactive Recharts Donut Chart (`PieChart` with `innerRadius={60}` and `outerRadius={90}`).
   - Hovering over segments reveals rich tooltips with exact bytes formatted (e.g., `320 MB · 32%`) and item counts.
   - A structured legend below displays color-coded dots, category names, file counts, and total sizes with tabular numerals.

### Visual Identity & Theme
- **Aesthetic Direction**: Clean SaaS cloud workspace, adhering strictly to enterprise dashboard standards with single-elevation depth and high visual legibility.
- **Color Palette**:
  - Video: Indigo/Blue (`#3b82f6`)
  - Documents: Amber (`#f59e0b`)
  - Archives: Emerald (`#10b981`)
  - Images: Rose (`#ec4899`)
  - Spreadsheets: Teal (`#14b8a6`)
  - Free Quota Space: Neutral slate tint (`#e2e8f0`)
- **Typography & Hierarchy**: `Plus Jakarta Sans` for titles and labels, paired with `font-mono tabular-nums` for bytes and file counts to eliminate layout jitter.
- **Interactive Motion**: Motion spring transitions (`cubic-bezier(0.16, 1, 0.3, 1)`) on drag-and-drop backdrop entrance/exit and chart segment hover highlights.

---

## 3. Key Product Decisions & Trade-Offs

- **Recursive Directory Traversal vs Flat Extraction**:
  - *Chosen Approach*: Recursive `webkitGetAsEntry()` / `FileSystemDirectoryEntry.createReader()` traversal creating matching `DriveItem` folders and parenting child files accordingly.
  - *Why*: Delivers standard cloud drive parity (Google Drive / Dropbox behavior) where desktop folder organization is preserved.
  - *Alternatives Considered*: Flattening all files into current directory would discard the user's desktop folder taxonomy.

- **Recharts Client Component Encapsulation**:
  - *Chosen Approach*: Implement a dedicated `StorageBreakdownChart` client component using `recharts` (`ResponsiveContainer`, `PieChart`, `Pie`, `Cell`, `Tooltip`), keeping rendering self-contained and SSR-safe.
  - *Why*: Recharts requires client-side DOM measurement; encapsulating it isolates chart lifecycle and prevents hydration warnings.
  - *Alternatives Considered*: Hand-rolled SVG pie charts lack accessible tooltips and smooth sector hover animations.

---

## 4. Technical Architecture & Data Strategy

### System & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AsterDrive Client App                           │
│                                                                        │
│   ┌────────────────────────┐         ┌───────────────────────────────┐ │
│   │ Full-Window Drag Zone  │         │   Account & Profile Center    │ │
│   │   (dragenter/dragover) │         │     (isProfileMenuOpen)       │ │
│   └───────────┬────────────┘         └───────────────┬───────────────┘ │
│               │ (drop)                               │                 │
│               ▼                                      ▼                 │
│   ┌────────────────────────┐         ┌───────────────────────────────┐ │
│   │ Recursive Drop Parser  │         │    Storage Breakdown Card     │ │
│   │ - FileSystemEntry read │         │  - Storage calculation hook  │ │
│   │ - Quota verification   │         │  - Recharts PieChart (Donut)  │ │
│   │ - Video ObjectURLs     │         │  - Interactive Custom Tooltip │ │
│   └───────────┬────────────┘         │  - Tabular Category Legend    │ │
│               │                      └───────────────────────────────┘ │
│               ▼                                                        │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │                     Drive Items State Store                      │ │
│   │                 (driveItems: DriveItem[], React state)           │ │
│   └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Categorization Schema
```typescript
interface StorageCategoryBreakdown {
  name: string;        // 'Videos' | 'Documents' | 'Archives' | 'Images' | 'Spreadsheets' | 'Available'
  typeKey: string;     // 'video' | 'document' | 'archive' | 'image' | 'spreadsheet' | 'free'
  bytes: number;       // Size in bytes
  count: number;       // Number of files
  color: string;       // Hex color for Recharts segment
  percentage: number;  // Relative proportion of total plan quota
}
```

### Interactive State & Handlers
1. `dragDepth` counter state on window/main wrapper to track entered/left transitions without child-element flickering.
2. `handleDrop` async function that inspects `event.dataTransfer.items`, recursively collects entries and files, computes total size, enforces plan limits, and dispatches batch state updates.
3. Memoized `storageBreakdown` computed from `driveItems` and `currentPlan.maxBytes`, feeding directly into the Recharts donut chart and category legend.
