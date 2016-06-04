var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// 使用 module.exports 导出 ContactUS 模块
module.exports = mongoose.model('ContactUs', new Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  host: String,
  createdAt: {
    type: Date,
    default: Date.now()
  }
}));
