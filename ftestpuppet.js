// HTTP Modules for download image
require("http").globalAgent.maxSockets = Infinity;
var request = require('request').defaults({ encoding: null });

// Modules & server references
var express = require('express');
var ftestpuppet = express(),
  server = require('http').createServer(ftestpuppet),
  io = require('socket.io').listen(server),
  fs = require('fs');

// PUPPETEER reference
const puppeteer = require('puppeteer');

// initialize body-parser to parse incoming parameters requests to req.body
var bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
ftestpuppet.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
ftestpuppet.use(bodyParser.json())

// static folder to serve all files to all pages  
ftestpuppet.use(express.static(__dirname + '/libs'));

// CORS
var cors = require('cors');
ftestpuppet.options('*', cors());

// Path reference
var path = require('path');

// Accept all connection origins
io.set('origins', '*:*');

// Listening on port 
const port = 44533
server.listen(port);

// init puppeteer headless browser
const MAX_WSE = 4;  // number of browser
let WSE_LIST = [];
initPuppeteer();

// ------------------------------------------------------------
// HTTP ROUTES
// ------------------------------------------------------------
// Send testJson.html page to client
ftestpuppet.get('/', function (req, res) {
  res.sendFile(__dirname + '/testJson.html');
});

// Send template.html to Chromium (Puppeteer)
ftestpuppet.get('/template', function (req, res) {
  res.sendFile(__dirname + '/template.html');
});

// Client request: /process
ftestpuppet.post('/process', function (req, res) {

  // the json project sent by client
  var data = req.body.mydata;
  var startDate = new Date()
  console.log('>> Get JSON data!', startDate);

  // canvas dimensions
  var wantedW = 'width' in data ? data.width : 1920;
  var wantedH = 'height' in data ? data.height : 1080;

  // the folder where to write the PNG file
  var folder = 'pngs';

  // Start the job with puppeteer
  (async () => {

    const isNodeConvert = true
    let projectData = data

    if (isNodeConvert) {
      projectData = JSON.stringify(await filterJSON(projectData))
      var to64Date = new Date()
      console.log('>> img has been converted to base64!', `duration: ${to64Date - startDate}ms`);
    }

    // Choose a browser randomly
    var rdn = Math.floor(Math.random() * MAX_WSE);
    let browserWSEndpoint = WSE_LIST[rdn];
    const browser = await puppeteer.connect({ browserWSEndpoint, defaultViewport: null });
    const page = await browser.newPage();

    // Output log in browser page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    const cw = wantedW; // canvas width
    const ch = wantedH; // canvas height

    try {

      // Opens the template.html page in chromium
      await page.goto(`http://localhost:${port}/template`);

      let dataFrame = await page.evaluate(async (projectData, cw, ch, isNodeConvert) => {

        if (!isNodeConvert) projectData = await filterJSON(projectData)
        // prepareProcess() script function is in template.html page
        await prepareProcess(cw, ch, projectData);
        // doJob() script function is in template.html and returns the encoded PNG in dataFrame
        return doJob();
      }, projectData, cw, ch, isNodeConvert)

      var initDate = new Date()
      console.log('>> canvas data has been created!', `duration: ${initDate - startDate}ms`);

      // Creates the PNG from dataFrame
      dataFrame = dataFrame.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
      var createdDate = new Date()
      console.log('>> png data has been generated!', `duration: ${createdDate - startDate}ms`);

      // Return img to client
      var img = Buffer.from(dataFrame, 'base64');
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': img.length
      });

      // Quit client
      res.end(img);

    } catch (err) {

      res.end();
      console.log('ERR:', err.message);

    } finally {

      await page.close();

    }

  })();

});

// ------------------------------------------------------------
// Creates user folder if needed
// ------------------------------------------------------------
function createFolder(path, mask, cb) {
  if (typeof mask == 'function') { // allow the `mask` parameter to be optional
    cb = mask;
    mask = 0777;
  }
  fs.mkdir(path, mask, function (err) {
    if (err) {
      if (err.code == 'EEXIST') { cb(null); } // ignore the error if the folder already exists
      else { cb(err); } // something else went wrong
    } else { cb(null); } // successfully created folder
  });
}

// ------------------------------------------------------------
// Deletes all files from user folder if any
// ------------------------------------------------------------
function extension(element) {
  var extName = path.extname(element);
  return extName === '.png';
};

function cleanFolder(user) {
  fs.readdir(__dirname + '/' + user, function (err, files) {
    if (err) { console.log('Warning: folder not found'); }
    else {
      //for (const file of files) {
      files.filter(extension).forEach(function (file) {
        fs.unlink(__dirname + '/' + user + '/' + file, function (err) {
          if (err) { console.log('Warning: unable to delete file :' + file); }
        });
      });
      // console.log(`> ${user}folder has been emptied.`);
    }
  });
}

// ------------------------------------------------------------
// init several browser for canvas generated
// ------------------------------------------------------------
function initPuppeteer() {
  (async () => {
    for (var i = 0; i < MAX_WSE; i++) {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--auto-open-devtools-for-tabs',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--no-sandbox',
          '--no-zygote',
          '--disable-web-security',
          '--disable-features=IsolateOrigins',
          '--disable-site-isolation-trials',
          // '--single-process' // not supportable in windows
        ]
      });
      browserWSEndpoint = await browser.wsEndpoint();
      WSE_LIST[i] = browserWSEndpoint;
    }
    console.log('> browser has been created', WSE_LIST);
  })();
}

// ------------------------------------------------------------
// nodeJS url convert to base64 image
// ------------------------------------------------------------
function toDataURL(url) {
  return new Promise((resolve, reject) => {
    request.get(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        data = "data:" + response.headers["content-type"] + ";base64," + Buffer.from(body).toString('base64');
        resolve(data);
      }
      else {
        reject(error)
      }
    });
  })
}

// ------------------------------------------------------------
// move image to the bottom for rendering
// breaking: need z-index in object
// ------------------------------------------------------------
async function filterJSON(json) {
  if (typeof json === 'string') json = JSON.parse(json)
  let objects = json.objects
  let promises = []
  let images = []
  let others = []
  for (let i in objects) {
    let obj = objects[i]
    if (!'z-index' in obj) obj['z-index'] = i
    if (obj.type === 'image' && obj.src.indexOf('http') > -1) {
      let promise = toDataURL(obj.src)
      promises.push(promise)
      images.push(obj)
    }
    else {
      others.push(obj)
    }
  }
  let datas = await Promise.all(promises)
  images.forEach((ele, idx) => {
    ele.src = datas[idx]
  })
  json.objects = [...images, ...others]
  return json
}

// Export this app
module.exports = ftestpuppet;
