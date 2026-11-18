
import React, {useEffect, useMemo, useState} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  delayRender,
  continueRender,
  cancelRender,
} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

type V3 = [number, number, number];

// BASIC 3D SHAPES
const Block = ({
  position, size, color,
}: {
  position: V3;
  size: V3;
  color: string;
}) => (
  <mesh position={position}>
    <boxGeometry args={size}/>
    <meshStandardMaterial color={color} roughness={0.8}/>
  </mesh>
);

const Ball = ({
  position, scale, color,
}: {
  position: V3;
  scale: V3;
  color: string;
}) => (
  <mesh position={position} scale={scale}>
    <sphereGeometry args={[1, 24, 16]}/>
    <meshStandardMaterial color={color} roughness={0.75}/>
  </mesh>
);

// FLOATING PRICE TAG
const PriceTag = () => {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#202b44';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 14;
    ctx.strokeRect(8, 8, 496, 240);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 170px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$0', 256, 128);

    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, []);

  return (
    <sprite position={[0, 3.25, 0]} scale={[1.25, 0.63, 1]}>
      <spriteMaterial map={texture} transparent/>
    </sprite>
  );
};

// LEO CHARACTER
const Leo = ({frame}: {frame: number}) => {
  const seconds = frame / 30;
  const walk = Math.sin(seconds * 9);
  const bob = Math.abs(walk) * 0.045;
  const blink = frame % 95 >= 91 ? 0.18 : 1;
  const surprised = frame >= 170;
  const x = -2.4 + seconds * 0.48;

  return (
    <group position={[x, bob, 0]}>
      {[-1, 1].map(side => (
        <group
          key={'leg' + side}
          position={[side * 0.19, 0.78, 0]}
          rotation={[walk * side * 0.3, 0, 0]}
        >
          <Block
            position={[0, -0.35, 0]}
            size={[0.22, 0.7, 0.25]}
            color="#27364e"
          />
          <Block
            position={[0, -0.69, 0.12]}
            size={[0.29, 0.16, 0.45]}
            color="#f2f2f2"
          />
        </group>
      ))}

      <Block
        position={[0, 1.34, 0]}
        size={[0.72, 0.95, 0.39]}
        color="#367fc4"
      />

      <Block
        position={[0, 1.13, 0.22]}
        size={[0.4, 0.22, 0.035]}
        color="#23609e"
      />

      {[-1, 1].map(side => (
        <group
          key={'arm' + side}
          position={[side * 0.47, 1.67, 0]}
          rotation={[-walk * side * 0.24, 0, side * 0.09]}
        >
          <Block
            position={[0, -0.29, 0]}
            size={[0.2, 0.57, 0.22]}
            color="#367fc4"
          />
          <Ball
            position={[0, -0.62, 0]}
            scale={[0.13, 0.15, 0.13]}
            color="#ffd4b4"
          />
        </group>
      ))}

      <Block
        position={[0, 1.93, 0]}
        size={[0.19, 0.24, 0.19]}
        color="#ffd4b4"
      />

      <Ball
        position={[0, 2.34, 0]}
        scale={[0.53, 0.56, 0.47]}
        color="#ffe0c3"
      />

      <Ball
        position={[-0.25, 2.76, -0.03]}
        scale={[0.32, 0.18, 0.46]}
        color="#f04459"
      />

      <Ball
        position={[0.25, 2.76, -0.03]}
        scale={[0.32, 0.18, 0.46]}
        color="#25c77c"
      />

      {[-1, 1].map(side => (
        <group key={'eye' + side}>
          <Ball
            position={[side * 0.2, 2.4, 0.43]}
            scale={[0.065, 0.085 * blink, 0.035]}
            color="#182337"
          />
          <Block
            position={[
              side * 0.2,
              surprised ? 2.61 : 2.57,
              0.43,
            ]}
            size={[0.17, 0.035, 0.04]}
            color="#633c3c"
          />
        </group>
      ))}

      <Ball
        position={[0, 2.14, 0.455]}
        scale={[
          surprised ? 0.095 : 0.13,
          surprised ? 0.12 : 0.035,
          0.025,
        ]}
        color="#8b4550"
      />

      <PriceTag/>
    </group>
  );
};

// TOWN BUILDINGS
const Building = ({
  x, color, height,
}: {
  x: number;
  color: string;
  height: number;
}) => (
  <group position={[x, 0, -5.1]}>
    <Block
      position={[0, height / 2, 0]}
      size={[2.5, height, 2.4]}
      color={color}
    />
    <Block
      position={[0, height + 0.16, 0]}
      size={[2.85, 0.32, 2.75]}
      color="#765c72"
    />
    {[1.4, 2.65].filter(y => y < height - 0.4).map(y =>
      [-0.65, 0.65].map(wx => (
        <Block
          key={y + '-' + wx}
          position={[wx, y, 1.225]}
          size={[0.67, 0.72, 0.08]}
          color="#e9f8ff"
        />
      ))
    )}
    <Block
      position={[0, 0.68, 1.245]}
      size={[0.68, 1.36, 0.09]}
      color="#80614f"
    />
  </group>
);

