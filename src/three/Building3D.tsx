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
  onModelNormalized?: (info: { maxDim: number; height: number }) => void;
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

    const allBox = new THREE.Box3().setFromObject(clonedScene);
    if (allBox.isEmpty()) {
      return;
    }

    const size = allBox.getSize(new THREE.Vector3());
    const center = allBox.getCenter(new THREE.Vector3());
    const initialMaxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 80;
    const scale = targetSize / initialMaxDim;

    if (initialMaxDim > 500 || initialMaxDim < 1) {
      console.warn('Model scale may be incorrect:', initialMaxDim);
    }

    clonedScene.scale.setScalar(scale);
    clonedScene.updateWorldMatrix(true, true);

    allBox.setFromObject(clonedScene);
    const scaledSize = allBox.getSize(new THREE.Vector3());

    // Some models include a large, thin basement/base slab that skews centering.
    // Hide only the *largest* thin near-ground slab (by XZ area), then center using the main occupied floors.
    const focusBox = new THREE.Box3();
    const allHeight = Math.max(scaledSize.y, 1e-6);
    // Base slab should be very thin relative to total model height.
    const baseThicknessLimit = allHeight * 0.03;
    const minY = allBox.min.y;
    // Keep this tight so we don't accidentally classify the real Ground Floor as "base".
    const nearGroundLimit = minY + allHeight * 0.06;

    const meshEntries: Array<{
      mesh: THREE.Mesh;
      box: THREE.Box3;
      size: THREE.Vector3;
      areaXZ: number;
      isCandidateBase: boolean;
    }> = [];

    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      // Reset any previous visibility changes when re-normalizing.
      child.visible = true;

      const meshBox = new THREE.Box3().setFromObject(child);
      if (meshBox.isEmpty()) return;

      const meshSize = meshBox.getSize(new THREE.Vector3());
      const areaXZ = meshSize.x * meshSize.z;
      const isCandidateBase =
        meshSize.y <= baseThicknessLimit &&
        meshBox.min.y <= minY + allHeight * 0.02 &&
        meshBox.max.y <= nearGroundLimit &&
        areaXZ > 0;

      meshEntries.push({ mesh: child, box: meshBox, size: meshSize, areaXZ, isCandidateBase });
    });

    // Determine the model "base" as the lowest vertical band (instead of heuristic slab detection).
    // This prevents misclassifying the real Ground Floor as base.
    let baseBandMaxY: number | null = null;

    // Build vertical "bands" and compute a focus box from the top N major bands (Ground..Floor 5).
    // We do not hide/reorder floors here; this is only for centering/grounding/camera framing.
    const desiredBandCount = Math.max(zones.length, 1);
    const bandTolerance = Math.max(allHeight / desiredBandCount / 2.2, 0.35);
    const footprintArea = Math.max(scaledSize.x * scaledSize.z, 1e-6);
    const bands: { centerY: number; minY: number; maxY: number; meshes: THREE.Mesh[]; areaXZ: number }[] = [];

    meshEntries.forEach((entry) => {
      if (!entry.mesh.visible) return;
      const meshCenter = entry.box.getCenter(new THREE.Vector3());
      const existing = bands.find((band) => Math.abs(band.centerY - meshCenter.y) <= bandTolerance);

      if (existing) {
        existing.meshes.push(entry.mesh);
        existing.centerY = (existing.centerY * (existing.meshes.length - 1) + meshCenter.y) / existing.meshes.length;
        existing.minY = Math.min(existing.minY, entry.box.min.y);
        existing.maxY = Math.max(existing.maxY, entry.box.max.y);
        existing.areaXZ += entry.size.x * entry.size.z;
        return;
      }

      bands.push({
        centerY: meshCenter.y,
        minY: entry.box.min.y,
        maxY: entry.box.max.y,
        meshes: [entry.mesh],
        areaXZ: entry.size.x * entry.size.z,
      });
    });

    const sortedBands = bands.sort((a, b) => a.minY - b.minY);
    const primaryBands = sortedBands.filter((band) => band.areaXZ / footprintArea >= 0.03);
    const bandsToUse = primaryBands.length >= desiredBandCount ? primaryBands : sortedBands;

    // Anchor at "Ground": select the first N floor bands above the base slab height (if detected).
    if (bandsToUse.length > 0) {
      baseBandMaxY = bandsToUse[0].maxY;
    }

    const groundAnchoredBands =
      baseBandMaxY === null
        ? bandsToUse
        : bandsToUse.filter((band) => band.minY >= baseBandMaxY! - bandTolerance * 0.25);

    // Map/focus the first N bands above base: Ground..Floor 5. Any extra above (e.g. roof) is ignored.
    const keptBands = groundAnchoredBands.slice(0, desiredBandCount);

    const keptMeshes = new Set<string>();
    keptBands.forEach((band) => band.meshes.forEach((mesh) => keptMeshes.add(mesh.uuid)));

    const weightedCenter = new THREE.Vector3(0, 0, 0);
    let weightSum = 0;
    const tmpCenter = new THREE.Vector3();

    meshEntries.forEach((entry) => {
      if (!entry.mesh.visible) return;
      if (!keptMeshes.has(entry.mesh.uuid)) return;
      focusBox.union(entry.box);

      // Weight by footprint area so large slabs/floors dominate centering (better than pure bounds for asymmetric models).
      const weight = Math.max(entry.size.x * entry.size.z, 1e-6);
      entry.box.getCenter(tmpCenter);
      weightedCenter.x += tmpCenter.x * weight;
      weightedCenter.y += tmpCenter.y * weight;
      weightedCenter.z += tmpCenter.z * weight;
      weightSum += weight;
    });

    const centerBox = focusBox.isEmpty() ? allBox : focusBox;
    centerBox.getCenter(center);
    if (weightSum > 0) {
      center.x = weightedCenter.x / weightSum;
      center.z = weightedCenter.z / weightSum;
    }

    const offset = new THREE.Vector3(-center.x, 0, -center.z);
    // Ground at the lowest point of the focused floors (so Ground sits on the grid even if basements exist).
    offset.y = -(focusBox.isEmpty() ? allBox.min.y : focusBox.min.y);

    setCenterOffset(offset);

    const visibleSize = (focusBox.isEmpty() ? allBox : focusBox).getSize(new THREE.Vector3());
    onModelNormalized?.({
      maxDim: Math.max(visibleSize.x, visibleSize.y, visibleSize.z),
      height: visibleSize.y,
    });

    setNormalizationVersion((value) => value + 1);
  }, [clonedScene, onModelNormalized, zones.length]);

  const meshZoneLookup = useMemo(() => {
    const directMatches = new Map<string, Zone>();
    const claimedZones = new Set<string>();
    const unmatchedMeshes: { mesh: THREE.Mesh; centerY: number; minY: number; maxY: number; areaXZ: number }[] = [];
    const modelBounds = new THREE.Box3().setFromObject(clonedScene);
    const modelHeight = Math.max(modelBounds.getSize(new THREE.Vector3()).y, 1);
    const bandTolerance = Math.max(modelHeight / Math.max(zones.length, 1) / 2.5, 0.3);
    const footprintArea = Math.max(modelBounds.getSize(new THREE.Vector3()).x * modelBounds.getSize(new THREE.Vector3()).z, 1e-6);
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      if (!child.visible) return;

      const normalizedName = normalizeName(child.name);
      const matchedZone = zoneLookup.get(normalizedName);

      if (matchedZone && !claimedZones.has(matchedZone.id)) {
        directMatches.set(child.uuid, matchedZone);
        claimedZones.add(matchedZone.id);
        return;
      }

      const meshBox = new THREE.Box3().setFromObject(child);
      const meshCenter = meshBox.getCenter(new THREE.Vector3());
      const meshSize = meshBox.getSize(new THREE.Vector3());
      unmatchedMeshes.push({
        mesh: child,
        centerY: meshCenter.y,
        minY: meshBox.min.y,
        maxY: meshBox.max.y,
        areaXZ: meshSize.x * meshSize.z,
      });
    });

    const remainingZones = [...zones]
      .filter((zone) => !claimedZones.has(zone.id))
      .sort((a, b) => a.floor - b.floor);
    const sortedUnmatchedMeshes = unmatchedMeshes.sort((a, b) => a.centerY - b.centerY);
    const floorBands: { centerY: number; minY: number; maxY: number; meshes: THREE.Mesh[]; areaXZ: number }[] = [];

    sortedUnmatchedMeshes.forEach((entry) => {
      const existingBand = floorBands.find((band) => Math.abs(band.centerY - entry.centerY) <= bandTolerance);

      if (existingBand) {
        existingBand.meshes.push(entry.mesh);
        existingBand.centerY =
          (existingBand.centerY * (existingBand.meshes.length - 1) + entry.centerY) /
          existingBand.meshes.length;
        existingBand.minY = Math.min(existingBand.minY, entry.minY);
        existingBand.maxY = Math.max(existingBand.maxY, entry.maxY);
        existingBand.areaXZ += entry.areaXZ;
        return;
      }

      floorBands.push({
        centerY: entry.centerY,
        minY: entry.minY,
        maxY: entry.maxY,
        meshes: [entry.mesh],
        areaXZ: entry.areaXZ,
      });
    });

    // Map lowest geometry band -> lowest zone.floor (Ground), then upward.
    const sortedBands = floorBands.sort((a, b) => a.minY - b.minY);
    const primaryBands = sortedBands.filter((band) => band.areaXZ / footprintArea >= 0.03);
    const bandsToUse = primaryBands.length >= remainingZones.length ? primaryBands : sortedBands;

    // Anchor at the lowest band (base), then map the next N bands to Ground..Floor 5.
    // This avoids skipping the real Ground floor even when it's a large thin slab.
    const baseBandMaxY = bandsToUse.length > 0 ? bandsToUse[0].maxY : null;
    const groundAnchoredBands =
      baseBandMaxY === null
        ? bandsToUse
        : bandsToUse.filter((band) => band.minY >= baseBandMaxY - bandTolerance * 0.25);

    // Order by band centerY (not minY) to avoid swapping adjacent floors due to stairs/overhangs.
    const keptBands = [...groundAnchoredBands].sort((a, b) => a.centerY - b.centerY).slice(0, remainingZones.length);

    keptBands.forEach((band, index) => {
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
