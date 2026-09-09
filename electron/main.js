import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { exec } from "child_process";
import path from "path";
import keytar from "keytar";
import { fileURLToPath } from "url";
import fs from "fs";
import pkg from "electron-updater";

const { autoUpdater } = pkg;

app.disableHardwareAcceleration();

autoUpdater.autoDownload = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// ======================================================
// FILE PICKER
// ======================================================

ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
  });

  return result.filePaths;
});

// ======================================================
// AWS KEYCHAIN
// ======================================================

ipcMain.handle("get-aws-keychain", async () => {
  return new Promise((resolve, reject) => {
    exec(
      `security find-internet-password -s s3.amazonaws.com -g`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          reject(error.message);
          return;
        }

        // Extract access key
        const accessKeyMatch = stdout.match(/"acct"<blob>="([^"]+)"/);

        // Extract secret key
        const secretKeyMatch = stderr.match(/password: "([^"]+)"/);

        resolve({
          access_key: accessKeyMatch?.[1] || "",
          secret_key: secretKeyMatch?.[1] || "",
        });
      },
    );
  });
});

// ======================================================
// SESSION - SAVE
// ======================================================

ipcMain.handle("save-session", async (_, data) => {
  await keytar.setPassword(
    "s3-explorer-session",
    data.access_key,
    data.session_id,
  );

  return true;
});

// ======================================================
// SESSION - GET
// ======================================================

ipcMain.handle("get-session", async (_, access_key) => {
  const session = await keytar.getPassword("s3-explorer-session", access_key);

  return session;
});

// ======================================================
// SESSION - DELETE
// ======================================================

ipcMain.handle("delete-session", async (_, access_key) => {
  await keytar.deletePassword("s3-explorer-session", access_key);

  return true;
});

// ======================================================
// READ FILE
// ======================================================

ipcMain.handle("read-file", async (_, filePath) => {
  const buffer = fs.readFileSync(filePath);

  return Array.from(buffer);
});

// ======================================================
// APPLICATION UPDATE
// ======================================================
//
// Flow:
//
// React
//   ↓
// updateApplication()
//   ↓
// checkForUpdates()
//   ↓
// update-available
//   ↓
// downloadUpdate()
//   ↓
// update-downloaded
//   ↓
// quitAndInstall()
//

ipcMain.handle("update-application", async () => {
  try {
    console.log("Checking for updates...");

    await autoUpdater.checkForUpdates();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Update check failed:", error);

    mainWindow?.webContents.send("update-error", {
      message: error.message,
    });

    return {
      success: false,
      message: error.message,
    };
  }
});

// ======================================================
// CREATE WINDOW
// ======================================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),

      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.webContents.openDevTools();

    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist/index.html"));
  }
}

// ======================================================
// UPDATE - CHECKING
// ======================================================

autoUpdater.on("checking-for-update", () => {
  console.log("Checking for updates...");
});

// ======================================================
// UPDATE - AVAILABLE
// ======================================================
//
// An update exists.
// Automatically start downloading it.
//

autoUpdater.on("update-available", async (info) => {
  console.log("Update available:", info.version);

  mainWindow?.webContents.send("update-started", {
    version: info.version,
  });

  try {
    console.log("Downloading update...");

    await autoUpdater.downloadUpdate();
  } catch (error) {
    console.error("Update download failed:", error);

    mainWindow?.webContents.send("update-error", {
      message: error.message,
    });
  }
});

// ======================================================
// UPDATE - NOT AVAILABLE
// ======================================================

autoUpdater.on("update-not-available", () => {
  console.log("No updates available");

  mainWindow?.webContents.send("update-not-available");
});

// ======================================================
// UPDATE - DOWNLOAD PROGRESS
// ======================================================

autoUpdater.on("download-progress", (progress) => {
  console.log(`Download progress: ${progress.percent.toFixed(1)}%`);

  mainWindow?.webContents.send("update-progress", progress.percent);
});

// ======================================================
// UPDATE - DOWNLOADED
// ======================================================
//
// Once downloaded, automatically install.
//

autoUpdater.on("update-downloaded", () => {
  console.log("Update downloaded");

  mainWindow?.webContents.send("update-downloaded");

  // Give renderer a moment to
  // receive the event before quitting.
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 1000);
});

// ======================================================
// UPDATE - ERROR
// ======================================================

autoUpdater.on("error", (error) => {
  console.error("Updater error:", error);

  mainWindow?.webContents.send("update-error", {
    message: error.message,
  });
});

// ======================================================
// APP READY
// ======================================================
//
// IMPORTANT:
// We do NOT check for updates here.
//
// Updates are checked only when the
// user clicks the Update button.
//

app.whenReady().then(() => {
  createWindow();
});

// ======================================================
// MACOS
// ======================================================

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ======================================================
// WINDOWS / LINUX
// ======================================================

app.on("window-all-closed", () => {
    app.quit();
});
