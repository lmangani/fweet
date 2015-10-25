if (typeof GLOBAL._REDISURL !== 'undefined') {
	        console.log('Using Remote Redis');
	        var rtg   = require("url").parse(GLOBAL._REDISURL);

	        var r = require("redis").createClient(rtg.port, rtg.hostname);
		r.addListener('connected', rAuth(r) );
		r.addListener('reconnected', rAuth(r) );
		rAuth(r);

	        var rpub = require("redis").createClient(rtg.port, rtg.hostname);
		rpub.addListener('connected', rAuth(rpub) );
		rpub.addListener('reconnected', rAuth(rpub) );
		rAuth(rpub);

	        var rsub = require("redis").createClient(rtg.port, rtg.hostname);
		rsub.addListener('connected', rAuth(rsub) );
		rsub.addListener('reconnected', rAuth(rsub) );
		rAuth(rsub);




} else {
	        console.log('Using Local Redis');
	        var r = require("redis").createClient();
	        var rpub = require("redis").createClient();
	        var rsub = require("redis").createClient();
}

GLOBAL._REDISCLIENT = r;
GLOBAL._REDISCLIENTPUB = rpub;
GLOBAL._REDISCLIENTSUB = rsub;
return;
