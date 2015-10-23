# ![fWeet](http://i.imgur.com/czjXDLf.png)

fWeet is a simple dweet-like clone for node.js and redis (early/alpha/unstable)

## API Calls:
```
    POST    /post/:thing            Create a post for a Thing
    GET     /get/latest/:thing      Read the latest post from a Thing
    GET     /get/:thing             Read all the available posts from a Thing
    GET     /get/timeline           Read all the available posts from a All the Things
```

## Examples:
```
curl -X POST -d "status=testing" -u qxip:qxip http://localhost/post/qxip
{"status":"success","data":"[{ id: 1 }]"}
curl -X POST -d "status=testing+more" -u qxip:qxip http://localhost/post/qxip
{"status":"success","data":"[{ id: 2 }]"}
```

```
curl -X GET -u qxip:qxip http://localhost/get/qxip
{"status":"success","data":[{"id":"1","uid":"7","thing":"qxip","status":"testing","time":"1445640694522","version":"1"},{"id":"2","uid":"7","thing":"qxip","status":"testing more","time":"1445640694689","version":"1"}]}
```
