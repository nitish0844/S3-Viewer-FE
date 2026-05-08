import CryptoJS from "crypto-js";

const ENC_KEY = import.meta.env.VITE_ENC_KEY;


// ENCRYPT
export function encryptData(data) {

  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    CryptoJS.enc.Utf8.parse(ENC_KEY),
    {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  return encrypted.toString();
}


// DECRYPT
export function decryptData(payload) {

  const decrypted = CryptoJS.AES.decrypt(
    payload,
    CryptoJS.enc.Utf8.parse(ENC_KEY),
    {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  return JSON.parse(
    decrypted.toString(CryptoJS.enc.Utf8)
  );
}