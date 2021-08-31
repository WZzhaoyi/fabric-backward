# fabric-backward
Server side generates pictures according to fabric JSON and relies on puppeteer(headless browser) to achieve consistent display between the front and backward.

服务端根据 fabric JSON 生成图片，依赖puppeteer(headless browser)实现前后端显示效果一致

## Installation
Node version >= 12
```
npm install
```

## Start

```
npm run dev
```

## Usage
### Get JSON from fabric.js
[Fabric.js Doc](https://http://fabricjs.com/docs/)
```
var json = canvas.toJSON();
```

### Post JSON to server
```
var axios = require('axios');
var data = JSON.stringify({
  "mydata": json // your fabric json
});

var config = {
  method: 'post',
  url: 'localhost:44533/process',
  headers: { 
    'Content-Type': 'application/json'
  },
  responseType: 'blob',
  data : data
};

axios(config)
.then(function (response) {
  var blob = res.data
  var src = window.URL.createObjectURL(blob)
  window.open(src)
})
.catch(function (error) {
  console.log(error);
});
```
