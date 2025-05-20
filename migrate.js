const mongoose = require('mongoose');
const File = require('./models/File');

// 連線到 MongoDB
const uri = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster0.mongodb.net/databaseName?retryWrites=true&w=majority';
mongoose.connect(uri)
    .then(() => console.log('MongoDB 連線成功'))
    .catch(err => console.error('MongoDB 連線失敗:', err));

async function migrateData() {
    try {
        // 查找所有文件，按 createdAt 排序
        const files = await File.find().sort({ createdAt: 1 });
        console.log(`找到 ${files.length} 條記錄，開始遷移...`);

        // 為每條記錄分配 order 值
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.order || file.order === 0) { // 僅更新缺少 order 的記錄
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