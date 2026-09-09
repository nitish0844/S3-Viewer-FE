const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectFile: async () => {
    const files = await ipcRenderer.invoke("select-file");
    return files;
  },

  getAwsKeychain: () => ipcRenderer.invoke("get-aws-keychain"),

  saveSession: (data) => ipcRenderer.invoke("save-session", data),

  getSession: (access_key) => ipcRenderer.invoke("get-session", access_key),

  deleteSession: (access_key) =>
    ipcRenderer.invoke("delete-session", access_key),

  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),

  // -------------------------
  // Application Update
  // -------------------------

  updateApplication: () => ipcRenderer.invoke("update-application"),

  onUpdateStarted: (callback) =>
    ipcRenderer.on("update-started", (_, data) => callback(data)),

  onUpdateNotAvailable: (callback) =>
    ipcRenderer.on("update-not-available", () => callback()),

  onUpdateProgress: (callback) =>
    ipcRenderer.on("update-progress", (_, progress) => callback(progress)),

  onUpdateDownloaded: (callback) =>
    ipcRenderer.on("update-downloaded", () => callback()),

  onUpdateError: (callback) =>
    ipcRenderer.on("update-error", (_, data) => callback(data)),
});
