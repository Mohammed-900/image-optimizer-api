const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Please upload a valid image file.'));
        }
        cb(null, true);
    }
});

app.post('/api/optimize', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided.' });
        }

        const width = req.query.width ? parseInt(req.query.width) : null;
        const height = req.query.height ? parseInt(req.query.height) : null;
        const quality = req.query.quality ? parseInt(req.query.quality) : 80;
        const format = req.query.format ? req.query.format.toLowerCase() : 'webp';

        let sharpInstance = sharp(req.file.buffer);

        if (width || height) {
            sharpInstance = sharpInstance.resize({
                width: width || null,
                height: height || null,
                fit: 'fill'
            });
        }

        let contentType = 'image/webp';
        let extension = 'webp';

        if (format === 'jpeg' || format === 'jpg') {
            sharpInstance = sharpInstance.jpeg({ quality });
            contentType = 'image/jpeg';
            extension = 'jpg';
        } else if (format === 'png') {
            sharpInstance = sharpInstance.png({ quality });
            contentType = 'image/png';
            extension = 'png';
        } else {
            sharpInstance = sharpInstance.webp({ quality });
            contentType = 'image/webp';
            extension = 'webp';
        }

        const optimizedBuffer = await sharpInstance.toBuffer();

        res.set('Content-Type', contentType);
        res.set('Content-Disposition', `attachment; filename="optimized-image.${extension}"`);
        res.status(200).send(optimizedBuffer);

    } catch (error) {
        res.status(500).json({ 
            error: 'An error occurred while processing the image.', 
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});