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
});
