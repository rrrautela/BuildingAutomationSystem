import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Building3D } from './Building3D';
import { useBASStore } from '../store/basStore';
import { Zone } from '../types';

function CameraSetup({ distance, target }: { distance: number; target: [number, number, number] }) {
  const { camera } = useThree();

  useEffect(() => {
    // Keep camera framed relative to the orbit target so the model stays centered on screen.
    camera.position.set(target[0] + distance, target[1] + distance * 0.7, target[2] + distance * 1.3);
    camera.lookAt(target[0], target[1], target[2]);
    camera.near = 0.1;
    camera.far = 3000;

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 55;
    }

    camera.updateProjectionMatrix();
  }, [camera, distance, target]);

  return null;
}

const SceneContent = () => {
  const { camera } = useThree();
  const { zones, selectedZoneId, viewMode, setSelectedZone, energyData } = useBASStore();
  const [cameraDistance, setCameraDistance] = useState(160);
  const [controlsTarget, setControlsTarget] = useState<[number, number, number]>([0, 18, 0]);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [minZoomDistance, setMinZoomDistance] = useState(6);

  const handleZoneSelect = (zone: Zone) => {
    setSelectedZone(zone.id);
  };

  const handleModelNormalized = useCallback((info: { maxDim: number; height: number }) => {
    setCameraDistance(info.maxDim * 2.2);
    // Model is normalized so its base rests on y=0; focus on its vertical center for better framing.
    setControlsTarget([0, Math.max(6, info.height * 0.5), 0]);
    // Allow close-up inspection regardless of model scale.
    setMinZoomDistance(Math.max(1.5, info.maxDim * 0.08));
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.target.set(controlsTarget[0], controlsTarget[1], controlsTarget[2]);
    controls.update();

    // Some drivers/environments apply controls after camera setup; re-assert framing.
    camera.lookAt(controls.target);
    camera.updateProjectionMatrix();
  }, [camera, controlsTarget]);

  return (
    <>
      <CameraSetup distance={cameraDistance} target={controlsTarget} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={controlsTarget}
        enableDamping
        dampingFactor={0.05}
        minDistance={minZoomDistance}
        maxDistance={900}
        zoomSpeed={1.1}
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
      className="touch-none"
      style={{ width: '100%', height: '100%', display: 'block' }}
      gl={{ antialias: true }}
    >
      <SceneContent />
    </Canvas>
  );
};
