require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");       // <-- THIS IS REQUIRED
const archiver = require("archiver");

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

// ----------- DOWNLOAD ALL & CLEAN -----------
app.get("/download-all", (req, res) => {
  const uploadsDir = path.join(__dirname, "uploads");

  // Check if folder exists or has files
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Cannot read uploads folder" });
    if (files.length === 0) return res.status(404).json({ error: "No files to download" });

    // Set headers for zip download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=all_uploads.zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    // Add all files to archive
    files.forEach(file => {
      archive.file(path.join(uploadsDir, file), { name: file });
    });

    archive.finalize();

    // After sending zip, clean uploads folder
    archive.on("end", () => {
      files.forEach(file => {
        fs.unlink(path.join(uploadsDir, file), err => {
          if (err) console.error("Failed to delete file:", file);
        });
      });
      console.log("All files sent and uploads folder cleaned");
    });
  });
});
