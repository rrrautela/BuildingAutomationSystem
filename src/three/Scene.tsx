import { Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Building3D } from './Building3D';
import { useBASStore } from '../store/basStore';
import { Zone } from '../types';

function CameraSetup({ distance }: { distance: number }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(distance, distance * 0.7, distance * 1.3);
    camera.lookAt(0, 0, 0);
    camera.near = 0.5;
    camera.far = 1500;
    camera.fov = 55;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [camera, distance]);

  return null;
}

const SceneContent = () => {
  const { zones, selectedZoneId, viewMode, setSelectedZone, energyData } = useBASStore();
  const [cameraDistance, setCameraDistance] = useState(160);

  const handleZoneSelect = (zone: Zone) => {
    setSelectedZone(zone.id);
  };

  const handleModelNormalized = useCallback((maxDim: number) => {
    setCameraDistance(maxDim * 2.2);
  }, []);

  return (
    <>
      <CameraSetup distance={cameraDistance} />
      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.05}
        minDistance={30}
        maxDistance={400}
        maxPolarAngle={Math.PI / 2.05}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 140, 80]} intensity={1.5} castShadow />
      <directionalLight position={[-80, 60, -100]} intensity={0.4} />
      <hemisphereLight args={['#e0eaff', '#1e293b', 0.6]} />
      <Suspense fallback={null}>
        <Building3D
          zones={zones}
          selectedZoneId={selectedZoneId}
          viewMode={viewMode}
          onZoneSelect={handleZoneSelect}
          solarOutput={energyData.solar}
          onModelNormalized={handleModelNormalized}
        />
      </Suspense>
    </>
  );
};

export const Scene = () => {
  return (
    <Canvas
      shadows
      style={{ width: '100%', height: '100%', display: 'block' }}
      gl={{ antialias: true }}
    >
      <SceneContent />
    </Canvas>
  );
};
