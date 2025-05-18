const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    videoLink: { type: String, required: true },
    mp3Link: { type: String, required: true },
    textLink: { type: String, required: true }
});

module.exports = mongoose.model('File', fileSchema);