const Analytics = require("../../model/analytics.model");

// API: /analytic/
exports.getAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const match = {
            $match: {
                timestamp: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        };

        const group = {
            $group: {
                _id: "$action",
                totalCount: { $sum: 1 },
                totalRevenue: { $sum: "$revenue" }
            }
        };
        const analyticsData = await Analytics.aggregate([match, group]);
        res.status(200).json(analyticsData);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
}

// API: /analytic/total-blogs
exports.getTotalBlogs = async (req, res) => {
    try {
        const totalBlogs = await Analytics.distinct("blogId").countDocuments();
        return res.status(200).json({ totalBlogs });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching total blogs", error: error.message });
    }
};
// API: /analytic/total-views
exports.getTotalViews = async (req, res) => {
    try {
        const totalViews = await Analytics.countDocuments({ action: "view" });
        return res.status(200).json({ totalViews });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching total views", error: error.message });
    }
};

// API: /analytic/total-visitors
exports.getTotalVisitors = async (req, res) => {
    try {
        const totalVisitors = await Analytics.distinct("ip").countDocuments();
        return res.status(200).json({ totalVisitors });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching total visitors", error: error.message });
    }
};