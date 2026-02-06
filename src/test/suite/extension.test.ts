import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Basics', () => {
  test('activates on markdown language', async () => {
    // Opening a markdown document should trigger activation via onLanguage:markdown
    const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content: '# Hello' });
    await vscode.languages.setTextDocumentLanguage(doc, 'markdown');

    const ext = vscode.extensions.getExtension('nautat.markdown-folder-links');
    await ext?.activate();

    assert.ok(ext, 'Extension not found by ID');
    assert.ok(ext?.isActive, 'Extension did not activate');
  });

  test('provides document links for folder/reveal/edit/view', async () => {
    const content = [
      '[Open](folder://./tmp-dir)',
      '[Reveal](reveal://./README.md)',
      '[Edit](edit://./notes/todo.md)',
      '[View](view://./README.md)'
    ].join(' ');

    const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content });
    const links = (await vscode.commands.executeCommand(
      'vscode.executeLinkProvider',
      doc.uri
    )) as vscode.DocumentLink[];

    assert.ok(links && links.length >= 4, `Expected >=4 links, got ${links?.length ?? 0}`);
    const targets = links.map((l) => l.target?.toString() ?? '');
    assert.ok(
      targets.every((t) => t.startsWith('command:markdownFolderLinks.openLink?')),
      'All links should invoke markdownFolderLinks.openLink command'
    );
  });

  test('provides document links for wiki-style view syntax', async () => {
    const content = 'Check this: [[view:./README.md]] for details.';

    const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content });
    const links = (await vscode.commands.executeCommand(
      'vscode.executeLinkProvider',
      doc.uri
    )) as vscode.DocumentLink[];

    assert.ok(links && links.length >= 1, `Expected >=1 links, got ${links?.length ?? 0}`);
    const target = links[0].target?.toString() ?? '';
    assert.ok(
      target.startsWith('command:markdownFolderLinks.openLink?'),
      'Wiki-style view link should invoke markdownFolderLinks.openLink command'
    );
  });

  test('hover provider returns info for wiki-style link', async () => {
    const doc = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: 'See [[folder:./non-existent-folder]] for details.'
    });
    const position = new vscode.Position(0, 7); // inside the link
    const hovers = (await vscode.commands.executeCommand(
      'vscode.executeHoverProvider',
      doc.uri,
      position
    )) as vscode.Hover[];

    assert.ok(hovers && hovers.length > 0, 'Expected a hover result');
  });

  test('hover provider returns info for view:// link', async () => {
    const doc = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: 'See [View](view://./non-existent-file.txt) for details.'
    });
    const position = new vscode.Position(0, 10); // inside the link
    const hovers = (await vscode.commands.executeCommand(
      'vscode.executeHoverProvider',
      doc.uri,
      position
    )) as vscode.Hover[];

    assert.ok(hovers && hovers.length > 0, 'Expected a hover result for view:// link');
  });
});

