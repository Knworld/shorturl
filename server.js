var express = require('express');
var mongo = require('mongodb').MongoClient;
var path = require('path');
var localdb = "mongodb://localhost:27017/mydb";
var url_db = localdb || process.env.DB_URL;
var app = express();
var resObj = {};
var digit = 10;
var pool = ['1','2','3','4','5','6','7','8','9','0','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
            'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
var maxStorage = Math.pow(pool.length, digit);

app.get('/', function(req, res){
   res.sendFile(path.join(__dirname, 'index.html')) ;
});

app.get(/short\/(.+)/, function(req, res){
    var obj = {};
    var code;
    var url = req.params[0];
    var baseUrl = req.protocol + 's://' + req.get('Host') + '/';
    var ptn = /^((http|https):\/\/(www\.|)[a-z]+\.([a-z]{3}\/[\w\/]*|[a-z]{3}))$/;
    if(!ptn.test(url)) {
        obj.error = "The provided paramter is not a valid url";
        return res.json(obj);
    }
    
    obj["original_url"] = url;
    
        accessDb(url, function(err, col){
           if(err) throw err;
           col.find().toArray(function(err, data){
            if(err) throw err;
      
            for(var i=0; i<data.length; i++){
                  var item = data[i];
                  console.log(item);
                  if(item['key'] && (item['key'][Object.keys(item['key'])[0]] === url)) {
                      obj["short_url"] = baseUrl + Object.keys(item['key'])[0];
                      //res.json(obj);
                      console.log('value foundddddddddddddddddd');
                      break;
                  }
            }
            
            
            //if url does not exist in database
            if(!obj["short_url"]){
                code = codeGen(digit, '');
                console.log("code_part1", code);
                var count = 0;
                var keyObj = {};
               
               if(code === null) {  obj["short_url"] = "Maximum storage reached";}
               else {
                   obj["short_url"] = baseUrl + code;
                  //var subObj = {};
                   //subObj[code] = url;
                   keyObj['key'] = code;
                   keyObj['url'] = url;
                   col.insert(keyObj);
                   
               }
               
            }
            
            return res.json(obj);
            
       
       
        
            });
            
        });
   
    
  
   
});

app.get('/short/', function(req, res){
    resObj.error = "Please provide a url"
    return res.json(resObj);
})

app.get('/:short_url', function(req, res){
    var short_url = req.params.short_url;
    var resObj = {};
    
    accessDb(short_url, function(err, col){
        if(err) throw err;
        col.find().toArray(function(err, data){
            var thisUrl;
            if(err) throw err;
            
            data.forEach(function(item){
                if(item['key'] && Object.keys(item['key'])[0] === short_url){
                    thisUrl = item['key'][Object.keys(item['key'])[0]];
                   return;
                }
            });
            
            if(!thisUrl) {
                resObj.error = "the url does not exist";
                return res.json(resObj);
            }
            
            return res.redirect(thisUrl);
        });
        
    });
    
   
});

app.listen(process.env.PORT || 8080, function(){});

function accessDb(key, callback){
    
    mongo.connect(url_db, function(err, db){
       if(err) throw err;
       
       var col = db.collection('codebase');
       
       callback(null, col);
       
       db.close();
    });
}


function codeGen(digit, code){
    if(digit<1) return code;
    code += pool[Math.floor(Math.random()*pool.length)];
    return codeGen(digit-1, code);
}