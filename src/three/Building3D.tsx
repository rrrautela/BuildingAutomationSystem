import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Zone, ViewMode } from '../types';

interface FloorZoneProps {
  zone: Zone;
  isSelected: boolean;
  viewMode: ViewMode;
  onSelect: (zone: Zone) => void;
}

const FloorZone = ({ zone, isSelected, viewMode, onSelect }: FloorZoneProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const outlineRef = useRef<THREE.LineSegments>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      if (zone.occupied && viewMode === 'occupancy') {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
        meshRef.current.scale.set(scale, 1, scale);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }

    if (outlineRef.current && zone.hasFault) {
      const intensity = (Math.sin(state.clock.elapsedTime * 4) + 1) / 2;
      (outlineRef.current.material as THREE.LineBasicMaterial).color.setRGB(
        1,
        intensity * 0.3,
        intensity * 0.3
      );
    }
  });

  const getZoneColor = useMemo(() => {
    if (viewMode === 'hvac') {
      const tempDiff = zone.temp - zone.targetTemp;
      if (tempDiff > 1.5) return new THREE.Color('#ef4444');
      if (tempDiff < -1.5) return new THREE.Color('#3b82f6');
      if (Math.abs(tempDiff) > 0.5) return new THREE.Color('#eab308');
      return new THREE.Color('#22c55e');
    }
    if (viewMode === 'lighting') {
      const intensity = zone.lighting / 100;
      return new THREE.Color().setHSL(0.12, 0.8, 0.25 + intensity * 0.35);
    }
    if (viewMode === 'occupancy') {
      return zone.occupied ? new THREE.Color('#22c55e') : new THREE.Color('#4b5563');
    }
    if (viewMode === 'energy') {
      const energyIntensity = zone.occupied ? 0.7 : 0.3;
      return new THREE.Color().setHSL(0.52, 0.8, 0.3 + energyIntensity * 0.2);
    }
    return new THREE.Color('#6b7280');
  }, [viewMode, zone.temp, zone.targetTemp, zone.lighting, zone.occupied]);

  const emissiveIntensity = useMemo(() => {
    if (viewMode === 'lighting') {
      return (zone.lighting / 100) * 0.6;
    }
    if (zone.occupied && viewMode === 'occupancy') {
      return 0.3;
    }
    if (zone.hasFault) {
      return 0.4;
    }
    return isSelected ? 0.3 : hovered ? 0.15 : 0;
  }, [viewMode, zone.lighting, zone.occupied, zone.hasFault, isSelected, hovered]);

  const floorHeight = 3;
  const yPosition = (zone.floor - 1) * floorHeight;
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(8, 2.5, 8)), []);

  return (
    <group position={[0, yPosition, 0]}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(zone);
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[8, 2.5, 8]} />
        <meshStandardMaterial
          color={getZoneColor}
          emissive={zone.hasFault ? new THREE.Color('#ef4444') : getZoneColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={isSelected ? 0.95 : hovered ? 0.85 : 0.7}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      <lineSegments ref={outlineRef} geometry={edgesGeometry}>
        <lineBasicMaterial
          color={isSelected ? '#06b6d4' : zone.hasFault ? '#ef4444' : hovered ? '#ffffff' : '#374151'}
        />
      </lineSegments>

      {(hovered || isSelected) && (
        <Html position={[0, 2, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-2xl min-w-[180px] backdrop-blur-sm">
            <div className="text-white font-semibold text-sm mb-2">{zone.name}</div>
            <div className="space-y-1 text-xs">
              {viewMode === 'hvac' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Temperature</span>
                    <span className={`font-medium ${
                      Math.abs(zone.temp - zone.targetTemp) > 1 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {zone.temp.toFixed(1)}°C → {zone.targetTemp}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className="text-cyan-400 capitalize">{zone.hvacStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Humidity</span>
                    <span className="text-gray-300">{zone.humidity.toFixed(0)}%</span>
                  </div>
                </>
              )}
              {viewMode === 'lighting' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Light Level</span>
                    <span className="text-yellow-400">{zone.lighting}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daylight</span>
                    <span className="text-gray-300">{zone.daylightContribution}%</span>
                  </div>
                </>
              )}
              {viewMode === 'occupancy' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={zone.occupied ? 'text-green-400' : 'text-gray-500'}>
                      {zone.occupied ? 'Occupied' : 'Vacant'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Occupants</span>
                    <span className="text-gray-300">{zone.occupantCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CO₂</span>
                    <span className={zone.co2 > 700 ? 'text-red-400' : 'text-gray-300'}>
                      {zone.co2} ppm
                    </span>
                  </div>
                </>
              )}
              {viewMode === 'energy' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">HVAC Status</span>
                    <span className="text-cyan-400 capitalize">{zone.hvacStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lighting</span>
                    <span className="text-gray-300">{zone.lighting}%</span>
                  </div>
                </>
              )}
            </div>
            {zone.hasFault && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <span className="text-red-400 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  {zone.faultMessage || 'Fault detected'}
                </span>
              </div>
            )}
          </div>
        </Html>
      )}

      {zone.hasFault && (
        <mesh position={[4.5, 1.5, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#ef4444" />
          <pointLight color="#ef4444" intensity={2} distance={5} decay={2} />
        </mesh>
      )}
    </group>
  );
};

interface SolarPanelsProps {
  solarOutput: number;
}

const SolarPanels = ({ solarOutput }: SolarPanelsProps) => {
  const panelsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (panelsRef.current) {
      const intensity = Math.max(0, solarOutput / 50);
      panelsRef.current.children.forEach((panel, i) => {
        if (panel instanceof THREE.Mesh) {
          const material = panel.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = intensity * (0.3 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.1);
        }
      });
    }
  });

  const panelPositions: [number, number, number][] = [
    [-3, 0, -3], [-1, 0, -3], [1, 0, -3], [3, 0, -3],
    [-3, 0, -1], [-1, 0, -1], [1, 0, -1], [3, 0, -1],
    [-3, 0, 1], [-1, 0, 1], [1, 0, 1], [3, 0, 1],
  ];

  return (
    <group ref={panelsRef} position={[0, 15.5, 0]}>
      {panelPositions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[-Math.PI / 6, 0, 0]} castShadow>
          <boxGeometry args={[1.5, 0.05, 1.5]} />
          <meshStandardMaterial
            color="#1e3a8a"
            emissive="#3b82f6"
            emissiveIntensity={0}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};

interface Building3DProps {
  zones: Zone[];
  selectedZoneId: string | null;
  viewMode: ViewMode;
  onZoneSelect: (zone: Zone) => void;
  solarOutput: number;
}

export const Building3D = ({
  zones,
  selectedZoneId,
  viewMode,
  onZoneSelect,
  solarOutput,
}: Building3DProps) => {
  return (
    <>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[25, 0.5, 25]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>

      <mesh position={[0, 7.5, 0]} castShadow>
        <boxGeometry args={[9, 15.5, 9]} />
        <meshStandardMaterial
          color="#374151"
          transparent
          opacity={0.12}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {zones.map((zone) => (
        <FloorZone
          key={zone.id}
          zone={zone}
          isSelected={selectedZoneId === zone.id}
          viewMode={viewMode}
          onSelect={onZoneSelect}
        />
      ))}

      <SolarPanels solarOutput={solarOutput} />

      <gridHelper args={[40, 40, '#374151', '#1f2937']} position={[0, -0.24, 0]} />
    </>
  );
};
