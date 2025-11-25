import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Trail, Line } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialBody, Vector3, BodyType, OrbitalElements } from '../types';
import { G_CONSTANT, TIME_STEP } from '../constants';

interface SceneProps {
  bodies: CelestialBody[];
  setBodies: React.Dispatch<React.SetStateAction<CelestialBody[]>>;
  paused: boolean;
  gravityViz: boolean;
  onBodyClick: (body: CelestialBody) => void;
  selectedBody: CelestialBody | null;
}

// --- Orbital Mechanics Helpers ---

/**
 * Solves Kepler's Equation M = E - e*sin(E) for E (Eccentric Anomaly)
 * using Newton-Raphson iteration.
 */
const solveKepler = (M: number, e: number): number => {
    let E = M;
    const tolerance = 1e-6;
    for (let i = 0; i < 10; i++) {
        const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E = E - dE;
        if (Math.abs(dE) < tolerance) break;
    }
    return E;
};

/**
 * Calculates the 3D position of a body given its orbital elements and current time.
 * Returns position relative to the parent body.
 */
const calculateOrbitalPosition = (elements: OrbitalElements, time: number, parentMass: number): Vector3 => {
    const { semiMajorAxis: a, eccentricity: e, inclination: i, ascendingNode: omega_uppercase, periapsis: omega_lowercase, meanAnomalyEpoch: M0 } = elements;
    
    // 1. Calculate Mean Anomaly (M)
    // n = sqrt(mu / a^3) where mu = G * M_parent
    const mu = G_CONSTANT * parentMass;
    const n = Math.sqrt(mu / Math.pow(a, 3));
    const M = M0 + n * time;

    // 2. Solve for Eccentric Anomaly (E)
    const E = solveKepler(M, e);

    // 3. Calculate True Anomaly (v)
    // tan(v/2) = sqrt((1+e)/(1-e)) * tan(E/2)
    const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));

    // 4. Calculate Distance (r)
    const r = a * (1 - e * Math.cos(E));

    // 5. Position in Orbital Plane (Perifocal Coordinate System)
    // x' points towards periapsis
    const x_orb = r * Math.cos(v);
    const y_orb = r * Math.sin(v);
    
    // 6. Rotate to 3D Heliocentric/Geocentric Coords
    // We use standard rotation matrices for:
    // - Argument of Periapsis (w)
    // - Inclination (i)
    // - Longitude of Ascending Node (Ω)
    
    const cos_w = Math.cos(omega_lowercase);
    const sin_w = Math.sin(omega_lowercase);
    const cos_i = Math.cos(i);
    const sin_i = Math.sin(i);
    const cos_O = Math.cos(omega_uppercase);
    const sin_O = Math.sin(omega_uppercase);

    // P = x_orb, Q = y_orb
    const P = x_orb;
    const Q = y_orb;

    // Standard Astronomy Rotation (Z-up system)
    
    // Rotate by w around Z
    const x1 = P * cos_w - Q * sin_w;
    const y1 = P * sin_w + Q * cos_w;
    const z1 = 0;

    // Rotate by i around X
    const x2 = x1;
    const y2 = y1 * cos_i - z1 * sin_i;
    const z2 = y1 * sin_i + z1 * cos_i;

    // Rotate by Ω around Z
    const x3 = x2 * cos_O - y2 * sin_O;
    const y3 = x2 * sin_O + y2 * cos_O;
    const z3 = z2;

    // 7. Convert to Three.js Coordinate System (Y-up)
    // Standard Z (North) -> Three Y.
    // Standard X (Vernal Equinox) -> Three X.
    // Standard Y -> Three -Z.
    
    return { x: x3, y: z3, z: -y3 };
};

// --- Components ---

