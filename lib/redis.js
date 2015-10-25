if (typeof GLOBAL._REDISURL !== 'undefined') {
	        console.log('Using Remote Redis');
	        var rtg   = require("url").parse(GLOBAL._REDISURL);

                var rAuth = function(r) { r.auth(rtg.auth.split(":")[1]); }

                var r = require("redis").createClient(rtg.port, rtg.hostname);
                r.addListener('connected', function(){ r.auth(rtg.auth.split(":")[1]); } );
                r.addListener('reconnected', function(){ r.auth(rtg.auth.split(":")[1]); } );
                rAuth(r);

                var rpub = require("redis").createClient(rtg.port, rtg.hostname);
                rpub.addListener('connected', function(){ rpub.auth(rtg.auth.split(":")[1]); } );
                rpub.addListener('reconnected', function(){ rpub.auth(rtg.auth.split(":")[1]); } );
                rAuth(rpub);

                var rsub = require("redis").createClient(rtg.port, rtg.hostname);
                rsub.addListener('connected', function(){ rsub.auth(rtg.auth.split(":")[1]); } );
                rsub.addListener('reconnected', function(){ rsub.auth(rtg.auth.split(":")[1]); } );
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
