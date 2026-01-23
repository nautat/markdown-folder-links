import { exec } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";

const execAsync = promisify(exec);
const fsAccess = promisify(fs.access);

interface LinkPattern {
  pattern: RegExp;
  action: "open" | "reveal" | "vscode" | "view";
}

export function activate(context: vscode.ExtensionContext) {
  console.log("Markdown Folder Links extension activated");

  // Register link provider for markdown files
  const linkProvider = new FolderLinkProvider();
  const linkProviderDisposable = vscode.languages.registerDocumentLinkProvider(
    { scheme: "*", language: "markdown" },
    linkProvider
  );

  // Register hover provider for additional information
  const hoverProvider = new FolderLinkHoverProvider();
  const hoverProviderDisposable = vscode.languages.registerHoverProvider(
    { scheme: "*", language: "markdown" },
    hoverProvider
  );

  // Register command to open links
  const commandDisposable = vscode.commands.registerCommand(
    "markdownFolderLinks.openLink",
    async (linkPath: string, action: string) => {
      await openPath(linkPath, action);
    }
  );

  context.subscriptions.push(
    linkProviderDisposable,
    hoverProviderDisposable,
    commandDisposable
  );
}

class FolderLinkProvider implements vscode.DocumentLinkProvider {
  private linkPatterns: LinkPattern[] = [
    // Standard markdown link syntax
    { pattern: /\[([^\]]+)\]\(folder:\/\/([^)]+)\)/g, action: "open" },
    { pattern: /\[([^\]]+)\]\(reveal:\/\/([^)]+)\)/g, action: "reveal" },
    { pattern: /\[([^\]]+)\]\(edit:\/\/([^)]+)\)/g, action: "vscode" },
    { pattern: /\[([^\]]+)\]\(view:\/\/([^)]+)\)/g, action: "view" },
    // Wiki-style syntax
    { pattern: /\[\[folder:([^\]]+)\]\]/g, action: "open" },
    { pattern: /\[\[reveal:([^\]]+)\]\]/g, action: "reveal" },
    { pattern: /\[\[edit:([^\]]+)\]\]/g, action: "vscode" },
    { pattern: /\[\[view:([^\]]+)\]\]/g, action: "view" },
  ];

  provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.DocumentLink[] {
    const links: vscode.DocumentLink[] = [];
    const text = document.getText();

    for (const linkPattern of this.linkPatterns) {
      const regex = new RegExp(linkPattern.pattern);
      let match;

      while ((match = regex.exec(text)) !== null) {
        const linkPath = match[match.length - 1];
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);

        // Create a command URI that will trigger our command
        const args = encodeURIComponent(
          JSON.stringify([linkPath, linkPattern.action])
        );
        const uri = vscode.Uri.parse(
          `command:markdownFolderLinks.openLink?${args}`
        );

        const link = new vscode.DocumentLink(range, uri);
        const actionLabel =
          linkPattern.action === "vscode"
            ? "Edit in VSCode"
            : linkPattern.action === "reveal"
            ? "Reveal"
            : linkPattern.action === "view"
            ? "View"
            : "Open";
        link.tooltip = `${actionLabel}: ${expandPath(linkPath)}`;
        links.push(link);
      }
    }

    return links;
  }
}

class FolderLinkHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.Hover | undefined {
    const config = vscode.workspace.getConfiguration("markdownFolderLinks");
    if (!config.get("enableHoverPreview")) {
      return undefined;
    }

    const range = document.getWordRangeAtPosition(
      position,
      /\[([^\]]+)\]\((?:folder|reveal|edit|view):\/\/([^)]+)\)|\[\[(?:folder|reveal|edit|view):([^\]]+)\]\]/
    );
    if (!range) {
      return undefined;
    }

    const text = document.getText(range);
    const pathMatch = text.match(
      /(?:folder|reveal|edit|view):\/\/([^)]+)|(?:folder|reveal|edit|view):([^\]]+)/
    );
    if (!pathMatch) {
      return undefined;
    }

    const linkPath = pathMatch[1] || pathMatch[2];
    const expandedPath = expandPath(linkPath);

    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(`**Path:** \`${expandedPath}\`\n\n`);

    // Check if path exists
    if (fs.existsSync(expandedPath)) {
      const stats = fs.statSync(expandedPath);
      if (stats.isDirectory()) {
        markdown.appendMarkdown(
          `📁 Directory (${getFileCount(expandedPath)} items)`
        );
      } else {
        markdown.appendMarkdown(`📄 File (${formatFileSize(stats.size)})`);
      }
    } else {
      markdown.appendMarkdown(`⚠️ Path does not exist`);
    }

    return new vscode.Hover(markdown, range);
  }
}

