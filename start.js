require('dotenv').config();

// 設置默認的環境變數
if (!process.env.MONGO_URI) {
    console.error('錯誤：未設置 MONGO_URI 環境變數');
    process.exit(1);
}

// 啟動服務器
require('./server.js'); 