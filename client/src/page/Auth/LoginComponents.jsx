import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import MuiCard from "@mui/material/Card";
import { useNavigate } from "react-router-dom";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
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
  [theme.breakpoints.up("sm")]: {
    width: "430px",
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

const LoginAdminPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("auth/login", {
        username,
        password,
      });

      const { user, message } = response.data;

      if (user && user.role) {
        localStorage.setItem("user", JSON.stringify(user));

        if (user.role === "admin") {
          toast.success(message || `Chào mừng Admin ${user.name || user.username}! 🎉`);
          navigate("/admin-dashboard");
        } else {
          toast.error("Truy cập bị từ chối. Bạn không có quyền Admin. 🚫");
        }
      } else {
        toast.error("Dữ liệu trả về từ server không hợp lệ! ❌");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Đăng nhập thất bại! Vui lòng thử lại. ❌"
      );
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
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <AdminPanelSettingsIcon
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
              letterSpacing: "1px",
            }}
          >
            MomUni Admin
          </Typography>
          <Typography variant="body2" sx={{ color: newPalette.textLight }}>
            Đăng nhập để quản lý hệ thống
          </Typography>
        </Box>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <Stack spacing={2.5}>
            <StyledTextField
              label="Tên đăng nhập"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
              autoFocus
            />

            <StyledTextField
              label="Mật khẩu"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? (
                        <VisibilityOff
                          sx={{ color: newPalette.primary }}
                        />
                      ) : (
                        <Visibility
                          sx={{ color: newPalette.primary }}
                        />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 1 }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    sx={{
                      color: newPalette.secondary,
                      "&.Mui-checked": {
                        color: newPalette.primary,
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: newPalette.textLight, fontSize: '0.9rem' }}>
                    Ghi nhớ tôi
                  </Typography>
                }
              />
              <Typography
                onClick={() => navigate("/forgot-password")}
                sx={{
                  color: newPalette.primary,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  "&:hover": {
                    textDecoration: "underline",
                    color: newPalette.primaryDarker,
                  },
                }}
              >
                Quên mật khẩu?
              </Typography>
            </Stack>
          </Stack>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: "12px",
              backgroundColor: newPalette.primary,
              color: newPalette.textOnPrimary,
              fontWeight: "bold",
              fontSize: "1rem",
              boxShadow: `0 4px 15px ${alpha(newPalette.primary, 0.4)}`,
              "&:hover": {
                backgroundColor: newPalette.primaryDarker,
                boxShadow: `0 6px 20px ${alpha(newPalette.primaryDarker, 0.5)}`,
              },
              "&.Mui-disabled": {
                backgroundColor: alpha(newPalette.primary, 0.5),
                color: alpha(newPalette.textOnPrimary, 0.7),
              }
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: newPalette.textOnPrimary }} /> : "Đăng Nhập"}
          </Button>
        </form>
      </StyledCard>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
    </Box>
  );
};

export default LoginAdminPage;