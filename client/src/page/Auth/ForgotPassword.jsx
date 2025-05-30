import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
    Box,
    Button,
    TextField,
    Typography,
    CircularProgress,
    Link as MUILink,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import MuiCard from "@mui/material/Card";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
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
    gap: theme.spacing(3),
    boxShadow: `0px 10px 30px ${newPalette.boxShadow}`,
    borderRadius: "20px",
    backgroundColor: newPalette.cardBackground,
    color: newPalette.textDark,
    textAlign: "center",
    [theme.breakpoints.up("sm")]: {
        width: "450px",
    },
}));

const StyledTextField = styled(TextField)(() => ({
    "& label": {
        color: newPalette.textLight,
    },
    "& label.Mui-focused": {
        color: newPalette.primary,
    },
    "& .MuiInputBase-input": {
        color: newPalette.textDark,
        borderRadius: "12px",
    },
    "& .MuiOutlinedInput-root": {
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

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error("Vui lòng nhập địa chỉ email của bạn!");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post("auth/forgot-password", { email });
            toast.success(response.data.message || "Mã OTP đã được gửi, vui lòng kiểm tra email.", { autoClose: 2000 });
            setTimeout(() => {
                localStorage.setItem("forgotPasswordEmail", email);
                navigate("/verify-otp");
            }, 2000);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Đã có lỗi xảy ra!";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
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
                <MailOutlineIcon
                    sx={{
                        fontSize: "3.5rem",
                        color: newPalette.primary,
                        mb: 0,
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
                    Quên Mật Khẩu
                </Typography>

                <Typography sx={{ color: newPalette.textLight, mb: 1, fontSize: "0.95rem" }}>
                    Nhập địa chỉ email của bạn, chúng tôi sẽ gửi mã OTP để bạn đặt lại mật khẩu.
                </Typography>

                <StyledTextField
                    fullWidth
                    label="Địa chỉ Email"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    type="email"
                />

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    sx={{
                        py: 1.5,
                        borderRadius: "12px",
                        backgroundColor: newPalette.primary,
                        color: newPalette.textOnPrimary,
                        fontWeight: "bold",
                        fontSize: "1rem",
                        boxShadow: `0 4px 15px ${alpha(newPalette.primary, 0.3)}`,
                        "&:hover": {
                            backgroundColor: newPalette.primaryDarker,
                            boxShadow: `0 6px 20px ${alpha(newPalette.primaryDarker, 0.4)}`,
                        },
                        "&.Mui-disabled": {
                            backgroundColor: alpha(newPalette.primary, 0.5),
                        }
                    }}
                >
                    {loading ? <CircularProgress size={24} sx={{ color: newPalette.textOnPrimary }} /> : "Gửi mã OTP"}
                </Button>

                <Typography sx={{ color: newPalette.textLight, fontSize: "0.9rem", mt: 2 }}>
                    Đã nhớ mật khẩu?{" "}
                    <MUILink
                        component={RouterLink}
                        to="/"
                        sx={{
                            color: newPalette.primary,
                            fontWeight: "bold",
                            textDecoration: "none",
                            "&:hover": {
                                textDecoration: "underline",
                                color: newPalette.primaryDarker,
                            },
                        }}
                    >
                        Đăng nhập
                    </MUILink>
                </Typography>
            </StyledCard>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        </Box>
    );
};

export default ForgotPassword;