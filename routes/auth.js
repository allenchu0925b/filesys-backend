const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 註冊路由
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: '請填寫所有欄位' });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: '用戶名已存在' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            password: hashedPassword,
        });
        await user.save();
        res.status(201).json({ message: '用戶註冊成功' });
    } catch (error) {
        res.status(500).json({ error: '伺服器錯誤', details: error.message });
    }
});

// 登入路由
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: '請填寫所有欄位' });
        }
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: '無效的用戶名或密碼' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: '伺服器錯誤', details: error.message });
    }
});

// 初始化管理員路由
router.post('/init-admin', async (req, res) => {
    console.log('收到 /init-admin 請求');
    try {
        const adminExists = await User.findOne({ username: 'testadmin' });
        console.log('檢查管理員是否存在:', adminExists);
        if (adminExists) {
            console.log('管理員已存在，返回 400');
            return res.status(400).json({ message: '管理員帳號已存在' });
        }
        const hashedPassword = await bcrypt.hash('testpassword', 10);
        console.log('密碼加密完成:', hashedPassword);
        const admin = new User({
            username: 'testadmin',
            password: hashedPassword,
        });
        await admin.save();
        console.log('管理員帳號創建成功');
        res.status(201).json({ message: '管理員帳號創建成功' });
    } catch (error) {
        console.error('錯誤:', error.message);
        res.status(500).json({ message: '伺服器錯誤', error: error.message });
    }
});

// 臨時重設管理員密碼路由
router.post('/reset-admin', async (req, res) => {
    console.log('收到 /reset-admin 請求');
    try {
        const hashedPassword = await bcrypt.hash('newpassword123', 10);
        console.log('密碼加密完成:', hashedPassword);
        await User.updateOne(
            { username: 'testadmin' },
            { password: hashedPassword },
            { upsert: true }
        );
        console.log('管理員密碼重設成功');
        res.status(200).json({ message: '管理員密碼已重設為 newpassword123' });
    } catch (error) {
        console.error('錯誤:', error.message);
        res.status(500).json({ message: '重設失敗', error: error.message });
    }
});

module.exports = router;