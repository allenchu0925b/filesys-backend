const express = require('express');
const File = require('../models/File');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 錯誤處理輔助函數
const handleError = (error) => {
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return { status: 400, message: errors.join(', ') };
    }
    if (error.name === 'CastError') {
        return { status: 400, message: '無效的 ID 格式' };
    }
    return { status: 500, message: '伺服器錯誤' };
};

// JWT 認證中間件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: '未提供 token' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '無效的 token' });
        }
        req.user = user;
        next();
    });
};

// 測試路由
router.get('/test', (req, res) => {
    res.json({ message: '檔案路由正常運作' });
});

// 獲取所有檔案 - 公開訪問
router.get('/', async (req, res) => {
    try {
        const files = await File.find().sort({ createdAt: -1 });
        res.json(files);
    } catch (error) {
        const { status, message } = handleError(error);
        res.status(status).json({ error: message });
    }
});

// 新增檔案
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, videoLink, mp3Link, textLink } = req.body;
        const file = new File({ name, videoLink, mp3Link, textLink });
        await file.save();
        res.status(201).json(file);
    } catch (error) {
        const { status, message } = handleError(error);
        res.status(status).json({ error: message });
    }
});

// 更新檔案
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, videoLink, mp3Link, textLink } = req.body;
        const file = await File.findByIdAndUpdate(
            req.params.id,
            { name, videoLink, mp3Link, textLink },
            { new: true, runValidators: true }
        );
        if (!file) return res.status(404).json({ error: '找不到檔案' });
        res.json(file);
    } catch (error) {
        const { status, message } = handleError(error);
        res.status(status).json({ error: message });
    }
});

// 刪除檔案
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const file = await File.findByIdAndDelete(req.params.id);
        if (!file) return res.status(404).json({ error: '找不到檔案' });
        res.json({ message: '檔案已成功刪除' });
    } catch (error) {
        const { status, message } = handleError(error);
        res.status(status).json({ error: message });
    }
});

module.exports = router;