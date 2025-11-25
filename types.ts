export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export enum BodyType {
  STAR = 'STAR',
  PLANET = 'PLANET',
  MOON = 'MOON',
  DWARF_PLANET = 'DWARF_PLANET',
  ASTEROID = 'ASTEROID',
  CUSTOM = 'CUSTOM'
}

export interface OrbitalElements {
  semiMajorAxis: number; // a: Size of the orbit (simulation units)
  eccentricity: number; // e: Shape of the orbit (0 = circle, <1 = ellipse)
  inclination: number; // i: Tilt relative to the reference plane (radians)
  ascendingNode: number; // Ω: Orientation of the intersection line (radians)
  periapsis: number; // ω: Orientation of the ellipse in the orbital plane (radians)
  meanAnomalyEpoch: number; // M0: Position at time t=0 (radians)
}

export interface CelestialBody {
  id: string;
  name: string;
  type: BodyType;
  mass: number; // Relative mass
  radius: number; // Visual radius
  color: string;
  texture?: string; // Base64 or URL
  position: Vector3;
  velocity: Vector3;
  orbitalElements?: OrbitalElements; // Replaces simple radius/speed for Keplerian physics
  description?: string;
  isLocked?: boolean; // If true, follows Keplerian rails instead of N-body physics
  parentId?: string; // ID of the body this one orbits (if isLocked)
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isError?: boolean;
}

export interface SearchResult {
  title: string;
  uri: string;
}

export interface GroundingMetadata {
  web?: {
    uri: string;
    title: string;
  }[];
}