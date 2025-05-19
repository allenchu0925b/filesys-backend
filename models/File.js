const mongoose = require('mongoose');

const urlValidator = {
    validator: function(v) {
        if (!v) return true; // 允許空值
        try {
            new URL(v);
            return true;
        } catch (e) {
            return false;
        }
    },
    message: '請輸入有效的 URL'
};

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxLength: [100, '名稱不能超過 100 字元']
    },
    videoLink: {
        type: String,
        validate: urlValidator,
        maxLength: [2000, 'URL 不能超過 2000 字元']
    },
    mp3Link: {
        type: String,
        validate: urlValidator,
        maxLength: [2000, 'URL 不能超過 2000 字元']
    },
    textLink: {
        type: String,
        validate: urlValidator,
        maxLength: [2000, 'URL 不能超過 2000 字元']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('File', fileSchema);