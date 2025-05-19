const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 確保使用 UTF-8 編碼
process.env.LANG = 'zh_TW.UTF-8';
Buffer.from('中文測試'); // 強制 Node.js 使用 UTF-8

dotenv.config();
const app = express();

// 基本的健康檢查路由 - 必須在最前面
app.get('/', (req, res) => {
    res.json({ message: '服務器正在運行' });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// CORS 中間件 - 使用更寬鬆的配置進行測試
app.use((req, res, next) => {
    // 允許所有來源，僅用於測試
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// 請求日誌
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    
    // 捕獲回應
    const oldSend = res.send;
    res.send = function(data) {
        console.log(`[${new Date().toISOString()}] Response:`, {
            statusCode: res.statusCode,
            headers: res.getHeaders(),
            body: data
        });
        oldSend.apply(res, arguments);
    };
    
    next();
});

// 中間件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 連接配置
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
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

// 錯誤處理 - 必須在所有路由之後
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: true,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 處理 404
app.use((req, res) => {
    res.status(404).json({ message: '找不到請求的資源' });
});

// 連接資料庫並啟動伺服器
const PORT = process.env.PORT || 10000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ 伺服器運行在 port ${PORT}`);
        console.log(`測試 API: http://localhost:${PORT}/test`);
        console.log(`資料庫狀態: http://localhost:${PORT}/db-status`);
    });
});