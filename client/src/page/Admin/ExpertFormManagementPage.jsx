import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    CircularProgress,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Chip,
    Stack,
    Link as MuiLink,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Visibility as ViewIcon,
    Reply as ReplyIcon,
    Delete as DeleteIcon,
    CheckCircleOutline as HandledIcon,
    HourglassEmpty as PendingIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    HelpOutline as QuestionIcon,
    CalendarToday as CalendarIcon,
    AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import axios from 'axios';

const ExpertFormManagementPage = () => {
    const theme = useTheme()
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [replyLoading, setReplyLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [formToDelete, setFormToDelete] = useState(null);

    const fetchForms = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/expert-form');
            setForms(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch expert forms:', error);
            toast.error(error.response?.data?.message || 'Không thể tải danh sách yêu cầu.');
            setForms([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchForms();
    }, [fetchForms]);

    const handleOpenReplyModal = (form) => {
        setSelectedForm(form);
        setReplyMessage('');
        setReplyModalOpen(true);
    };

    const handleCloseReplyModal = () => {
        setReplyModalOpen(false);
        setSelectedForm(null);
    };

    const handleSubmitReply = async () => {
        if (!selectedForm || !replyMessage.trim()) {
            toast.warn('Vui lòng nhập nội dung phản hồi.');
            return;
        }
        setReplyLoading(true);
        try {
            await axios.post(`expert-form/reply/${selectedForm._id}`, {
                message: replyMessage,
            });
            toast.success('Đã gửi phản hồi thành công!');
            handleCloseReplyModal();
            fetchForms();
        } catch (error) {
            console.error('Failed to submit reply:', error);
            toast.error(error.response?.data?.message || 'Gửi phản hồi thất bại.');
        } finally {
            setReplyLoading(false);
        }
    };

    const handleOpenDeleteConfirm = (form) => {
        setFormToDelete(form);
        setDeleteConfirmOpen(true);
    };

    const handleCloseDeleteConfirm = () => {
        setDeleteConfirmOpen(false);
        setFormToDelete(null);
    };

    const handleDeleteForm = async () => {
        if (!formToDelete) return;
        try {
            await axios.delete(`expert-forms/${formToDelete._id}`);
            toast.success(`Đã xóa yêu cầu từ ${formToDelete.name}.`);
            handleCloseDeleteConfirm();
            fetchForms();
        } catch (error) {
            console.error('Failed to delete expert form:', error);
            toast.error(error.response?.data?.message || 'Xóa yêu cầu thất bại.');
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


    return (
        <Paper sx={{ p: 3, m: 2, borderRadius: '12px', boxShadow: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Quản lý Yêu cầu Tư vấn Chuyên gia
                </Typography>
                <Tooltip title="Tải lại danh sách">
                    <span>
                        <IconButton
                            onClick={fetchForms}
                            color="primary"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                        </IconButton>
                    </span>
                </Tooltip>

            </Box>

            {loading && forms.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : forms.length === 0 && !loading ? (
                <Typography sx={{ textAlign: 'center', my: 5, color: 'text.secondary' }}>
                    Không có yêu cầu tư vấn nào.
                </Typography>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '8px', boxShadow: 'none' }}>
                    <Table sx={{ minWidth: 650 }} aria-label="expert forms table">
                        <TableHead sx={{ bgcolor: 'primary.main' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Người gửi</TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Email</TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Câu hỏi</TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Ngày gửi</TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Trạng thái</TableCell>
                                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {forms.map((form) => (
                                <TableRow
                                    key={form._id}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'action.hover' } }}
                                >
                                    <TableCell component="th" scope="row">
                                        {form.name}
                                    </TableCell>
                                    <TableCell>
                                        <MuiLink href={`mailto:${form.email}`} color="secondary.main" underline="hover">
                                            {form.email}
                                        </MuiLink>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Tooltip title={form.question}>
                                            <span>{form.question}</span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>{formatDate(form.createdAt)}</TableCell>
                                    <TableCell>
                                        {form.isHandled ? (
                                            <Chip
                                                icon={<HandledIcon />}
                                                label="Đã được xử lý"
                                                color="success"
                                                size="small"
                                                variant="outlined"
                                            />
                                        ) : (
                                            <Chip
                                                icon={<PendingIcon />}
                                                label="Chờ xử lý"
                                                color="warning"
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={form.isHandled ? "Xem & Thêm Phản hồi" : "Trả lời"}>
                                            <IconButton onClick={() => handleOpenReplyModal(form)} color="primary" size="small">
                                                <ReplyIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Xóa yêu cầu">
                                            <IconButton onClick={() => handleOpenDeleteConfirm(form)} color="error" size="small">
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Reply Modal */}
            {selectedForm && (
                <Dialog open={replyModalOpen} onClose={handleCloseReplyModal} maxWidth="md" fullWidth
                    PaperProps={{ sx: { borderRadius: '12px' } }}
                >
                    <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <ReplyIcon />
                            <Typography variant="h6">
                                Phản hồi Yêu cầu Tư vấn
                            </Typography>
                        </Stack>
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: 3 }}>
                        <Box mb={2}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                <PersonIcon color="action" />
                                <Typography variant="subtitle1" fontWeight="bold">Người gửi:</Typography>
                                <Typography variant="body1">{selectedForm.name}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                <EmailIcon color="action" />
                                <Typography variant="subtitle1" fontWeight="bold">Email:</Typography>
                                <MuiLink href={`mailto:${selectedForm.email}`} color="secondary.main" underline="hover">
                                    {selectedForm.email}
                                </MuiLink>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                                <CalendarIcon color="action" />
                                <Typography variant="subtitle1" fontWeight="bold">Ngày gửi:</Typography>
                                <Typography variant="body1">{formatDate(selectedForm.createdAt)}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="flex-start" mb={2}>
                                <QuestionIcon color="action" sx={{ mt: 0.5 }} />
                                <Typography variant="subtitle1" fontWeight="bold">Câu hỏi:</Typography>
                            </Stack>
                            <Paper variant="outlined" sx={{ p: 2, maxHeight: 150, overflowY: 'auto', whiteSpace: 'pre-wrap', bgcolor: 'background.default', borderRadius: '8px' }}>
                                {selectedForm.question}
                            </Paper>
                        </Box>

                        {selectedForm.isHandled && (
                            <Box mb={2}>
                                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                    <AdminIcon color="action" />
                                    <Typography variant="subtitle1" fontWeight="bold">Đã được xử lý</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                                    <CalendarIcon color="action" />
                                    <Typography variant="subtitle1" fontWeight="bold">Thời gian xử lý:</Typography>
                                    <Typography variant="body1">{formatDate(selectedForm.handledAt)}</Typography>
                                </Stack>
                                <Typography variant="subtitle1" fontWeight="bold" mb={1}>Lịch sử Phản hồi:</Typography>
                                {selectedForm.replies && selectedForm.replies.length > 0 ? (
                                    selectedForm.replies.map((reply, index) => (
                                        <Paper key={index} variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: '8px' }}>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{reply.message}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Phản hồi lúc {formatDate(reply.repliedAt || selectedForm.handledAt)}
                                            </Typography>
                                        </Paper>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">Chưa có phản hồi nào.</Typography>
                                )}
                            </Box>
                        )}

                        <TextField
                            label="Nội dung phản hồi của bạn"
                            multiline
                            rows={4}
                            fullWidth
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            variant="outlined"
                            sx={{ mt: selectedForm.isHandled ? 2 : 0, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            placeholder="Nhập câu trả lời của bạn ở đây..."
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={handleCloseReplyModal} color="secondary">Hủy</Button>
                        <Button
                            onClick={handleSubmitReply}
                            variant="contained"
                            color="primary"
                            disabled={replyLoading}
                            startIcon={replyLoading ? <CircularProgress size={20} color="inherit" /> : <ReplyIcon />}
                        >
                            {replyLoading ? 'Đang gửi...' : 'Gửi Phản hồi'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Delete Confirmation Dialog */}
            {formToDelete && (
                <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}
                    PaperProps={{ sx: { borderRadius: '12px' } }}
                >
                    <DialogTitle sx={{ bgcolor: 'error.main', color: 'error.contrastText', fontWeight: 'bold' }}>
                        Xác nhận Xóa Yêu cầu
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                        <Typography>
                            Bạn có chắc chắn muốn xóa yêu cầu từ <strong>{formToDelete.name}</strong> không?
                            Hành động này không thể hoàn tác.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto', p: 1, border: '1px dashed', borderColor: 'divider', borderRadius: '4px' }}>
                            <strong>Câu hỏi:</strong> {formToDelete.question}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={handleCloseDeleteConfirm} color="secondary">Hủy</Button>
                        <Button onClick={handleDeleteForm} variant="contained" color="error" startIcon={<DeleteIcon />}>
                            Xác nhận Xóa
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Paper>
    );
};

export default ExpertFormManagementPage;
