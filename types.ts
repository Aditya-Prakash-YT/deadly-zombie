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
  orbitRadius?: number; // For stable orbits
  orbitSpeed?: number; // For stable orbits
  description?: string;
  isLocked?: boolean; // If true, follows Keplerian rails instead of N-body physics
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