async function openPath(linkPath: string, action: string) {
  try {
    const expandedPath = expandPath(linkPath);

    // Check if path exists (skip for vscode and view actions as they have their own error handling)
    if (action !== "vscode" && action !== "view") {
      try {
        await fsAccess(expandedPath);
      } catch {
        const response = await vscode.window.showWarningMessage(
          `Path does not exist: ${expandedPath}`,
          "Create Folder",
          "Cancel"
        );

        if (response === "Create Folder") {
          await createFolder(expandedPath);
        }
        return;
      }
    }

    const platform = process.platform;
    let command: string;

    switch (action) {
      case "vscode":
        // Open in VSCode - determine if it's a file or folder
        try {
          const stats = await fs.promises.stat(expandedPath);
          if (stats.isDirectory()) {
            // Open folder in new window
            await vscode.commands.executeCommand(
              "vscode.openFolder",
              vscode.Uri.file(expandedPath),
              true
            );
          } else {
            // Open file in current window
            const doc = await vscode.workspace.openTextDocument(expandedPath);
            await vscode.window.showTextDocument(doc);
          }
          vscode.window.showInformationMessage(
            `Opened in VSCode: ${path.basename(expandedPath)}`
          );
        } catch (error) {
          // If file doesn't exist, try to create and open it
          try {
            // Ensure directory exists
            const dir = path.dirname(expandedPath);
            await fs.promises.mkdir(dir, { recursive: true });
            // Create empty file if it doesn't exist
            await fs.promises
              .writeFile(expandedPath, "", { flag: "wx" })
              .catch(() => {});
            // Open the file
            const doc = await vscode.workspace.openTextDocument(expandedPath);
            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage(
              `Created and opened: ${path.basename(expandedPath)}`
            );
          } catch (err) {
            vscode.window.showErrorMessage(`Unable to open: ${expandedPath}`);
          }
        }
        break;

      case "view":
        // View file (read-only, no creation)
        try {
          const stats = await fs.promises.stat(expandedPath);

          if (stats.isDirectory()) {
            vscode.window.showWarningMessage(
              `Cannot view directory: ${path.basename(expandedPath)}`
            );
            return;
          }

          // Check if it's a binary file by extension
          const ext = path.extname(expandedPath).toLowerCase();
          const binaryExtensions = [
            '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.ico',
            '.mp4', '.mp3', '.avi', '.mov', '.wav', '.flac',
            '.zip', '.tar', '.gz', '.rar', '.7z',
            '.exe', '.dll', '.so', '.dylib',
            '.bin', '.dat', '.iso'
          ];

          if (binaryExtensions.includes(ext)) {
            // Binary file: open with system default viewer
            if (platform === "darwin") {
              command = `open "${expandedPath}"`;
            } else if (platform === "win32") {
              command = `start "" "${expandedPath}"`;
            } else {
              command = `xdg-open "${expandedPath}"`;
            }
            await execAsync(command);
            vscode.window.showInformationMessage(
              `Opened with system viewer: ${path.basename(expandedPath)}`
            );
          } else {
            // Text file: open in VSCode with preview
            const doc = await vscode.workspace.openTextDocument(expandedPath);
            await vscode.window.showTextDocument(doc, { preview: true });
            vscode.window.showInformationMessage(
              `Viewing: ${path.basename(expandedPath)}`
            );
          }
        } catch (error) {
          // File doesn't exist or other error
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            vscode.window.showErrorMessage(
              `File does not exist: ${expandedPath}`
            );
          } else {
            vscode.window.showErrorMessage(
              `Unable to view file: ${expandedPath}`
            );
          }
        }
        break;

      case "reveal":
        // Reveal in file manager
        if (platform === "darwin") {
          command = `open -R "${expandedPath}"`;
        } else if (platform === "win32") {
          command = `explorer.exe /select,"${expandedPath}"`;
        } else {
          // Linux - try common file managers
          command = `xdg-open "${path.dirname(expandedPath)}"`;
        }
        await execAsync(command);
        vscode.window.showInformationMessage(
          `Revealed: ${path.basename(expandedPath)}`
        );
        break;

      case "open":
      default:
        // Open folder/file
        if (platform === "darwin") {
          command = `open "${expandedPath}"`;
        } else if (platform === "win32") {
          command = `start "" "${expandedPath}"`;
        } else {
          command = `xdg-open "${expandedPath}"`;
        }
        await execAsync(command);
        vscode.window.showInformationMessage(
          `Opened: ${path.basename(expandedPath)}`
        );
        break;
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to open path: ${error}`);
  }
}

function expandPath(linkPath: string): string {
  // Decode URL encoding
  let expandedPath = decodeURIComponent(linkPath);

  // Expand ~ to home directory
  if (expandedPath.startsWith("~")) {
    expandedPath = path.join(os.homedir(), expandedPath.slice(1));
  }

  // Handle relative paths from current workspace
  if (!path.isAbsolute(expandedPath)) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      expandedPath = path.join(workspaceFolder.uri.fsPath, expandedPath);
    }
  }

  // Normalize the path
  return path.normalize(expandedPath);
}

async function createFolder(folderPath: string) {
  try {
    await fs.promises.mkdir(folderPath, { recursive: true });
    vscode.window.showInformationMessage(`Created folder: ${folderPath}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create folder: ${error}`);
  }
}

function getFileCount(dirPath: string): number {
  try {
    return fs.readdirSync(dirPath).length;
  } catch {
    return 0;
  }
}

function formatFileSize(bytes: number): string {
  const sizes = ["B", "KB", "MB", "GB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

export function deactivate() {
  console.log("Markdown Folder Links extension deactivated");
}
