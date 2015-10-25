if (typeof GLOBAL._REDISURL !== 'undefined') {
	        console.log('Using Remote Redis');
	        var rtg   = require("url").parse(GLOBAL._REDISURL);
	        var r = require("redis").createClient(rtg.port, rtg.hostname);
	        var rAuth = function() { r.auth(rtg.auth.split(":")[1]); }
		r.addListener('connected', rAuth);
		r.addListener('reconnected', rAuth);
		rAuth();

} else {
	        console.log('Using Local Redis');
	        var r = require("redis").createClient();
}

GLOBAL._REDISCLIENT = r;
return;
