const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const connectDb = require('./config/db')
const router = require('./routes/index')
require('dotenv').config();
const corsOptions = {
    origin: ["http://localhost:5173"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};
app.set("trust proxy", true);
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
router(app);
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
    connectDb();
    console.log(`Server is running on port ${PORT}`);
});