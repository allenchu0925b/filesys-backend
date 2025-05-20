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

// 獲取所有檔案 - 公開訪問，支援動態排序
router.get('/', async (req, res) => {
    try {
        const { sort = 'order', order = 'asc' } = req.query;
        const sortOptions = {};
        // 根據 sort 和 order 參數動態設置排序
        sortOptions[sort] = order === 'asc' ? 1 : -1;
        // 如果 sort 不是 order，則添加次要排序條件 createdAt
        if (sort !== 'order') {
            sortOptions.createdAt = -1;
        }
        const files = await File.find().sort(sortOptions);
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
        const maxOrderFile = await File.findOne().sort({ order: -1 });
        const newOrder = maxOrderFile ? maxOrderFile.order + 1 : 0;
        const file = new File({ name, videoLink, mp3Link, textLink, order: newOrder });
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

// 調整順序
router.post('/reorder', authenticateToken, async (req, res) => {
    try {
        const { id, direction } = req.body;
        const file = await File.findById(id);
        if (!file) return res.status(404).json({ error: '找不到檔案' });

        const files = await File.find().sort({ order: 1, createdAt: -1 });
        const index = files.findIndex(f => f._id.toString() === id);

        if (direction === 'up' && index > 0) {
            const prevFile = files[index - 1];
            const tempOrder = file.order;
            file.order = prevFile.order;
            prevFile.order = tempOrder;
            await file.save();
            await prevFile.save();
        } else if (direction === 'down' && index < files.length - 1) {
            const nextFile = files[index + 1];
            const tempOrder = file.order;
            file.order = nextFile.order;
            nextFile.order = tempOrder;
            await file.save();
            await prevFile.save();
        }

        res.json({ message: '順序調整成功' });
    } catch (error) {
        const { status, message } = handleError(error);
        res.status(status).json({ error: message });
    }
});

module.exports = router;