// TOWN TREES
const Tree = ({x}: {x: number}) => (
  <group position={[x, 0, -2.9]}>
    <Block
      position={[0, 0.7, 0]}
      size={[0.2, 1.4, 0.2]}
      color="#77513b"
    />
    <Ball
      position={[0, 1.75, 0]}
      scale={[0.78, 0.85, 0.78]}
      color="#3d9b63"
    />
  </group>
);

// REAL POLYFORK GLB MODEL
const PolyforkVehicle = () => {
  const [model, setModel] = useState<THREE.Group | null>(null);

  const [handle] = useState(() =>
    delayRender('Loading Polyfork 3D vehicle')
  );

  useEffect(() => {
    let active = true;
    let settled = false;

    const finish = () => {
      if (!settled) {
        settled = true;
        continueRender(handle);
      }
    };

    const fail = (error: unknown) => {
      if (!settled) {
        settled = true;
        cancelRender(
          new Error('Polyfork GLB failed: ' + String(error))
        );
      }
    };

    const loader = new GLTFLoader();

    loader.load(
      staticFile('assets/polyfork-vehicle.glb'),
      (gltf) => {
        if (!active) return;

        const vehicle = gltf.scene;

        // Center and normalize model geometry.
        const bounds = new THREE.Box3().setFromObject(vehicle);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());

        const maxDimension = Math.max(
          size.x, size.y, size.z
        );

        if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
          fail('Model has invalid dimensions');
          return;
        }

        // Keep original model separate from its placement.
        const normalized = new THREE.Group();
        vehicle.position.sub(center);
        normalized.add(vehicle);

        normalized.scale.setScalar(2.8 / maxDimension);

        const scaledBounds = new THREE.Box3()
          .setFromObject(normalized);

        normalized.position.y -= scaledBounds.min.y;

        normalized.traverse(object => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });

        setModel(normalized);
        finish();
      },
      undefined,
      (error) => {
        if (active) fail(error);
      }
    );

    return () => {
      active = false;
    };
  }, [handle]);

  if (!model) return null;

  return (
    <group position={[3.5, 0.12, -1.3]}>
      <primitive object={model}/>
    </group>
  );
};

// COMPLETE 3D SCENE
const Scene = () => {
  const frame = useCurrentFrame();
  const seconds = frame / 30;

  const camera = useMemo(
    () => new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 100),
    []
  );

  const targetX = -2.4 + seconds * 0.48;

  camera.position.set(
    targetX + 3.5,
    3.8,
    8.5 - Math.min(seconds, 6) * 0.12
  );
  camera.lookAt(targetX, 1.55, 0);

  const colors = [
    '#efb6a6',
    '#b9b5e8',
    '#f1d293',
    '#a4d6c4',
    '#efbdc8',
    '#bad6ee',
  ];

  return (
    <>
      <primitive object={camera} makeDefault/>

      <ambientLight intensity={1.6}/>
      <hemisphereLight
        args={['#dff2ff', '#9d876e', 1.2]}
      />
      <directionalLight
        position={[5, 10, 7]}
        intensity={2.4}
      />

      <Block
        position={[0, -0.23, 0]}
        size={[40, 0.35, 24]}
        color="#8bc78e"
      />

      <Block
        position={[0, -0.035, 0]}
        size={[40, 0.08, 4.2]}
        color="#535d6b"
      />

      {[-1, 1].map(side => (
        <Block
          key={side}
          position={[0, 0, side * 2.55]}
          size={[40, 0.2, 0.9]}
          color="#d8d9d5"
        />
      ))}

      {Array.from({length: 12}, (_, i) => (
        <Block
          key={i}
          position={[-18 + i * 3.4, 0.015, 0]}
          size={[1.5, 0.015, 0.1]}
          color="#ffe9a5"
        />
      ))}

      {Array.from({length: 9}, (_, i) => (
        <Building
          key={i}
          x={-16 + i * 4}
          height={3.3 + (i % 3) * 0.5}
          color={colors[i % colors.length]}
        />
      ))}

      {[-12, -6, 0, 6, 12].map(x => (
        <Tree key={x} x={x}/>
      ))}

      <Leo frame={frame}/>

      {/* Our first real Polyfork 3D model */}
      <PolyforkVehicle/>
    </>
  );
};

// REMOTION COMPOSITION
export const Town3DTest: React.FC = () => {
  const {width, height} = useVideoConfig();

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#b8e3f8',
    }}>
      <ThreeCanvas width={width} height={height}>
        <Scene/>
      </ThreeCanvas>
    </div>
  );
};
