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
var data = JSON.stringify({ 'mydata': json })

var xhr = new XMLHttpRequest()
xhr.withCredentials = true
xhr.responseType = 'blob'

xhr.addEventListener('readystatechange', function() {
  if (this.readyState === 4) {
    const blob = this.response
    const src = window.URL.createObjectURL(blob)
    window.open(src)
  }
})

xhr.open('POST', 'http://localhost:44533/process')
xhr.setRequestHeader('Content-Type', 'application/json')

xhr.send(data)
```
