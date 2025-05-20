const mongoose = require('mongoose');
const File = require('./models/File');
const dotenv = require('dotenv'); // 添加 dotenv

// 載入環境變數
dotenv.config();

// 連線到 MongoDB
const uri = process.env.MONGO_URI;
if (!uri) {
    console.error('錯誤：未設置 MONGO_URI 環境變數');
    process.exit(1);
}

mongoose.connect(uri)
    .then(() => console.log('MongoDB 連線成功'))
    .catch(err => console.error('MongoDB 連線失敗:', err));

async function migrateData() {
    try {
        const files = await File.find().sort({ createdAt: 1 });
        console.log(`找到 ${files.length} 條記錄，開始遷移...`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.order || file.order === 0) {
                file.order = i;
                await file.save();
                console.log(`更新 ${file.name} 的 order 為 ${i}`);
            }
        }

        console.log('資料遷移完成！');
        mongoose.connection.close();
    } catch (error) {
        console.error('遷移失敗:', error);
        mongoose.connection.close();
    }
}

migrateData();