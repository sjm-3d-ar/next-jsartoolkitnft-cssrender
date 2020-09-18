/* eslint-disable no-param-reassign */
import * as THREE from "three";
import { CSS3DRenderer, CSS3DObject } from "./CSS3DRenderer.js";

/**
 * NOTE: this file is derived from `threejs_worker.js`
 * https://github.com/webarkit/jsartoolkitNFT/tree/master/examples
 *
 */

const VIDEO_WIDTH_16 = 16;
const VIDEO_HEIGHT_9 = 9;

function isMobile() {
  return /Android|mobile|iPad|iPhone/i.test(navigator.userAgent);
}

// NOTE: the original value of this was 24, which was very smooth, but slower to track
const interpolationFactor = 4;

const trackedMatrix = {
  // for interpolation
  delta: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  interpolated: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const setMatrix = (matrix, valuesObj) => {
  const array = [];

  // convert the incoming object literal 'valuesObj', to an array
  Object.keys(valuesObj).forEach(key => {
    array[key] = valuesObj[key];
  });

  if (typeof matrix.elements.set === "function") {
    matrix.elements.set(array);
  } else {
    matrix.elements = [].slice.call(array);
  }
};

const setupScene = (renderer, scene, camera, root, campaignVideoEl, cameraCanvasEl) => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  cameraCanvasEl.appendChild(renderer.domElement);

  camera.matrixAutoUpdate = false;
  scene.add(camera);

  scene.add(root);
  root.matrixAutoUpdate = false;

  const div = document.createElement("div");
  div.style.width = "480px";
  div.style.height = "360px";
  div.style.backgroundColor = "green";
  div.style.border = "solid red 5px";
  div.style.visibility = "hidden";

  const button = document.createElement("button");
  button.style.width = "180px";
  button.style.height = "60px";
  button.style.backgroundColor = "yellow";
  button.textContent = "Click me.";
  button.addEventListener("click", () => alert("clicked!"));
  div.appendChild(button);

  const object = new CSS3DObject(div);
  object.name = "videoPlane";
  // object.position.set(x, y, z);

  root.visible = false;
  root.add(object);
};

function setObjectPositionAndScale(scene, imageData) {
  return;

  const videoPlane = scene.getObjectByName("videoPlane");

  const imageHeightMM = (imageData.height / imageData.dpi) * 2.54 * 10;
  const imageWidthMM = (imageData.width / imageData.dpi) * 2.54 * 10;

  // const videoScale = Math.floor(imageWidthMM / videoPlane.geometry.parameters.width);
  // const videoScale = Math.floor(imageWidthMM / videoPlane.geometry.parameters.width);

  videoPlane.position.y = imageHeightMM / 2.0;
  videoPlane.position.x = imageWidthMM / 2.0;

  // videoPlane.scale.set(videoScale, videoScale, 1);
  videoPlane.visible = true;
}

let isFound = false;

function startTracking(
  nftDescriptorsName,
  cameraVideoEl,
  cameraCanvasEl,
  campaignVideoEl,
  handleLoadingEnded,
) {
  let vw;
  let vh;
  let sw;
  let sh;
  let pScale;
  let sScale;
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

  const renderer = new CSS3DRenderer({});
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const root = new THREE.Object3D();

  setupScene(renderer, scene, camera, root, campaignVideoEl, cameraCanvasEl);

  function found(msg) {
    world = msg ? JSON.parse(msg.matrixGL_RH) : null;
  }

  const playVideo = () => {
    campaignVideoEl.play();
  };

  const pauseVideo = () => {
    campaignVideoEl.pause();
  };

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
    sScale = isMobile() ? window.outerWidth / cameraVideoEl.videoWidth : 1;

    sw = vw * sScale;
    sh = vh * sScale;

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

    renderer.setSize(sw, sh);

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
          setMatrix(camera.projectionMatrix, proj);
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
          setObjectPositionAndScale(scene, imageData);
          break;
        }

        case "found": {
          if (!isFound) {
            playVideo();
            isFound = true;
          }

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

  function draw() {
    const videoPlane = scene.getObjectByName("videoPlane");

    if (!world) {
      root.visible = false;
      videoPlane.element.style.visibility = "hidden";
    } else {
      root.visible = true;
      videoPlane.element.style.visibility = "visible";

      // interpolate matrix
      for (let i = 0; i < 16; i += 1) {
        trackedMatrix.delta[i] = world[i] - trackedMatrix.interpolated[i];
        trackedMatrix.interpolated[i] += trackedMatrix.delta[i] / interpolationFactor;
      }

      // set matrix of 'root' by detected 'world' matrix
      setMatrix(root.matrix, trackedMatrix.interpolated);
    }
    renderer.render(scene, camera);
  }

  function tick() {
    draw();
    requestAnimationFrame(tick);
  }

  load();
  tick();
  process();
}

export { startTracking };
