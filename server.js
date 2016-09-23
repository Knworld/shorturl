var express = require('express');
var mongo = require('mongodb').MongoClient;
var path = require('path');
var localdb = "mongodb://localhost:27017/mydb";
var url_db = process.env.DB_URI || localdb;
var app = express();
var resObj = {};
var digit = 10;
var pool = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

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

    //console.log('variable', url_db);
    obj["original_url"] = url;
    
    accessDb(function(err, db, col){
           if(err) throw err;
           
           //col.find().toArray(function(err, data){
               //if(err) throw err;
               //console.log('showdata',data);
           //});
       
          findUrl(url, function(err, data){
             if(err) throw err;
             if(data){
                 obj["short_url"] = baseUrl+ data;
                 db.close();
                 res.json(obj);
             }else{ 
                findKey(function(key){
                    console.log('final key', key);
                    obj["short_url"] = baseUrl + key;
                    col.insert({'key': key, 'url':url});
                    db.close();
                    res.json(obj);
                });
             }
                 
          });
              
            function findUrl(searchUrl, callback){
                
              col.findOne({'url': searchUrl}, function(err, data){
                  if(!data){
                    callback(err, null);
                  }else {
                    console.log('thisdata_part',data)  
                    //obj["short_url"] = baseUrl + data[0]['key'];
                    callback(err, data['key']);
                  }
              });
                  
            }
              
            function findKey(callback){
              
              var newKey = codeGen(digit, "");
              col.findOne({key: newKey}, function(err, data){
                  if(err) throw err;
                  //if(!data) return findKey(callback);
                  //else callback(newKey);
                  console.log('keygen', newKey);
                  callback(newKey);
              });
            }

           
           /*
           col.find({'url':url}).toArray(function(err, data){
             
            if(err) throw err;
           
            //if url does not exist in database
            if(data.length){
                //console.log('found', data[0]['key']);
                obj["short_url"] = baseUrl + data[0]['key'];
            }else{
                code = codeGen(digit, '');
                
                var count = 0;
                var keyObj = {};
               
               if(code === null) {  obj["short_url"] = "Maximum storage reached";}
               else {
                   console.log("code_part1", code);
                   obj["short_url"] = baseUrl + code;
                   col.insert({key:code, url:url});
                   //insertData(col, code, url);
               }
               
            }
            
            return res.json(obj);
            
            });*/
            
    });
   
    
  
   
});

app.get('/short/', function(req, res){
    resObj.error = "Please provide a url"
    return res.json(resObj);
})

app.get('/:short_url', function(req, res){
    var short_url = req.params.short_url;
    var resObj = {};
    console.log('getkey', short_url);
    accessDb(short_url, function(err, col){
        if(err) throw err;
        col.findOne({'key':short_url}, function(err,data){
            //var thisUrl;
            if(err) throw err;
            
            
            if(!data) {
                resObj.error = "the url does not exist";
                return res.json(resObj);
            }
            
            return res.redirect(data['url']);
        });
        
    });
    
   
});

app.listen(process.env.PORT || 8080, function(){});

function accessDb(callback){
    
    mongo.connect(url_db, function(err, db){
       if(err) throw err;
       var col = db.collection('urls');
       callback(null, db, col);
       //db.close();
    });
}

function codeGen(digit, code){
    if(digit<1) return code;
    code += pool[Math.floor(Math.random()*pool.length)];
    return codeGen(digit-1, code);
}

