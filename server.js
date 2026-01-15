require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// Allow only .txt files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "text/plain") {
    cb(null, true);
  } else {
    cb(new Error("Only .txt files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

// Health check
app.get("/", (req, res) => {
  res.send("Text file upload API is running");
});

// Upload endpoint
app.post("/upload-text", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.json({
    success: true,
    message: "File uploaded successfully",
    file: {
      originalName: req.file.originalname,
      savedAs: req.file.filename,
      size: req.file.size,
    },
  });
});

// Error handling
app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
