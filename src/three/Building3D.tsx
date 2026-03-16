import { useEffect, useMemo, useState } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Zone, ViewMode } from '../types';

const LIGHTING_SCALE = [
  { stop: 0, color: '#1e3a5f' },
  { stop: 25, color: '#4a90d9' },
  { stop: 50, color: '#f5f0e8' },
  { stop: 75, color: '#f5a623' },
  { stop: 100, color: '#fff7d6' },
];

const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;

const hexToRgb = (hex: string) => {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  };
};

const getLightingColor = (value: number) => {
  const clamped = Math.max(0, Math.min(100, value));

  for (let i = 0; i < LIGHTING_SCALE.length - 1; i++) {
    const current = LIGHTING_SCALE[i];
    const next = LIGHTING_SCALE[i + 1];

    if (clamped >= current.stop && clamped <= next.stop) {
      const ratio = (clamped - current.stop) / (next.stop - current.stop);
      const start = hexToRgb(current.color);
      const end = hexToRgb(next.color);

      return new THREE.Color(
        lerp(start.r, end.r, ratio) / 255,
        lerp(start.g, end.g, ratio) / 255,
        lerp(start.b, end.b, ratio) / 255
      );
    }
  }

  return new THREE.Color(LIGHTING_SCALE[LIGHTING_SCALE.length - 1].color);
};

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const getZoneMatchers = (zone: Zone) => {
  const normalizedName = normalizeName(zone.name);
  return new Set([
    normalizeName(zone.id),
    normalizedName,
    `floor${zone.floor}`,
    `zone${normalizeName(zone.id)}`,
    `zone${normalizedName}`,
    `${normalizedName}${zone.floor}`,
  ]);
};

const getZoneColor = (zone: Zone, viewMode: ViewMode) => {
  if (viewMode === 'hvac') {
    const tempDiff = zone.temp - zone.targetTemp;
    if (tempDiff > 1.5) return new THREE.Color('#ef4444');
    if (tempDiff < -1.5) return new THREE.Color('#3b82f6');
    if (Math.abs(tempDiff) > 0.5) return new THREE.Color('#eab308');
    return new THREE.Color('#22c55e');
  }

  if (viewMode === 'lighting') {
    return getLightingColor(zone.lighting);
  }

  if (viewMode === 'occupancy') {
    return zone.occupied ? new THREE.Color('#22c55e') : new THREE.Color('#4b5563');
  }

  if (viewMode === 'energy') {
    const energyIntensity = zone.occupied ? 0.7 : 0.3;
    return new THREE.Color().setHSL(0.52, 0.8, 0.3 + energyIntensity * 0.2);
  }

  return new THREE.Color('#6b7280');
};

interface Building3DProps {
  zones: Zone[];
  selectedZoneId: string | null;
  viewMode: ViewMode;
  onZoneSelect: (zone: Zone) => void;
  solarOutput: number;
  onModelNormalized?: (maxDim: number) => void;
}

