import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField,
    Grid, Box, Typography, IconButton, Chip, Stack, CircularProgress, Autocomplete,
    Paper, Divider
} from '@mui/material';
import {
    AddPhotoAlternate as AddPhotoIcon, Delete as DeleteIcon,
    VideoCall as VideoCallIcon, Link as LinkIcon, Close as CloseIcon,
    Save as SaveIcon, Label as TagIcon, Input as InsertIcon,
    CheckCircle as ActiveIcon, Cancel as InactiveIcon, WarningAmber as WarningIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useTheme, alpha } from '@mui/material/styles';
import MDEditor from '@uiw/react-md-editor';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import slugify from 'slugify';
import axios from 'axios';

// --- TIỆN ÍCH ---

const generateHeadings = (markdown) => {
    const headings = [];
    const tree = remark().use(remarkGfm).parse(markdown);
    tree.children.forEach(node => {
        if (node.type === 'heading') {
            const text = node.children.map(child => child.value).join('');
            headings.push({
                text: text,
                level: node.depth,
                slug: slugify(text, { lower: true, strict: true })
            });
        }
    });
    return headings;
};

// --- COMPONENT CHÍNH ---

const BlogForm2 = ({ open, onClose, blogData, onSaveSuccess }) => {
    const theme = useTheme();
    const emptyBlog = {
        title: '',
        contentMarkdown: '',
        summary: '',
        authorId: '',
        tags: '',
        images: [],
        video: null,
        affiliateLinks: [],
        status: 'inactive',
    };

    const [formData, setFormData] = useState(emptyBlog);
    const [loading, setLoading] = useState(false);
    const initialFormDataRef = useRef(null);
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
    const editorRef = useRef(null);

    const isFormDirty = () => JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);


    // useEffect(() => {
    //     if (open) {
    //         let initialData;
    //         if (blogData.tags) {
    //             initialData = {
    //                 title: blogData.title || '',
    //                 contentMarkdown: blogData.content || '',
    //                 summary: blogData.summary || '',
    //                 authorId: blogData.authorId?._id || blogData.authorId || '',
    //                 tags: tagsValue,
    //                 images: blogData.images?.map(img => ({ ...img, file: null, caption: img.caption || '' })) || [],
    //                 video: blogData.video ? { ...blogData.video, file: null, caption: blogData.video.caption || '' } : null,
    //                 affiliateLinks: blogData.affiliateLinks || [],
    //                 status: blogData.status || 'inactive',
    //             };
    //         } else {
    //             const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    //             initialData = { ...emptyBlog, authorId: currentUser?.id || 'ADMIN_ID_PLACEHOLDER' };
    //         }
    //         setFormData(initialData);
    //         initialFormDataRef.current = JSON.parse(JSON.stringify(initialData));
    //     } else {
    //         formData.images.forEach(img => {
    //             if (img.file && img.url) URL.revokeObjectURL(img.url);
    //         });
    //         if (formData.video?.file && formData.video?.url) URL.revokeObjectURL(formData.video.url);
    //         setFormData(emptyBlog);
    //         initialFormDataRef.current = null;
    //     }
    // }, [blogData, open]);

    // useEffect(() => {
    //     if (open) {
    //         let initialData;
    //         console.log(blogData);

    //         if (blogData) {
    //             let tagsValue = '';
    //             if (blogData.tags) {
    //                 if (Array.isArray(blogData.tags)) {
    //                     tagsValue = blogData.tags.join(', ');
    //                 } else if (typeof blogData.tags === 'string') {
    //                     try {
    //                         const parsedTags = JSON.parse(blogData.tags);
    //                         if (Array.isArray(parsedTags)) {
    //                             tagsValue = parsedTags.join(', ');
    //                         } else {
    //                             tagsValue = blogData.tags;
    //                         }
    //                     } catch (error) {
    //                         tagsValue = blogData.tags;
    //                     }
    //                 }
    //             }

    //             initialData = {
    //                 title: blogData.title || '',
    //                 contentMarkdown: blogData.content || '',
    //                 summary: blogData.summary || '',
    //                 authorId: blogData.authorId?._id || blogData.authorId || '',
    //                 tags: tagsValue,
    //                 images: blogData.images?.map(img => ({ ...img, file: null, caption: img.caption || '' })) || [],
    //                 video: blogData.video ? { ...blogData.video, file: null, caption: blogData.video.caption || '' } : null,
    //                 affiliateLinks: blogData.affiliateLinks || [],
    //                 status: blogData.status || 'inactive',
    //             };
    //         } else {
    //             const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    //             initialData = { ...emptyBlog, authorId: currentUser?.id || 'ADMIN_ID_PLACEHOLDER' };
    //         }
    //         setFormData(initialData);
    //         initialFormDataRef.current = JSON.parse(JSON.stringify(initialData));
    //     } else {
    //         formData.images.forEach(img => {
    //             if (img.file && img.url) URL.revokeObjectURL(img.url);
    //         });
    //         if (formData.video?.file && formData.video?.url) URL.revokeObjectURL(formData.video.url);
    //         setFormData(emptyBlog);
    //         initialFormDataRef.current = null;
    //     }
    // }, [blogData, open]);

    useEffect(() => {
        if (open) {
            let initialData;
            console.log(blogData);

            if (blogData) {
                // Handle tags: convert to comma-separated string
                let tagsValue = '';
                if (blogData.tags) {
                    if (Array.isArray(blogData.tags)) {
                        // If tags is an array, join it
                        tagsValue = blogData.tags.join(', ');
                    } else if (typeof blogData.tags === 'string') {
                        try {
                            // Try parsing if it's a stringified JSON array
                            const parsedTags = JSON.parse(blogData.tags);
                            if (Array.isArray(parsedTags)) {
                                tagsValue = parsedTags.join(', ');
                            } else {
                                // If it's a plain string, use it directly
                                tagsValue = blogData.tags;
                            }
                        } catch (error) {
                            // If JSON parsing fails, treat as a comma-separated string
                            tagsValue = blogData.tags;
                        }
                    }
                }

                initialData = {
                    title: blogData.title || '',
                    contentMarkdown: blogData.content || '',
                    summary: blogData.summary || '',
                    authorId: blogData.authorId?._id || blogData.authorId || '',
                    tags: tagsValue,
                    images: blogData.images?.map(img => ({ ...img, file: null, caption: img.caption || '' })) || [],
                    video: blogData.video ? { ...blogData.video, file: null, caption: blogData.video.caption || '' } : null,
                    affiliateLinks: blogData.affiliateLinks || [],
                    status: blogData.status || 'inactive',
                };
            } else {
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                initialData = { ...emptyBlog, authorId: currentUser?.id || 'ADMIN_ID_PLACEHOLDER' };
            }
            setFormData(initialData);
            initialFormDataRef.current = JSON.parse(JSON.stringify(initialData));
        } else {
            formData.images.forEach(img => {
                if (img.file && img.url) URL.revokeObjectURL(img.url);
            });
            if (formData.video?.file && formData.video?.url) URL.revokeObjectURL(formData.video.url);
            setFormData(emptyBlog);
            initialFormDataRef.current = null;
        }
    }, [blogData, open]);




    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContentChange = (value = '') => {
        setFormData(prev => ({ ...prev, contentMarkdown: value }));
    };



    // Logic mới 1: add link blob và chèn vào editor và đợi tải lên => replace link blob bằng link cloud
    const insertImageWithCloudUrl = async (imageObj, editorRef, formData, setFormData, handleContentChange) => {
        const markdownToInsert = `![${imageObj.caption || 'image'}](${imageObj.url})\n`;
        const currentContent = formData.contentMarkdown || '';
        const textarea = editorRef?.current?.textarea;
        let newContent;

        if (textarea) {
            const cursorPosition = textarea.selectionStart;
            newContent = currentContent.slice(0, cursorPosition) + markdownToInsert + currentContent.slice(cursorPosition);
            setTimeout(() => {
                const newCursor = cursorPosition + markdownToInsert.length;
                textarea.focus();
                textarea.setSelectionRange(newCursor, newCursor);
            }, 0);
        } else {
            newContent = currentContent + markdownToInsert;
        }

        handleContentChange(newContent);
    };

    const uploadImageToServer = async (file) => {
        const form = new FormData();
        form.append('images', file);
        const { data } = await axios.post('upload-images', form);
        return data.images?.[0];
    };

    const handleImageChange = async (e) => {
        if (!e.target.files?.length) return;

        for (const file of Array.from(e.target.files)) {
            const tempUrl = URL.createObjectURL(file);
            const tempImageObj = {
                file,
                caption: '',
                url: tempUrl,
                public_id: null
            };

            setFormData(prev => ({ ...prev, images: [...prev.images, tempImageObj] }));
            await insertImageWithCloudUrl(tempImageObj, editorRef, formData, setFormData, handleContentChange);

            try {
                const uploaded = await uploadImageToServer(file);

                setFormData(prev => ({
                    ...prev,
                    images: prev.images.map(img =>
                        img.url === tempUrl ? { ...img, url: uploaded.url, public_id: uploaded.public_id } : img
                    ),
                    contentMarkdown: prev.contentMarkdown.replace(tempUrl, uploaded.url)
                }));
            } catch (err) {
                toast.error('Lỗi khi tải ảnh lên máy chủ.');
            }
        }
    };

    const removeImage = (indexToRemove) => {
        const imageToRemove = formData.images[indexToRemove];
        if (imageToRemove.url && imageToRemove.file) {
            URL.revokeObjectURL(imageToRemove.url);
        }
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove),
        }));
    };

    const handleImageCaptionChange = (index, value) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) =>
                i === index ? { ...img, caption: value } : img
            )
        }));
    };

    const insertImageIntoEditor = useCallback((image) => {
        const markdownToInsert = `![${image.caption || 'image'}](${image.url})\n`;
        if (!editorRef.current) {
            const currentContent = formData.contentMarkdown || '';
            handleContentChange(currentContent + markdownToInsert);
            toast.success('Đã chèn ảnh vào cuối nội dung!');
            return;
        }
        const textarea = editorRef.current.textarea;
        if (textarea) {
            const cursorPosition = textarea.selectionStart;
            const currentContent = formData.contentMarkdown || '';
            const newContent =
                currentContent.slice(0, cursorPosition) +
                markdownToInsert +
                currentContent.slice(cursorPosition);
            handleContentChange(newContent);
            toast.success('Đã chèn ảnh vào vị trí con trỏ!');
            setTimeout(() => {
                const newCursorPosition = cursorPosition + markdownToInsert.length;
                textarea.focus();
                textarea.setSelectionRange(newCursorPosition, newCursorPosition);
            }, 0);
        }

    }, [formData.contentMarkdown]);


    const handlePaste = useCallback(async (event) => {
        const files = event.clipboardData.files;
        if (files.length > 0 && files[0].type.startsWith("image/")) {
            event.preventDefault();
            const pastedFile = files[0];
            const tempImageUrl = URL.createObjectURL(pastedFile);
            const newImageObj = {
                file: pastedFile,
                caption: 'Pasted Image',
                url: tempImageUrl,
                public_id: null
            };
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, newImageObj]
            }));

            insertImageIntoEditor(newImageObj);
            toast.info('Ảnh đã được chèn vào nội dung (sẽ được tải lên khi lưu).');
        }
    }, [insertImageIntoEditor]);

    const handleVideoChange = (e) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const tempVideoUrl = URL.createObjectURL(file);
            if (formData.video?.file && formData.video?.url) URL.revokeObjectURL(formData.video.url);

            setFormData(prev => ({
                ...prev,
                video: {
                    file,
                    caption: formData.video?.caption || '',
                    url: tempVideoUrl,
                    public_id: null
                }
            }));
        }
    };

    const handleVideoCaptionChange = (e) => {
        setFormData(prev => ({
            ...prev,
            video: {
                ...prev.video,
                caption: e.target.value
            }
        }));
    };

    const removeVideo = () => {
        if (formData.video?.file && formData.video?.url) URL.revokeObjectURL(formData.video.url);
        setFormData(prev => ({ ...prev, video: null }));
    };

    // const handleAddAffiliateLink = () => setFormData(prev => ({ ...prev, affiliateLinks: [...prev.affiliateLinks, { label: '', url: '' }] }));
    const handleAddAffiliateLink = () => setFormData(prev => ({
        ...prev, affiliateLinks: [...prev.affiliateLinks, { label: '', url: '', image: '' }]
    }));
    const removeAffiliateLink = (index) => setFormData(prev => ({ ...prev, affiliateLinks: prev.affiliateLinks.filter((_, i) => i !== index) }));
    const handleAffiliateLinkChange = (index, field, value) => setFormData(prev => ({ ...prev, affiliateLinks: prev.affiliateLinks.map((link, i) => i === index ? { ...link, [field]: value } : link) }));


    const requestClose = () => {
        if (isFormDirty()) setConfirmCloseOpen(true);
        else onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('content', formData.contentMarkdown);
            data.append('summary', formData.summary);
            data.append('status', formData.status);
            if (typeof formData.tags === 'string') {
                const tagArray = formData.tags
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
                if (tagArray.length > 0) {
                    data.append('tags', JSON.stringify(tagArray));
                }
            }
            data.append('affiliateLinks', JSON.stringify(formData.affiliateLinks));
            const headings = generateHeadings(formData.contentMarkdown);
            data.append('headings', JSON.stringify(headings));
            const newImageFiles = [];
            const newImageCaptions = [];
            const existingImagesData = [];

            formData.images.forEach((img) => {
                if (img.file) {
                    newImageFiles.push(img.file);
                    newImageCaptions.push(img.caption || '');
                } else if (img.public_id && img.url) {
                    existingImagesData.push({
                        url: img.url,
                        public_id: img.public_id,
                        caption: img.caption || ''
                    });
                }
            });

            newImageFiles.forEach((file) => data.append('newImages', file));
            newImageCaptions.forEach((caption) => data.append('newImageCaptions', caption));
            data.append('existingImages', JSON.stringify(existingImagesData));
            if (formData.video?.file) {
                data.append('newVideo', formData.video.file);
                data.append('newVideoCaption', formData.video.caption || '');
            } else if (formData.video?.public_id && formData.video?.url) {
                data.append('existingVideo', JSON.stringify({
                    url: formData.video.url,
                    public_id: formData.video.public_id,
                    caption: formData.video.caption || ''
                }));
            }


            if (blogData?._id) {
                await axios.put(`blog/update/${blogData._id}`, data);
                toast.success('Cập nhật bài viết thành công!');
            } else {
                await axios.post('blog/create', data);
                toast.success('Tạo bài viết mới thành công!');
            }
            onSaveSuccess();
            onClose();

        } catch (error) {
            console.error('Lưu bài viết thất bại:', error.message);
            toast.error(error.response?.data?.message || 'Lưu bài viết thất bại.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <>
            <Dialog open={open} onClose={requestClose} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: '16px', height: '95vh' } }}>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: { xs: 2, sm: 4 } }}>
                    {blogData ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết Mới'}
                    <IconButton onClick={requestClose} sx={{ color: 'primary.contrastText' }}> <CloseIcon /> </IconButton>
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent dividers sx={{ p: { xs: 2, sm: 4 }, display: 'flex', flexDirection: 'column' }}>
                        <Grid container spacing={4} sx={{ flex: 1, overflow: 'hidden' }}>
                            {/* Cột trái - Editor (ưu tiên không gian) */}
                            <Grid item xs={12} md={8.5} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <TextField
                                    label="Tiêu đề Bài viết"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    fullWidth required variant="outlined" size="medium" sx={{ mb: 3, flexShrink: 0 }}
                                />
                                <Box sx={{ flex: 1, minHeight: 0, '& .w-md-editor': { borderRadius: '8px', border: `1px solid ${theme.palette.divider}` } }} data-color-mode={theme.palette.mode}>
                                    <MDEditor
                                        ref={editorRef}
                                        value={formData.contentMarkdown}
                                        onChange={handleContentChange}
                                        onPaste={handlePaste}
                                        height="100%"
                                        preview="live"
                                    />
                                </Box>
                            </Grid>
                            <Grid item md={0.5} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                                <Divider orientation="vertical" />
                            </Grid>

                            {/* Cột phải - Metadata (đã tối ưu không gian) */}
                            <Grid item xs={12} md={3} container spacing={4} sx={{ overflowY: 'auto', pr: { xs: 0, md: 1 } }}>
                                <Grid item xs={12}>
                                    <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px' }}>
                                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>Thông tin cơ bản</Typography>
                                        <TextField label="Tóm tắt (Meta Description)" name="summary" value={formData.summary} onChange={handleChange} fullWidth multiline rows={4} variant="outlined" size="medium" sx={{ mb: 3 }} />
                                        <TextField
                                            label="Tags"
                                            name="tags"
                                            value={typeof formData.tags === 'string' ? formData.tags : ''}
                                            onChange={handleChange}
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            placeholder="Nhập tags, phân tách bằng dấu phẩy (ví dụ: mẹ, bé)"
                                        />
                                        <Box sx={{ mt: 3 }}>
                                            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1 }}>Trạng thái</Typography>
                                            <Chip
                                                icon={formData.status === 'active' ? <ActiveIcon /> : <InactiveIcon />}
                                                label={formData.status === 'active' ? 'Công khai' : 'Bản nháp'}
                                                onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }))}
                                                color={formData.status === 'active' ? 'success' : 'default'}
                                                variant="filled"
                                                size="medium"
                                                sx={{ cursor: 'pointer', p: 1.5 }}
                                            />
                                        </Box>
                                    </Paper>
                                </Grid>

                                {/* Quản lý ảnh */}
                                <Grid item xs={12}>
                                    <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px' }}>
                                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>Thư viện ảnh</Typography>
                                        <Button variant="outlined" component="label" startIcon={<AddPhotoIcon />} size="medium" sx={{ textTransform: 'none', mb: 2 }}>
                                            Tải ảnh lên
                                            {/* <input type="file" hidden accept="image/*" onChange={handleImageChange} multiple /> */}
                                            <input type="file" hidden accept="image/*" onChange={(e) => handleImageChange(e)} multiple />

                                        </Button>
                                        <Grid container spacing={2}>
                                            {formData.images.map((img, index) => (
                                                <Grid item xs={12} key={index}>
                                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: '10px', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                        <Box sx={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, bgcolor: theme.palette.action.hover }}>
                                                            <img src={img.url} alt={`preview ${index}`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                                        </Box>
                                                        <TextField
                                                            label="Chú thích ảnh"
                                                            value={img.caption}
                                                            onChange={(e) => handleImageCaptionChange(index, e.target.value)}
                                                            fullWidth
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{ mt: 'auto' }}
                                                        />
                                                        <IconButton size="small" onClick={() => removeImage(index)} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: alpha(theme.palette.error.main, 0.8), color: 'white', '&:hover': { bgcolor: theme.palette.error.dark } }}><DeleteIcon fontSize="small" /></IconButton>
                                                        <IconButton size="small" onClick={() => insertImageIntoEditor(img)} sx={{ position: 'absolute', top: 8, left: 8, bgcolor: alpha(theme.palette.primary.main, 0.9), color: 'white', '&:hover': { bgcolor: theme.palette.primary.dark } }} title="Chèn vào bài viết"><InsertIcon fontSize="small" /></IconButton>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Paper>
                                </Grid>

                                {/* Quản lý Video */}
                                <Grid item xs={12}>
                                    <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px' }}>
                                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>Video</Typography>
                                        {!formData.video ? (
                                            <Button variant="outlined" component="label" startIcon={<VideoCallIcon />} size="medium" sx={{ textTransform: 'none', mb: 2 }}>
                                                Tải video lên
                                                <input type="file" hidden accept="video/*" onChange={handleVideoChange} />
                                            </Button>
                                        ) : (
                                            <Box sx={{ position: 'relative', mb: 2, p: 2, border: `1px dashed ${theme.palette.divider}`, borderRadius: '8px' }}>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>Preview Video:</Typography>
                                                <video src={formData.video.url} controls style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                                                <TextField
                                                    label="Chú thích video"
                                                    value={formData.video.caption}
                                                    onChange={handleVideoCaptionChange}
                                                    fullWidth
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ mt: 1.5 }}
                                                />
                                                <IconButton size="small" onClick={removeVideo} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: alpha(theme.palette.error.main, 0.8), color: 'white', '&:hover': { bgcolor: theme.palette.error.dark } }}><DeleteIcon fontSize="small" /></IconButton>
                                            </Box>
                                        )}
                                    </Paper>
                                </Grid>

                                {/* Quản lý link affiliate */}
                                <Grid item xs={12}>
                                    <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Link Affiliate</Typography>
                                            <Button onClick={handleAddAffiliateLink} size="medium" startIcon={<LinkIcon />} sx={{ textTransform: 'none' }}>Thêm</Button>
                                        </Box>
                                        {formData.affiliateLinks.length === 0 && (
                                            <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                                                Chưa có link affiliate nào được thêm.
                                            </Typography>
                                        )}
                                        <Stack spacing={2}>
                                            {formData.affiliateLinks.map((link, index) => (
                                                <Paper key={index} variant="outlined" sx={{ p: 2, position: 'relative', bgcolor: alpha(theme.palette.action.selected, 0.08), borderRadius: '10px' }}>
                                                    <Stack spacing={1.5}>
                                                        <TextField label="Tên sản phẩm" value={link.label} onChange={(e) => handleAffiliateLinkChange(index, 'label', e.target.value)} fullWidth variant="outlined" size="small" />
                                                        <TextField label="URL" value={link.url} onChange={(e) => handleAffiliateLinkChange(index, 'url', e.target.value)} fullWidth variant="outlined" size="small" />
                                                        <TextField
                                                            label="Ảnh SP (URL)"
                                                            value={link.image}
                                                            onChange={(e) => handleAffiliateLinkChange(index, 'image', e.target.value)}
                                                            fullWidth
                                                            variant="standard"
                                                            size="small"
                                                        />

                                                        {link.image && typeof link.image === 'string' && (
                                                            <Box
                                                                sx={{
                                                                    mt: 1.5,
                                                                    textAlign: 'center',
                                                                    border: `1px solid ${theme.palette.divider}`,
                                                                    borderRadius: 1,
                                                                    padding: 1,
                                                                    backgroundColor: alpha(theme.palette.action.selected, 0.1),
                                                                }}
                                                            >
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Preview ảnh:
                                                                </Typography>
                                                                <Box
                                                                    component="img"
                                                                    src={link.image}
                                                                    alt={`Ảnh affiliate ${index}`}
                                                                    sx={{ width: '100%', maxHeight: 120, objectFit: 'contain', mt: 0.5 }}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = 'https://via.placeholder.com/120x80?text=No+Image';
                                                                    }}
                                                                />
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                    <IconButton onClick={() => removeAffiliateLink(index)} color="error" size="small" sx={{ position: 'absolute', top: 8, right: 8 }}><DeleteIcon fontSize='small' /></IconButton>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: { xs: 2, sm: 4 }, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Button onClick={requestClose} color="secondary" size="large">Hủy</Button>
                        <Button type="submit" variant="contained" color="primary" disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} size="large">
                            {loading ? 'Đang lưu...' : (blogData ? 'Lưu Thay đổi' : 'Tạo Bài viết')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog open={confirmCloseOpen} onClose={() => setConfirmCloseOpen(false)}>
                <DialogTitle><WarningIcon sx={{ color: 'warning.main', mr: 1, verticalAlign: 'bottom' }} /> Xác nhận Đóng</DialogTitle>
                <DialogContent><Typography>Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy bỏ không?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmCloseOpen(false)}>Ở lại</Button>
                    <Button onClick={() => { setConfirmCloseOpen(false); onClose(); }} color="primary">Đóng & Hủy</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default BlogForm2;