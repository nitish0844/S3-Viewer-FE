import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { exec } from "child_process";
import path from "path";
import keytar from "keytar";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

// =========================
// FILE PICKER
// =========================
ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
  });

  return result.filePaths;
});

// =========================
// GET AWS KEYCHAIN
// =========================
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

ipcMain.handle("save-session", async (_, data) => {
  await keytar.setPassword(
    "s3-explorer-session",

    data.access_key,

    data.session_id,
  );

  return true;
});

ipcMain.handle("get-session", async (_, access_key) => {
  const session = await keytar.getPassword(
    "s3-explorer-session",

    access_key,
  );

  return session;
});

ipcMain.handle("delete-session", async (_, access_key) => {
  await keytar.deletePassword(
    "s3-explorer-session",

    access_key,
  );

  return true;
});

ipcMain.handle("read-file", async (_, filePath) => {
  console.log("Reading file:");

  console.log(filePath);

  const buffer = fs.readFileSync(filePath);

  return Array.from(buffer);
});

// =========================
// CREATE WINDOW
// =========================
function createWindow() {
  const win = new BrowserWindow({
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
    win.webContents.openDevTools();
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(createWindow);
