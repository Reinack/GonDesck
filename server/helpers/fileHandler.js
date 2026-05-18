const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../public/uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const uploadImage = multer({
    storage: multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadPdf = multer({
    storage: multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
            cb(null, `pres-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.pdf`);
        }
    }),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'));
        }
    }
});

const deleteFile = async (fileUrl) => {
    if (!fileUrl) return;
    try {
        const filePath = path.join(uploadDir, path.basename(fileUrl));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }
};

const getUploadUrl = (filename) => {
    return `/uploads/${filename}`;
};

module.exports = {
    uploadImage,
    uploadPdf,
    deleteFile,
    getUploadUrl,
    uploadDir
};