const CameraController = ({ controlsRef, selectedBody }: { controlsRef: React.RefObject<any>, selectedBody: CelestialBody | null }) => {
  const { camera } = useThree();
  const [movement, setMovement] = useState({ w: false, a: false, s: false, d: false });
  const [isResetting, setIsResetting] = useState(false);
  const [followTarget, setFollowTarget] = useState<CelestialBody | null>(null);

  // Sync follow target when prop changes
  useEffect(() => {
    if (selectedBody) {
        setFollowTarget(selectedBody);
        setIsResetting(false);
    }
  }, [selectedBody]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keys if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      switch(e.key.toLowerCase()) {
        case 'w': setMovement(m => ({ ...m, w: true })); break;
        case 'a': setMovement(m => ({ ...m, a: true })); break;
        case 's': setMovement(m => ({ ...m, s: true })); break;
        case 'd': setMovement(m => ({ ...m, d: true })); break;
        case 'y': 
          setIsResetting(true);
          setFollowTarget(null);
          break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
       switch(e.key.toLowerCase()) {
        case 'w': setMovement(m => ({ ...m, w: false })); break;
        case 'a': setMovement(m => ({ ...m, a: false })); break;
        case 's': setMovement(m => ({ ...m, s: false })); break;
        case 'd': setMovement(m => ({ ...m, d: false })); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [camera, controlsRef]);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    
    // --- WASD Movement ---
    const speed = (camera.position.y > 50 ? 80 : 40) * delta; 
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();
    const moveDir = new THREE.Vector3(0, 0, 0);

    if (movement.w) moveDir.add(forward);
    if (movement.s) moveDir.sub(forward);
    if (movement.d) moveDir.add(right);
    if (movement.a) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize().multiplyScalar(speed);
      camera.position.add(moveDir);
      controlsRef.current.target.add(moveDir);
      // Break auto-follow/reset if manual movement occurs
      setIsResetting(false);
      setFollowTarget(null);
    }

    // --- Smooth Transition Logic ---
    // Smooth factor (higher = faster, lower = smoother)
    const damping = 4 * delta; 

    if (isResetting) {
        // Target: 0,0,0
        // Cam Pos: 0, 80, 120
        const targetVec = new THREE.Vector3(0, 0, 0);
        const camVec = new THREE.Vector3(0, 80, 120);

        controlsRef.current.target.lerp(targetVec, damping);
        camera.position.lerp(camVec, damping);
        
        // Stop resetting if close enough
        if (camera.position.distanceTo(camVec) < 1 && controlsRef.current.target.distanceTo(targetVec) < 1) {
            setIsResetting(false);
        }
    } else if (followTarget) {
         // Smooth Pan to selected body
         const bodyPos = new THREE.Vector3(followTarget.position.x, followTarget.position.y, followTarget.position.z);
         
         // Interpolate target
         const currentTarget = controlsRef.current.target.clone();
         const newTarget = currentTarget.clone().lerp(bodyPos, damping);
         
         // Calculate current offset of camera relative to target
         const offset = camera.position.clone().sub(currentTarget);
         
         // Apply new positions
         // By adding offset to the new target, we keep the camera's relative angle/zoom but move it along with the target
         controlsRef.current.target.copy(newTarget);
         camera.position.copy(newTarget.clone().add(offset));
    }
    
    controlsRef.current.update();
  });

  return null;
}

