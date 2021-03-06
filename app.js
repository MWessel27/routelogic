var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");
var fs = require('fs');
app.use(express.static('public'));
app.use(bodyParser.json());
var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});
var upload = multer({ //multer settings
                storage: storage,
                fileFilter : function(req, file, callback) { //file filter
                    if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
                        return callback(new Error('Wrong extension type'));
                    }
                    callback(null, true);
                }
            }).single('file');
/** API path that will upload the files */
app.route('/')
    .get(function(req,res){
        res.sendFile(__dirname + "/index.html");
    });

app.route('/uploaded')
    .get(function(req,res){
      var obj = fs.readFileSync('./uploads/upload.json');
      var jsonContent = JSON.parse(obj);
      var html = fs.readFileSync('./public/files/test.txt');
      for (var i=0;i<jsonContent.length;i++) {
        html += '<tr><td>' +
            (jsonContent[i].address) +
                '</tr></td>';
      }
      html += fs.readFileSync('./public/files/test1.txt');
      res.send(html);
    });
// app.route('/route')
// .get(function(req,res){
app.post('/route', function(req, res) {
    var obj = fs.readFileSync('./uploads/upload.json');
    var jsonContent = JSON.parse(obj);
    var html = fs.readFileSync('./public/files/route.txt');
    html += 'destinations: [';
    html += '\'' + (jsonContent[0].address)+ '\'' + ',';
    for (var i=1;i<jsonContent.length-1;i++) {
      html += '\'' + (jsonContent[i].address)+ '\'' + ',';
    }
    var len = jsonContent.length-1;
    html += '\'' + (jsonContent[len].address)+ '\'';
    html += fs.readFileSync('./public/files/route2.txt');
    res.send(html);
    //res.sendFile(__dirname + "/test.html");
});
app.listen('3000', function(){
    console.log('running on 3000...');
});
// app.route('/upload')
//   .get(function(req,res){
//     res.sendFile(__dirname + "/uploaded.html");
//   });
app.post('/upload', function(req, res) {
  var exceltojson;
  upload(req,res,function(err){
      var tempPath = './uploads/upload.json';
      fs.exists(tempPath, function(exists) {
        if(exists) {
          fs.unlink(tempPath);
        } else {
        }
      });
      if(err){
           res.json({error_code:1,err_desc:err});
           return;
      }
      /** Multer gives us file info in req.file object */
      if(!req.file){
          res.json({error_code:1,err_desc:"No file passed"});
          return;
      }
      /** Check the extension of the incoming file and
       *  use the appropriate module
       */
      if(req.file.originalname.split('.')[req.file.originalname.split('.').length-1] === 'xlsx'){
          exceltojson = xlsxtojson;
      } else {
          exceltojson = xlstojson;
      }
      try {
          exceltojson({
              input: req.file.path,
              output: './uploads/upload.json', //since we don't need output.json
              lowerCaseHeaders:true
          }, function(err,result){
              if(err) {
                  return res.json({error_code:1,err_desc:err, data: null});
              }
              res.json(result.address);
          });
      } catch (e){
          res.json({error_code:1,err_desc:"Corrupted excel file"});
      }
      //This will remove the file in uploads after it is complete
      try {
        fs.unlinkSync(req.file.path);
      } catch(e) {
          //error deleting the file
      }
  })
  res.sendFile(__dirname + "/uploaded.html");
});

app.post('/uploaded', function(req, res) {
  var obj = fs.readFileSync('./uploads/upload.json');
  var jsonContent = JSON.parse(obj);
  var html = fs.readFileSync('./public/files/test.txt');
  for (var i=0;i<jsonContent.length;i++) {
    html += '<tr><td>' +
        (jsonContent[i].address) +
            '</tr></td>';
  }
  html += fs.readFileSync('./public/files/test1.txt');
  res.send(html);
});
