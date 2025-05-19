const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 確保使用 UTF-8 編碼
process.env.LANG = 'zh_TW.UTF-8';
Buffer.from('中文測試'); // 強制 Node.js 使用 UTF-8

dotenv.config();
const app = express();

// 在所有路由之前處理 CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://filesys-frontend.onrender.com');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // 處理 OPTIONS 請求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('錯誤:', err);
    res.status(500).json({
        message: '服務器錯誤',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 請求日誌中間件
app.use((req, res, next) => {
    console.log(`\n=== 請求資訊 ===`);
    console.log(`時間: ${new Date().toISOString()}`);
    console.log(`方法: ${req.method}`);
    console.log(`路徑: ${req.path}`);
    console.log(`來源: ${req.headers.origin}`);
    console.log(`請求標頭:`, req.headers);
    
    // 監聽回應完成事件
    res.on('finish', () => {
        console.log(`\n=== 回應資訊 ===`);
        console.log(`狀態碼: ${res.statusCode}`);
        console.log(`回應標頭:`, res.getHeaders());
    });
    
    next();
});

// 中間件
app.use(express.json());
// 設定字符編碼
app.use(express.urlencoded({ extended: true }));

// MongoDB 連接配置
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB 連接成功!');
        console.log(`資料庫主機: ${conn.connection.host}`);
        console.log(`資料庫名稱: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB 連接失敗:', error.message);
        process.exit(1);
    }
};

// 測試路由
app.get('/test', (req, res) => {
    res.json({ message: 'API 正常運作中!' });
});

// 資料庫連接狀態路由
app.get('/db-status', (req, res) => {
    const state = mongoose.connection.readyState;
    const states = {
        0: '已斷開',
        1: '已連接',
        2: '正在連接',
        3: '正在斷開'
    };
    res.json({
        status: states[state],
        database: mongoose.connection.name,
        host: mongoose.connection.host
    });
});

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));

// 連接資料庫並啟動伺服器
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ 伺服器運行在 port ${PORT}`);
        console.log(`測試 API: http://localhost:${PORT}/test`);
        console.log(`資料庫狀態: http://localhost:${PORT}/db-status`);
    });
});