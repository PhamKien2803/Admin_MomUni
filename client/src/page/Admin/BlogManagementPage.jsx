import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, IconButton, CircularProgress, Tooltip,
    Chip, Switch, Avatar, Link as MuiLink, TablePagination, Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    Add as AddIcon, Refresh as RefreshIcon, Edit as EditIcon,
    Delete as DeleteIcon, Visibility as ViewIcon, Image as ImageIcon,
    Videocam as VideoIcon, CheckCircle as ActiveIcon, Cancel as InactiveIcon,
    Category as CategoryIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import BlogForm from './BlogForm';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

const BlogManagementPage = () => {
    const theme = useTheme();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const fetchBlogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('blog/all');
            setBlogs(response.data.blogs || []);
        } catch (error) {
            console.error('Failed to fetch blogs:', error);
            toast.error(error.response?.data?.message || 'Không thể tải danh sách bài viết.');
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    const handleOpenForm = (blog = null) => {
        setSelectedBlog(blog);
        setFormOpen(true);
    };

    const handleCloseForm = () => {
        setFormOpen(false);
        setSelectedBlog(null);
        fetchBlogs();
    };

    const handleOpenDeleteConfirm = (blog) => {
        setBlogToDelete(blog);
        setDeleteConfirmOpen(true);
    };

    const handleCloseDeleteConfirm = () => {
        setDeleteConfirmOpen(false);
        setBlogToDelete(null);
    };

    const handleDeleteBlog = async () => {
        if (!blogToDelete) return;
        try {
            await axios.delete(`blog/delete/${blogToDelete._id}`);
            toast.success(`Đã xóa bài viết: ${blogToDelete.title}`);
            handleCloseDeleteConfirm();
            fetchBlogs();
        } catch (error) {
            console.error('Failed to delete blog:', error);
            toast.error(error.response?.data?.message || 'Xóa bài viết thất bại.');
        }
    };

    const handleUpdateStatus = async (blogId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            await axios.put(`update-status/${blogId}?status=${newStatus}`);
            toast.success(`Cập nhật trạng thái thành công.`);
            fetchBlogs();
        } catch (error) {
            console.error('Failed to update blog status:', error);
            toast.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại.');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const displayedBlogs = blogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Paper sx={{ p: { xs: 2, sm: 3 }, m: { xs: 1, sm: 2 }, borderRadius: '12px', boxShadow: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Quản lý Bài viết Blog
                </Typography>
                <Box>
                    <Tooltip title="Tải lại danh sách">
                        <IconButton onClick={fetchBlogs} color="primary" disabled={loading} sx={{ mr: 1 }}>
                            {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenForm()}
                        sx={{ borderRadius: '8px' }}
                    >
                        Tạo Bài viết Mới
                    </Button>
                </Box>
            </Box>

            {loading && displayedBlogs.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : displayedBlogs.length === 0 && !loading ? (
                <Typography sx={{ textAlign: 'center', my: 5, color: 'text.secondary' }}>
                    Không có bài viết nào.
                </Typography>
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ borderRadius: '8px', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
                        <Table sx={{ minWidth: 750 }} aria-label="blogs table">
                            <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.primary.main, 0.1) }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', width: '5%' }}>Ảnh</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', width: '25%' }}>Tiêu đề</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', width: '15%' }}>Tác giả</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', width: '15%' }}>Ngày tạo</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', width: '10%', textAlign: 'center' }}>Trạng thái</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', width: '15%', textAlign: 'center' }}>Hành động</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {displayedBlogs.map((blog) => (
                                    <TableRow
                                        key={blog._id}
                                        hover
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell>
                                            <Avatar
                                                variant="rounded"
                                                src={blog.images?.[0]?.url || undefined}
                                                sx={{ width: 56, height: 56, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                                            >
                                                {!blog.images?.[0]?.url && <ImageIcon color="primary" />}
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight="medium" color="text.primary">
                                                {blog.title}
                                            </Typography>
                                            <MuiLink
                                                component={RouterLink}
                                                to={`/admin-dashboard/blogs-detail/${blog._id}`}
                                                variant="caption"
                                                color="secondary.main"
                                            >
                                                Xem chi tiết
                                            </MuiLink>
                                        </TableCell>
                                        {/* <TableCell>{blog.authorId?.username || blog.authorId || 'N/A'}</TableCell> */}
                                        <TableCell>Chuyên Gia</TableCell>
                                        <TableCell>{formatDate(blog.createdAt)}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title={blog.status === 'active' ? "Đang hoạt động" : "Không hoạt động"}>
                                                <Switch
                                                    checked={blog.status === 'active'}
                                                    onChange={() => handleUpdateStatus(blog._id, blog.status)}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Tooltip>
                                            <Chip
                                                icon={blog.status === 'active' ? <ActiveIcon /> : <InactiveIcon />}
                                                label={blog.status === 'active' ? 'Hoạt động' : 'Ẩn'}
                                                color={blog.status === 'active' ? 'success' : 'default'}
                                                size="small"
                                                variant="outlined"
                                                sx={{ ml: 1, display: { xs: 'none', md: 'inline-flex' } }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Chỉnh sửa">
                                                <IconButton onClick={() => handleOpenForm(blog)} color="info" size="small">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Xóa">
                                                <IconButton onClick={() => handleOpenDeleteConfirm(blog)} color="error" size="small">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={blogs.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Số dòng mỗi trang:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} trên ${count !== -1 ? count : `hơn ${to}`}`}
                    />
                </>
            )}

            <BlogForm
                open={formOpen}
                onClose={handleCloseForm}
                blogData={selectedBlog}
                onSaveSuccess={fetchBlogs}
            />

            {blogToDelete && (
                <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm} PaperProps={{ sx: { borderRadius: '12px' } }}>
                    <DialogTitle sx={{ bgcolor: 'error.main', color: 'error.contrastText', fontWeight: 'bold' }}>
                        Xác nhận Xóa Bài viết
                    </DialogTitle>
                    <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography>
                            Bạn có chắc chắn muốn xóa bài viết: <strong>{blogToDelete.title}</strong>?
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Hành động này không thể hoàn tác. Tất cả hình ảnh và video liên quan (nếu có trên Cloudinary) cũng sẽ bị xóa.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Button onClick={handleCloseDeleteConfirm} color="secondary">Hủy</Button>
                        <Button onClick={handleDeleteBlog} variant="contained" color="error" startIcon={<DeleteIcon />}>
                            Xác nhận Xóa
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Paper>
    );
};
export default BlogManagementPage;