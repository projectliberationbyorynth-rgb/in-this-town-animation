import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';

type Vec3 = [number, number, number];

const Cube = ({
  position,
  size,
  color,
}: {
  position: Vec3;
  size: Vec3;
  color: string;
}) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} />
  </mesh>
);

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  const walk = Math.sin(t * 10) * 0.35;
  const leoX = -2 + t * 0.8;

  const camera = React.useMemo(() => {
    return new THREE.PerspectiveCamera(
      42,
      16 / 9,
      0.1,
      100
    );
  }, []);

  camera.position.set(
    5 - t * 0.4,
    4,
    10
  );
  camera.lookAt(0, 1.3, 0);

  return (
    <>
      <primitive object={camera} makeDefault />

      <ambientLight intensity={1.5} />
      <directionalLight
        position={[5, 9, 6]}
        intensity={2.2}
      />

      {/* Ground */}
      <Cube
        position={[0, -0.2, 0]}
        size={[24, 0.3, 20]}
        color="#83bd8b"
      />

      {/* Road */}
      <Cube
        position={[0, -0.02, 0]}
        size={[24, 0.08, 3.8]}
        color="#525969"
      />

      {/* Road markings */}
      {[-8, -4, 0, 4, 8].map((x) => (
        <Cube
          key={x}
          position={[x, 0.03, 0]}
          size={[1.6, 0.01, 0.1]}
          color="#f9e8a0"
        />
      ))}

      {/* Town buildings */}
      {[-8, -5, -2, 1, 4, 7].map(
        (x, i) => (
          <group key={i}>
            <Cube
              position={[x, 1.65, -5]}
              size={[2.4, 3.3, 2.4]}
              color={
                [
                  '#efb5a2',
                  '#bfb4e9',
                  '#f0d28d',
                  '#a5d9c7',
                ][i % 4]
              }
            />

            <Cube
              position={[x, 3.45, -5]}
              size={[2.7, 0.35, 2.7]}
              color="#7d6176"
            />

            <Cube
              position={[x, 2, -3.76]}
              size={[0.8, 0.9, 0.05]}
              color="#b7eaff"
            />

            <Cube
              position={[x, 0.65, -3.75]}
              size={[0.65, 1.3, 0.06]}
              color="#76584a"
            />
          </group>
        )
      )}

      {/* Leo */}
      <group position={[leoX, 0, 0]}>
        {/* Legs */}
        <group
          position={[-0.17, 0.65, 0]}
          rotation={[walk, 0, 0]}
        >
          <Cube
            position={[0, -0.3, 0]}
            size={[0.19, 0.65, 0.2]}
            color="#263b61"
          />
        </group>

        <group
          position={[0.17, 0.65, 0]}
          rotation={[-walk, 0, 0]}
        >
          <Cube
            position={[0, -0.3, 0]}
            size={[0.19, 0.65, 0.2]}
            color="#263b61"
          />
        </group>

        {/* Body */}
        <Cube
          position={[0, 1.2, 0]}
          size={[0.65, 0.85, 0.35]}
          color="#347bc7"
        />

        {/* Arms */}
        <group
          position={[-0.47, 1.2, 0]}
          rotation={[-walk, 0, 0]}
        >
          <Cube
            position={[0, -0.3, 0]}
            size={[0.19, 0.7, 0.19]}
            color="#ffd4b4"
          />
        </group>

        <group
          position={[0.47, 1.2, 0]}
          rotation={[walk, 0, 0]}
        >
          <Cube
            position={[0, -0.3, 0]}
            size={[0.19, 0.7, 0.19]}
            color="#ffd4b4"
          />
        </group>

        {/* Head */}
        <mesh position={[0, 1.95, 0]}>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial color="#ffd8b7" />
        </mesh>

        {/* Red and green hair */}
        <Cube
          position={[-0.22, 2.34, 0]}
          size={[0.44, 0.23, 0.65]}
          color="#ef4458"
        />

        <Cube
          position={[0.22, 2.34, 0]}
          size={[0.44, 0.23, 0.65]}
          color="#21c77c"
        />

        {/* Eyes */}
        <Cube
          position={[-0.16, 2, 0.41]}
          size={[0.08, 0.11, 0.04]}
          color="#172236"
        />

        <Cube
          position={[0.16, 2, 0.41]}
          size={[0.08, 0.11, 0.04]}
          color="#172236"
        />
      </group>
    </>
  );
};

export const Town3DTest: React.FC = () => {
  const {width, height} = useVideoConfig();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#b5ddf2',
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
      >
        <Scene />
      </ThreeCanvas>

      {/* Floating price tag */}
      <div
        style={{
          position: 'absolute',
          top: '14%',
          left: '43%',
          background: '#1e293b',
          color: 'white',
          padding: '12px 30px',
          borderRadius: 16,
          fontSize: 60,
          fontWeight: 900,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        $0
      </div>
    </div>
  );
};

