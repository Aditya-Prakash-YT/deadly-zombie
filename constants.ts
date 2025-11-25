import { BodyType, CelestialBody, Vector3 } from './types';

export const G_CONSTANT = 0.5; // Adjusted for visual simulation speed
export const TIME_STEP = 0.1; // Increased for better feel with Verlet integration

// Helper to convert degrees to radians
const degToRad = (deg: number) => (deg * Math.PI) / 180;

const PLANETS: CelestialBody[] = [
  {
    id: 'sun',
    name: 'Sun',
    type: BodyType.STAR,
    mass: 1000,
    radius: 4,
    color: '#FDB813',
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    isLocked: true,
    description: 'The star at the center of our Solar System. It contains 99.86% of the system\'s total mass and is a nearly perfect sphere of hot plasma.'
  },
  {
    id: 'mercury',
    name: 'Mercury',
    type: BodyType.PLANET,
    mass: 1,
    radius: 0.8,
    color: '#A5A5A5',
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    orbitalElements: {
        semiMajorAxis: 10,
        eccentricity: 0.205,
        inclination: degToRad(7),
        ascendingNode: degToRad(48),
        periapsis: degToRad(29),
        meanAnomalyEpoch: Math.random() * 6
    },
    isLocked: true,
    parentId: 'sun',
    description: 'The smallest planet in the Solar System and the closest to the Sun. It has a rocky body like Earth but no substantial atmosphere.'
  },
  {
    id: 'venus',
    name: 'Venus',
    type: BodyType.PLANET,
    mass: 2,
    radius: 1.2,
    color: '#E3BB76',
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    orbitalElements: {
        semiMajorAxis: 16,
        eccentricity: 0.007,
        inclination: degToRad(3.4),
        ascendingNode: degToRad(76),
        periapsis: degToRad(55),
        meanAnomalyEpoch: Math.random() * 6
    },
    isLocked: true,
    parentId: 'sun',
    description: 'The second planet from the Sun. It has a thick, toxic atmosphere filled with carbon dioxide and sulfuric acid clouds.'
  },
  {
    id: 'earth',
    name: 'Earth',
    type: BodyType.PLANET,
    mass: 2.5,
    radius: 1.3,
    color: '#22A6B3',
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    orbitalElements: {
        semiMajorAxis: 24,
        eccentricity: 0.017,
        inclination: degToRad(0), // Reference plane
        ascendingNode: degToRad(0), // Reference plane
        periapsis: degToRad(102),
        meanAnomalyEpoch: Math.random() * 6
    },
    isLocked: true,
    parentId: 'sun',
    description: 'Our home planet, the third from the Sun. It is the only place we know of so far that’s inhabited by living things.'
  },
  {
    id: 'mars',
    name: 'Mars',
    type: BodyType.PLANET,
    mass: 1.5,
    radius: 1,
    color: '#EB4D4B',
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    orbitalElements: {
        semiMajorAxis: 36,
        eccentricity: 0.094,
        inclination: degToRad(1.85),
        ascendingNode: degToRad(49),
        periapsis: degToRad(286),
        meanAnomalyEpoch: Math.random() * 6
    },
    isLocked: true,
    parentId: 'sun',
    description: 'The fourth planet from the Sun. Known as the Red Planet due to iron oxide rust on its surface. It has the largest volcano in the solar system.'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: BodyType.PLANET,
    mass: 80,
    radius: 3.5,
    color: '#D35400',
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    orbitalElements: {
        semiMajorAxis: 70,
        eccentricity: 0.049,
        inclination: degToRad(1.3),
        ascendingNode: degToRad(100),
        periapsis: degToRad(273),
        meanAnomalyEpoch: Math.random() * 6
    },
    isLocked: true,
    parentId: 'sun',
    description: 'The largest planet in the Solar System. It is a gas giant with a mass more than two and a half times that of all the other planets combined.'
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: BodyType.PLANET,
    mass: 60,
    radius: 3,
    color: '#F1C40F',
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    orbitalElements: {
        semiMajorAxis: 110,
        eccentricity: 0.057,
        inclination: degToRad(2.48),
        ascendingNode: degToRad(113),
        periapsis: degToRad(339),
        meanAnomalyEpoch: Math.random() * 6
    },
    isLocked: true,
    parentId: 'sun',
    description: 'The sixth planet from the Sun and the second-largest. It is best known for its fabulous ring system.'
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: BodyType.PLANET,
    mass: 30,
    radius: 2.5,
    color: '#73C6B6',
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    orbitalElements: {
        semiMajorAxis: 160,
        eccentricity: 0.046,
        inclination: degToRad(0.77),
        ascendingNode: degToRad(74),
        periapsis: degToRad(96),
        meanAnomalyEpoch: Math.random() * 6
    },
    isLocked: true,
    parentId: 'sun',
    description: 'The seventh planet from the Sun. It has the third-largest planetary radius and fourth-largest planetary mass in the Solar System.'
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: BodyType.PLANET,
    mass: 32,
    radius: 2.4,
    color: '#2E86C1',
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    orbitalElements: {
        semiMajorAxis: 220,
        eccentricity: 0.011,
        inclination: degToRad(1.77),
        ascendingNode: degToRad(131),
        periapsis: degToRad(273),
        meanAnomalyEpoch: Math.random() * 6
    },
    isLocked: true,
    parentId: 'sun',
    description: 'The eighth and farthest-known Solar planet from the Sun. It is the fourth-largest planet in the Solar System by diameter and the densest giant planet.'
  },
  {
    id: 'pluto',
    name: 'Pluto',
    type: BodyType.DWARF_PLANET,
    mass: 0.8,
    radius: 0.6,
    color: '#D7BDE2',
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    orbitalElements: {
        semiMajorAxis: 280,
        eccentricity: 0.244,
        inclination: degToRad(17.16),
        ascendingNode: degToRad(110),
        periapsis: degToRad(113),
        meanAnomalyEpoch: Math.random() * 6
    },
    isLocked: true,
    parentId: 'sun',
    description: 'A dwarf planet in the Kuiper belt, a ring of bodies beyond the orbit of Neptune. It was the first and the largest Kuiper belt object to be discovered.'
  }
];

