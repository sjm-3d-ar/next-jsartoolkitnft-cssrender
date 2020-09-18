import css from "styled-jsx/css"; // eslint-disable-line import/no-extraneous-dependencies

export default css`
  .loadingContainer {
    width: 100%;
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.45);
    z-index: 9999999;
    color: black;
    font-weight: bold;
  }

  .tapToPlay {
    width: 100%;
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    width: 100%;
    height: 100%;
    z-index: 9999998;
  }

  .tapToPlay span {
    color: blue;
    font-weight: bold;
    margin: 30px;
  }

  .trackingVideo {
    position: fixed;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
  }

  .campaignVideo {
    position: fixed;
    top: 0;
    left: 100%;
    z-index: -2;
  }

  .cameraVideo {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
  }

  .cameraCanvas {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 100;
    display: block;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
  }
`;
