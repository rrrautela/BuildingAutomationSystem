import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { Building3D } from './Building3D';
import { useBASStore } from '../store/basStore';
import { Zone } from '../types';

const SceneContent = () => {
  const { zones, selectedZoneId, viewMode, setSelectedZone, energyData } = useBASStore();

  const handleZoneSelect = (zone: Zone) => {
    setSelectedZone(zone.id);
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[22, 18, 22]} fov={45} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={15}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.1}
        target={[0, 6, 0]}
      />

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[15, 25, 15]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight intensity={0.4} groundColor="#1f2937" color="#0ea5e9" />
      <pointLight position={[-10, 10, -10]} intensity={0.3} color="#06b6d4" />

      <Building3D
        zones={zones}
        selectedZoneId={selectedZoneId}
        viewMode={viewMode}
        onZoneSelect={handleZoneSelect}
        solarOutput={energyData.solar}
      />

      <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      <Environment preset="night" />
      
      <fog attach="fog" args={['#0f172a', 30, 80]} />
    </>
  );
};

export const Scene = () => {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0f172a' }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
};
