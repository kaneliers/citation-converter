'use strict';
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow = null;

function settingsPath() {
  if (!app.isPackaged) return path.join(app.getPath('userData'), 'settings.json');
  const candidates = [];
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    candidates.push(path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'settings.json'));
  }
  candidates.push(path.join(path.dirname(process.execPath), 'settings.json'));
  candidates.push(path.join(app.getPath('userData'), 'settings.json'));
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
      fs.accessSync(path.dirname(p), fs.constants.W_OK);
      return p;
    } catch (e) { /* 继续尝试下一个 */ }
  }
  return path.join(app.getPath('userData'), 'settings.json');
}

const DEFAULT_SETTINGS = {
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-v4-flash',
  apiKey: '',
  temperature: 0,
  jsonMode: true
};

function loadSettings() {
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8');
    return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
  } catch (e) {
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}

function saveSettings(s) {
  try {
    fs.writeFileSync(settingsPath(), JSON.stringify(s, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

ipcMain.handle('settings:get', () => loadSettings());
ipcMain.handle('settings:set', (e, s) => saveSettings(s));

ipcMain.handle('api:chat', async (e, req) => {
  const { baseURL, model, apiKey, messages, temperature, jsonMode } = req;
  if (!baseURL || !model || !apiKey) {
    throw new Error('请先在设置中填写 baseURL / 模型 / API Key');
  }
  const url = String(baseURL).replace(/\/+$/, '') + '/chat/completions';
  const body = { model, messages, temperature };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 400); } catch (e2) { /* ignore */ }
    throw new Error('API 错误 ' + res.status + (detail ? '：' + detail : ''));
  }
  const data = await res.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) throw new Error('API 返回内容为空');
  return content;
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: '引注格式转换器',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
