
const vscode = require('vscode');

const MANTRAS = [
  "El ruido no elige mis ejes.",
  "Hoy giré igual. Eso también cuenta.",
  "Nunca falles dos días seguidos.",
  "No busco motivación; construyo dirección.",
  "Mantén el vínculo, no la duración."
];

let statusItem;
let mantraIndex = 0;

function setMantra(text){
  if (!statusItem) { return; }
  statusItem.text = `$(triangle-right) ${text}`;
  statusItem.tooltip = "Eliejesresce K2 — Ritual Mode";
  statusItem.show();
}

function cycleMantra(){
  mantraIndex = (mantraIndex + 1) % MANTRAS.length;
  setMantra(MANTRAS[mantraIndex]);
}

async function applySettings(settings){
  const config = vscode.workspace.getConfiguration();
  for (const [key, value] of Object.entries(settings)){
    try {
      await config.update(key, value, vscode.ConfigurationTarget.Global);
    } catch(e){ console.error(e); }
  }
}

function activate(context) {
  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
  context.subscriptions.push(statusItem);

  setMantra(MANTRAS[mantraIndex]);

  const cmdCycle = vscode.commands.registerCommand('eliejesresceK2.cycleMantra', () => cycleMantra());
  const cmdRitual = vscode.commands.registerCommand('eliejesresceK2.toggleRitualMode', async () => {
    await applySettings({
      "zenMode.fullScreen": false,
      "zenMode.centerLayout": true,
      "zenMode.hideLineNumbers": false,
      "zenMode.hideStatusBar": false,
      "zenMode.hideTabs": true,
      "workbench.activityBar.visible": false,
      "workbench.statusBar.visible": true,
      "editor.minimap.enabled": false,
      "editor.cursorSmoothCaretAnimation": "on",
      "editor.cursorBlinking": "phase",
      "editor.lineHeight": 22,
      "editor.letterSpacing": 0.2,
      "editor.rulers": [88]
    });
    await vscode.commands.executeCommand('workbench.action.toggleZenMode');
    vscode.window.setStatusBarMessage("Ritual K2 activado", 2000);
  });

  const cmdGold = vscode.commands.registerCommand('eliejesresceK2.toggleGoldMode', async () => {
    await applySettings({
      "workbench.activityBar.visible": false,
      "workbench.statusBar.visible": false,
      "zenMode.centerLayout": true,
      "editor.minimap.enabled": false,
      "workbench.editor.showTabs": false,
      "editor.renderWhitespace": "none",
      "editor.lineNumbers": "on",
      "editor.bracketPairColorization.enabled": true,
      "editor.rulers": [88]
    });
    await vscode.commands.executeCommand('workbench.action.toggleZenMode');
    vscode.window.setStatusBarMessage("Bloque de Oro K2", 2000);
  });

  context.subscriptions.push(cmdCycle, cmdRitual, cmdGold);
}

function deactivate() {
  if (statusItem){ statusItem.dispose(); }
}

module.exports = { activate, deactivate };
