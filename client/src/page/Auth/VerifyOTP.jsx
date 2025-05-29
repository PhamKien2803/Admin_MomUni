import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    Box,
    Typography,
    TextField,
    Stack,
    CircularProgress,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import MuiCard from "@mui/material/Card";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const newPalette = {
    primary: "#CA877E",
    primaryDarker: "#B8736B",
    secondary: "#E6A599",
    backgroundLight: "#FAF0EE",
    cardBackground: "#FFFFFF",
    textDark: "#333333",
    textLight: "#555555",
    textOnPrimary: "#FFFFFF",
    boxShadow: "rgba(202, 135, 126, 0.3)",
};

const StyledCard = styled(MuiCard)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    padding: theme.spacing(4),
    gap: theme.spacing(2.5),
    boxShadow: `0px 10px 30px ${newPalette.boxShadow}`,
    borderRadius: "20px",
    backgroundColor: newPalette.cardBackground,
    color: newPalette.textDark,
    textAlign: "center",
    [theme.breakpoints.up("sm")]: {
        width: "480px",
    },
}));

const StyledOtpInput = styled(TextField)(() => ({
    width: "3.5rem",
    height: "3.5rem",
    "& .MuiInputBase-input": {
        textAlign: "center",
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: newPalette.textDark,
        padding: "10px 0",
        height: "100%",
        boxSizing: "border-box",
    },
    "& .MuiOutlinedInput-root": {
        height: "100%",
        borderRadius: "12px",
        "& fieldset": {
            borderColor: newPalette.secondary,
        },
        "&:hover fieldset": {
            borderColor: newPalette.primary,
        },
        "&.Mui-focused fieldset": {
            borderColor: newPalette.primary,
            borderWidth: "2px",
        },
    },
}));

const VerifyOTP = () => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const otpInputs = useRef([]);
    const navigate = useNavigate();
    const timerRef = useRef(null);

    const startTimer = () => {
        setCanResend(false);
        setCountdown(60);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev === 1) {
                    clearInterval(timerRef.current);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        startTimer();
        otpInputs.current[0]?.focus();
        return () => clearInterval(timerRef.current);
    }, []);

    const handleChange = (index, event) => {
        const value = event.target.value;
        if (/^[0-9]$/.test(value) || value === "") {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (value && index < otp.length - 1) {
                otpInputs.current[index + 1]?.focus();
            }

            const otpString = newOtp.join("");
            if (otpString.length === 6) {
                verifyOtp(otpString);
            }
        }
    };

    const handleKeyDown = (index, event) => {
        if (event.key === "Backspace" && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
    };

    const verifyOtp = async (otpCode) => {
        setVerifying(true);
        try {
            const response = await axios.post("auth/verify-otp", { otp: otpCode });
            toast.success(response.data.message || "Xác thực OTP thành công!", { autoClose: 2000 });
            setTimeout(() => {
                navigate("/reset-password");
            }, 2000);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.";
            toast.error(errorMessage);
            setOtp(["", "", "", "", "", ""]);
            otpInputs.current[0]?.focus();
        } finally {
            setVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        startTimer();
        try {
            const email = localStorage.getItem("forgotPasswordEmail");
            if (!email) {
                toast.error("Không tìm thấy địa chỉ email để gửi lại OTP.");
                setCanResend(true);
                return;
            }
            await axios.post("auth/forgot-password", { email });
            toast.success("Mã OTP mới đã được gửi đến email của bạn.");
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Gửi lại OTP thất bại.";
            toast.error(errorMessage);
            setCanResend(true);
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                backgroundColor: newPalette.backgroundLight,
                padding: 2,
            }}
        >
            <StyledCard>
                <VpnKeyIcon
                    sx={{
                        fontSize: "3.5rem",
                        color: newPalette.primary,
                        mb: 1,
                    }}
                />
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: newPalette.primary,
                        textTransform: "uppercase",
                    }}
                >
                    Xác Thực Mã OTP
                </Typography>

                <Typography sx={{ color: newPalette.textLight, mb: 3, fontSize: "0.95rem" }}>
                    Nhập Mã OTP gồm 6 chữ số đã được gửi đến email của bạn.
                </Typography>

                <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mb: 3 }}>
                    {otp.map((digit, index) => (
                        <StyledOtpInput
                            key={index}
                            inputRef={(el) => (otpInputs.current[index] = el)}
                            type="tel"
                            value={digit}
                            onChange={(e) => handleChange(index, e)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            inputProps={{ maxLength: 1 }}
                            disabled={verifying}
                        />
                    ))}
                </Stack>
                {verifying && <CircularProgress size={24} sx={{ color: newPalette.primary, mb: 2 }} />}

                <Button
                    variant="outlined"
                    onClick={handleResendOtp}
                    disabled={!canResend || verifying}
                    sx={{
                        fontWeight: "bold",
                        borderRadius: "12px",
                        fontSize: "0.95rem",
                        textTransform: "none",
                        transition: "0.3s",
                        py: 1,
                        px: 3,
                        minWidth: '180px',
                        ...(canResend && !verifying
                            ? {
                                borderColor: newPalette.primary,
                                color: newPalette.primary,
                                "&:hover": {
                                    backgroundColor: alpha(newPalette.primary, 0.08),
                                    borderColor: newPalette.primaryDarker,
                                },
                            }
                            : {
                                borderColor: alpha(newPalette.textLight, 0.3),
                                color: newPalette.textLight,
                                cursor: "default",
                                opacity: 0.7,
                            }),
                    }}
                >
                    {canResend ? "Gửi lại OTP" : `Gửi lại sau ${countdown}s`}
                </Button>
            </StyledCard>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        </Box>
    );
};

export default VerifyOTP;