import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Trail, Line } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialBody, Vector3, BodyType } from '../types';
import { G_CONSTANT, TIME_STEP } from '../constants';

interface SceneProps {
  bodies: CelestialBody[];
  setBodies: React.Dispatch<React.SetStateAction<CelestialBody[]>>;
  paused: boolean;
  gravityViz: boolean;
  onBodyClick: (body: CelestialBody) => void;
}

const PlanetMesh = ({ body, onClick }: { body: CelestialBody; onClick: (b: CelestialBody) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  const [textureMap, setTextureMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (body.texture) {
      textureLoader.load(body.texture, (tex) => {
        setTextureMap(tex);
      });
    } else {
      setTextureMap(null);
    }
  }, [body.texture, textureLoader]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(body.position.x, body.position.y, body.position.z);
      meshRef.current.rotation.y += 0.005; // Self rotation
    }
  });

  return (
    <group>
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
        {body.type !== BodyType.ASTEROID && (
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

// Simple component to draw a circular orbit line
const OrbitLine = ({ radius }: { radius: number }) => {
    const points = useMemo(() => {
        const pts = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        }
        return pts;
    }, [radius]);

    return <Line points={points} color="white" opacity={0.15} transparent lineWidth={1} />;
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
            if (body.mass < 0.1) continue; // Skip tiny bodies for optimization
            
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
            float dist = distance(worldPos.xyz, bodyPos);
            // Smooth gravity well shape
            elevation -= (mass * 2.5) / (dist + 2.0); 
        }
        
        // Displace along local Z (which acts as up/down due to mesh rotation)
        pos.z += elevation;
        vElevation = elevation;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      varying float vElevation;
      uniform float uTime;

      void main() {
        // Grid pattern
        float scale = 40.0;
        float thickness = 0.02;
        vec2 grid = fract(vUv * scale);
        float line = step(1.0 - thickness, max(grid.x, grid.y));
        
        // Color mapping
        float intensity = smoothstep(0.0, -15.0, vElevation);
        vec3 colorA = vec3(0.2, 0.3, 0.4); // Base grey-blue
        vec3 colorB = vec3(0.8, 0.2, 1.0); // Deep purple/magenta
        vec3 finalColor = mix(colorA, colorB, intensity);
        
        // Glow pulse
        float pulse = (sin(uTime * 1.5 - vElevation) * 0.5 + 0.5) * 0.3;
        finalColor += pulse * intensity;

        // Alpha fade out at edges
        float alpha = (line * 0.2) + (intensity * 0.6);
        alpha *= smoothstep(0.5, 0.2, distance(vUv, vec2(0.5)));

        if (alpha < 0.01) discard;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
            <planeGeometry args={[400, 400, 128, 128]} />
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

const SceneContent = ({ bodies, setBodies, paused, gravityViz, onBodyClick }: SceneProps) => {
    
    useFrame((state) => {
        if (paused) return;

        const nextBodies = bodies.map(b => ({ 
            ...b, 
            position: { ...b.position }, 
            velocity: { ...b.velocity } 
        }));

        const dt = TIME_STEP;

        // Calculate forces/acceleration
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
                     
                     if (dist < 0.5) continue; // Softening to prevent infinity

                     const f = (G_CONSTANT * other.mass) / distSq;
                     ax += f * (dx / dist);
                     ay += f * (dy / dist);
                     az += f * (dz / dist);
                 }
                 return { x: ax, y: ay, z: az };
             });
        };

        // --- Velocity Verlet Integration ---
        
        // 1. Calculate initial acceleration a(t)
        const acc1 = getAccelerations(nextBodies);

        // 2. First half-kick & drift
        // v(t + 0.5dt) = v(t) + 0.5 * a(t) * dt
        // r(t + dt) = r(t) + v(t + 0.5dt) * dt
        for(let i = 0; i < nextBodies.length; i++) {
            const body = nextBodies[i];
            
            if (body.isLocked && body.orbitRadius && body.orbitSpeed) {
                // Keplerian rails for locked bodies
                const time = state.clock.getElapsedTime();
                const angle = time * (body.orbitSpeed * 0.2); 
                body.position.x = Math.cos(angle) * body.orbitRadius;
                body.position.z = Math.sin(angle) * body.orbitRadius;
            } else if (!body.isLocked) {
                // Pos update
                body.position.x += body.velocity.x * dt + 0.5 * acc1[i].x * dt * dt;
                body.position.y += body.velocity.y * dt + 0.5 * acc1[i].y * dt * dt;
                body.position.z += body.velocity.z * dt + 0.5 * acc1[i].z * dt * dt;

                // Half velocity update
                body.velocity.x += 0.5 * acc1[i].x * dt;
                body.velocity.y += 0.5 * acc1[i].y * dt;
                body.velocity.z += 0.5 * acc1[i].z * dt;
            }
        }

        // 3. Calculate new acceleration a(t+dt) based on new positions
        const acc2 = getAccelerations(nextBodies);

        // 4. Second half-kick
        // v(t + dt) = v(t + 0.5dt) + 0.5 * a(t+dt) * dt
        for(let i = 0; i < nextBodies.length; i++) {
            const body = nextBodies[i];
            if (!body.isLocked) {
                body.velocity.x += 0.5 * acc2[i].x * dt;
                body.velocity.y += 0.5 * acc2[i].y * dt;
                body.velocity.z += 0.5 * acc2[i].z * dt;
            }
        }

        setBodies(nextBodies);
    });

    return (
        <>
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 0, 0]} intensity={2} color="#FDB813" />
            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            {gravityViz && <GravityWell bodies={bodies} />}

            {bodies.map(body => (
                <React.Fragment key={body.id}>
                    <PlanetMesh body={body} onClick={onBodyClick} />
                    {body.orbitRadius && <OrbitLine radius={body.orbitRadius} />}
                </React.Fragment>
            ))}
            
            <OrbitControls minDistance={10} maxDistance={200} />
        </>
    );
};

export const Scene3D: React.FC<SceneProps> = (props) => {
    return (
        <div className="w-full h-full bg-black relative">
            <Canvas camera={{ position: [0, 50, 60], fov: 45 }}>
                <SceneContent {...props} />
            </Canvas>
        </div>
    );
};