const MOONS: CelestialBody[] = [
    {
        id: 'moon',
        name: 'Moon',
        type: BodyType.MOON,
        mass: 0.5,
        radius: 0.4,
        color: '#BDC3C7',
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        orbitalElements: {
            semiMajorAxis: 3,
            eccentricity: 0.0549,
            inclination: degToRad(5.14),
            ascendingNode: Math.random() * 6,
            periapsis: Math.random() * 6,
            meanAnomalyEpoch: Math.random() * 6
        },
        isLocked: true,
        parentId: 'earth',
        description: "Earth's only natural satellite. It is the fifth largest satellite in the Solar System."
    },
    {
        id: 'io',
        name: 'Io',
        type: BodyType.MOON,
        mass: 0.6,
        radius: 0.5,
        color: '#F4D03F',
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        orbitalElements: {
            semiMajorAxis: 5,
            eccentricity: 0.0041,
            inclination: degToRad(0.05),
            ascendingNode: Math.random() * 6,
            periapsis: Math.random() * 6,
            meanAnomalyEpoch: Math.random() * 6
        },
        isLocked: true,
        parentId: 'jupiter',
        description: 'The innermost of the four Galilean moons of the planet Jupiter. It is the most geologically active object in the Solar System.'
    },
    {
        id: 'europa',
        name: 'Europa',
        type: BodyType.MOON,
        mass: 0.5,
        radius: 0.45,
        color: '#D6EAF8',
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        orbitalElements: {
            semiMajorAxis: 7,
            eccentricity: 0.009,
            inclination: degToRad(0.47),
            ascendingNode: Math.random() * 6,
            periapsis: Math.random() * 6,
            meanAnomalyEpoch: Math.random() * 6
        },
        isLocked: true,
        parentId: 'jupiter',
        description: 'The smallest of the four Galilean moons orbiting Jupiter. It has a water-ice crust and likely a subsurface ocean.'
    },
    {
        id: 'titan',
        name: 'Titan',
        type: BodyType.MOON,
        mass: 1.2,
        radius: 0.7,
        color: '#E59866',
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        orbitalElements: {
            semiMajorAxis: 8,
            eccentricity: 0.0288,
            inclination: degToRad(0.348),
            ascendingNode: Math.random() * 6,
            periapsis: Math.random() * 6,
            meanAnomalyEpoch: Math.random() * 6
        },
        isLocked: true,
        parentId: 'saturn',
        description: 'The largest moon of Saturn and the second-largest natural satellite in the Solar System.'
    }
];

const generateRing = (count: number, minRadius: number, maxRadius: number, namePrefix: string, color: string, parentId: string = 'sun'): CelestialBody[] => {
    const bodies: CelestialBody[] = [];
    for(let i=0; i<count; i++) {
        // Generate random orbital elements for the belt
        const semiMajorAxis = minRadius + Math.random() * (maxRadius - minRadius);
        const eccentricity = Math.random() * 0.2; // Some eccentricity
        const inclination = (Math.random() - 0.5) * 0.4; // +/- 11 degrees ish
        const ascendingNode = Math.random() * Math.PI * 2;
        const periapsis = Math.random() * Math.PI * 2;
        const meanAnomalyEpoch = Math.random() * Math.PI * 2;

        // Random sizes: mostly small, some larger for variety
        const scale = Math.random();
        let radius;
        if (scale > 0.98) {
             radius = 0.3 + Math.random() * 0.3; // Very Rare Large
        } else if (scale > 0.90) {
             radius = 0.15 + Math.random() * 0.15; // Rare Medium
        } else {
             radius = 0.04 + Math.random() * 0.06; // Common Small
        }

        bodies.push({
            id: `${namePrefix}_${Math.random().toString(36).substr(2, 6)}`,
            name: `${namePrefix} ${i}`,
            type: BodyType.ASTEROID,
            mass: 0.01 + Math.random() * 0.05,
            radius: radius,
            color: color,
            position: { x: 0, y: 0, z: 0 }, // Calculated by physics engine or orbital prop
            velocity: { x: 0, y: 0, z: 0 },
            isLocked: true, // Use Keplerian orbits for efficiency and stability in belts
            parentId: parentId,
            orbitalElements: {
                semiMajorAxis,
                eccentricity,
                inclination,
                ascendingNode,
                periapsis,
                meanAnomalyEpoch
            },
            description: 'A small rocky or icy body drifting through space.'
        });
    }
    return bodies;
};

// Generate Asteroid Belt (Between Mars and Jupiter)
// Increased density: 1200 asteroids
const ASTEROID_BELT = generateRing(1200, 42, 58, 'Asteroid', '#7f8c8d');

// Generate Kuiper Belt (Beyond Neptune)
// Increased density: 1200 objects
const KUIPER_BELT = generateRing(1200, 240, 300, 'KBO', '#6c5ce7');

export const INITIAL_BODIES: CelestialBody[] = [
    ...PLANETS,
    ...MOONS,
    ...ASTEROID_BELT,
    ...KUIPER_BELT
];