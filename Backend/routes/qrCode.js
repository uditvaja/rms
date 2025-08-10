const express = require('express');
const qrCodeController = require('../controllers/qrCode');
const router = express.Router();

router.post('/', qrCodeController.CreateQrCode);

router.get('/', qrCodeController.getAllQrCodes);

router.put('/update/:id', qrCodeController.updateQrCode);

router.delete('/delete/:id', qrCodeController.deleteQrCode);

module.exports = router;