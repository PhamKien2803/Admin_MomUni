import CryptoJS from "crypto-js";
import { jwtDecode } from "jwt-decode";

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

const decryptData = (encryptedData) => {
    if (!encryptedData) {
        console.error("Dữ liệu cần giải mã bị null hoặc undefined!");
        return null;
    }
    try {
        const [ivHex, encryptedText] = encryptedData.split(":");
        if (!ivHex || !encryptedText) {
            console.error("Dữ liệu mã hóa không hợp lệ!");
            return null;
        }

        const key = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
        const iv = CryptoJS.enc.Hex.parse(ivHex);

        const decrypted = CryptoJS.AES.decrypt(encryptedText, key, { iv });

        const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
        if (!decryptedText) {
            console.error("Không thể giải mã dữ liệu (kết quả rỗng)!");
            return null;
        }

        return JSON.parse(decryptedText);
    } catch (error) {
        console.error("Lỗi giải mã dữ liệu:", error);
        return null;
    }
};

export const getUserFromToken = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        console.warn("Không tìm thấy accessToken trong localStorage!");
        return null;
    }
    try {
        const decodedJWT = jwtDecode(token);
        if (!decodedJWT?.data) {
            console.error("Token không chứa dữ liệu hợp lệ!");
            return null;
        }

        console.log("Decoded trước giải mã:", decodedJWT);

        const userData = decryptData(decodedJWT.data);

        console.log("Decoded sau giải mã:", userData);

        return userData || null;
    } catch (error) {
        console.error("Lỗi đọc token:", error);
        return null;
    }
};

