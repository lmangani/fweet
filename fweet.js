/*
	==== fWeet! ====
	fweet is a simple dweet-like clone for node.js and redis, based on elements of RetwisJS
	Licensed under the GNU GPL v2.0 license (https://api.github.com/licenses/gpl-2.0)
	(c) 2015 QXIP BV

	API Methods:

	POST	/post/:thing		Create a post for a Thing
	GET	/get/latest/:thing	Read the latest post from a Thing
	GET	/get/:thing		Read all the available posts from a Thing
	GET	/get/timeline		Read all the available posts from a All the Things
	GET	/del/oldest/:thing	Delete oldest posts from a Thing (careful!)
	GET	/del/all/:thing		Delete all posts from a Thing (careful!)

*/

var version = "1.0e"

console.log('::: fweet '+version+' initializing ...');

// Init Modules & Functions
var express = require('express');
var app = express.createServer();

/* Optional Redis Server address */
// GLOBAL._REDISURL = "redis://user:pass@remote.redis:port"

var Redis = require('./lib/redis.js');
var r = GLOBAL._REDISCLIENT;

// Check Existing Stack in Redis (*NO PRODUCTION*)
r.keys('*:id', function (err, keys) {
  if (err) return console.log(err);
  console.log('Things: '+keys.length);
});     

r.keys('post:*', function (err, keys) {
  if (err) return console.log(err);
  console.log('Posts: '+keys.length);
});     

var Util = require('./lib/util.js');
var User = require('./lib/user.js');
var Post = require('./lib/post.js');

/* Response Templates */
var Res200 = { "status": "success", "data": "no data" };
var Res500 = { "status": "failure", "error": "no errors" };

app.dynamicHelpers({
   stash: function(req, res){
      return req.stash; // Inspired by perl catalyst
   }
});

