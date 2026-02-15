# Change Log

All notable changes to the "markdown-folder-links" extension will be documented in this file.

## [1.1.0] - 2026-02-06

### Added
- Added support for `view://` protocol for read-only file viewing
  - Opens text files in VSCode with preview mode
  - Opens binary files (PDFs, images, videos, etc.) with system default viewer
  - Shows error if file doesn't exist (doesn't create files like `edit://`)
  - Supports both standard markdown syntax `[text](view://path)` and wiki-style `[[view:path]]`

## [1.0.0] - 2024-01-XX

### Initial Release
- Added support for `folder://` protocol to open folders/files
- Added support for `reveal://` protocol to reveal items in file manager
- Added support for `edit://` protocol to open paths in VSCode
- Implemented wiki-style `[[folder:path]]`, `[[reveal:path]]`, and `[[edit:path]]` syntax
- Added hover previews with file/folder information
- Path expansion for `~` and relative paths
- Cross-platform support (macOS, Windows, Linux)
- Configuration options for default behavior
- Smart handling of non-existent paths with creation prompt
