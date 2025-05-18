const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 確保使用 UTF-8 編碼
process.env.LANG = 'zh_TW.UTF-8';
Buffer.from('中文測試'); // 強制 Node.js 使用 UTF-8

dotenv.config();
const app = express();

// CORS 配置
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = ['https://filesys-frontend.onrender.com', 'http://localhost:3000'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('不允許的來源'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400, // 預檢請求的結果可以快取 24 小時
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// 使用 CORS 中間件
app.use(cors(corsOptions));

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