app.configure(function(){
   // Optional Authenticator
   app.use(express.basicAuth('qxip', 'qxip'));
   app.use(express.bodyParser());
   app.use(express.methodOverride());
   app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// API Calls

app.all('*',function(req,res,next) {
   req.stash = {};
   next();
});

app.get('/', function(req,res) {
   msg = Res200; msg.data = "[{ version: "+version+" }]"; res.send(msg);
});

app.all('/post/:thing', function(req,res) {
   var thing = req.param('thing','');
   var username = thing;
   var password = "";
      // Find or create Thing
      r.get('thing:' + thing + ':id',function(err,val){
         if (err) {
	    msg = Res500; msg.error = err; res.send(msg);
         } else if (val) {
	    // Thing is valid!
	    req.stash.user = {};
	    req.stash.user.name = thing; req.stash.user.id = val;
	    r.incr("global:nextPostId",function(err,pid) {
	      var status = req.param('status').replace(/\n/,"");
	      var post = [Post.currentVersion,pid,req.stash.user.id,req.stash.user.name,+new Date(),status].join('|');
	
	      r.set("post:"+pid,post)
	      r.lpush("global:timeline",pid);
	      r.ltrim("global:timeline",0,500); //keep last 1000 only
	
	      r.smembers("uid:" + req.stash.user.id + ":followers",function(err,users) {
	         if (err) {
	            console.log("Could not retrieve followers");
	            users = [];
	         }
	         users.push(req.stash.user.id);
	         var multiAction = r.multi();
	         for (uid in users) {
	            multiAction.lpush("uid:"+users[uid]+":posts",pid);
	         }
	         multiAction.exec(function(err,replies) { 
			 msg = Res200; msg.data = [{ uid: req.stash.user.id, id: pid }]; res.send(msg);
		 });
	      });
	   });

         } else {
            User.register(thing,password,function(err,user,session) {
               if (err) {
		  msg = Res500; msg.error = err; res.send(msg);
               } else {
                  req.stash.user = user;
                  // Use new Thing
		    r.incr("global:nextPostId",function(err,pid) {
		      if ( isJSON(req.param('status')) ) {
		      	// var status = JSON.stringify(req.param('status'));
			var status = req.param('status').replace(/\n/,"");
		      } else {
			var status = req.param('status').replace(/\n/,"");
		      }
		      var post = [Post.currentVersion,pid,req.stash.user.id,req.stash.user.name,+new Date(),status].join('|');
		
		      r.set("post:"+pid,post)
		      r.lpush("global:timeline",pid);
		      r.ltrim("global:timeline",0,500); //keep last 1000 only
		
		      r.smembers("uid:" + req.stash.user.id + ":followers",function(err,users) {
		         if (err) {
		            console.log("Could not retrieve followers");
		            users = [];
		         }
		         users.push(req.stash.user.id);
		         var multiAction = r.multi();
		         for (uid in users) {
		            multiAction.lpush("uid:"+users[uid]+":posts",pid);
		         }
		         multiAction.exec(function(err,replies) { 
	 			 msg = Res200; msg.data = [{ uid: req.stash.user.id, id: pid, new: 1 }]; res.send(msg);
			});
	              });
	            });
               }
            });
         }
      });


});

app.get('/get/timeline', function(req,res) {
   r.sort('global:users','DESC','LIMIT','0','10','GET','uid:*:thing',function(err,things) {
      if (err) { msg = Res500; msg.error = error; return res.send(msg); }
      req.stash.things = things || [];

      var start = req.param('start',0);
      var count = req.param('count',10);
      req.stash.start = start;
      req.stash.count = count;
      User.getPosts(-1, start, count, function(err, posts) {
         if (err) { 
		msg = Res500; msg.error = "no data"; res.send(msg); }
         else { 
		req.stash.posts = posts;
	 	msg = Res200; msg.data = posts; res.send(msg);
	 }
      });
   });
});

app.get('/get/latest/:thing', function(req,res) {
   r.get("thing:"+req.param('thing','')+":id",function(err,uid) {
      if (err || !uid > 0) { msg = Res500; msg.error = 'bad request'; return res.send(msg); }
      var start = req.param('start',-1);
      var count = req.param('count',0);
      req.stash.start = start;
      req.stash.count = count;
      req.stash.uid = uid;
      req.stash.thing = req.param('thing','');
      User.getPosts(uid,start,count,function(err,posts) {
         req.stash.posts = posts;
	 if (posts !== undefined) {
		 msg = Res200; msg.data = posts; res.send(msg);
	 } else {
		 msg = Res200; msg.data = { results: 0 }; res.send(msg);
	 }

      });
   });
});

app.get('/get/:thing', function(req,res) {
   r.get("thing:"+req.param('thing','')+":id",function(err,uid) {
      if (err || !uid > 0) { msg = Res500; msg.error = 'bad request'; res.send(msg); }
      var start = req.param('start',0);
      var count = req.param('count',50);
      req.stash.start = start;
      req.stash.count = count;
      req.stash.uid = uid;
      req.stash.thing = req.param('thing','');
      User.getPosts(uid,start,count,function(err,posts) {
         req.stash.posts = posts;
	 if (posts !== undefined) {
		 msg = Res200; msg.data = posts; res.send(msg);
	 } else {
		 msg = Res200; msg.data = { results: 0 }; res.send(msg);
	 }
      });
   });
});

app.get('/del/all/:thing', function(req,res) {
   r.get("thing:"+req.param('thing','')+":id",function(err,uid) {
      if (err || !uid > 0) { msg = Res500; msg.error = 'bad request'; res.send(msg); }
      var start = req.param('start',0);
      var count = req.param('count',0);
      req.stash.start = start;
      req.stash.count = count;
      req.stash.uid = uid;
      req.stash.thing = req.param('thing','');
      var count = 0;
      User.delAllPosts(uid,function(err,posts) {
	  if (!err) count = posts.length;
      });
	 msg = Res200; msg.data = { deleted: count }; res.send(msg);
   });
});

// BROKEN! WIP!
app.get('/del/oldest/:thing', function(req,res) {
   r.get("thing:"+req.param('thing','')+":id",function(err,uid) {
      if (err || !uid > 0) { msg = Res500; msg.error = 'bad request'; res.send(msg); }
      var start = req.param('start',1);
      var count = req.param('count',-1);
      req.stash.start = start;
      req.stash.count = count;
      req.stash.uid = uid;
      req.stash.thing = req.param('thing','');
      User.delPosts(uid,start,count,function(err,posts) {
         req.stash.posts = posts;
	 msg = Res200; msg.data = { deleted: posts }; res.send(msg);
      });
   });
});


app.get('/set/:user/follow/:uid', function(req,res) {
	if (req.param.key) {	
		follow(req,res,req.param('uid',-1),true,req.param('user','') )
	}
});

app.get('/set/:user/unfollow/:uid', function(req,res) {
	if (req.param.key) {	
		follow(req,res,req.param('uid',-1),false,req.param('user','') )
	}
});

function follow(req,res,uid,follow,user) {
   if (user.length > 0 && user != req.stash.user.id) { 
	   if (uid > 0 && uid != user) {
	      if (follow) {
	         r.sadd("uid:"+uid+":followers",user);
	         r.sadd("uid:"+user+":following",uid);
	       } else {
	         r.srem("uid:"+uid+":followers",user);
	         r.srem("uid:"+user+":following",uid);
	      }
	   }
	   r.get('uid:'+uid+':name',function(err,name) {
	      res.redirect('/get/' + name);
	   });
   }

}

app.post('/register', function(req,res) {
   var username  = req.param('username','').trim();
   var password  = req.param('password','').trim();

   if (!username.length > 0 || !password.length > 0) {
      res.render('error',{error : "Must supply all fields" });
   } else {
      r.get('username:' + username + ':id',function(err,val){
         if (err) {
            res.render('error',{error : "Error checking for existing username : " + err });
         } else if (val) {
            res.render('error',{error : "Username already in use, try something different!" });
         } else {
            User.register(username,password,function(err,user,session) {
               if (err) {
                  res.render('error',{error : 'Could not register user'});
               } else {
                  req.stash.user = user;
                  res.send('registered user '+user);
               }
            });
         }
      });
   }
});


function isJSON (jsonString){
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object" && o !== null) {
            return o;
        }
    }
    catch (e) { }
    return false;
};

// Start API Server
app.listen(8080);
console.log('Ready!');

process.on('SIGINT', function() {
    console.log(' detected!');
    console.log("Terminating...");
	app.close();
        process.exit();
});
