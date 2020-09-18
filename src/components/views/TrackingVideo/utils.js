import { startTracking } from "../../../utils/threeNFT";

const startAR = (
  nftDescriptorsName,
  // NOTE, wanted to receive elements as params instead of refs here, but saw strange behavior
  // when doing so (came in as null, when passing cameraVideoRef.current in)
  // Perhaps need to useCallback / useRef callback instead?
  cameraVideoRef,
  cameraCanvasRef,
  campaignVideoRef,
  handleLoadingEnded,
) => {
  // start camera stream
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    let hint = {
      audio: false,
      video: true,
    };

    if (window && window.innerWidth < 800) {
      const width = window.innerWidth < window.innerHeight ? 240 : 360;
      const height = window.innerWidth < window.innerHeight ? 360 : 240;

      console.log("window WxH:", width, height);

      hint = {
        audio: false,
        video: {
          facingMode: "environment",
          width: { min: width, max: width },
        },
      };

      console.log(hint);
    }

    navigator.mediaDevices.getUserMedia(hint).then(stream => {
      cameraVideoRef.current.srcObject = stream; // eslint-disable-line no-param-reassign

      cameraVideoRef.current.addEventListener("loadedmetadata", () => {
        cameraVideoRef.current.play();

        startTracking(
          nftDescriptorsName,
          cameraVideoRef.current,
          cameraCanvasRef.current,
          campaignVideoRef.current,
          handleLoadingEnded,
        );
      });
    });
  }
};

export { startAR };
// start camera stream
