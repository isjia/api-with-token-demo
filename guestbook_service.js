var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var config = require('./production_config');

var Message = require('./app/models/contact_us');
var GuestBook = require('./app/models/guest_book');

var port = config.guestbook_service_port || 8080;
mongoose.connect(config.database);

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

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
    res.json(guestbooks);
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
