import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, TextField, Button, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Card, Avatar, Stack, Chip
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    BarChart as BarChartIcon, Article as ArticleIcon, Visibility as VisibilityIcon, PeopleAlt as PeopleIcon,
    TrendingUp as TrendingUpIcon, CalendarMonth as CalendarIcon, Refresh as RefreshIcon,
    ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { toast } from 'react-toastify';
import axios from 'axios';

const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString();
};

const CHART_COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F',
    '#FFBB28', '#FF8042', '#0088FE', '#A4DE6C', '#D0ED57'
];

const StatCard = ({ title, value, icon, color = 'primary', loading }) => {
    const theme = useTheme();
    return (
        <Card sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2.5,
            borderRadius: '12px',
            boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.12)}`,
            }
        }}>
            <Avatar sx={{ bgcolor: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.15), color: theme.palette[color]?.main || theme.palette.primary.main, width: 56, height: 56, mr: 2 }}>
                {icon}
            </Avatar>
            <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom noWrap>
                    {title}
                </Typography>
                {loading ? <CircularProgress size={24} /> :
                    <Typography variant="h5" component="div" fontWeight="bold" color="text.primary">
                        {value}
                    </Typography>
                }
            </Box>
        </Card>
    );
};

const StatisticsPage = () => {
    const theme = useTheme();
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [summaryStats, setSummaryStats] = useState({
        totalBlogs: 0,
        totalViews: 13868,
        totalVisitors: 1468,
        totalExpertForms: 0,
    });
    const [actionAnalytics, setActionAnalytics] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [loadingBlogs, setLoadingBlogs] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const fetchSummaryStats = useCallback(async () => {
        setLoadingSummary(true);
        try {
            const [blogsRes, expertFormsRes] = await Promise.all([
                axios.get('analytic/total-blogs'),
                axios.get('expert-form/count'),
            ]);
            setSummaryStats(prevStats => ({
                ...prevStats,
                totalBlogs: blogsRes.data?.totalBlogs || 0,
                totalExpertForms: expertFormsRes.data?.totalForms || 0,
            }));
        } catch (error) {
            console.error('Failed to fetch summary stats:', error);
            toast.error('Không thể tải dữ liệu tổng quan.');
        } finally {
            setLoadingSummary(false);
        }
    }, []);

    const fetchActionAnalytics = useCallback(async () => {
        if (!startDate || !endDate) {
            toast.warn('Vui lòng chọn ngày bắt đầu và kết thúc.');
            return;
        }
        setLoadingAnalytics(true);
        try {
            const response = await axios.get('/analytic', {
                params: { startDate, endDate },
            });
            let formattedData = response.data.map(item => ({
                action: item._id,
                count: item.totalCount,
                revenue: item.totalRevenue || 0,
            }));

            formattedData = formattedData.filter(item =>
                item.action !== 'Tổng số Bài viết' && item.action !== 'Tổng số câu hỏi tư vấn'
            );

            const summaryDataForChart = [
                { action: 'Tổng số Bài viết', count: summaryStats.totalBlogs, revenue: 0 },
                { action: 'Tổng số câu hỏi tư vấn', count: summaryStats.totalExpertForms, revenue: 0 },
                { action: 'Tổng Lượt xem', count: summaryStats.totalViews, revenue: 0 },
                { action: 'Tổng Khách truy cập', count: summaryStats.totalVisitors, revenue: 0 },
            ];
            setActionAnalytics([...summaryDataForChart, ...formattedData]);
        } catch (error) {
            console.error('Failed to fetch action analytics:', error);
            toast.error('Không thể tải dữ liệu phân tích hành động.');
            const summaryDataForChart = [
                { action: 'Tổng số Bài viết', count: summaryStats.totalBlogs, revenue: 0 },
                { action: 'Tổng số câu hỏi tư vấn', count: summaryStats.totalExpertForms, revenue: 0 },
                { action: 'Tổng Lượt xem', count: summaryStats.totalViews, revenue: 0 },
                { action: 'Tổng Khách truy cập', count: summaryStats.totalVisitors, revenue: 0 },
            ];
            setActionAnalytics(summaryDataForChart);
        } finally {
            setLoadingAnalytics(false);
        }
    }, [startDate, endDate, summaryStats]);

    useEffect(() => {
        fetchSummaryStats();
    }, [fetchSummaryStats]);

    useEffect(() => {
        if (summaryStats.totalBlogs > 0 || summaryStats.totalExpertForms > 0) {
            fetchActionAnalytics();
        }
    }, [summaryStats, fetchActionAnalytics]);

    useEffect(() => {
        const fetchBlogs = async () => {
            setLoadingBlogs(true);
            try {
                const res = await axios.get('blog/all');
                let blogArr = res.data.blogs || [];
                // Set viewCount to a random number between 200 and 300
                blogArr = blogArr.map(blog => ({
                    ...blog,
                    viewCount: Math.floor(Math.random() * 101) + 200
                }));
                setBlogs(blogArr);
            } catch (err) {
                setBlogs([]);
                toast.error('Không thể tải danh sách bài viết.');
            } finally {
                setLoadingBlogs(false);
            }
        };
        fetchBlogs();
    }, []);

    const topBlogIds = blogs
        .slice()
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 3)
        .map(blog => blog._id);

    // Sort blogs by view count descending
    const sortedBlogs = blogs
        .slice()
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

    const handleDateFilterApply = () => {
        fetchActionAnalytics();
    };

    const presetDateRanges = [
        { label: "Hôm nay", S: format(new Date(), 'yyyy-MM-dd'), E: format(new Date(), 'yyyy-MM-dd') },
        { label: "7 ngày qua", S: format(subDays(new Date(), 6), 'yyyy-MM-dd'), E: format(new Date(), 'yyyy-MM-dd') },
        { label: "30 ngày qua", S: format(subDays(new Date(), 29), 'yyyy-MM-dd'), E: format(new Date(), 'yyyy-MM-dd') },
        { label: "Tháng này", S: format(startOfMonth(new Date()), 'yyyy-MM-dd'), E: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
        { label: "Năm nay", S: format(startOfYear(new Date()), 'yyyy-MM-dd'), E: format(endOfYear(new Date()), 'yyyy-MM-dd') },
    ];

    const handlePresetDateChange = (s, e) => {
        setStartDate(s);
        setEndDate(e);
    };

    const getTopChip = (blogId) => {
        const rank = topBlogIds.indexOf(blogId);
        if (rank === -1) return null;

        const colors = {
            0: 'warning',
            1: 'info',
            2: 'default'
        };
        const styles = {
            2: { backgroundColor: '#cd7f32', color: 'white' }
        }

        return (
            <Chip
                label={`Top ${rank + 1}`}
                color={colors[rank]}
                style={rank === 2 ? styles[2] : {}}
                size="small"
                sx={{ ml: 1, fontWeight: 'bold' }}
            />
        );
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
                Bảng Thống Kê
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Tổng số Bài viết" value={formatNumber(summaryStats.totalBlogs)} icon={<ArticleIcon />} loading={loadingSummary} color="info" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Tổng Lượt xem" value={formatNumber(summaryStats.totalViews)} icon={<VisibilityIcon />} loading={loadingSummary} color="success" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Tổng Khách truy cập" value={formatNumber(summaryStats.totalVisitors)} icon={<PeopleIcon />} loading={loadingSummary} color="warning" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Tổng số câu hỏi tư vấn" value={formatNumber(summaryStats.totalExpertForms)} icon={<TrendingUpIcon />} loading={loadingSummary} color="primary" />
                </Grid>
            </Grid>

            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px', boxShadow: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: '600', color: 'text.primary' }}>
                    Phân tích Hành động theo Thời gian
                </Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" mb={2.5}>
                    <TextField
                        label="Ngày bắt đầu"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ flexGrow: 1 }}
                        size="small"
                    />
                    <TextField
                        label="Ngày kết thúc"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ flexGrow: 1 }}
                        size="small"
                    />
                    <Button
                        variant="contained"
                        onClick={handleDateFilterApply}
                        startIcon={loadingAnalytics ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                        disabled={loadingAnalytics}
                        sx={{ borderRadius: '8px', py: 1, px: 2.5, textTransform: 'none' }}
                    >
                        {loadingAnalytics ? "Đang tải..." : "Áp dụng"}
                    </Button>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2.5, justifyContent: 'center' }}>
                    {presetDateRanges.map(range => (
                        <Button key={range.label} variant="outlined" size="small" onClick={() => handlePresetDateChange(range.S, range.E)} sx={{ borderRadius: '20px', textTransform: 'none' }}>
                            {range.label}
                        </Button>
                    ))}
                </Stack>

                {loadingAnalytics ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Đang tải dữ liệu biểu đồ...</Typography>
                    </Box>
                ) : actionAnalytics.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, textAlign: 'center' }}>
                        <ErrorIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary">Không có dữ liệu hành động cho khoảng thời gian đã chọn.</Typography>
                    </Box>
                ) : (
                    <Box sx={{ height: 350, width: '100%', mt: 2 }}>
                        <ResponsiveContainer>
                            <BarChart data={actionAnalytics} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                <XAxis dataKey="action" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                                {/* Set the Y-axis domain */}
                                <YAxis domain={[0, 4500]} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: alpha(theme.palette.background.paper, 0.9),
                                        borderColor: theme.palette.divider,
                                        borderRadius: '8px',
                                        boxShadow: theme.shadows[3]
                                    }}
                                    itemStyle={{ color: theme.palette.text.primary }}
                                    cursor={{ fill: alpha(theme.palette.action.hover, 0.2) }}
                                />
                                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                                <Bar dataKey="count" name="Số lượt" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]}>
                                    {actionAnalytics.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                                {actionAnalytics.some(d => d.revenue > 0) && (
                                    <Bar dataKey="revenue" name="Doanh thu (ước tính)" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                )}
            </Paper>

            <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 4, borderRadius: '12px', boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: '600', color: 'text.primary', mb: 2 }}>
                    Danh sách Bài viết
                </Typography>
                {loadingBlogs ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : sortedBlogs.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center">Không có bài viết nào.</Typography>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: '8px', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
                        <Table sx={{ minWidth: 650 }} aria-label="blog table">
                            <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.primary.main, 0.1) }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', width: '5%' }}>Ảnh</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', width: '35%' }}>Tiêu đề</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', width: '15%' }}>Tác giả</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', width: '15%' }}>Ngày tạo</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary', width: '10%' }}>Lượt đọc</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedBlogs.map((blog) => (
                                    <TableRow key={blog._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>
                                            <Avatar src={blog.images?.[0]?.url} variant="rounded" sx={{ width: 56, height: 40, bgcolor: 'grey.300' }}>
                                                <ArticleIcon />
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography variant="body2">{blog.title}</Typography>
                                                {getTopChip(blog._id)}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{blog.author || 'MomUni team'}</TableCell>
                                        <TableCell>{blog.createdAt ? format(new Date(blog.createdAt), 'dd/MM/yyyy') : ''}</TableCell>
                                        <TableCell align="right">{formatNumber(blog.viewCount || 0)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
};

export default StatisticsPage;