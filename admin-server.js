const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve the entire static site

// Helper function to auto-generate gallery.json by scanning subdirectories of images/
function generateGalleryJson() {
    const imagesDir = path.join(__dirname, 'images');
    let galleryImages = [];

    if (fs.existsSync(imagesDir)) {
        const entries = fs.readdirSync(imagesDir, { withFileTypes: true });
        
        for (const entry of entries) {
            // Only scan subdirectories (e.g. 'gallery', 'onam', 'district2025')
            if (entry.isDirectory()) {
                const subDirPath = path.join(imagesDir, entry.name);
                const files = fs.readdirSync(subDirPath);
                
                for (const file of files) {
                    // Filter for image extensions
                    if (/\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
                        galleryImages.push(`images/${entry.name}/${file}`);
                    }
                }
            }
        }
    }

    // Save to data/gallery.json
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    fs.writeFileSync(path.join(dataDir, 'gallery.json'), JSON.stringify(galleryImages, null, 2));
    console.log('Successfully generated data/gallery.json with', galleryImages.length, 'images.');
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use the folderName from the request body, default to 'news'
        const folderName = req.body.folderName || 'news';
        // Sanitize folder name
        const safeFolderName = folderName.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
        
        const dir = path.join(__dirname, 'images', safeFolderName);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Keep original filename but prepend timestamp to prevent overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-z0-9.-]/gi, '_'));
    }
});

const upload = multer({ storage: storage });

// API endpoint to handle news submission
app.post('/api/news', upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 6 }
]), (req, res) => {
    try {
        console.log('Received news submission:', req.body);
        
        const folderName = req.body.folderName || 'news';
        const safeFolderName = folderName.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();

        // Construct new news item
        const newItem = {
            id: Date.now().toString(),
            title: req.body.title,
            date: req.body.date,
            tag: req.body.tag,
            shortDescription: req.body.shortDescription,
            fullDescription: req.body.fullDescription,
            heroImage: '',
            additionalImages: []
        };

        // Handle uploaded files
        if (req.files['heroImage'] && req.files['heroImage'].length > 0) {
            newItem.heroImage = `images/${safeFolderName}/${req.files['heroImage'][0].filename}`;
        }
        
        if (req.files['additionalImages'] && req.files['additionalImages'].length > 0) {
            req.files['additionalImages'].forEach(file => {
                newItem.additionalImages.push(`images/${safeFolderName}/${file.filename}`);
            });
        }

        // Read existing news.json
        const newsJsonPath = path.join(__dirname, 'data', 'news.json');
        let newsData = [];
        if (fs.existsSync(newsJsonPath)) {
            const rawData = fs.readFileSync(newsJsonPath, 'utf8');
            try {
                newsData = JSON.parse(rawData);
            } catch (e) {
                console.error('Error parsing news.json', e);
            }
        }

        // Add new item to the beginning of the array
        newsData.unshift(newItem);

        // Save updated news.json
        fs.writeFileSync(newsJsonPath, JSON.stringify(newsData, null, 2));

        // Auto-generate gallery.json after a successful upload
        generateGalleryJson();

        res.status(200).json({ success: true, message: 'News added successfully', data: newItem });
    } catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

// Endpoint to manually trigger gallery regeneration
app.post('/api/generate-gallery', (req, res) => {
    try {
        generateGalleryJson();
        res.status(200).json({ success: true, message: 'Gallery regenerated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error regenerating gallery' });
    }
});

app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 Admin Server is running!`);
    console.log(`👉 View website: http://localhost:${PORT}`);
    console.log(`👉 Open portal: http://localhost:${PORT}/admin.html`);
    console.log(`===========================================`);
    
    // Generate gallery.json on startup
    generateGalleryJson();
});