export const Building3D = ({
  zones,
  selectedZoneId,
  viewMode,
  onZoneSelect,
  onModelNormalized,
}: Building3DProps) => {
  const { scene } = useGLTF('/test_model.glb');
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [centerOffset, setCenterOffset] = useState<THREE.Vector3>(() => new THREE.Vector3(0, 0, 0));
  const [normalizationVersion, setNormalizationVersion] = useState(0);

  const zoneLookup = useMemo(() => {
    const lookup = new Map<string, Zone>();
    zones.forEach((zone) => {
      getZoneMatchers(zone).forEach((matcher) => lookup.set(matcher, zone));
    });
    return lookup;
  }, [zones]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      child.castShadow = true;
      child.receiveShadow = true;
      child.material = Array.isArray(child.material)
        ? child.material.map((material) => material.clone())
        : child.material.clone();
    });
  }, [clonedScene]);

  useEffect(() => {
    clonedScene.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(clonedScene);
    if (box.isEmpty()) {
      return;
    }

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const initialMaxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 80;
    const scale = targetSize / initialMaxDim;

    if (initialMaxDim > 500 || initialMaxDim < 1) {
      console.warn('Model scale may be incorrect:', initialMaxDim);
    }

    clonedScene.scale.setScalar(scale);
    clonedScene.updateWorldMatrix(true, true);

    box.setFromObject(clonedScene);
    const scaledSize = box.getSize(new THREE.Vector3());
    box.getCenter(center);

    const offset = new THREE.Vector3(-center.x, -center.y, -center.z);
    offset.y = -box.min.y;

    setCenterOffset(offset);
    onModelNormalized?.(Math.max(scaledSize.x, scaledSize.y, scaledSize.z));

    const existingBoxHelper = clonedScene.getObjectByName('__debug_box_helper__');
    if (existingBoxHelper) {
      clonedScene.remove(existingBoxHelper);
    }

    const existingAxesHelper = clonedScene.getObjectByName('__debug_axes_helper__');
    if (existingAxesHelper) {
      clonedScene.remove(existingAxesHelper);
    }

    const helper = new THREE.Box3Helper(box.clone(), 0xff0000);
    helper.name = '__debug_box_helper__';
    clonedScene.add(helper);

    const axes = new THREE.AxesHelper(20);
    axes.name = '__debug_axes_helper__';
    clonedScene.add(axes);

    setNormalizationVersion((value) => value + 1);
  }, [clonedScene, onModelNormalized]);

  const meshZoneLookup = useMemo(() => {
    const directMatches = new Map<string, Zone>();
    const claimedZones = new Set<string>();
    const unmatchedMeshes: { mesh: THREE.Mesh; centerY: number }[] = [];
    const modelBounds = new THREE.Box3().setFromObject(clonedScene);
    const modelHeight = Math.max(modelBounds.getSize(new THREE.Vector3()).y, 1);
    const bandTolerance = Math.max(modelHeight / Math.max(zones.length, 1) / 2.5, 0.3);

    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const normalizedName = normalizeName(child.name);
      const matchedZone = zoneLookup.get(normalizedName);

      if (matchedZone && !claimedZones.has(matchedZone.id)) {
        directMatches.set(child.uuid, matchedZone);
        claimedZones.add(matchedZone.id);
        return;
      }

      const meshBox = new THREE.Box3().setFromObject(child);
      const meshCenter = meshBox.getCenter(new THREE.Vector3());
      unmatchedMeshes.push({ mesh: child, centerY: meshCenter.y });
    });

    const remainingZones = [...zones]
      .filter((zone) => !claimedZones.has(zone.id))
      .sort((a, b) => b.floor - a.floor);
    const sortedUnmatchedMeshes = unmatchedMeshes.sort((a, b) => b.centerY - a.centerY);
    const floorBands: { centerY: number; meshes: THREE.Mesh[] }[] = [];

    sortedUnmatchedMeshes.forEach((entry) => {
      const existingBand = floorBands.find((band) => Math.abs(band.centerY - entry.centerY) <= bandTolerance);

      if (existingBand) {
        existingBand.meshes.push(entry.mesh);
        existingBand.centerY =
          (existingBand.centerY * (existingBand.meshes.length - 1) + entry.centerY) /
          existingBand.meshes.length;
        return;
      }

      floorBands.push({ centerY: entry.centerY, meshes: [entry.mesh] });
    });

    floorBands.forEach((band, index) => {
      const fallbackZone = remainingZones[index];
      if (!fallbackZone) return;

      band.meshes.forEach((mesh) => {
        directMatches.set(mesh.uuid, fallbackZone);
      });
    });

    return directMatches;
  }, [clonedScene, normalizationVersion, zoneLookup, zones]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const matchedZone = meshZoneLookup.get(child.uuid) ?? zoneLookup.get(normalizeName(child.name));
      child.userData.zoneId = matchedZone?.id ?? null;
      child.userData.zoneName = matchedZone?.name ?? null;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      const zone = matchedZone ?? null;
      const isSelected = zone?.id === selectedZoneId;
      const isHovered = zone?.id === hoveredZoneId;
      const baseColor = zone ? getZoneColor(zone, viewMode) : new THREE.Color('#6b7280');
      const emissiveColor = zone?.hasFault ? new THREE.Color('#ef4444') : baseColor;

      materials.forEach((material) => {
        const standardMaterial = material as THREE.MeshStandardMaterial;
        standardMaterial.color = baseColor.clone();
        standardMaterial.emissive = emissiveColor.clone();
        standardMaterial.envMapIntensity = 1.5;
        standardMaterial.transparent = true;
        standardMaterial.opacity = isSelected ? 0.98 : isHovered ? 0.92 : 0.84;
        standardMaterial.roughness = standardMaterial.roughness ?? 0.4;
        standardMaterial.metalness = standardMaterial.metalness ?? 0.2;

        if (zone) {
          if (viewMode === 'lighting') {
            standardMaterial.emissiveIntensity = (zone.lighting / 100) * 0.6;
          } else if (zone.occupied && viewMode === 'occupancy') {
            standardMaterial.emissiveIntensity = 0.3;
          } else if (zone.hasFault) {
            standardMaterial.emissiveIntensity = 0.4;
          } else {
            standardMaterial.emissiveIntensity = isSelected ? 0.32 : isHovered ? 0.18 : 0;
          }
        } else {
          standardMaterial.emissiveIntensity = 0;
        }

        standardMaterial.needsUpdate = true;
      });
    });
  }, [clonedScene, hoveredZoneId, meshZoneLookup, selectedZoneId, viewMode, zoneLookup]);

  useFrame((state) => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const zoneId = child.userData.zoneId as string | null;
      if (!zoneId) return;

      const zone = zones.find((item) => item.id === zoneId);
      if (!zone) return;

      if (zone.occupied && viewMode === 'occupancy') {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.01;
        child.scale.setScalar(scale);
      } else {
        child.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    });
  });

  return (
    <>
      <group position={centerOffset}>
        <primitive
          object={clonedScene}
          onPointerOver={(event: ThreeEvent<PointerEvent>) => {
            const mesh = event.object as THREE.Object3D;
            const zoneId = mesh.userData.zoneId as string | null;
            if (!zoneId) return;
            event.stopPropagation();
            setHoveredZoneId(zoneId);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(event: ThreeEvent<PointerEvent>) => {
            const mesh = event.object as THREE.Object3D;
            if (!mesh.userData.zoneId) return;
            event.stopPropagation();
            setHoveredZoneId((current) => (current === mesh.userData.zoneId ? null : current));
            document.body.style.cursor = 'default';
          }}
          onClick={(event: ThreeEvent<MouseEvent>) => {
            const mesh = event.object as THREE.Object3D;
            const zoneId = mesh.userData.zoneId as string | null;
            if (!zoneId) return;
            const zone = zones.find((item) => item.id === zoneId);
            if (!zone) return;
            event.stopPropagation();
            onZoneSelect(zone);
          }}
        />
      </group>

      <gridHelper args={[180, 36, '#1e3a5f', '#0f172a']} position={[0, 0, 0]} />
    </>
  );
};

useGLTF.preload('/test_model.glb');
