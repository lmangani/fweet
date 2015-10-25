![travis](https://travis-ci.org/lmangani/fweet.svg?branch=master)

# <img src="http://i.imgur.com/HF1daBu.gif" height="100"><img src="http://i.imgur.com/czjXDLf.png">

#### fWeet is a simple dweet-like clone using node.js and redis 
Status: _(early/alpha/unstable)_

Easily send and receive data from your _"things"_ (IOT) by interacting with fWeet JSON API 

<br/>

##### To fweet from your thing:
```
$ curl -X GET -u qxip:qxip http://localhost:8080/post/qxip?status=set+status
{   "status":"success",
    "data": [{ uid: 7, id: 1 }]
}
```

```
$ curl -X POST -d 'status={"temp": 99}' -u qxip:qxip http://localhost:8080/post/qxip
{   "status":"success",
    "data": [{ uid: 7, id: 2 }]
}
```

##### To read the latest fweet for a thing:
```
$ curl -X GET -u qxip:qxip http://localhost:8080/get/latest/qxip
{   "status":"success",
    "data":[
        {   "id":1,
            "uid":1,
            "thing":"qxip",
            "status":"set status",
            "time":1445640694522,
            "version":1
        }]
}
```

##### To read all fweets for a thing:
```
$ curl -X GET -u qxip:qxip http://localhost:8080/get/qxip
{   "status":"success",
    "data":[
        {   "id":1,
            "uid":7,
            "thing":"qxip",
            "status":"set status",
            "time":1445640694522,
            "version":1},
        {   "id":2,
            "uid":7,
            "thing":"qxip",
            "status":{"temp": 99},
            "time":1445640694689,
            "version":1
        }]
}
```

### Setup:
```
$ npm install
$ npm test
$ npm start
```

### API Calls:
```
    POST    /post/:thing            Create a post for a Thing
    GET     /get/latest/:thing      Read the latest post from a Thing
    GET     /get/:thing             Read all the available posts from a Thing
    GET     /get/timeline           Read all the available posts from a All the Things
    GET     /del/oldest/:thing      Delete oldest posts from a Thing (careful!)
    GET     /del/all/:thing         Delete all posts from a Thing (careful!)

```

### To-Do:

* lots of stuff


### Notice

The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. in no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.

Any third-party trademarks, brands, names, service marks and logos are the property of their respective owners. 
