function Post(pid,uid,thing,status,time,version) {

   if (isJSON(status)){
	   status = JSON.parse(status);
   }

   this.id       = parseInt(pid);
   this.uid      = parseInt(uid);
   this.thing    = thing;
   this.status   = status;
   this.time     = parseInt(time);
   this.version  = parseInt(version);
}

//[version,pid,uid,thing,time,status].join('|');
Post.fromV1String = function(string) {
   var parts = string.split('|');
   	return new Post(parts[1],parts[2],parts[3],parts[5],parts[4],parts[0]);
}

Post.fromString = function(string) {
   return Post.fromV1String(string) 
}

Post.currentVersion = 1;

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


module.exports = Post;
