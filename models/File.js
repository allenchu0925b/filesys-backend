const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    videoLink: {
        type: String,
        trim: true
    },
    mp3Link: {
        type: String,
        trim: true
    },
    textLink: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    order: {  // 新增 order 欄位
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('File', fileSchema);