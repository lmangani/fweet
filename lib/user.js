var r = GLOBAL._REDISCLIENT;
var Util = require('./util.js');
var Post = require('./post.js');

function User(id,name) {
   this.id = id || -1;
   this.name = name;
}

User.prototype.isLoggedIn = function() {
   return this.id > 0;
}

User.prototype.getPosts = function(start,count,callback) {
   User.getPosts(this.id,start,count,callback);
}

User.register = function(thing, password, callback) {
   r.incr("global:nextUserId",function(err,userId) {
      if (err) callback(err);
      var authsecret = Util.getrand();
      r.multi()
         .set("thing:"+thing+":id",userId)
         .set("uid:"+userId+":thing",thing)
         .set("uid:"+userId+":password",password)
         .set("uid:"+userId+":auth",authsecret)
         .set("auth:"+authsecret,userId)
         .sadd("global:users",userId)
         .exec(function(err,replies) {
            if (err) callback(err);
            callback(undefined, new User(userId,thing), authsecret);
         });
   });
}

User.getPosts = function(uid, start, count, callback) {
   var key = uid == -1 ? 'global:timeline' : 'uid:' + uid + ':posts';
   var multiAction = r.multi();
   r.lrange(key, start, start+count, function(err,pids){
      if (err) return callback(err);
      r.mget(pids.map(function(pid){return 'post:'+pid}),function(err,rawPosts) {
         if (err) return callback(err);
         var posts = rawPosts.map(function(postString){return Post.fromString(postString)});
         return callback(undefined, posts);
      });
   });
}

User.delPosts = function(uid, start, count, callback) {
   var key = uid == -1 ? 'global:timeline' : 'uid:' + uid + ':posts';
   var multiAction = r.multi();
   r.lrange(key, start, start+count, function(err,pids){
      if (err) return callback(err);
      r.mget(pids.map(function(pid){return 'post:'+pid}),function(err,rawPosts) {
         if (err) return callback(err);
         var posts = rawPosts.map(function(postString){return Post.fromString(postString)});
         return callback(undefined, posts);
      });
   });
   r.ltrim(key, start, start+count, function(err,pids){
      if (err) return callback(err);
   });
}

User.fromSession = function(sessionId,callback) {
   r.get('auth:'+sessionId,function(err,uid) {
      if (err) return callback(err);
      if (uid) {
         r.multi()
            .get('uid:' + uid + ':auth')
            .get('uid:' + uid + ':thing')
            .exec(function(err,replies) {
               if (err) return callback(err);
               if (replies[0] == sessionId) {
                  callback(undefined, new User(uid,replies[1]));
               } else {
                  callback(undefined, new User());
               }
         });
      } else {
         callback(undefined, new User());
      }
   });
}

// Token Funcs
var TOKEN_LENGTH = 32;

User.createToken = function(callback) {
    crypto.randomBytes(TOKEN_LENGTH, function(ex, token) {
        if (ex) callback(ex);
 
        if (token) callback(null, token.toString('hex'));
        else callback(new Error('Problem when generating token'));
    });
};

User.setTokenWithData = function(token, data, ttl, callback) {
    if (token == null) throw new Error('Token is null');
    if (data != null && typeof data !== 'object') throw new Error('data is not an Object');
 
    var userData = data || {};
    userData._ts = new Date();
 
    var timeToLive = ttl || auth.TIME_TO_LIVE;
    if (timeToLive != null && typeof timeToLive !== 'number') throw new Error('TimeToLive is not a Number');
 
    redisClient.set(token, JSON.stringify(userData), function(err, reply) {
        if (err) callback(err);
 
        if (reply) {
            redisClient.expire(token, timeToLive, function(err, reply) {
                if (err) callback(err);
 
                if (reply) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Expiration not set on redis'));
                }
            });
        }
        else {
            callback(new Error('Token not set in redis'));
        }
    });
 
};

User.verifyToken = function(req, res, next) {
    var headers = req.headers;
    if (headers == null) return res.send(401);
 
    // Get token
    try {
        var token = tokenHelper.extractTokenFromHeader(headers);
    } catch (err) {
        console.log(err);
        return res.send(401);
    }
 
    //Verify it in redis, set data in req._user
    redisHelper.getDataByToken(token, function(err, data) {
        if (err) return res.send(401);
 
        req._user = data;
 
        next();
    });
};

User.extractTokenFromHeader = function(headers) {
    if (headers == null) throw new Error('Header is null');
    if (headers.authorization == null) throw new Error('Authorization header is null');
 
    var authorization = headers.authorization;
    var authArr = authorization.split(' ');
    if (authArr.length != 2) throw new Error('Authorization header value is not of length 2');
 
    // retrieve token
    var token = authArr[1];
    if (token.length != TOKEN_LENGTH * 2) throw new Error('Token length is not the expected one');
 
    return token;
};
 
User.getDataByToken = function(token, callback) {
    if (token == null) callback(new Error('Token is null'));
 
    r.get(token, function(err, userData) {
        if (err) callback(err);
 
        if (userData != null) callback(null, JSON.parse(userData));
        else callback(new Error('Token Not Found'));
    });
};

User.expireToken = function(headers, callback) {
    if (headers == null) callback(new Error('Headers are null'));
    // Get token
    try {
        var token = tokenHelper.extractTokenFromHeader(headers);
 
        if (token == null) callback(new Error('Token is null'));
 
        redisHelper.expireToken(token, callback);
    } catch (err) {
        console.log(err);
        return callback(err);
    }
}

module.exports = User;
