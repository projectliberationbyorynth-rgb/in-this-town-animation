
import React, {useEffect, useMemo, useState} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

type V3 = [number, number, number];
const Block = ({position,size,color}: {position:V3;size:V3;color:string}) => <mesh position={position}><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={0.8}/></mesh>;
const Ball = ({position,scale,color}: {position:V3;scale:V3;color:string}) => <mesh position={position} scale={scale}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={color} roughness={0.75}/></mesh>;

const PriceTag = () => {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width=512;canvas.height=256;
    const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#202b44';ctx.fillRect(0,0,512,256);
    ctx.strokeStyle='#ffd166';ctx.lineWidth=14;ctx.strokeRect(8,8,496,240);
    ctx.fillStyle='white';ctx.font='bold 170px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('$0',256,128);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[]);
  return <sprite position={[0,3.25,0]} scale={[1.25,0.63,1]}><spriteMaterial map={texture} transparent/></sprite>;
};

const leoX = (frame:number) => -2.4 + frame/30*0.48;
const Leo = ({frame}:{frame:number}) => {
  const walk=Math.sin(frame/30*9), bob=Math.abs(walk)*0.045;
  const blink=frame%95>=91?0.18:1, surprised=frame>=170;
  return <group position={[leoX(frame),bob,0]}>
    {[-1,1].map(s=><group key={'leg'+s} position={[s*0.19,0.78,0]} rotation={[walk*s*0.3,0,0]}><Block position={[0,-0.35,0]} size={[0.22,0.7,0.25]} color="#27364e"/><Block position={[0,-0.69,0.12]} size={[0.29,0.16,0.45]} color="#f2f2f2"/></group>)}
    <Block position={[0,1.34,0]} size={[0.72,0.95,0.39]} color="#367fc4"/>
    <Block position={[0,1.13,0.22]} size={[0.4,0.22,0.035]} color="#23609e"/>
    {[-1,1].map(s=><group key={'arm'+s} position={[s*0.47,1.67,0]} rotation={[-walk*s*0.24,0,s*0.09]}><Block position={[0,-0.29,0]} size={[0.2,0.57,0.22]} color="#367fc4"/><Ball position={[0,-0.62,0]} scale={[0.13,0.15,0.13]} color="#ffd4b4"/></group>)}
    <Block position={[0,1.93,0]} size={[0.19,0.24,0.19]} color="#ffd4b4"/>
    <Ball position={[0,2.34,0]} scale={[0.53,0.56,0.47]} color="#ffe0c3"/>
    <Ball position={[-0.25,2.76,-0.03]} scale={[0.32,0.18,0.46]} color="#f04459"/>
    <Ball position={[0.25,2.76,-0.03]} scale={[0.32,0.18,0.46]} color="#25c77c"/>
    {[-1,1].map(s=><group key={'eye'+s}><Ball position={[s*0.2,2.4,0.43]} scale={[0.065,0.085*blink,0.035]} color="#182337"/><Block position={[s*0.2,surprised?2.61:2.57,0.43]} size={[0.17,0.035,0.04]} color="#633c3c"/></group>)}
    <Ball position={[0,2.14,0.455]} scale={[surprised?0.095:0.13,surprised?0.12:0.035,0.025]} color="#8b4550"/>
    <PriceTag/>
  </group>;
};

const Building=({x,color,height}:{x:number;color:string;height:number})=><group position={[x,0,-5.1]}><Block position={[0,height/2,0]} size={[2.5,height,2.4]} color={color}/><Block position={[0,height+0.16,0]} size={[2.85,0.32,2.75]} color="#765c72"/>{[1.4,2.65].filter(y=>y<height-0.4).flatMap(y=>[-0.65,0.65].map(wx=><Block key={`${y}-${wx}`} position={[wx,y,1.225]} size={[0.67,0.72,0.08]} color="#e9f8ff"/>))}<Block position={[0,0.68,1.245]} size={[0.68,1.36,0.09]} color="#80614f"/></group>;
const Tree=({x}:{x:number})=><group position={[x,0,-2.9]}><Block position={[0,0.7,0]} size={[0.2,1.4,0.2]} color="#77513b"/><Ball position={[0,1.75,0]} scale={[0.78,0.85,0.78]} color="#3d9b63"/></group>;

