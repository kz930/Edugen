import React from "react";
import { Composition } from "remotion";
import { SlideVideo, type SlideVideoProps } from "./SlideVideo";

const defaultSlideProps: SlideVideoProps = {
  title: "Slide",
  bullets: [],
  audioHttpUrl: "",
  durationInSeconds: 10,
  narrationScript: "",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SlideVideo"
        component={SlideVideo}
        calculateMetadata={async ({ props }) => {
          const dur =
            typeof props.durationInSeconds === "number" &&
            Number.isFinite(props.durationInSeconds)
              ? Math.max(1, props.durationInSeconds)
              : 10;
          const fps = 30;
          return {
            durationInFrames: Math.max(30, Math.ceil(dur * fps)),
            fps,
            width: 1280,
            height: 720,
          };
        }}
        defaultProps={defaultSlideProps}
      />
    </>
  );
};
