// const jwt = require("jsonwebtoken");
// const dotenv = require("dotenv");
// const CryptoJS = require("crypto-js");

// dotenv.config();

// const encryptData = (data) => {
//     const key = CryptoJS.enc.Hex.parse(process.env.ENCRYPTION_KEY);
//     const iv = CryptoJS.lib.WordArray.random(16);
//     const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, { iv });

//     return iv.toString(CryptoJS.enc.Hex) + ":" + encrypted.toString();
// };

// const decryptData = (encryptedData) => {
//     try {
//         const key = CryptoJS.enc.Hex.parse(process.env.ENCRYPTION_KEY);
//         const [ivHex, encryptedText] = encryptedData.split(":");

//         const iv = CryptoJS.enc.Hex.parse(ivHex);
//         const decrypted = CryptoJS.AES.decrypt(encryptedText, key, { iv });

//         return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
//     } catch (error) {
//         console.error("Lỗi giải mã dữ liệu:", error.message);
//         return null;
//     }
// };

// const createAccessToken = (payload) => {
//     console.log("JWT_EXPIRES_IN:", process.env.JWT_EXPIRES_IN);
//     const encryptedPayload = encryptData(payload);

//     return jwt.sign({ data: encryptedPayload }, process.env.JWT_SECRET_KEY, {
//         expiresIn: process.env.JWT_EXPIRES_IN || "30s",
//     });
// };

// const createRefreshToken = () => {
//     console.log("JWT_REFRESH_TOKEN_EXPIRES_IN:", process.env.JWT_REFRESH_TOKEN_EXPIRES_IN);
//     return jwt.sign({}, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "60s" });
// };

// const verifyToken = (token) => {
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
//         decoded.data = decryptData(decoded.data);
//         return decoded;
//     } catch (error) {
//         console.log("Token không hợp lệ:", error.message);
//         return null;
//     }
// };

// module.exports = { createAccessToken, createRefreshToken, verifyToken };
