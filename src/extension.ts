import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("Angular Component Navigator is now active!");

  let disposable = vscode.commands.registerCommand(
    "angular-component-navigator.jumpToComponent",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor found");
        return;
      }

      const document = editor.document;
      const position = editor.selection.active;
      const line = document.lineAt(position.line);
      const lineText = line.text;

      // Match Angular component selectors
      const componentRegex = /<([a-z][a-z0-9-]*)(?:\s|>)/g;
      let match;
      let componentName = "";

      // Find the component at or before the cursor position
      while ((match = componentRegex.exec(lineText)) !== null) {
        if (match.index <= position.character) {
          componentName = match[1];
        }
      }

      if (!componentName) {
        vscode.window.showInformationMessage(
          "No component found at cursor position"
        );
        return;
      }

      console.log("Found component:", componentName);

      // Get the workspace folder
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showInformationMessage("No workspace folder found");
        return;
      }

      // Search for the component file
      const componentFiles = await vscode.workspace.findFiles(
        "**/*.ts",
        "**/node_modules/**"
      );

      console.log(
        "Searching through",
        componentFiles.length,
        "TypeScript files"
      );

      for (const file of componentFiles) {
        const content = await vscode.workspace.fs.readFile(file);
        const fileContent = Buffer.from(content).toString("utf8");

        // Look for component decorator with matching selector
        const selectorRegex = new RegExp(
          `@Component\\([^)]*selector:\\s*['"]${componentName}['"]`,
          "i"
        );
        if (selectorRegex.test(fileContent)) {
          console.log("Found matching component in:", file.fsPath);
          const doc = await vscode.workspace.openTextDocument(file);
          await vscode.window.showTextDocument(doc);
          return;
        }
      }

      vscode.window.showInformationMessage(
        `Component "${componentName}" not found`
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  console.log("Extension deactivated");
}
