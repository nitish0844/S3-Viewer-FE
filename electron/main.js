import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { exec } from "child_process";
import path from "path";
import keytar from "keytar";
import { fileURLToPath } from "url";
import fs from "fs";

import pkg from "electron-updater";

const { autoUpdater } = pkg;

autoUpdater.autoDownload = false;
// =========================
// PATHS
// =========================

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );


// =========================
// GLOBAL WINDOW
// =========================

let mainWindow;

// =========================
// FILE PICKER
// =========================

ipcMain.handle(
  "select-file",

  async () => {

    const result =
      await dialog
        .showOpenDialog({

          properties: [
            "openFile"
          ],
        });

    return result.filePaths;
  }
);


// =========================
// GET AWS KEYCHAIN
// =========================

ipcMain.handle(
  "get-aws-keychain",

  async () => {

    return new Promise(

      (
        resolve,
        reject
      ) => {

        exec(

          `security find-internet-password -s s3.amazonaws.com -g`,

          (
            error,
            stdout,
            stderr
          ) => {

            if (error) {

              console.error(
                error
              );

              reject(
                error.message
              );

              return;
            }

            // Extract access key
            const accessKeyMatch =
              stdout.match(

                /"acct"<blob>="([^"]+)"/
              );

            // Extract secret key
            const secretKeyMatch =
              stderr.match(

                /password: "([^"]+)"/
              );

            resolve({

              access_key:
                accessKeyMatch?.[1]
                || "",

              secret_key:
                secretKeyMatch?.[1]
                || "",
            });
          }
        );
      }
    );
  }
);


// =========================
// SESSION STORAGE
// =========================

ipcMain.handle(
  "save-session",

  async (_, data) => {

    await keytar
      .setPassword(

        "s3-explorer-session",

        data.access_key,

        data.session_id
      );

    return true;
  }
);


ipcMain.handle(
  "get-session",

  async (_, access_key) => {

    const session =
      await keytar
        .getPassword(

          "s3-explorer-session",

          access_key
        );

    return session;
  }
);


ipcMain.handle(
  "delete-session",

  async (_, access_key) => {

    await keytar
      .deletePassword(

        "s3-explorer-session",

        access_key
      );

    return true;
  }
);


// =========================
// READ FILE
// =========================

ipcMain.handle(
  "read-file",

  async (_, filePath) => {

    console.log(
      "Reading file:"
    );

    console.log(
      filePath
    );

    const buffer =
      fs.readFileSync(
        filePath
      );

    return Array.from(
      buffer
    );
  }
);


// =========================
// START UPDATE
// =========================

ipcMain.handle(
  "start-update",

  async () => {

    console.log(
      "Starting update download..."
    );

    autoUpdater
      .downloadUpdate();
  }
);


// =========================
// INSTALL UPDATE
// =========================

ipcMain.handle(
  "install-update",

  async () => {

    console.log(
      "Installing update..."
    );

    autoUpdater
      .quitAndInstall();
  }
);


// =========================
// CREATE WINDOW
// =========================
function createWindow() {

  mainWindow =
    new BrowserWindow({

      width: 1200,

      height: 800,

      webPreferences: {

        preload: path.join(
          __dirname,
          "preload.cjs"
        ),

        contextIsolation: true,

        nodeIntegration: false,
      },
    });


  const isDev =
    !app.isPackaged;


  if (isDev) {

    mainWindow
      .webContents
      .openDevTools();

    mainWindow
      .loadURL(
        "http://localhost:5173"
      );

  } else {

    mainWindow
      .loadFile(

        path.join(
          app.getAppPath(),
          "dist/index.html"
        )
      );
  }
}


// =========================
// AUTO UPDATER EVENTS
// =========================

autoUpdater.on(

  "checking-for-update",

  () => {

    console.log(
      "Checking for updates..."
    );
  }
);


autoUpdater.on(

  "update-available",

  (info) => {

    console.log(
      "Update available"
    );

    console.log(
      info
    );

    mainWindow
      .webContents
      .send(
        "update-available"
      );
  }
);


autoUpdater.on(

  "update-not-available",

  () => {

    console.log(
      "No updates available"
    );
  }
);


autoUpdater.on(

  "download-progress",

  (progress) => {

    console.log(
      "Download progress"
    );

    console.log(
      progress.percent
    );

    mainWindow
      .webContents
      .send(

        "update-progress",

        progress.percent
      );
  }
);


autoUpdater.on(

  "update-downloaded",

  () => {

    console.log(
      "Update downloaded"
    );

    mainWindow
      .webContents
      .send(
        "update-downloaded"
      );
  }
);


autoUpdater.on(

  "error",

  (error) => {

    console.log(
      "Updater error"
    );

    console.log(
      error
    );
  }
);


// =========================
// APP READY
// =========================

app.whenReady().then(

  () => {

    createWindow();

    autoUpdater
      .checkForUpdates();
  }
);