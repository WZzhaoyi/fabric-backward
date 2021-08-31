var canvas = null;

// =======================================================
// FUNCTIONS LIBRARY
// =======================================================
var fabFunctions = {

  // -------------------------------------------------------
  // INIT function
  // -------------------------------------------------------	
  init: function () {

    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.padding = 5;

    // --------------------------------------
    // RESTORE FABRIC CANVAS LAYER
    // --------------------------------------
    fabric.Object.prototype.getZIndex = function() {
      return this.canvas.getObjects().indexOf(this);
    }
    fabric.Canvas.prototype.moveToLayer = function(object,position) {
      while(object.getZIndex() > position) {
          this.sendBackwards(object);
      }
    }

    // --------------------------------------
    // INITIALIZE FABRIC CANVAS
    // --------------------------------------
    canvas = window.__canvas = new fabric.Canvas('surface');

  },

  // -------------------------------------------------------
  // PREPARE OBJECTS function
  // Read the project from indata input text, create objects 
  // in canvas
  // -------------------------------------------------------
  prepareObjects: function (wW, wH, indata) {
    return new Promise((resolve, reject) => {
      var startDate = new Date()
      canvas.setWidth(wW);
      canvas.setHeight(wH);
      canvas.setBackgroundColor('rgba(255, 255, 255, 1)');

      var timer = setTimeout(() => {
        clearTimeout(timer)
        timer = null
        reject('render error 4s')
      }, 4000)
      canvas.loadFromJSON(indata, () => {
        clearTimeout(timer)
        timer = null
        // restore z-index!!
        canvas._objects.map(object => {
          canvas.moveToLayer(object, object['z-index'])
        })
        canvas.renderAll.bind(canvas)();
        console.log(`loaded ${(new Date())-startDate}ms`)
        resolve()
      });
    })
  },

  // -------------------------------------------------------
  // DOJOB function
  // Assign the frame to the outdata input text
  // -------------------------------------------------------
  doJob: function () {
    return canvas.toDataURL({ format: 'png' });
  },
};
