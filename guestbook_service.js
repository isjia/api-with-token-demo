var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var path = require('path');

var config = require('./production_config');

var Message = require('./app/models/contact_us');
var GuestBook = require('./app/models/guest_book');

var port = config.guestbook_service_port || 8080;
mongoose.connect(config.database);

// Allow CORS REST request
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

var app = express();

app.set('views', './app/views/pages'); //设置视图跟目录
app.set('view engine', 'jade'); // 设置默认的模板引擎
app.use(express.static(path.join(__dirname, 'public')));
app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.locals.moment = require('moment');
app.use(morgan('dev'));

app.get('/'+ config.secret +'/wizdigital/', function(req, res){
  var wizdigital_gb = new GuestBook({
    site_name: 'wizdigital.com',
    token: '8U2UvX8kHDFD',
    messages: []
  });

  wizdigital_gb.save(function(err){
    if (err) throw err;
    res.json({success: true});
  })
});

app.get('/'+ config.secret +'/guestbooks', function(req, res){
  GuestBook.find({}, function(err, guestbooks){
    // res.json(guestbooks);
    res.render('guestbooks', {
      title: '全部留言',
      guestbooks: guestbooks
    });
  });
});

app.post('/guestbook/:id/new', function(req, res){
  var msg = new Message({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    message: req.body.message,
    // host: req.get('host')
    status: 'new'
  });
  GuestBook.update(
    { _id: req.params.id },
    { $push: { messages: msg } },
    function(err) {
      if (err) throw err;
      res.json({success: true});
    });
});

// 启动服务
app.listen(port);
console.log('API at port: ' + port);
