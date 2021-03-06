![travis](https://travis-ci.org/lmangani/fweet.svg?branch=master)
<br>

# <img src="http://i.imgur.com/HF1daBu.gif" height="100"><img src="http://i.imgur.com/czjXDLf.png">



#### fWeet is a simple dweet-like application using node.js and redis 
Status: _(early/alpha/unstable)_

Easily send and receive data from your _"things"_ (IOT) by interacting with fWeet JSON API 


<br/>


<img src="http://i.imgur.com/PXjXiRV.gif" width="50"><img src="http://i.imgur.com/EX3cr4z.gif" width="50"><img src="http://i.imgur.com/UWjVcZW.gif" width="50"><img src="http://i.imgur.com/8sCQNt2.png" width="50">

### Get Started:

Install fweet using npm. Requires a local or remote redis-server as backend.

#### Setup:
```
$ npm install
$ npm test
$ npm start
```

#### Quick Example:
Play with the [online demo](https://lmangani.github.io/fweet/) or check out a barebone example dashboard using data feeds from fweet built with [https://freeboard.io/](https://freeboard.io/board/T0R2h2)

Test by sending commands with geo values _(or anything else!)_ to our public demo:
```
$ curl -XPOST -H "Content-Type: application/json" 'http://fweet.herokuapp.com/post/qxip' -d '{
    "user": "me",
    "post_date": "2015-10-25T23:58:45.690Z",
    "message": "trying out fweet",
    "geo_lat": 52.786118,
    "geo_lon": 4.311661,
    "value": 100
  }'
  
$ curl -XPOST -H "Content-Type: application/json" 'http://fweet.herokuapp.com/post/qxip' -d '{
    "user": "me",
    "post_date": "2015-10-25T23:58:52.490Z",
    "message": "changing location",
    "geo_lat": 40.716118,
    "geo_lon": -75.011661,
    "value": 80
  }'
```
<img src="http://i.imgur.com/xAFtFvk.png?1" />

### API Calls:
```
    POST    /post/:thing            Create a post for a Thing
    GET     /get/latest/:thing      Read the latest post from a Thing
    GET     /get/:thing             Read all the available posts from a Thing
    GET     /get/timeline           Read all the available posts from a All the Things
    GET     /listen/to/:thing       Subscribe to live posts from a Thing  
    GET     /del/oldest/:thing      Delete oldest posts from a Thing (careful!)
    GET     /del/all/:thing         Delete all posts from a Thing (careful!)

```

#### CURL Examples:

##### send a fweet from your thing:
<pre>
$ curl -X GET -u qxip:qxip http://localhost:8080/post/qxip?<b>status=set+status</b>
</pre>

##### send a fweet with JSON body and/or parameters:
<pre>
$ curl -XPOST -H "Content-Type: application/json" \
'http://localhost:8080/post/qxip?<b>status=ok</b>' -d '
{ 
  <b>"temp": 99, </b>
  <b>"value": 100 </b>
}' 
</pre>

--------------

##### get the latest fweet for a thing:
```
$ curl -X GET -u qxip:qxip http://localhost:8080/get/latest/qxip
```
```
{   "status":"success",
    "data":[
        {   "id":2,
            "uid":7,
            "thing":"qxip",
            "status": { "temp": 99, "value": 100, "text": "message" },
            "time":1445640694689,
            "version":1
        }]
}
```
--------------

##### get all fweets for a thing:
```
$ curl -X GET -u qxip:qxip http://localhost:8080/get/qxip
```
```
{   "status":"success",
    "data":[
        {   "id":1,
            "uid":7,
            "thing":"qxip",
            "status": "set status",
            "time":1445640694522,
            "version":1},
        {   "id":2,
            "uid":7,
            "thing":"qxip",
            "status": { "temp": 99, "value": 100, "text": "message" },
            "time":1445640694689,
            "version":1
        }]
}
```
--------------

##### To subscribe to realtime fweets for a thing:
```
$ curl --raw -u qxip:qxip http://localhost:8080/listen/to/qxip
```
```
{
   "status": "success",
   "data": "{"pid":61,"uid":7,"thing":"qxip","time":1445783849758,"status":"realtime"}"
}

{
   "status": "success",
   "data": "{"pid":62,"uid":7,"thing":"qxip","time":1445783852492,"status":"message"}"
}
```
--------------

### To-Do:

* Auth Tokens
* .. lots of stuff


### Notice
<i>
The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. in no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.

Any third-party trademarks, brands, names, service marks and logos are the property of their respective owners.
</i>
