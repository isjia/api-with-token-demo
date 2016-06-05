var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Message = require('./contact_us');

// 使用 module.exports 导出 GuestBook 模块
module.exports = mongoose.model('GuestBook', new Schema({
  site_name: {
    type: String,
    unique: true,
  },
  token: {
    type: String,
    unique: true,
  },
  available: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  messages: []
}));
