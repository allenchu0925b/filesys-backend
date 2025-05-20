const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// 測試路由
router.get('/test', (req, res) => {
    res.json({ message: '認證路由正常運作' });
});

// 登入路由
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: '請提供帳號和密碼' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: '帳號或密碼錯誤' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: '帳號或密碼錯誤' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        const { status, message } = handleError(error);
        res.status(status).json({ error: message });
    }
});

module.exports = router;