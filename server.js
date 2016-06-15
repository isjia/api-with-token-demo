var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken'); // 用来创建和确认用户摘要信息
var config = require('./config'); // 读取配置文件 config.js 信息
var User = require('./app/models/user'); // 获取 User model 信息
var ContactUs = require('./app/models/contact_us'); // 获取联系我们的信息

// Allow CORS REST request
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

// 配置
var port = config.port || 8080; // 设置启动端口
mongoose.connect(config.database); // 连接数据库

var app = express();
app.use(allowCrossDomain);
app.set('superSecret', config.secret); // 设置 app 的超级密码，即用来生成摘要的密码

app.set('views', './app/views/pages');
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

// 用 body parser 来解析post 和 url 信息中的参数
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// 使用 morgan 将请求日志打印到控制台
app.use(morgan('dev'));

// 基础路由
// app.get('/', function(req, res){
//   res.send('Hello! The API is at http://localhost:' + port + '/api');
// });

// 联系我们的路由
app.post('/contactus/new', function(req, res){
  // 创建一个联系我们的消息
  var msg = new ContactUs({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    message: req.body.message,
    // host: req.get('host')
    status: 'new'
  });

  // 保存到数据库中
  msg.save(function(err){
    if(err) throw err;

    console.log('Contact Msg saved successfully');
    res.json({success: true});
  });
});

app.get('/contactus', function(req, res){
  ContactUs.find({}, function(err, messages){
    res.json(messages);
  });
});

// 添加用户的路由
app.get('/user/new', function(req, res){
  // 创建一个测试用户
  var nick = new User({
    name: 'wizdigital.com',
    password: 'test',
    admin: 'true',
    available: 'true'
  });

  // 将测试用户保存到数据库
  nick.save(function(err){
    if (err) throw err;

    console.log('User saved successfully');
    res.json({success: true});
  })
})

var apiRoutes = express.Router(); // 获取一个 express 的路由实例

// 认证接口, route to authenticate a user (Post http://xxxx/api/auth)
apiRoutes.post('/auth', function(req, res){
  // find the user
  console.log(req.body.name);
  User.findOne({
    name: req.body.name
  }, function(err, user){
    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: '认证失败，用户名找不到'});
    } else if (user) {
      // 检查密码
      if (user.password != req.body.password) {
        console.log(req.body.password );
        res.json({success: false, message: '认证失败，密码错误'});
      } else {
        // 创建 toke
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: '1440m' // 设置过期时间
        });

        // json 格式返回 token
        res.json({
          success: true,
          message: 'Enjoy your token',
          token: token
        });
      }
    }
  })
});
// route middleware to verify a token
apiRoutes.use(function(req, res, next){
  // 检查 post 的信息或者 url 查询参数或者头信息
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // 解析 token
  if (token) {
    // 确认 token
    console.log(token);
    jwt.verify(token, app.get('superSecret'), function(err, decoded){
      if(err){
        return res.json({
          sucess: false,
          message: 'token 信息错误。'
        });
      } else {
        // 如果没有问题就把解码后的信息保存到请求中，供后面的路由使用
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // 如果没有 token ，则返回错误
    return res.status(403).send({
      success: false,
      message: '没有提供 token！'
    });
  }
});
apiRoutes.get('/', function(req, res){
  res.json({message: 'Welcome to the coolest API on earth!'});
})

// 返回所有用户的信息
apiRoutes.get('/users', function(req, res){
  User.find({}, function(err, users){
    res.json(users);
  });
});

// 应用 APIRoutes, 并在前面加前缀 '/api'
app.use('/api', apiRoutes);

// 启动服务
app.listen(port);
console.log('API at port: ' + port);
