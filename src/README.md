# Source Code Structure

This directory contains all the source code for the OneZygo AI application, organized in a professional and scalable structure.

## 📁 Directory Overview

### `/components`
Contains main layout components:
- **Header & Footer**: Main application layout components

### `/icons`
Contains all icon components:
- **UI Icons**: `CheckIcon`, `CloseIcon`, `XIcon`, etc.
- **Action Icons**: `NewChatIcon`, `DownloadIcon`, `UploadIcon`, etc.
- **File Icons**: `FileIcon`, `FolderIcon`, `FilePlusIcon`, etc.

### `/chat`
Chat functionality components:
- **ChatPanel.tsx** - Main chat interface
- **ActionSummary.tsx** - AI action summaries
- **StreamingAIResponse.tsx** - Real-time AI responses
- **Citations.tsx** - Source citations

### `/editor`
Code editing components:
- **CodeEditor.tsx** - Main code editor
- **CodeBlock.tsx** - Code block display
- **EditorTabs.tsx** - File tabs
- **PendingChanges.tsx** - Change management

### `/file-explorer`
File management components:
- **FileExplorer.tsx** - File tree interface
- **ContextMenu.tsx** - Right-click context menu

### `/layout`
Layout and navigation components:
- **ResizablePanels.tsx** - Resizable panel layout
- **AppRouter.tsx** - Application routing
- **PreviewPanel.tsx** - Preview panel
- **RunAppPrompt.tsx** - App execution prompt

### `/modals`
Modal dialog components:
- **ApiKeyModal.tsx** - API key configuration
- **DiffEditorModal.tsx** - File diff viewer

### `/terminal`
Terminal interface components:
- **TerminalPanel.tsx** - Terminal panel

### `/ui`
Reusable UI components:
- **Modal.tsx** - Modal dialog
- **ErrorCard.tsx** - Error display
- **Logo.tsx** - Application logo
- **FinAvatar.tsx** - AI avatar
- **ThinkingIndicator.tsx** - Loading indicator

### `/pages`
Page components:
- **HomePage.tsx** - Home page
- **AboutUs.tsx** - About page
- **ContactUs.tsx** - Contact page
- **PrivacyPolicy.tsx** - Privacy policy
- **Recommended.tsx** - Recommendations

### `/hooks`
Custom React hooks for state management and side effects:
- `useProjectState.ts` - Manages project state and file operations
- `useWebContainer.ts` - Handles web container functionality

### `/services`
External API integrations and business logic:
- `geminiService.ts` - Gemini AI API integration
- `continueService.ts` - AI streaming continuation logic

### `/types`
TypeScript type definitions:
- `types.ts` - All application type definitions
- `index.ts` - Re-exports for cleaner imports

### `/styles`
CSS and styling files:
- `index.css` - Main application styles

### `/utils`
Utility functions and helpers (ready for future use)

### `/pages`
Page components (ready for future use)

## 🔧 Import Patterns

### Using Index Files
```typescript
// Clean imports using index files
import { HomePage, ChatPanel } from '@/components';
import { useProjectState } from '@/hooks';
import { getAiChanges } from '@/services';
import { ProjectState } from '@/types';
```

### Direct Imports
```typescript
// Direct imports for specific components
import HomePage from '@/components/HomePage';
import { useProjectState } from '@/hooks/useProjectState';
```

## 📝 Development Guidelines

1. **Component Organization**: Place new components in the appropriate subdirectory
2. **Type Safety**: Always define types in `/types` directory
3. **Service Layer**: Keep API calls and business logic in `/services`
4. **Custom Hooks**: Extract reusable logic into custom hooks
5. **Index Files**: Use index files for cleaner imports

## 🚀 Adding New Features

1. **New Component**: Add to `/components` with appropriate subdirectory
2. **New Hook**: Add to `/hooks` directory
3. **New Service**: Add to `/services` directory
4. **New Types**: Add to `/types/types.ts`
5. **Update Index Files**: Export new items from index files

This structure makes the codebase scalable and maintainable for team development.
