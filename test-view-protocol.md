# Test view:// Protocol

This file tests the new `view://` protocol implementation.

## Test Cases

### 1. View Text File (should open in VSCode preview)
[View sample text file](view://test-files/sample-text.txt)

Wiki-style: [[view:test-files/sample-text.txt]]

### 2. View Binary File (should open with system viewer)
[View sample PNG image](view://test-files/sample-image.png)

Wiki-style: [[view:test-files/sample-image.png]]

### 3. View Non-Existent File (should show error)
[View non-existent file](view://test-files/does-not-exist.txt)

Wiki-style: [[view:test-files/does-not-exist.txt]]

### 4. View with Spaces in Path (URL encoded)
[View file with spaces](view://test-files/file%20with%20spaces.txt)

### 5. View Home Directory File
[View from home](view://~/test-file.txt)

### 6. View Current Extension Source
[View extension.ts](view://src/extension.ts)

## Comparison with Other Protocols

### edit:// (creates file if doesn't exist, editable)
[Edit sample text](edit://test-files/sample-text.txt)

### folder:// (opens in system file manager)
[Open test-files folder](folder://test-files)

### reveal:// (reveals in file manager)
[Reveal sample text](reveal://test-files/sample-text.txt)
