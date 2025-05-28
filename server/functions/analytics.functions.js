const { app } = require('@azure/functions');
const Analytics = require('../shared/model/analytics.model');
const connectDB = require('../shared/mongoose');

app.http('getAnalytics', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'analytic',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: getAnalytics.');
        try {
            await connectDB();
            const startDate = request.query.get('startDate');
            const endDate = request.query.get('endDate');

            if (!startDate || !endDate) {
                return {
                    status: 400,
                    jsonBody: { message: "startDate and endDate are required query parameters." }
                };
            }

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

            return {
                status: 200,
                jsonBody: analyticsData
            };
        } catch (error) {
            context.error(`Error fetching analytics: ${error.message}`);
            return {
                status: 500,
                jsonBody: { message: 'Internal server error', error: error.message }
            };
        }
    }
});

app.http('getTotalBlogs', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'analytic/total-blogs',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: getTotalBlogs.');
        try {
            await connectDB();
            const totalBlogs = await Analytics.distinct("blogId").countDocuments();
            return {
                status: 200,
                jsonBody: { totalBlogs }
            };
        } catch (error) {
            context.error(`Error fetching total blogs: ${error.message}`);
            return {
                status: 500,
                jsonBody: { message: "Error fetching total blogs", error: error.message }
            };
        }
    }
});


app.http('getTotalViews', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'analytic/total-views',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: getTotalViews.');
        try {
            await connectDB();

            const totalViews = await Analytics.countDocuments({ action: "view" });

            return {
                status: 200,
                jsonBody: { totalViews }
            };
        } catch (error) {
            context.error(`Error fetching total views: ${error.message}`);
            return {
                status: 500,
                jsonBody: { message: "Error fetching total views", error: error.message }
            };
        }
    }
});

app.http('getTotalVisitors', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'analytic/total-visitors',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request: getTotalVisitors.');
        try {
            await connectDB();
            const totalVisitors = await Analytics.distinct("ip").countDocuments();
            return {
                status: 200,
                jsonBody: { totalVisitors }
            };
        } catch (error) {
            context.error(`Error fetching total visitors: ${error.message}`);
            return {
                status: 500,
                jsonBody: { message: "Error fetching total visitors", error: error.message }
            };
        }
    }
});