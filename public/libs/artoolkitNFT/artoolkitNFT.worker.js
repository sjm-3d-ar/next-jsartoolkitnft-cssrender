var next = null;
var ar = null;
var markerResult = null;

self.onmessage = function (e) {
  var msg = e.data;
  switch (msg.type) {
    case 'load': {
      load(msg);
      return;
    }
    case 'process': {
      next = msg.imagedata;
      process();
      return;
    }
  }
};

function load (msg) {
  importScripts('artoolkitNFT_wasm.js');

  self.addEventListener('artoolkitNFT-loaded', function () {
    var onLoad = function () {
      ar = new ARControllerNFT(msg.pw, msg.ph, param);
      var cameraMatrix = ar.getCameraMatrix();

      ar.addEventListener('getNFTMarker', function (ev) {
        markerResult = {type: "found", matrixGL_RH: JSON.stringify(ev.data.matrixGL_RH), proj: JSON.stringify(cameraMatrix)};
      });

      ar.loadNFTMarker(msg.marker, function (nft) {
        // to get w, h, dpi from loaded image, can read from nft here
        // and post nftData, getNFTData messages here to pass those to videoPlane
        postMessage({type: "nftData", nft: JSON.stringify(nft)});
        
        ar.trackNFTMarkerId(nft.id);
        console.log("loadNFTMarker -> ", nft.id);
        console.log("nftMarker struct: ", nft);
        postMessage({ type: 'endLoading', end: true }),
          function (err) {
          console.error('Error in loading marker on Worker', err);
        };
      });

      postMessage({ type: 'loaded', proj: JSON.stringify(cameraMatrix) });
    };

    var onError = function (error) {
      console.error(error);
    };

    // we cannot pass the entire ARControllerNFT, so we re-create one inside the Worker, starting from camera_param
    var param = new ARCameraParamNFT(msg.camera_para, onLoad, onError);
  });

}

function process () {
  markerResult = null;

  if (ar && ar.process) {
    ar.process(next);
  }

  if (markerResult) {
    postMessage(markerResult);
  } else {
    postMessage({type: 'not found'});
  }

  next = null;
}
