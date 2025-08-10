const models = require("../models");

const CreateQrCode = async (req, res) => {
  try {
    const {
      activeTab,
      link,
      qrName,
      additionalText,
      chooseColor,
      frameColor,
      qrColor,
      contentCategory,
      isTable,
    } = req.body;

    if (!link) {
      return res.status(400).json({ message: "Link is required" });
    }

    const allowedContentCategories = ["Food & Drink", "Other", "website"];
    if (!allowedContentCategories.includes(contentCategory)) {
      return res.status(400).json({
        message: `Invalid contentCategory. Allowed values are: ${allowedContentCategories.join(", ")}`,
      });
    }

    // Validate isTable
    if (typeof isTable === "undefined") {
      return res.status(400).json({ message: "isTable field is required." });
    }

    const range = parseInt(qrName, 10);
    if (isNaN(range) || range <= 0) {
      return res.status(400).json({ message: "qrName must be a positive integer" });
    }

    const qrCodes = [];

    for (let i = 1; i <= range; i++) {
      const qrCode = new models.QrCode({
        activeTab,
        link,
        qrName: `${i}`,
        additionalText,
        chooseColor,
        frameColor,
        qrColor,
        contentCategory,
        isTable,
      });

      const savedQRCode = await qrCode.save();
      qrCodes.push(savedQRCode);
    }

    res.status(201).json({
      message: "QR Codes created successfully",
      requestBody: req.body,
      QRCode: qrCodes,
    });
  } catch (error) {
    console.error("Error saving QR Code:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};


const getAllQrCodes = async (req, res) => {
  try {
    const qrCodes = await models.QrCode.find();

    if (!qrCodes.length) {
      return res.status(404).json({ message: "No QR codes found" });
    }

    res.status(200).json(qrCodes);
  } catch (error) {
    console.error("Error fetching QR Codes:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const updateQrCode = async (req, res) => {
  try {
    const { id } = req.params;
    const qrCode = await models.QrCode.findById(id);
    if (!qrCode) {
      return res.status(404).json({ message: "QR Code not found" });
    }

    const {
      activeTab,
      link,
      qrName,
      additionalText,
      chooseColor,
      frameColor,
      qrColor,
      contentCategory,
      isTable,
    } = req.body;

    const allowedContentCategories = ["Food & Drink", "Other", "website"];
    if (contentCategory && !allowedContentCategories.includes(contentCategory)) {
      return res.status(400).json({
        message: `Invalid contentCategory. Allowed values are: ${allowedContentCategories.join(", ")}`,
      });
    }

    if (typeof isTable !== "undefined" && typeof isTable !== "boolean") {
      return res.status(400).json({ message: "isTable must be a boolean (true or false)." });
    }

    if (qrName && (isNaN(parseInt(qrName, 10)) || parseInt(qrName, 10) <= 0)) {
      return res.status(400).json({ message: "qrName must be a positive integer" });
    }

    qrCode.activeTab = activeTab || qrCode.activeTab;
    qrCode.link = link || qrCode.link;
    qrCode.qrName = qrName || qrCode.qrName;
    qrCode.additionalText = additionalText || qrCode.additionalText;
    qrCode.chooseColor = chooseColor || qrCode.chooseColor;
    qrCode.frameColor = frameColor || qrCode.frameColor;
    qrCode.qrColor = qrColor || qrCode.qrColor;
    qrCode.contentCategory = contentCategory || qrCode.contentCategory;

    if (typeof isTable !== "undefined") {
      qrCode.isTable = isTable;
    }

    const updatedQRCode = await qrCode.save();

    res.status(200).json({
      message: "QR Code updated successfully",
      QRCode: updatedQRCode,
    });
  } catch (error) {
    console.error("Error updating QR Code:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};


const deleteQrCode = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await models.QrCode.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "QR Code not found" });
    }

    res.status(200).json({ message: "QR Code deleted successfully" });
  } catch (error) {
    console.error("Error deleting QR Code:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { CreateQrCode, getAllQrCodes, updateQrCode, deleteQrCode };