const PlanetMesh = ({ body, onClick, isSelected }: { body: CelestialBody; onClick: (b: CelestialBody) => void; isSelected: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  const [textureMap, setTextureMap] = useState<THREE.Texture | null>(null);

  // Selection Pulse Logic
  const haloRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (body.texture) {
      textureLoader.load(body.texture, (tex) => {
        setTextureMap(tex);
      });
    } else {
      setTextureMap(null);
    }
  }, [body.texture, textureLoader]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.set(body.position.x, body.position.y, body.position.z);
      meshRef.current.rotation.y += 0.005; // Self rotation
    }
    if (isSelected && haloRef.current) {
        const t = state.clock.getElapsedTime();
        const scale = 1.0 + Math.sin(t * 3) * 0.15; // Pulse between 0.85 and 1.15 scale addition
        haloRef.current.scale.set(scale, scale, scale);
    }
  });

  const isAsteroid = body.type === BodyType.ASTEROID;

  return (
    <group>
        {/* Selection Halo */}
        {isSelected && (
            <mesh ref={haloRef} position={[body.position.x, body.position.y, body.position.z]}>
                <sphereGeometry args={[body.radius * 1.6, 32, 32]} />
                <meshBasicMaterial 
                    color={body.color} 
                    transparent 
                    opacity={0.3} 
                    depthWrite={false} 
                    blending={THREE.AdditiveBlending} 
                />
            </mesh>
        )}

        {/* Only show trail for major bodies */}
        {isAsteroid ? (
             <mesh
             ref={meshRef}
             onClick={(e) => {
               e.stopPropagation();
               onClick(body);
             }}
           >
             <sphereGeometry args={[body.radius, 8, 8]} />
             <meshStandardMaterial
               color={body.color}
               emissive={'black'}
             />
           </mesh>
        ) : (
            <Trail width={1} length={20} color={body.color} attenuation={(t) => t * t}>
                <mesh
                ref={meshRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(body);
                }}
                >
                <sphereGeometry args={[body.radius, 32, 32]} />
                <meshStandardMaterial
                    color={textureMap ? 'white' : body.color}
                    map={textureMap}
                    emissive={body.type === BodyType.STAR ? body.color : 'black'}
                    emissiveIntensity={body.type === BodyType.STAR ? 2 : 0}
                />
                </mesh>
            </Trail>
        )}

        {/* Hide names for asteroids to reduce clutter */}
        {!isAsteroid && (
           <Text
             position={[body.position.x, body.position.y + body.radius + 1, body.position.z]}
             fontSize={1}
             color="white"
             anchorX="center"
             anchorY="middle"
           >
             {body.name}
           </Text>
        )}
    </group>
  );
};

const KeplerOrbitLine = ({ body, allBodies, isSelected }: { body: CelestialBody, allBodies: CelestialBody[], isSelected: boolean }) => {
    const parent = allBodies.find(b => b.id === body.parentId);
    
    const points = useMemo(() => {
        if (!body.orbitalElements) return [];
        
        const pts = [];
        const segments = 128;
        
        for (let i = 0; i <= segments; i++) {
            const M = (i / segments) * Math.PI * 2;
            const { semiMajorAxis: a, eccentricity: e, inclination: inc, ascendingNode: O, periapsis: w } = body.orbitalElements;
            
            const E = solveKepler(M, e);
            const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
            const r = a * (1 - e * Math.cos(E));
            
            const x_orb = r * Math.cos(v);
            const y_orb = r * Math.sin(v);
            
            const cos_w = Math.cos(w);
            const sin_w = Math.sin(w);
            const cos_i = Math.cos(inc);
            const sin_i = Math.sin(inc);
            const cos_O = Math.cos(O);
            const sin_O = Math.sin(O);
            
            const x1 = x_orb * cos_w - y_orb * sin_w;
            const y1 = x_orb * sin_w + y_orb * cos_w;
            const z1 = 0;
            
            const x2 = x1;
            const y2 = y1 * cos_i - z1 * sin_i;
            const z2 = y1 * sin_i + z1 * cos_i;
            
            const x3 = x2 * cos_O - y2 * sin_O;
            const y3 = x2 * sin_O + y2 * cos_O;
            const z3 = z2;

            pts.push(new THREE.Vector3(x3, z3, -y3));
        }
        return pts;
    }, [body.orbitalElements]);

    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (!groupRef.current || !parent) return;
        groupRef.current.position.set(parent.position.x, parent.position.y, parent.position.z);
    });

    if (points.length === 0) return null;

    return (
        <group ref={groupRef}>
            <Line 
                points={points} 
                color={isSelected ? '#ffffff' : body.color} 
                opacity={isSelected ? 0.7 : 0.2} 
                transparent 
                lineWidth={isSelected ? 3 : 1} 
            />
        </group>
    );
};

