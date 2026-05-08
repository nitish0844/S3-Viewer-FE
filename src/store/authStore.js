import { create } from "zustand";

import {
  persist,
  createJSONStorage,
} from "zustand/middleware";

import CryptoJS from "crypto-js";


const ENC_KEY =
  import.meta.env.VITE_ENC_KEY;


const encrypt = (data) => {

  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    ENC_KEY
  ).toString();
};


const decrypt = (data) => {

  const bytes =
    CryptoJS.AES.decrypt(
      data,
      ENC_KEY
    );

  return JSON.parse(
    bytes.toString(
      CryptoJS.enc.Utf8
    )
  );
};


const encryptedStorage = {
  getItem: (name) => {
    const item =
      localStorage.getItem(name);

    if (!item) {
      return null;
    }

    return decrypt(item);
  },

  setItem: (name, value) => {

    localStorage.setItem(
      name,
      encrypt(value)
    );
  },

  removeItem: (name) => {

    localStorage.removeItem(name);
  },
};


export const useAuthStore =
  create(

    persist(

      (set) => ({

        sessionId: null,

        accessKey: null,

        setSession: (
          sessionId,
          accessKey
        ) => set({

          sessionId,
          accessKey
        }),

        clearSession: () =>
          set({

            sessionId: null,
            accessKey: null
          }),
      }),

      {
        name: "s3-auth-storage",
        storage:
          createJSONStorage(
            () =>
              encryptedStorage
          ),
      }
    )
  );