/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

import styles from "./styles";
import { startAR } from "./utils";

const TrackingVideo = ({ nftDescriptorsName, videoSrc }) => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const campaignVideoRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);

  const handleLoadingEnded = () => {
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    startAR(
      nftDescriptorsName,
      cameraVideoRef,
      cameraCanvasRef,
      campaignVideoRef,
      handleLoadingEnded,
    );
  }, []);

  const startCampaignVideo = e => {
    e.target.style.display = "none";
    campaignVideoRef.current.play();
  };

  return (
    <div>
      {mounted && (
        <>
          <video
            className="campaignVideo"
            ref={campaignVideoRef}
            autoPlay
            loop
            crossOrigin="anonymous"
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
          </video>

          {loading && (
            <div className="loadingContainer">
              <span>Loading, please wait</span>
            </div>
          )}

          <div className="tapToPlay" onClick={startCampaignVideo}>
            <span>Tap screen to play video...</span>
          </div>

          <div className="trackingVideo">
            <video
              className="cameraVideo"
              ref={cameraVideoRef}
              loop
              autoPlay
              muted
              playsInline
            />

            <div className="cameraCanvas" ref={cameraCanvasRef} />
          </div>
        </>
      )}
      <style jsx>{styles}</style>
    </div>
  );
};

TrackingVideo.propTypes = {
  nftDescriptorsName: PropTypes.string,
  videoSrc: PropTypes.string,
};

TrackingVideo.defaultProps = {
  nftDescriptorsName:
    "https://avo-content-dev.s3.amazonaws.com/campaign-manager/markers/abc_dental/abc_dental",
  videoSrc: "https://avo-content-dev.s3.amazonaws.com/videos/bg_1588085276090.mp4",
};

export default TrackingVideo;
