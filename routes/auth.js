const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// 測試路由
router.get('/test', (req, res) => {
    res.json({ message: '認證路由正常運作' });
});

// 初始化管理員帳號
router.post('/init-admin', async (req, res) => {
    try {
        // 檢查是否已存在管理員
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            return res.status(400).json({ message: '管理員帳號已存在' });
        }

        // 創建管理員帳號
        const hashedPassword = await bcrypt.hash('testpassword', 10);
        const admin = new User({
            username: 'testadmin',
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        res.status(201).json({ message: '管理員帳號創建成功' });
    } catch (error) {
        res.status(500).json({ message: '伺服器錯誤', error: error.message });
    }
});

// 註冊路由
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 檢查使用者是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: '使用者名稱已存在' });
        }

        // 加密密碼
        const hashedPassword = await bcrypt.hash(password, 10);

        // 創建新使用者
        const user = new User({
            username,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: '使用者註冊成功' });
    } catch (error) {
        res.status(500).json({ message: '伺服器錯誤', error: error.message });
    }
});

// 登入
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

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
outer.post('/reset-admin', async (req, res) => {
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