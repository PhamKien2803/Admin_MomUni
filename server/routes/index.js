const blogsRoute = require('./blogs.router')
const usersRoute = require("./users.router")
const expertFormRoute = require("./expertForm.router")
const notificationRoute = require("./notification.router")
const commentRoute = require("./comment.router")
const ratingRoute = require("./rating.router")
const blogCustomerRoute = require("./blog-customer.router")
const analyticsRoute = require("./analytics.router")

module.exports = (app) => {
    const api = "/api";
    app.use(api + '/admin/blog', blogsRoute)
    app.use(api + '/blog', blogCustomerRoute)
    app.use(api + '/auth', usersRoute)
    app.use(api + '/comment', commentRoute)
    app.use(api + '/rating', ratingRoute)
    app.use(api + '/expert-form', expertFormRoute)
    app.use(api + '/notification', notificationRoute)
    app.use(api + '/analytics', analyticsRoute)
}