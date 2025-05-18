const express = require('express');
const jwt = require('jsonwebtoken');
const File = require('../models/File');
const router = express.Router();

// JWT 驗證中間件
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.userId = decoded.userId;
        next();
    });
};

// 測試路由
router.get('/test', (req, res) => {
    res.json({ message: '檔案路由正常運作' });
});

// 獲取檔案列表
router.get('/', (req, res) => {
    res.json({ message: '這裡將返回檔案列表' });
});

// 獲取所有檔案（格式化輸出）
router.get('/all', async (req, res) => {
    try {
        const files = await File.find();
        const formattedFiles = files.map(file => ({
            "檔案名稱": file.name,
            "檔案ID": file._id,
            "建立時間": file.createdAt,
            "影片連結": file.videoLink,
            "音頻連結": file.mp3Link,
            "文字連結": file.textLink
        }));
        res.json(formattedFiles);
    } catch (error) {
        res.status(500).json({ error: '獲取檔案失敗' });
    }
});

// 新增檔案（需認證）
router.post('/', authenticate, async (req, res) => {
    const { name, videoLink, mp3Link, textLink } = req.body;
    try {
        const file = new File({ name, videoLink, mp3Link, textLink });
        await file.save();
        const formattedFile = {
            "檔案名稱": file.name,
            "檔案ID": file._id,
            "建立時間": file.createdAt,
            "影片連結": file.videoLink,
            "音頻連結": file.mp3Link,
            "文字連結": file.textLink
        };
        res.status(201).json(formattedFile);
    } catch (error) {
        res.status(400).json({ error: '新增檔案失敗' });
    }
});

// 更新檔案（需認證）
router.put('/:id', authenticate, async (req, res) => {
    const { name, videoLink, mp3Link, textLink } = req.body;
    try {
        const file = await File.findByIdAndUpdate(
            req.params.id,
            { name, videoLink, mp3Link, textLink },
            { new: true }
        );
        if (!file) return res.status(404).json({ error: '找不到檔案' });
        const formattedFile = {
            "檔案名稱": file.name,
            "檔案ID": file._id,
            "建立時間": file.createdAt,
            "影片連結": file.videoLink,
            "音頻連結": file.mp3Link,
            "文字連結": file.textLink
        };
        res.json(formattedFile);
    } catch (error) {
        res.status(400).json({ error: '更新檔案失敗' });
    }
});

// 刪除檔案（需認證）
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const file = await File.findByIdAndDelete(req.params.id);
        if (!file) return res.status(404).json({ error: 'File not found' });
        res.json({ message: 'File deleted' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete file' });
    }
});

module.exports = router;