const GravityWell = ({ bodies }: { bodies: CelestialBody[] }) => {
    const shaderRef = useRef<THREE.ShaderMaterial>(null);
    const MAX_BODIES = 32;

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uBodies: { value: new Float32Array(MAX_BODIES * 4) },
        uBodyCount: { value: 0 }
    }), []);

    useFrame((state) => {
        if (!shaderRef.current) return;
        
        shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        
        const bodiesArray = shaderRef.current.uniforms.uBodies.value;
        let count = 0;
        
        for (const body of bodies) {
            if (count >= MAX_BODIES) break;
            // Only consider massive bodies for the visualization to keep it clean
            if (body.mass < 1.0) continue; 
            
            bodiesArray[count * 4] = body.position.x;
            bodiesArray[count * 4 + 1] = body.position.y;
            bodiesArray[count * 4 + 2] = body.position.z;
            bodiesArray[count * 4 + 3] = body.mass;
            count++;
        }
        shaderRef.current.uniforms.uBodyCount.value = count;
    });

    const vertexShader = `
      varying vec2 vUv;
      varying float vElevation;
      uniform vec4 uBodies[32];
      uniform int uBodyCount;

      void main() {
        vUv = uv;
        vec3 pos = position;
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        
        float elevation = 0.0;
        for (int i = 0; i < 32; i++) {
            if (i >= uBodyCount) break;
            vec3 bodyPos = uBodies[i].xyz;
            float mass = uBodies[i].w;
            // Distance in XZ plane (since plane is flat on ground)
            float dist = distance(worldPos.xyz, vec3(bodyPos.x, 0.0, bodyPos.z));
            
            // Gravity funnel formula: -Mass / Distance^p
            // We use 0.8 for distance power to make the well wider
            float influence = (mass * 4.0) / (pow(dist, 0.9) + 1.0);
            elevation -= influence; 
        }
        
        // Clamp elevation so it doesn't go into infinite abyss
        // elevation = max(elevation, -50.0);
        
        pos.z += elevation; // Local Z is World Y due to rotation
        vElevation = elevation;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      varying float vElevation;
      uniform float uTime;

      void main() {
        // Create a grid
        float scale = 80.0;
        vec2 grid = fract(vUv * scale);
        
        // Thin glowing lines
        float width = 0.03;
        float lineX = smoothstep(1.0 - width, 1.0, grid.x) + smoothstep(width, 0.0, grid.x);
        float lineY = smoothstep(1.0 - width, 1.0, grid.y) + smoothstep(width, 0.0, grid.y);
        float line = max(lineX, lineY);
        
        // Depth-based coloring
        float depth = smoothstep(0.0, -25.0, vElevation);
        
        vec3 surfaceColor = vec3(0.05, 0.1, 0.2); // Dark Blue background
        vec3 gridColor = vec3(0.2, 0.4, 0.8);     // Cyan/Blue grid
        vec3 deepColor = vec3(1.0, 0.2, 0.6);     // Magenta/Red core
        
        vec3 finalColor = mix(surfaceColor, deepColor, depth * 0.8);
        
        // Add grid lines
        finalColor += line * mix(gridColor, vec3(1.0), depth);
        
        // Pulse effect near gravity wells
        float pulse = sin(uTime * 2.0 - vElevation * 0.5) * 0.5 + 0.5;
        finalColor += pulse * depth * 0.2;

        // Circular fade for the whole plane
        float distToCenter = distance(vUv, vec2(0.5));
        float alpha = (1.0 - smoothstep(0.4, 0.5, distToCenter));
        
        // Make grid more transparent far away
        alpha *= (0.1 + line + depth); 

        if (alpha < 0.01) discard;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[500, 500, 200, 200]} />
            <shaderMaterial
                ref={shaderRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                transparent
                uniforms={uniforms}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
};

const SceneContent = ({ bodies, setBodies, paused, gravityViz, onBodyClick, selectedBody }: SceneProps) => {
    
    useFrame((state) => {
        if (paused) return;

        const nextBodies = bodies.map(b => ({ 
            ...b, 
            position: { ...b.position }, 
            velocity: { ...b.velocity } 
        }));

        const bodyMap = new Map<string, CelestialBody>();
        nextBodies.forEach(b => bodyMap.set(b.id, b));

        const dt = TIME_STEP;
        const time = state.clock.getElapsedTime() * 0.5;

        // --- Physics Engine ---
        // 1. Unlocked bodies (Asteroid spawns): Velocity Verlet
        const getAccelerations = (currentBodies: CelestialBody[]) => {
             return currentBodies.map((body, i) => {
                 if (body.isLocked) return { x: 0, y: 0, z: 0 };
                 
                 let ax = 0, ay = 0, az = 0;
                 for (let j = 0; j < currentBodies.length; j++) {
                     if (i === j) continue;
                     const other = currentBodies[j];
                     const dx = other.position.x - body.position.x;
                     const dy = other.position.y - body.position.y;
                     const dz = other.position.z - body.position.z;
                     const distSq = dx*dx + dy*dy + dz*dz;
                     const dist = Math.sqrt(distSq);
                     
                     if (dist < 0.5) continue; 

                     const f = (G_CONSTANT * other.mass) / distSq;
                     ax += f * (dx / dist);
                     ay += f * (dy / dist);
                     az += f * (dz / dist);
                 }
                 return { x: ax, y: ay, z: az };
             });
        };

        const activePhysicsBodies = nextBodies.filter(b => !b.isLocked);
        if (activePhysicsBodies.length > 0) {
            const acc1 = getAccelerations(nextBodies);
            
            for(let i = 0; i < nextBodies.length; i++) {
                const body = nextBodies[i];
                if (!body.isLocked) {
                    body.position.x += body.velocity.x * dt + 0.5 * acc1[i].x * dt * dt;
                    body.position.y += body.velocity.y * dt + 0.5 * acc1[i].y * dt * dt;
                    body.position.z += body.velocity.z * dt + 0.5 * acc1[i].z * dt * dt;
                    
                    body.velocity.x += 0.5 * acc1[i].x * dt;
                    body.velocity.y += 0.5 * acc1[i].y * dt;
                    body.velocity.z += 0.5 * acc1[i].z * dt;
                }
            }
            
            const acc2 = getAccelerations(nextBodies);
            for(let i = 0; i < nextBodies.length; i++) {
                const body = nextBodies[i];
                if (!body.isLocked) {
                    body.velocity.x += 0.5 * acc2[i].x * dt;
                    body.velocity.y += 0.5 * acc2[i].y * dt;
                    body.velocity.z += 0.5 * acc2[i].z * dt;
                }
            }
        }

        // 2. Locked bodies (Planets, Moons): Keplerian
        for(let i = 0; i < nextBodies.length; i++) {
            const body = nextBodies[i];
            if (body.isLocked && body.orbitalElements) {
                let parentMass = 1000;
                let parentPos = { x: 0, y: 0, z: 0 };
                
                if (body.parentId) {
                    const parent = bodyMap.get(body.parentId);
                    if (parent) {
                        parentMass = parent.mass;
                        parentPos = parent.position;
                    }
                }

                const relPos = calculateOrbitalPosition(body.orbitalElements, time, parentMass);
                
                body.position.x = parentPos.x + relPos.x;
                body.position.y = parentPos.y + relPos.y;
                body.position.z = parentPos.z + relPos.z;
            }
        }

        setBodies(nextBodies);
    });

    const controlsRef = useRef<any>(null);

    return (
        <>
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 0, 0]} intensity={2} color="#FDB813" />
            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            <CameraController controlsRef={controlsRef} selectedBody={selectedBody} />

            {gravityViz && <GravityWell bodies={bodies} />}

            {bodies.map(body => (
                <React.Fragment key={body.id}>
                    <PlanetMesh 
                        body={body} 
                        onClick={onBodyClick} 
                        isSelected={selectedBody?.id === body.id}
                    />
                    {body.orbitalElements && body.type !== BodyType.ASTEROID && (
                        <KeplerOrbitLine 
                            body={body} 
                            allBodies={bodies} 
                            isSelected={selectedBody?.id === body.id}
                        />
                    )}
                </React.Fragment>
            ))}
            
            <OrbitControls ref={controlsRef} minDistance={5} maxDistance={900} />
        </>
    );
};

export const Scene3D: React.FC<SceneProps> = (props) => {
    return (
        <div className="w-full h-full bg-black relative">
            <Canvas shadows camera={{ position: [0, 80, 120], fov: 45 }}>
                <SceneContent {...props} />
            </Canvas>
        </div>
    );
};
