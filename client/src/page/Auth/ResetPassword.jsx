import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Link as MUILink,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import MuiCard from "@mui/material/Card";
import LockResetIcon from "@mui/icons-material/LockReset";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { toast, ToastContainer } from "react-toastify";
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

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    const storedEmail = localStorage.getItem("forgotPasswordEmail");

    if (!storedEmail) {
      toast.error("Phiên đã hết hạn! Vui lòng yêu cầu đặt lại mật khẩu.");
      navigate("/forgot-password");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }


    setLoading(true);
    try {
      const response = await axios.put("auth/reset-password", {
        email: storedEmail,
        newPassword,
        confirmPassword,
      });

      toast.success(response?.data?.message || "Đặt lại mật khẩu thành công!");
      setTimeout(() => {
        localStorage.removeItem("forgotPasswordEmail");
        navigate("/");
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
        <LockResetIcon
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
          Đặt Lại Mật Khẩu
        </Typography>

        <Typography sx={{ color: newPalette.textLight, mb: 1, fontSize: "0.95rem" }}>
          Nhập mật khẩu mới của bạn vào bên dưới.
        </Typography>

        <StyledTextField
          fullWidth
          label="Mật khẩu mới"
          type={showNewPassword ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle new password visibility"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  edge="end"
                >
                  {showNewPassword ? <VisibilityOff sx={{ color: newPalette.primary }} /> : <Visibility sx={{ color: newPalette.primary }} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <StyledTextField
          fullWidth
          label="Xác nhận mật khẩu mới"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff sx={{ color: newPalette.primary }} /> : <Visibility sx={{ color: newPalette.primary }} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          fullWidth
          variant="contained"
          onClick={handleResetPassword}
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
          {loading ? <CircularProgress size={24} sx={{ color: newPalette.textOnPrimary }} /> : "Đặt Lại Mật Khẩu"}
        </Button>

        <Typography sx={{ color: newPalette.textLight, fontSize: "0.9rem", mt: 2 }}>
          Quay lại trang{" "}
          <MUILink
            component={RouterLink}
            to="/login"
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

export default ResetPassword;