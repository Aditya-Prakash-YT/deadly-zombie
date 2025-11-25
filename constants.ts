import { BodyType, CelestialBody } from './types';

export const G_CONSTANT = 0.5; // Adjusted for visual simulation speed
export const TIME_STEP = 0.1; // Increased for better feel with Verlet integration

export const INITIAL_BODIES: CelestialBody[] = [
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
    position: { x: 10, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 4.5 },
    orbitRadius: 10,
    orbitSpeed: 2.5,
    isLocked: true,
    description: 'The smallest planet in the Solar System and the closest to the Sun. It has a rocky body like Earth but no substantial atmosphere.'
  },
  {
    id: 'venus',
    name: 'Venus',
    type: BodyType.PLANET,
    mass: 2,
    radius: 1.2,
    color: '#E3BB76',
    position: { x: 15, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 3.5 },
    orbitRadius: 15,
    orbitSpeed: 2.0,
    isLocked: true,
    description: 'The second planet from the Sun. It has a thick, toxic atmosphere filled with carbon dioxide and sulfuric acid clouds.'
  },
  {
    id: 'earth',
    name: 'Earth',
    type: BodyType.PLANET,
    mass: 2.5,
    radius: 1.3,
    color: '#22A6B3',
    position: { x: 20, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 3 },
    orbitRadius: 20,
    orbitSpeed: 1.5,
    isLocked: true,
    description: 'Our home planet, the third from the Sun. It is the only place we know of so far that’s inhabited by living things.'
  },
  {
    id: 'mars',
    name: 'Mars',
    type: BodyType.PLANET,
    mass: 1.5,
    radius: 1,
    color: '#EB4D4B',
    position: { x: 26, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 2.4 },
    orbitRadius: 26,
    orbitSpeed: 1.2,
    isLocked: true,
    description: 'The fourth planet from the Sun. Known as the Red Planet due to iron oxide rust on its surface. It has the largest volcano in the solar system.'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: BodyType.PLANET,
    mass: 80,
    radius: 3.5,
    color: '#D35400',
    position: { x: 40, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 1.8 },
    orbitRadius: 40,
    orbitSpeed: 0.8,
    isLocked: true,
    description: 'The largest planet in the Solar System. It is a gas giant with a mass more than two and a half times that of all the other planets combined.'
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: BodyType.PLANET,
    mass: 60,
    radius: 3,
    color: '#F1C40F',
    position: { x: 55, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 1.4 },
    orbitRadius: 55,
    orbitSpeed: 0.6,
    isLocked: true,
    description: 'The sixth planet from the Sun and the second-largest. It is best known for its fabulous ring system.'
  }
];