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
	GET	/listen/to/:thing	Subscribe to live posts from a Thing
	GET	/del/oldest/:thing	Delete oldest posts from a Thing (careful!)
	GET	/del/all/:thing		Delete all posts from a Thing (careful!)

*/

var version = "1.0h"

console.log('::: fweet '+version+' initializing ...');

// Init Modules & Functions
var express = require('express');
var app = express.createServer();

/* Optional Redis Server address */
// GLOBAL._REDISURL = "redis://user:pass@remote.redis:port"

var Redis = require('./lib/redis.js');
var r = GLOBAL._REDISCLIENT;
// Redis Publishers
var rpub = GLOBAL._REDISCLIENTPUB;
var rsub = GLOBAL._REDISCLIENTSUB;

// Extend mapping
var extend = require('util')._extend;

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
   app.use(express.favicon("favicon.ico")); 
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
   req.header('Content-Type', 'application/json');
   res.header('Access-Control-Allow-Origin', '*'); 
   res.header('Access-Control-Allow-Methods', 'GET, POST');
   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
   next();
});

app.get('/', function(req,res) {
   msg = Res200; msg.data = "[{ version: "+version+" }]"; res.send(msg);
});

app.all('/post/:thing', function(req,res) {
   var thing = req.param('thing','');
   if (thing.length <= 0 | typeof(thing.length)=== undefined ) { msg = Res500; msg.error = { how: "thing name mandatory!", error: "missing field"}; return res.send(msg); }
   var username = thing;
   var password = "";
      // Find or create Thing
      r.get('thing:' + thing + ':id',function(err,val){
         if (err) {
	    msg = Res500; msg.error = { how: "failed to find thing: "+thing, error: err}; return res.send(msg);
         } else if (val) {
	    // Thing is valid!
	    req.stash.user = {};
	    req.stash.user.name = thing; req.stash.user.id = val;
	    r.incr("global:nextPostId",function(err,pid) {

	    var data = JSON.stringify(extend(req.body,req.query));
	    if (req.param('key') !== undefined) {
		    var key = req.param('key');
		    data.key = undefined;
	    }

	      var post = [Post.currentVersion,pid,req.stash.user.id,req.stash.user.name,+new Date(),data].join('|');
	      var postjson = {pid:pid,uid:req.stash.user.id,thing:req.stash.user.name,time:+new Date(),data:data};
	
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
			 rpub.publish('pubsub:'+req.stash.user.id,JSON.stringify(postjson) );

		 });
	      });
	   });

         } else {
            User.register(thing,password,function(err,user,session) {
               if (err) {
		  msg = Res500; msg.error = err; return res.send(msg);
               } else {
                  req.stash.user = user;
                  // Use new Thing
		    r.incr("global:nextPostId",function(err,pid) {

		    var data = JSON.stringify(extend(req.body,req.query));
		    if (req.param('key') !== undefined) {
			    var key = req.param('key');
			    data.key = undefined;
		    }

		      var post = [Post.currentVersion,pid,req.stash.user.id,req.stash.user.name,+new Date(),data].join('|');
		      var postjson = {pid:pid,uid:req.stash.user.id,thing:req.stash.user.name,time:+new Date(),data:data};

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
				 rpub.publish('pubsub:'+req.stash.user.id,JSON.stringify(postjson) );
			});
	              });
	            });
               }
            });
         }
      });


});

/* duplicate functionality for dev */
app.all('/fweet/for/:thing', function(req,res) {
   var thing = req.param('thing','');
   if (thing.length <= 0 | typeof(thing.length)=== undefined ) { msg = Res500; msg.error = { how: "thing name mandatory!", error: "missing field"}; return res.send(msg); }
   var username = thing;
   var password = "";
      // Find or create Thing
      r.get('thing:' + thing + ':id',function(err,val){
         if (err) {
	    msg = Res500; msg.error = { how: "failed to find thing: "+thing, error: err}; return res.send(msg);
         } else if (val) {
	    // Thing is valid!
	    req.stash.user = {};
	    req.stash.user.name = thing; req.stash.user.id = val;
	    r.incr("global:nextPostId",function(err,pid) {

	    var data = JSON.stringify(extend(req.body,req.query));
	    if (req.param('key') !== undefined) {
		    var key = req.param('key');
		    data.key = undefined;
	    }

	      var post = [Post.currentVersion,pid,req.stash.user.id,req.stash.user.name,+new Date(),data].join('|');
	      var postjson = {pid:pid,uid:req.stash.user.id,thing:req.stash.user.name,time:+new Date(),data:data};
	
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
			 rpub.publish('pubsub:'+req.stash.user.id,JSON.stringify(postjson) );

		 });
	      });
	   });

         } else {
            User.register(thing,password,function(err,user,session) {
               if (err) {
		  msg = Res500; msg.error = err; return res.send(msg);
               } else {
                  req.stash.user = user;
                  // Use new Thing
		      r.incr("global:nextPostId",function(err,pid) {

		      var data = JSON.stringify(extend(req.body,req.query));
		      if (req.param('key') !== undefined) {
			    var key = req.param('key');
			    data.key = undefined;
	 	      }

		      var post = [Post.currentVersion,pid,req.stash.user.id,req.stash.user.name,+new Date(),data].join('|');
		      var postjson = {pid:pid,uid:req.stash.user.id,thing:req.stash.user.name,time:+new Date(),data:data};
		
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
				 rpub.publish('pubsub:'+req.stash.user.id,JSON.stringify(postjson) );
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
		msg = Res500; msg.error = "no data"; return res.send(msg); }
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
      if (err || !uid > 0) { msg = Res500; msg.error = 'bad request'; return res.send(msg); }
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


app.get('/listen/to/:thing', function(req,res) {
   r.get("thing:"+req.param('thing','')+":id",function(err,uid) {
      if (err || !uid > 0) { msg = Res500; msg.error = 'bad request'; return res.send(msg); }
      else {
	      req.stash.uid = uid;
	      req.stash.thing = req.param('thing','');
	
		var THING_PREFIX = 'pubsub:'+uid;
	        // r.set(THING_PREFIX);
		rsub.subscribe(THING_PREFIX);
	
		res.writeHead(200, {
		        'Content-Type': 'application/json'
		        , 'Transfer-Encoding': 'chunked'
		        , 'Access-Control-Allow-Origin': '*'
                        , 'Access-Control-Allow-Methods': 'GET, POST'
                        , 'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'

		});
		rsub.on('message', function (channel, message) {
		    // console.log('\n\n*************\n\nReceived event',channel.replace(THING_PREFIX,''),'\n\n',message,'\n\n**************');
	   	    msg = Res200; msg.data = [message];
                        // Ridicolous sanitizer, needs replacement
                        msg = JSON.stringify(msg).replace(/\\/g, '').replace(/\"{/g, '{').replace(/}\"/,'}').replace(/\"]/g, ']').replace(/\[\"/g, '[');
                        res.write('\n\r'+msg );
		});
      }
   });
});


app.get('/del/all/:thing', function(req,res) {
   r.get("thing:"+req.param('thing','')+":id",function(err,uid) {
      if (err || !uid > 0) { msg = Res500; msg.error = 'bad request'; return res.send(msg); }
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
      if (err || !uid > 0) { msg = Res500; msg.error = 'bad request'; return res.send(msg); }
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
var port = process.env.PORT || 8080;
app.listen(port);
console.log('Ready!');

process.on('SIGINT', function() {
    console.log(' detected!');
    console.log("Terminating...");
	app.close();
        process.exit();
});
