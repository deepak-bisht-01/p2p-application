# New Features Added

This document outlines the new features and improvements added to the P2P File Sharing Application.

## 1. Folder Upload Support

### Backend Changes
- **File Manager** (`src/backend/file_manager.py`):
  - Added `folder_path` parameter to `register_file()` and `save_file()` methods
  - Files can now be saved in subdirectories to maintain folder structure
  - Added `folders` dictionary to track folder metadata

- **API** (`src/backend/api.py`):
  - Updated `/api/files/upload` endpoint to accept optional `folder_path` parameter
  - Files are automatically organized in their respective folder paths

### Frontend Changes
- **FileUpload Component** (`frontend/src/components/FileUpload.tsx`):
  - Added radio buttons to toggle between single file and folder upload
  - Folder selection uses HTML5 `webkitdirectory` attribute
  - Displays file count when folder is selected
  - Supports uploading all files from a selected folder while preserving structure

## 2. Reduced Flickering

### Optimization Techniques Implemented

- **Smart Polling** (`frontend/src/App.tsx`):
  - Modified `usePolling` hook to only update state when data actually changes
  - Implemented JSON-based deep comparison to prevent unnecessary re-renders
  - Loading state only shown on initial fetch, not on subsequent polls
  - Added mounted ref to prevent state updates on unmounted components
  - Increased file polling interval from 2s to 3s for better performance

- **React.memo for All Components**:
  - `StatusSummaryCard` - Memoized to prevent re-renders when props haven't changed
  - `PeerList` - Optimized peer list rendering
  - `MessagePanel` - Prevents message list flickering
  - `MessageComposer` - Stable form rendering
  - `ConnectPeerForm` - No unnecessary re-renders
  - `FileUpload` - Form remains stable during uploads
  - `FileList` - File list doesn't flicker during updates

## 3. Video File Support

### Backend Enhancements
- **File Manager** (`src/backend/file_manager.py`):
  - Added `get_partial_file()` method to retrieve in-progress file data
  - Supports streaming partial content for video preview during transfer

- **API** (`src/backend/api.py`):
  - Updated `/api/files/{file_id}/preview` endpoint:
    - Now supports video MIME types
    - Returns partial content for receiving files (videos/images)
    - Sets `Content-Disposition: inline` for media files
    - Adds `X-Transfer-Status` header to indicate transfer state

### Frontend Features
- **FileList Component** (`frontend/src/components/FileList.tsx`):
  - Added video player with HTML5 `<video>` controls
  - Buffering state indicator during video loading
  - Video events handled:
    - `onWaiting`: Shows "Buffering..." overlay
    - `onCanPlay`: Hides buffering indicator
    - `onPlaying`: Ensures smooth playback indication
  - Supports video preview even during file transfer (receiving state)

## 4. Real-time File Preview During Transfer

### Key Features
- **Sender can view files while sending**:
  - Images and videos can be previewed before transfer completes
  - Preview button enabled for receiving files (videos only for now)
  - "Transfer in progress..." badge shown during active transfers

- **Partial Content Support**:
  - Backend assembles received chunks for preview
  - Frontend displays partial content with buffering indicators
  - Real-time progress updates with chunk count

## Supported File Types

### With Preview Support
- **Images**: All image/* MIME types (jpg, png, gif, etc.)
- **Videos**: All video/* MIME types (mp4, webm, etc.)
  - ✓ Buffering indicator
  - ✓ Preview during transfer
  - ✓ Playback controls
- **Text Files**: text/* MIME types (txt, csv, etc.)
- **JSON**: application/json

### Download Only
- All other file types can be downloaded after transfer completes

## Technical Implementation Details

### TypeScript Extensions
- Created `frontend/src/react-extensions.d.ts` to extend React types
- Adds support for `webkitdirectory` and `directory` HTML attributes

### Performance Optimizations
1. **Reduced API Calls**: Intelligent polling with change detection
2. **Memoization**: All components use React.memo
3. **Ref-based State**: Prevents stale closure issues
4. **Conditional Rendering**: Only updates changed DOM elements

## Usage Examples

### Uploading a Folder
1. Select "Folder" radio button in the File Upload section
2. Click the file input to open folder picker
3. Select any folder from your system
4. All files in the folder will be queued for upload
5. Click "Send File" or "Broadcast File"

### Previewing Video During Transfer
1. Start receiving a video file from a peer
2. The file will appear in the Files list with "receiving" status
3. Click the "Preview" button (available even during transfer)
4. Video player will show with buffering indicator
5. Video streams as chunks are received

### Benefits
- **Better UX**: No screen flickering during polling
- **Organized Files**: Folder structure preserved
- **Rich Media**: Video playback with controls
- **Real-time**: Preview files while transferring
