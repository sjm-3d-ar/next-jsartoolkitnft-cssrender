/* eslint-disable no-param-reassign */

/**
 * NOTE: this file is derived from `threejs_worker.js`
 * https://github.com/webarkit/jsartoolkitNFT/tree/master/examples
 *
 */

// NOTE: the original value of this was 24, which was very smooth, but slower to track
const interpolationFactor = 4;

const trackedMatrix = {
  // for interpolation
  delta: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  interpolated: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const setMatrix = matrixObj => {
  const array = [];

  // convert the incoming object literal 'matrixObj', to an array
  Object.keys(matrixObj).forEach(key => {
    array[key] = matrixObj[key];
  });

  // console.log("matrix array:", array.join(", "));

  // TODO assign matrix array to HTML element matrix3d()
  const el = document.querySelector("#trackingHTML");

  // NOTE: need to have parent set 'perspective' I think for translateZ to have an effect
  el.style.transform = `translateZ(-400px) matrix3d(${array.join(", ")})`;
};

const setupScene = displayEl => {
  console.log("window.innerHeight:", window.innerHeight);
  console.log("window.innerWidth:", window.innerWidth);

  const div = document.createElement("div");
  div.id = "trackingHTML";
  div.style.width = "927px";
  div.style.height = "586px";
  div.style.backgroundColor = "green";
  div.style.border = "solid red 5px";
  // div.style.visibility = "hidden";

  const button = document.createElement("button");
  button.style.width = "180px";
  button.style.height = "60px";
  button.style.backgroundColor = "yellow";
  button.style.display = "block";
  button.textContent = "Click me.";
  button.addEventListener("click", () => alert("clicked!"));
  div.appendChild(button);

  const video = document.createElement("video");
  video.style.width = "80%";
  video.style.height = "80%";
  video.autoplay = true;
  video.loop = true;
  video.crossOrigin = "anonymous";
  video.src = "https://avo-content-dev.s3.amazonaws.com/videos/bg_1588085276090.mp4";
  video.controls = true;
  div.appendChild(video);

  displayEl.appendChild(div);
};

function setObjectPositionAndScale(imageData) {
  console.log("imageData.height:", imageData.height);
  console.log("imageData.width:", imageData.width);
}

let isFound = false;

function startTracking(
  nftDescriptorsName,
  cameraVideoEl,
  displayEl,
  campaignVideoEl,
  handleLoadingEnded,
) {
  let vw;
  let vh;
  let pScale;
  let w;
  let h;
  let pw;
  let ph;
  let ox;
  let oy;
  let world;
  let worker;

  // create scratch canvas & context, used to capture a frame from the camera stream
  // and find the tracking image in the frame
  const scratchCanvasFrame = document.createElement("canvas");
  const scratchContextFrame = scratchCanvasFrame.getContext("2d");

  setupScene(displayEl);

  function found(msg) {
    world = msg ? JSON.parse(msg.matrixGL_RH) : null;
  }

  const playVideo = () => {
    campaignVideoEl.play();
  };

  const pauseVideo = () => {
    campaignVideoEl.pause();
  };

  function draw() {
    if (!world) {
      // videoPlane.element.style.visibility = "hidden";
    } else {
      // videoPlane.element.style.visibility = "visible";

      // interpolate matrix
      for (let i = 0; i < 16; i += 1) {
        trackedMatrix.delta[i] = world[i] - trackedMatrix.interpolated[i];
        trackedMatrix.interpolated[i] += trackedMatrix.delta[i] / interpolationFactor;
      }

      // set matrix of 'root' by detected 'world' matrix
      setMatrix(trackedMatrix.interpolated);
    }
  }

  function process() {
    // copy the camera frame to the scratch context
    scratchContextFrame.fillStyle = "black";
    scratchContextFrame.fillRect(0, 0, pw, ph);
    scratchContextFrame.drawImage(cameraVideoEl, 0, 0, vw, vh, ox, oy, w, h);

    // process the frame (look for image in the frame)
    const imageData = scratchContextFrame.getImageData(0, 0, pw, ph);
    worker.postMessage({ type: "process", imagedata: imageData }, [
      imageData.data.buffer,
    ]);
  }

  function load() {
    vw = cameraVideoEl.videoWidth;
    vh = cameraVideoEl.videoHeight;

    pScale = 320 / Math.max(vw, (vh / 3) * 4);

    w = vw * pScale;
    h = vh * pScale;
    pw = Math.max(w, (h / 3) * 4);
    ph = Math.max(h, (w / 4) * 3);
    ox = (pw - w) / 2;
    oy = (ph - h) / 2;
    scratchCanvasFrame.style.clientWidth = `${pw}px`;
    scratchCanvasFrame.style.clientHeight = `${ph}px`;
    scratchCanvasFrame.width = pw;
    scratchCanvasFrame.height = ph;

    worker = new Worker("libs/artoolkitNFT/artoolkitNFT.worker.js");

    worker.postMessage({
      type: "load",
      pw,
      ph,
      camera_para: "Data/camera_para.dat",
      marker: nftDescriptorsName,
    });

    worker.onmessage = ev => {
      const msg = ev.data;
      switch (msg.type) {
        case "loaded": {
          const proj = JSON.parse(msg.proj);
          const ratioW = pw / w;
          const ratioH = ph / h;
          proj[0] *= ratioW;
          proj[4] *= ratioW;
          proj[8] *= ratioW;
          proj[12] *= ratioW;
          proj[1] *= ratioH;
          proj[5] *= ratioH;
          proj[9] *= ratioH;
          proj[13] *= ratioH;
          setMatrix(proj);
          break;
        }

        case "endLoading": {
          if (msg.end === true && handleLoadingEnded) {
            handleLoadingEnded();
          }
          break;
        }

        case "nftData": {
          const nft = JSON.parse(msg.nft);
          const imageData = {
            dpi: nft.dpi,
            width: nft.width,
            height: nft.height,
          };
          setObjectPositionAndScale(imageData);
          break;
        }

        case "found": {
          if (!isFound) {
            playVideo();
            isFound = true;
          }
          draw();

          found(msg);
          break;
        }

        case "not found": {
          if (isFound) {
            pauseVideo();
            isFound = false;
          }

          found(null);
          break;
        }

        default:
          break;
      }

      process();
    };
  }

  load();
  process();
}

export { startTracking };
