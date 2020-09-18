import React from "react";
import Head from "next/head";

import TrackingVideo from "../src/components/views/TrackingVideo";

const Home = () => {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <title>next-jsartoolkitnft-video</title>
      </Head>
      <TrackingVideo />
    </>
  );
};

export default Home;
