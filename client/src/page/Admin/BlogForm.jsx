import { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField,
    Grid, Box, Typography, IconButton, Chip, Stack, CircularProgress, Autocomplete,
    Paper, Divider
} from '@mui/material';
import {
    AddPhotoAlternate as AddPhotoIcon, Delete as DeleteIcon,
    VideoCall as VideoCallIcon, Link as LinkIcon, Close as CloseIcon,
    Save as SaveIcon, Label as TagIcon,
    CheckCircle as ActiveIcon, Cancel as InactiveIcon, WarningAmber as WarningIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useTheme, alpha } from '@mui/material/styles';
import axios from 'axios';


const BlogForm = ({ open, onClose, blogData, onSaveSuccess }) => {
    const theme = useTheme();
    const emptyBlog = {
        title: '', content: '', summary: '', authorId: '', tags: [],
        images: [], video: null, affiliateLinks: [], status: 'inactive',
    };

    const [formData, setFormData] = useState(emptyBlog);
    const [loading, setLoading] = useState(false);
    const initialFormDataRef = useRef(null);
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);


    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);

    const isFormDirty = () => {
        if (!initialFormDataRef.current) return false;
        return JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);
    };

    useEffect(() => {
        if (open) {
            let initialData;
            if (blogData) {
                initialData = {
                    title: blogData.title || '',
                    content: blogData.content || '',
                    summary: blogData.summary || '',
                    authorId: blogData.authorId?._id || blogData.authorId || '',
                    tags: blogData.tags || [],
                    images: blogData.images?.map(img => ({
                        url: img.url,
                        public_id: img.public_id,
                        caption: img.caption || '',
                        preview: img.url
                    })) || [],
                    video: blogData.video ? {
                        url: blogData.video.url,
                        public_id: blogData.video.public_id,
                        caption: blogData.video.caption || '',
                        preview: blogData.video.url
                    } : null,
                    affiliateLinks: blogData.affiliateLinks || [],
                    status: blogData.status || 'inactive',
                };
            } else {
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                const currentAuthorId = currentUser?.id || 'ADMIN_ID_PLACEHOLDER';
                initialData = { ...emptyBlog, authorId: currentAuthorId };
            }
            setFormData(initialData);
            initialFormDataRef.current = JSON.parse(JSON.stringify(initialData));
        } else {
            setFormData(emptyBlog);
            initialFormDataRef.current = null;
        }
    }, [blogData, open]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagsChange = (event, newValue) => {
        setFormData(prev => ({ ...prev, tags: newValue }));
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newImages = Array.from(e.target.files).map(file => ({
                file: file,
                caption: '',
                preview: URL.createObjectURL(file),
            }));
            setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
            e.target.value = null;
        }
    };

    const handleImageCaptionChange = (index, caption) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) => i === index ? { ...img, caption } : img),
        }));
    };

    const removeImage = (indexToRemove) => {
        const imageToRemove = formData.images[indexToRemove];
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove),
        }));
        if (imageToRemove.preview && imageToRemove.file) {
            URL.revokeObjectURL(imageToRemove.preview);
        }
    };

    const handleVideoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({
                ...prev,
                video: { file: file, preview: URL.createObjectURL(file), caption: '' },
            }));
            e.target.value = null;
        }
    };

    const removeVideo = () => {
        if (formData.video && formData.video.preview && formData.video.file) {
            URL.revokeObjectURL(formData.video.preview);
        }
        setFormData(prev => ({ ...prev, video: null }));
    };

    const handleAddAffiliateLink = () => {
        setFormData(prev => ({
            ...prev,
            affiliateLinks: [...prev.affiliateLinks, { name: '', url: '', price: '', image: '' }],
        }));
    };

    const handleAffiliateLinkChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            affiliateLinks: prev.affiliateLinks.map((link, i) =>
                i === index ? { ...link, [field]: value } : link
            ),
        }));
    };

    const removeAffiliateLink = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            affiliateLinks: prev.affiliateLinks.filter((_, index) => index !== indexToRemove),
        }));
    };

    const handleAttemptCloseDialog = (event, reason) => {
        if (reason && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
            if (isFormDirty()) {
                setConfirmCloseOpen(true);
                return;
            }
        }
        onClose();
    };

    const requestClose = () => {
        if (isFormDirty()) {
            setConfirmCloseOpen(true);
        } else {
            onClose();
        }
    };

    const handleConfirmDiscardAndClose = () => {
        setConfirmCloseOpen(false);
        onClose();
    };

    const handleCancelDiscard = () => {
        setConfirmCloseOpen(false);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const submissionData = new FormData();
        submissionData.append('title', formData.title);
        submissionData.append('content', formData.content);
        submissionData.append('summary', formData.summary);
        formData.tags.forEach(tag => submissionData.append('tags[]', tag));
        const imageFiles = [];
        const imageCaptions = [];
        const existingImagesData = [];

        formData.images.forEach(img => {
            if (img.file) {
                imageFiles.push(img.file);
                imageCaptions.push(img.caption || '');
            } else if (img.url && img.public_id) {
                existingImagesData.push({
                    url: img.url,
                    public_id: img.public_id,
                    caption: img.caption || ''
                });
            }
        });

        imageFiles.forEach(file => submissionData.append('images', file));
        imageCaptions.forEach(caption => submissionData.append('captions', caption));

        if (blogData && blogData._id) {
            submissionData.append('existingImages', JSON.stringify(existingImagesData));
        }

        if (formData.video && formData.video.file) {
            submissionData.append('video', formData.video.file);
        } else if (blogData && blogData._id && formData.video && formData.video.url && !formData.video.file) {
            submissionData.append('existingVideo', JSON.stringify({
                public_id: formData.video.public_id,
                url: formData.video.url,
                caption: formData.video.caption || ''
            }));
        }

        submissionData.append('affiliateLinks', JSON.stringify(formData.affiliateLinks));
        submissionData.append('status', formData.status);

        try {
            if (blogData && blogData._id) {
                await axios.put(`blog/update/${blogData._id}`, submissionData);
                toast.success('Cập nhật bài viết thành công!');
            } else {
                await axios.post('blog/create', submissionData);
                toast.success('Tạo bài viết mới thành công!');
            }
            initialFormDataRef.current = JSON.parse(JSON.stringify(formData));
            onSaveSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save blog:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Lưu bài viết thất bại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleAttemptCloseDialog}
                maxWidth="xl"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', maxHeight: '95vh' } }}
            >
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {blogData ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết Mới'}
                    <IconButton onClick={requestClose} sx={{ color: 'primary.contrastText' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                        <Grid container spacing={3}>
                            {/* Left Column */}
                            <Grid item xs={12} md={7} container spacing={2.5}>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Tiêu đề Bài viết"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mb: 0.5 }}>Nội dung</Typography>
                                    <TextField
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        multiline
                                        rows={18}
                                        variant="outlined"
                                        placeholder="Viết nội dung bài viết ở đây..."
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', p: 1.5, height: 'auto' } }}
                                    />
                                </Grid>
                            </Grid>

                            <Grid item md={0.5} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', alignItems: 'stretch' }}>
                                <Divider orientation="vertical" flexItem sx={{ height: '100%' }} />
                            </Grid>
                            <Grid item xs={12} sx={{ display: { md: 'none' } }}>
                                <Divider sx={{ my: 2 }} />
                            </Grid>

                            <Grid item xs={12} md={4.5} container spacing={2.5} alignContent="flex-start">
                                <Grid item xs={12}>
                                    <TextField
                                        label="Tóm tắt (Meta Description)"
                                        name="summary"
                                        value={formData.summary}
                                        onChange={handleChange}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                {/* <Grid item xs={12}>
                                    <TextField
                                        label="ID Tác giả (Admin)"
                                        name="authorId"
                                        value={formData.authorId}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        variant="outlined"
                                        size="small"
                                        helperText="ID của admin tạo bài viết này."
                                        InputProps={{
                                            readOnly: !!blogData,
                                        }}
                                    />
                                </Grid> */}
                                <Grid item xs={12}>
                                    <Autocomplete
                                        multiple
                                        id="tags-filled"
                                        options={[]}
                                        value={formData.tags}
                                        onChange={handleTagsChange}
                                        freeSolo
                                        size="small"
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} onDelete={() => {
                                                    const newTags = [...formData.tags];
                                                    newTags.splice(index, 1);
                                                    setFormData(prev => ({ ...prev, tags: newTags }));
                                                }} />
                                            ))
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                label="Tags"
                                                placeholder="Thêm tags..."
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} sx={{ mt: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>Trạng thái</Typography>
                                    <Chip
                                        icon={formData.status === 'active' ? <ActiveIcon /> : <InactiveIcon />}
                                        label={formData.status === 'active' ? 'Công khai (Active)' : 'Bản nháp (Inactive)'}
                                        onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }))}
                                        color={formData.status === 'active' ? 'success' : 'default'}
                                        variant="outlined"
                                        sx={{ cursor: 'pointer' }}
                                    />
                                </Grid>
                            </Grid>

                            <Grid item xs={12}> <Divider sx={{ my: 1 }} /> </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mt: 1 }}>Hình ảnh</Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<AddPhotoIcon />}
                                    size="small"
                                    sx={{ mb: 1.5, textTransform: 'none', color: 'primary.main', borderColor: 'primary.main' }}
                                >
                                    Tải lên Hình ảnh
                                    <input type="file" hidden accept="image/*" onChange={handleImageChange} ref={imageInputRef} multiple />
                                </Button>
                                <Grid container spacing={1.5}>
                                    {formData.images.map((img, index) => (
                                        <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
                                            <Paper variant="outlined" sx={{ p: 1, borderRadius: '8px', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <Box sx={{ width: '100%', height: '120px', mb: 1, overflow: 'hidden', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: alpha(theme.palette.grey[300], 0.1) }}>
                                                    <img
                                                        src={img.preview || img.url}
                                                        alt={`preview ${index}`}
                                                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                                    />
                                                </Box>
                                                <TextField
                                                    label={`Chú thích ${index + 1}`}
                                                    value={img.caption}
                                                    onChange={(e) => handleImageCaptionChange(index, e.target.value)}
                                                    fullWidth
                                                    variant="standard"
                                                    size="small"
                                                    sx={{ mt: 'auto' }}
                                                />
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removeImage(index)}
                                                    sx={{ position: 'absolute', top: 4, right: 4, backgroundColor: alpha(theme.palette.common.black, 0.6), '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.8) }, color: 'white', p: 0.5 }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: '1rem' }} />
                                                </IconButton>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mt: 1 }}>Video (Tùy chọn)</Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<VideoCallIcon />}
                                    size="small"
                                    sx={{ mb: 1.5, textTransform: 'none', color: 'primary.main', borderColor: 'primary.main' }}
                                >
                                    Tải lên Video
                                    <input type="file" hidden accept="video/*" onChange={handleVideoChange} ref={videoInputRef} />
                                </Button>
                                {formData.video && (
                                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', position: 'relative', maxWidth: 280 }}>
                                        <Box sx={{ width: '100%', height: '150px', mb: 1, overflow: 'hidden', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: alpha(theme.palette.grey[300], 0.1) }}>
                                            {formData.video.preview ? (
                                                <video
                                                    src={formData.video.preview || formData.video.url}
                                                    controls
                                                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <Typography variant="caption">Video: {formData.video.file?.name || formData.video.public_id}</Typography>
                                            )}
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={removeVideo}
                                            sx={{ position: 'absolute', top: 4, right: 4, backgroundColor: alpha(theme.palette.common.black, 0.6), '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.8) }, color: 'white', p: 0.5 }}
                                        >
                                            <DeleteIcon sx={{ fontSize: '1rem' }} />
                                        </IconButton>
                                    </Paper>
                                )}
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, mt: 1 }}>
                                    <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Link Affiliate (Tùy chọn)</Typography>
                                    <Button onClick={handleAddAffiliateLink} size="small" startIcon={<LinkIcon />} sx={{ textTransform: 'none' }}>Thêm Link</Button>
                                </Box>
                                {formData.affiliateLinks.map((link, index) => (
                                    <Paper key={index} variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: '8px' }}>
                                        <Grid container spacing={1.5} alignItems="flex-end">
                                            <Grid item xs={12} sm={6} md={2.5}>
                                                <TextField label="Tên SP" value={link.name} onChange={(e) => handleAffiliateLinkChange(index, 'name', e.target.value)} fullWidth variant="standard" size="small" />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3.5}>
                                                <TextField label="URL" value={link.url} onChange={(e) => handleAffiliateLinkChange(index, 'url', e.target.value)} fullWidth variant="standard" size="small" />
                                            </Grid>
                                            <Grid item xs={12} sm={4} md={2}>
                                                <TextField label="Giá" value={link.price} onChange={(e) => handleAffiliateLinkChange(index, 'price', e.target.value)} fullWidth variant="standard" size="small" />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <TextField label="Ảnh SP (URL)" value={link.image} onChange={(e) => handleAffiliateLinkChange(index, 'image', e.target.value)} fullWidth variant="standard" size="small" />
                                            </Grid>
                                            <Grid item xs={12} sm={2} md={1} sx={{ textAlign: 'right' }}>
                                                <IconButton onClick={() => removeAffiliateLink(index)} color="error" size="small">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                ))}
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Button onClick={requestClose} color="secondary" sx={{ textTransform: 'none' }}>Hủy</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            sx={{ textTransform: 'none', borderRadius: '8px' }}
                        >
                            {loading ? (blogData ? 'Đang cập nhật...' : 'Đang tạo...') : (blogData ? 'Lưu Thay đổi' : 'Tạo Bài viết')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog
                open={confirmCloseOpen}
                onClose={handleCancelDiscard}
                aria-labelledby="confirm-close-dialog-title"
                aria-describedby="confirm-close-dialog-description"
                PaperProps={{ sx: { borderRadius: '12px' } }}
            >
                <DialogTitle id="confirm-close-dialog-title" sx={{ fontWeight: 'bold' }}>
                    <WarningIcon sx={{ color: 'warning.main', mr: 1, verticalAlign: 'bottom' }} />
                    Xác nhận Đóng
                </DialogTitle>
                <DialogContent>
                    <Typography id="confirm-close-dialog-description">
                        Bạn có một số thay đổi chưa được lưu. Bạn có chắc chắn muốn đóng và hủy các thay đổi không?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCancelDiscard} color="secondary" sx={{ textTransform: 'none' }}>
                        Hủy bỏ
                    </Button>
                    <Button onClick={handleConfirmDiscardAndClose} color="primary" variant="contained" autoFocus sx={{ textTransform: 'none' }}>
                        Đóng & Hủy thay đổi
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default BlogForm;
