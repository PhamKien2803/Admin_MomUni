import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, TextField, Button, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Card, Avatar, Stack, Chip
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    BarChart as BarChartIcon, PieChart as PieChartIcon, ShowChart as LineChartIcon,
    CalendarMonth as CalendarIcon, Refresh as RefreshIcon,
    Article as ArticleIcon, Visibility as VisibilityIcon, PeopleAlt as PeopleIcon,
    TrendingUp as TrendingUpIcon, AttachMoney as RevenueIcon, AdsClick as ClickIcon,
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
        totalViews: 0,
        totalVisitors: 0,
    });
    const [actionAnalytics, setActionAnalytics] = useState([]);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const fetchSummaryStats = useCallback(async () => {
        setLoadingSummary(true);
        try {
            const [blogsRes, viewsRes, visitorsRes] = await Promise.all([
                axios.get('analytic/total-blogs'),
                axios.get('analytic/total-views'),
                axios.get('analytic/total-visitors'),
            ]);
            setSummaryStats({
                totalBlogs: blogsRes.data?.totalBlogs || 0,
                totalViews: viewsRes.data?.totalViews || 0,
                totalVisitors: visitorsRes.data?.totalVisitors || 0,
            });
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
            const formattedData = response.data.map(item => ({
                action: item._id,
                count: item.totalCount,
                revenue: item.totalRevenue || 0,
            }));
            setActionAnalytics(formattedData);
        } catch (error) {
            console.error('Failed to fetch action analytics:', error);
            toast.error('Không thể tải dữ liệu phân tích hành động.');
            setActionAnalytics([]);
        } finally {
            setLoadingAnalytics(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchSummaryStats();
        fetchActionAnalytics();
    }, [fetchSummaryStats, fetchActionAnalytics]);

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
    useEffect(() => {

        if (startDate && endDate) {
            fetchActionAnalytics();
        }
    }, [startDate, endDate, fetchActionAnalytics]);


    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
                Bảng Thống Kê
            </Typography>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard title="Tổng số Bài viết" value={formatNumber(summaryStats.totalBlogs)} icon={<ArticleIcon />} loading={loadingSummary} color="info" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard title="Tổng Lượt xem" value={formatNumber(summaryStats.totalViews)} icon={<VisibilityIcon />} loading={loadingSummary} color="success" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard title="Tổng Khách truy cập" value={formatNumber(summaryStats.totalVisitors)} icon={<PeopleIcon />} loading={loadingSummary} color="warning" />
                </Grid>
            </Grid>

            {/* Date Filters and Action Analytics */}
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
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2.5 }}>
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
                                <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
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

            {/* Detailed Table */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 4, borderRadius: '12px', boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: '600', color: 'text.primary', mb: 2 }}>
                    Chi tiết Hành động
                </Typography>
                {loadingAnalytics ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : actionAnalytics.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center">Không có dữ liệu chi tiết.</Typography>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: '8px', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
                        <Table sx={{ minWidth: 650 }} aria-label="detailed analytics table">
                            <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.primary.main, 0.1) }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Hành động</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Tổng số lượt</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Tổng Doanh thu (ước tính)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {actionAnalytics.map((row, index) => (
                                    <TableRow key={row.action + index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell component="th" scope="row">
                                            <Chip
                                                label={row.action || 'Không xác định'}
                                                size="small"
                                                variant="outlined"
                                                icon={row.action === 'view' ? <VisibilityIcon fontSize="small" /> : row.action.includes('click') ? <ClickIcon fontSize="small" /> : <TrendingUpIcon fontSize="small" />}
                                                sx={{ borderColor: CHART_COLORS[index % CHART_COLORS.length], color: CHART_COLORS[index % CHART_COLORS.length] }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">{formatNumber(row.count)}</TableCell>
                                        <TableCell align="right">{formatNumber(row.revenue)} VND</TableCell>
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

