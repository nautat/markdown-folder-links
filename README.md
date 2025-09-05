# Markdown Folder Links

A VSCode extension that makes local folder and file paths clickable in Markdown files. Click to open folders in Finder (macOS), Explorer (Windows), or your default file manager (Linux).

## Features

- 🔗 **Clickable folder/file links** in Markdown files
- 📁 **Multiple protocols** for different actions:
  - `folder://` - Opens the folder/file in your system's file manager
  - `reveal://` - Reveals the folder/file in the file manager (shows in parent directory)
  - `edit://` - Opens the path in VSCode, creating files if needed
- 📝 **Wiki-style links** - Use `[[folder:path]]`, `[[reveal:path]]`, or `[[edit:path]]`
- 🏠 **Path expansion** - Supports `~` for home directory and relative paths
- 👁️ **Hover preview** - See if paths exist and get file/folder information
- ⚠️ **Smart handling** - Prompts to create missing folders and creates files for `edit://` links
- 🖥️ **Cross-platform** - Works on macOS, Windows, and Linux

## Usage

### Markdown Link Syntax

Standard markdown link format:

```markdown
[Open Documents](folder://~/Documents)
[Reveal in Finder](reveal://~/Downloads/file.pdf)
[Open in VSCode](edit://~/Projects/my-project)
```

Wiki-style double brackets:

```markdown
[[folder:~/Documents]]
[[reveal:~/Downloads/file.pdf]]
[[edit:~/Projects/my-app]]
```

### Path Formats

- **Absolute paths**: `/Users/username/Documents`
- **Home directory**: `~/Documents`
- **Relative paths**: `./subfolder` or `../parent-folder`
- **URL encoded**: Spaces and special characters are automatically handled

## Examples

```markdown
# My Project Notes

## Resources

- [Project Assets](folder://~/Projects/MyApp/assets)
- [Documentation](reveal://./docs)
- [Open Workspace in VSCode](edit://~/workspace)
- [Edit config file](edit://~/Projects/config.json)

## Quick Links

- [[folder:~/Downloads]]
- [[reveal:~/Desktop/important.pdf]]
- [[edit:~/Projects/my-app]]
```

## Configuration

Access settings through VSCode Settings > Extensions > Markdown Folder Links:

- **`markdownFolderLinks.enableHoverPreview`**: Show folder path preview on hover (default: true)
- **`markdownFolderLinks.defaultAction`**: Default action for folder:// links - "open" or "reveal" (default: "open")

## Installation

### From VSIX file

1. Download the `.vsix` file
2. Open VSCode
3. Go to Extensions view (⌘+Shift+X / Ctrl+Shift+X)
4. Click "..." menu > "Install from VSIX..."
5. Select the downloaded file

### From Source

1. Clone the repository
2. Run `npm install`
3. Run `npm run compile`
4. Press F5 to test in a new VSCode window

## Building from Source

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/markdown-folder-links.git
cd markdown-folder-links

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension
npm install -g vsce
vsce package
```

## Platform-Specific Behavior

### macOS

- `folder://` - Opens in Finder
- `reveal://` - Reveals in Finder with item selected

### Windows

- `folder://` - Opens in Explorer
- `reveal://` - Opens Explorer with item selected

### Linux

- Uses `xdg-open` to open with default file manager
- Supports most common desktop environments

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT

## Author

Created with VSCode extension development best practices.

---

**Note**: This extension runs locally and does not send any data externally. All folder operations are performed on your local machine.
