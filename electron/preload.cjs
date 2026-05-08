const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
  "electronAPI",

  {
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

    startUpdate: () => ipcRenderer.invoke("start-update"),

    installUpdate: () => ipcRenderer.invoke("install-update"),

    onUpdateAvailable: (callback) =>
      ipcRenderer.on("update-available", callback),

    onUpdateProgress: (callback) =>
      ipcRenderer.on(
        "update-progress",

        (_, progress) => callback(progress),
      ),

    onUpdateDownloaded: (callback) =>
      ipcRenderer.on("update-downloaded", callback),
  },
);
