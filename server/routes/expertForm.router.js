const express = require('express');
const router = express.Router();
const expertFormController = require("../controller/Customer/expertForm.controller");
const expertFormAdminController = require("../controller/Admin/formManage.controller");
//Customer
router.post("/create", expertFormController.sendExpertForm);

//Admin
router.get("/", expertFormAdminController.getExpertForm);
router.delete("/:id", expertFormAdminController.deleteExpertForm);
router.post("/reply/:rid", expertFormAdminController.replyExpertForm);

module.exports = router;