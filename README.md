# ![fWeet](http://i.imgur.com/czjXDLf.png)

#### fWeet is a simple dweet-like clone for node.js and redis _(early/alpha/unstable)_

Send and Receive data from your things to fweet by interacting with its simple API.

##### To fweet from your thing:
```
curl -X GET -u qxip:qxip http://localhost/post/qxip?status=set+status
{"status":"success","data":"[{ id: 1 }]"}
```

##### To read the latest fweet for a thing:
```
curl -X GET -u qxip:qxip http://localhost/get/latest/qxip
{"status":"success","data":[{"id":"1","uid":"1","thing":"qxip","status":"set status","time":"1445640694522","version":"1"}]}
```

##### To read all fweets for a thing:
```
curl -X GET -u qxip:qxip http://localhost/get/qxip
{"status":"success","data":[{"id":"1","uid":"7","thing":"qxip","status":"set status","time":"1445640694522","version":"1"},{"id":"2","uid":"7","thing":"qxip","status":"testing more","time":"1445640694689","version":"1"}]}
```

### Requirements:
```
$ npm install express redis
```

## API Calls:
```
    POST    /post/:thing            Create a post for a Thing
    GET     /get/latest/:thing      Read the latest post from a Thing
    GET     /get/:thing             Read all the available posts from a Thing
    GET     /get/timeline           Read all the available posts from a All the Things
```

