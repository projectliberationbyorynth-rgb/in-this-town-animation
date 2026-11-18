import React from 'react';
import {Composition} from 'remotion';
import {Town3DTest} from './Town3DTest';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Town3DTest"
        component={Town3DTest}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