// Frame-driven GLB loading. Never advance animation based on wall-clock time.
const PolyforkVehicle=()=>{
  const [model,setModel]=useState<THREE.Group|null>(null);
  const [handle]=useState(()=>delayRender('Load Polyfork GLB'));
  useEffect(()=>{
    let active=true;
    new GLTFLoader().load(staticFile('assets/polyfork-vehicle.glb'),gltf=>{
      if(!active)return;
      const vehicle=gltf.scene;
      const bounds=new THREE.Box3().setFromObject(vehicle);
      const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
      const max=Math.max(size.x,size.y,size.z);
      if(!Number.isFinite(max)||max<=0){cancelRender(new Error('Invalid GLB dimensions'));return;}
      vehicle.position.sub(center);
      const normalized=new THREE.Group();normalized.add(vehicle);normalized.scale.setScalar(2.8/max);
      const bottom=new THREE.Box3().setFromObject(normalized).min.y;normalized.position.y-=bottom;
      setModel(normalized);continueRender(handle);
    },undefined,error=>{if(active)cancelRender(new Error(String(error)));});
    return ()=>{active=false;};
  },[handle]);
  return model?<group position={[3.5,0.12,-1.3]}><primitive object={model}/></group>:null;
};

// CINEMATIC CAMERA DIRECTOR — all positions depend ONLY on frame.
// Cuts are deliberate: no interpolated flight through buildings or characters.
type Shot={start:number;end:number;name:string;offset:V3;lookOffset:V3;fov:number;track:boolean};
const SHOTS:Shot[]=[
  {start:0,end:59,name:'Town establishing',offset:[4.8,5.2,12.5],lookOffset:[0,1.5,0],fov:48,track:false},
  {start:60,end:119,name:'Leo walking medium',offset:[2.3,3.2,7.8],lookOffset:[0,1.6,0],fov:39,track:true},
  {start:120,end:169,name:'Leo face closeup',offset:[0.65,2.65,4.0],lookOffset:[0,2.35,0],fov:34,track:true},
  {start:170,end:224,name:'Leo reaction closeup',offset:[-0.8,2.8,4.5],lookOffset:[0,2.3,0],fov:34,track:true},
  {start:225,end:299,name:'Reveal vehicle and street',offset:[3.3,4.0,9.2],lookOffset:[1.1,1.5,-0.4],fov:46,track:true},
];
const ease=(t:number)=>t*t*(3-2*t);
const CinematicCamera=({frame}:{frame:number})=>{
  const camera=useMemo(()=>new THREE.PerspectiveCamera(42,16/9,0.1,150),[]);
  const shot=SHOTS.find(s=>frame>=s.start&&frame<=s.end)??SHOTS[SHOTS.length-1];
  const base=shot.track?leoX(frame):0;
  // Gentle push-in within each shot, without introducing camera collisions.
  const progress=Math.max(0,Math.min(1,(frame-shot.start)/Math.max(1,shot.end-shot.start)));
  const push=0.25*ease(progress);
  camera.fov=shot.fov;camera.aspect=16/9;camera.updateProjectionMatrix();
  camera.position.set(base+shot.offset[0],shot.offset[1],shot.offset[2]-push);
  camera.lookAt(base+shot.lookOffset[0],shot.lookOffset[1],shot.lookOffset[2]);
  return <primitive object={camera} makeDefault/>;
};

const Scene=()=>{
  const frame=useCurrentFrame();
  const colors=['#efb6a6','#b9b5e8','#f1d293','#a4d6c4','#efbdc8','#bad6ee'];
  return <>
    <CinematicCamera frame={frame}/>
    <ambientLight intensity={1.6}/><hemisphereLight args={['#dff2ff','#9d876e',1.2]}/><directionalLight position={[5,10,7]} intensity={2.4}/>
    <Block position={[0,-0.23,0]} size={[40,0.35,24]} color="#8bc78e"/>
    <Block position={[0,-0.035,0]} size={[40,0.08,4.2]} color="#535d6b"/>
    {[-1,1].map(s=><Block key={s} position={[0,0,s*2.55]} size={[40,0.2,0.9]} color="#d8d9d5"/>)}
    {Array.from({length:12},(_,i)=><Block key={i} position={[-18+i*3.4,0.015,0]} size={[1.5,0.015,0.1]} color="#ffe9a5"/>)}
    {Array.from({length:9},(_,i)=><Building key={i} x={-16+i*4} height={3.3+(i%3)*0.5} color={colors[i%colors.length]}/>)}
    {[-12,-6,0,6,12].map(x=><Tree key={x} x={x}/>)}
    <Leo frame={frame}/><PolyforkVehicle/>
  </>;
};
export const Town3DTest:React.FC=()=>{
  const {width,height}=useVideoConfig();
  return <div style={{width:'100%',height:'100%',background:'#b8e3f8'}}><ThreeCanvas width={width} height={height}><Scene/></ThreeCanvas></div>;
};
