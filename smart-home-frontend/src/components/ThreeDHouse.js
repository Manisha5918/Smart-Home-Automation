import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Wifi, 
  Camera, 
  Lock, 
  Lightbulb, 
  Sun,
  Shield
} from 'lucide-react';

// Error Boundary for safe 3D execution
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("3D Canvas Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Orbiting Node Device Component (Reduced icon and badge sizes)
const OrbitingNode = ({ position, icon: Icon, text, color, label, darkMode }) => {
  const linePoints = [new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(...position)];
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);

  return (
    <group>
      {/* Thin connection line to house */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial color={color} opacity={darkMode ? 0.12 : 0.22} transparent />
      </line>

      {/* Orbiting Node container */}
      <group position={position}>
        {/* Glow halo */}
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color={color} opacity={darkMode ? 0.08 : 0.15} transparent />
        </mesh>

        {/* HTML overlay with icon/text (Reduced to w-8 h-8 and size 12) */}
        <Html distanceFactor={6} center>
          <div className="flex flex-col items-center gap-1 select-none pointer-events-none">
            <div 
              style={{ 
                borderColor: darkMode ? `${color}55` : '#127A5633', 
                boxShadow: darkMode ? `0 0 12px ${color}22` : '0 4px 10px rgba(18,122,86,0.06)' 
              }}
              className={`w-8 h-8 rounded-full border flex items-center justify-center scale-90 hover:scale-105 hover:border-white transition-all duration-300 pointer-events-auto cursor-pointer ${
                darkMode ? 'bg-[#07120D] text-white' : 'bg-white text-slate-800'
              }`}
              title={label}
            >
              {Icon ? (
                <Icon size={12} style={{ color: darkMode ? color : '#127A56' }} />
              ) : (
                <span className="text-[10px] font-bold tracking-tighter" style={{ color: darkMode ? color : '#127A56' }}>{text}</span>
              )}
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
};

// Main 3D House Scene Model
const HouseScene = ({ mousePos, darkMode }) => {
  const groupRef = useRef();
  const coreRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Floating animation
      groupRef.current.position.y = Math.sin(time * 0.7) * 0.1;

      // Slow rotation + mouse offset
      groupRef.current.rotation.y = time * 0.05 + mousePos.current.x * 0.2;
      groupRef.current.rotation.x = mousePos.current.y * 0.12;
    }

    if (coreRef.current) {
      const glow = (darkMode ? 0.2 : 0.1) + Math.sin(time * 2) * 0.08;
      coreRef.current.material.opacity = Math.max(0, glow);
    }
  });

  // Orbital positions matching the model layout exactly
  const devices = [
    { icon: Wifi, color: '#1DBA74', label: 'Wi-Fi', position: [0.3, 1.1, -1.2] },
    { icon: Camera, color: '#2AD88C', label: 'Camera', position: [-1.4, 0.8, 0.8] },
    { icon: Lock, color: '#1DBA74', label: 'Lock', position: [-1.7, 0.1, 1.3] },
    { icon: Lightbulb, color: '#2AD88C', label: 'Bulb', position: [1.7, 0.6, -0.6] },
    { icon: Sun, color: '#1DBA74', label: 'Solar', position: [-1.3, 0.5, -1.3] },
    { icon: null, text: '24°', color: '#2AD88C', label: 'HVAC', position: [1.9, -0.1, 1.1] },
  ];

  return (
    <group>
      {/* Scene Lights */}
      <pointLight position={[2, 3, 2]} intensity={darkMode ? 3.5 : 4.5} color={darkMode ? "#2AD88C" : "#1DBA74"} />
      <pointLight position={[-2, -1, -2]} intensity={2.0} color={darkMode ? "#1DBA74" : "#127A56"} />
      <directionalLight position={[0, 5, 0]} intensity={darkMode ? 1.5 : 2.0} color="#ffffff" />

      {/* Main interactive group */}
      <group ref={groupRef}>
        {/* Floating platform */}
        <mesh position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.6, 1.7, 0.08, 32]} />
          <meshPhysicalMaterial 
            color={darkMode ? "#091c15" : "#e0ede7"} 
            roughness={0.2} 
            transmission={darkMode ? 0.5 : 0.8} 
            thickness={darkMode ? 0.8 : 0.3} 
            transparent 
            opacity={darkMode ? 0.65 : 0.85} 
          />
        </mesh>
        
        {/* Platform glowing neon edge */}
        <mesh position={[0, -0.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.605, 1.605, 0.01, 32]} />
          <meshBasicMaterial color={darkMode ? "#1DBA74" : "#127A56"} wireframe opacity={darkMode ? 0.35 : 0.55} transparent />
        </mesh>

        {/* 3D Smart House (Model Villa Primitives) */}
        {/* House Main Body */}
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[1.4, 0.9, 1.4]} />
          <meshPhysicalMaterial 
            color={darkMode ? "#0b1713" : "#f4faf7"} 
            roughness={0.3} 
            metalness={0.1} 
            transmission={0.8} 
            thickness={1.5} 
            transparent 
            opacity={darkMode ? 0.4 : 0.85} 
          />
        </mesh>
        
        {/* Glowing inner core */}
        <mesh position={[0, -0.3, 0]} ref={coreRef}>
          <boxGeometry args={[0.7, 0.6, 0.7]} />
          <meshBasicMaterial color={darkMode ? "#2AD88C" : "#1DBA74"} transparent opacity={darkMode ? 0.3 : 0.15} />
        </mesh>
        
        {/* House wireframe overlay */}
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[1.405, 0.905, 1.405]} />
          <meshBasicMaterial color={darkMode ? "#1DBA74" : "#127A56"} wireframe opacity={darkMode ? 0.2 : 0.4} transparent />
        </mesh>

        {/* Roof (translucent wedge) */}
        <mesh position={[0, 0.45, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[1.2, 0.6, 4]} />
          <meshPhysicalMaterial 
            color={darkMode ? "#0f291e" : "#eef6f3"} 
            roughness={0.15} 
            transmission={0.6} 
            thickness={1.0} 
            transparent 
            opacity={darkMode ? 0.5 : 0.8} 
          />
        </mesh>
        <mesh position={[0, 0.45, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[1.205, 0.605, 4]} />
          <meshBasicMaterial color={darkMode ? "#2AD88C" : "#127A56"} wireframe opacity={darkMode ? 0.25 : 0.45} transparent />
        </mesh>

        {/* Roof Solar Panels representation */}
        <mesh position={[0, 0.4, 0.35]} rotation={[-Math.PI / 6, 0, 0]}>
          <boxGeometry args={[0.7, 0.02, 0.4]} />
          <meshBasicMaterial color={darkMode ? "#0e241c" : "#0d3a2b"} />
        </mesh>
        <mesh position={[0, 0.4, 0.35]} rotation={[-Math.PI / 6, 0, 0]}>
          <boxGeometry args={[0.705, 0.025, 0.405]} />
          <meshBasicMaterial color={darkMode ? "#1DBA74" : "#127A56"} wireframe opacity={0.4} transparent />
        </mesh>

        {/* Windows with warm/green glow */}
        <mesh position={[0.71, -0.1, 0.2]}>
          <planeGeometry args={[0.3, 0.35]} />
          <meshBasicMaterial color={darkMode ? "#2AD88C" : "#1DBA74"} opacity={0.5} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.71, -0.1, 0.2]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.3, 0.35]} />
          <meshBasicMaterial color={darkMode ? "#2AD88C" : "#1DBA74"} opacity={0.5} transparent side={THREE.DoubleSide} />
        </mesh>

        {/* Flat concentric Dotted Orbit Paths using 3D-transformed SVG */}
        <Html position={[0, -0.74, 0]} rotation={[-Math.PI / 2, 0, 0]} transform occlude={false} pointerEvents="none">
          <svg width="400" height="400" viewBox="0 0 400 400" className={`select-none pointer-events-none transition-opacity duration-300 ${
            darkMode ? 'opacity-25' : 'opacity-40'
          }`}>
            <circle cx="200" cy="200" r="130" stroke={darkMode ? "#1DBA74" : "#127A56"} strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
            <circle cx="200" cy="200" r="165" stroke={darkMode ? "#2AD88C" : "#1DBA74"} strokeWidth="1.2" strokeDasharray="3 3" fill="none" />
          </svg>
        </Html>

        {/* Platform Bottom Shield Badge Node (Reduced to w-7 h-7) */}
        <group position={[0, -0.75, 1.55]}>
          <Html distanceFactor={6} center>
            <div className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${
              darkMode 
                ? 'bg-[#07120D] border-[#1DBA74] text-[#1DBA74] shadow-[0_0_12px_rgba(29,186,116,0.4)]' 
                : 'bg-white border-[#127A56] text-[#127A56] shadow-[0_4px_10px_rgba(18,122,86,0.12)]'
            }`}>
              <Shield size={12} className="animate-pulse" />
            </div>
          </Html>
        </group>

        {/* Orbiting nodes */}
        {devices.map((device, i) => (
          <OrbitingNode 
            key={i}
            position={device.position}
            icon={device.icon}
            text={device.text}
            color={device.color}
            label={device.label}
            darkMode={darkMode}
          />
        ))}
      </group>
    </group>
  );
};

// Premium SVG / CSS Fallback (Highly animated, futuristic)
const StaticFallback = ({ darkMode }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
      {/* Ambient background glow behind SVG */}
      <div className={`absolute w-64 h-64 rounded-full blur-[80px] pointer-events-none animate-pulse ${
        darkMode ? 'bg-[#1DBA74]/5' : 'bg-[#311256]/5'
      }`} />
      
      {/* Animated SVG Graphic matching model */}
      <svg className="w-[280px] h-[280px] relative z-10 overflow-visible" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="houseGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2AD88C" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1DBA74" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="coreGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2AD88C" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1DBA74" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Dotted Orbit Rings */}
        <ellipse cx="100" cy="100" rx="75" ry="28" stroke={darkMode ? "#1DBA74" : "#127A56"} strokeWidth="0.75" strokeDasharray="3 3" strokeOpacity="0.3" fill="none" transform="rotate(-15 100 100)" />
        <ellipse cx="100" cy="100" rx="90" ry="35" stroke={darkMode ? "#2AD88C" : "#1DBA74"} strokeWidth="0.75" strokeDasharray="3 3" strokeOpacity="0.25" fill="none" transform="rotate(10 100 100)" />

        {/* Dynamic orbital connection rays */}
        <line x1="100" y1="100" x2="35" y2="75" stroke={darkMode ? "#1DBA74" : "#127A56"} strokeWidth="0.5" strokeOpacity="0.15" />
        <line x1="100" y1="100" x2="165" y2="125" stroke={darkMode ? "#2AD88C" : "#1DBA74"} strokeWidth="0.5" strokeOpacity="0.15" />
        <line x1="100" y1="100" x2="150" y2="60" stroke={darkMode ? "#1DBA74" : "#127A56"} strokeWidth="0.5" strokeOpacity="0.15" />
        <line x1="100" y1="100" x2="50" y2="140" stroke={darkMode ? "#2AD88C" : "#1DBA74"} strokeWidth="0.5" strokeOpacity="0.15" />

        {/* Orbit Nodes (Reduced size) */}
        <g transform="translate(35, 75)">
          <circle r="9" fill={darkMode ? "#07120D" : "#ffffff"} fillOpacity="0.9" stroke={darkMode ? "#1DBA74" : "#127A56"} strokeWidth="1" strokeOpacity="0.5" />
          <circle r="2.5" fill="#1DBA74" />
        </g>
        <g transform="translate(165, 125)">
          <circle r="9" fill={darkMode ? "#07120D" : "#ffffff"} fillOpacity="0.9" stroke={darkMode ? "#2AD88C" : "#127A56"} strokeWidth="1" strokeOpacity="0.5" />
          <circle r="2.5" fill="#2AD88C" />
        </g>
        <g transform="translate(150, 60)">
          <circle r="9" fill={darkMode ? "#07120D" : "#ffffff"} fillOpacity="0.9" stroke={darkMode ? "#1DBA74" : "#127A56"} strokeWidth="1" strokeOpacity="0.5" />
          <circle r="2.5" fill="#1DBA74" />
        </g>

        {/* Base Platform */}
        <ellipse cx="100" cy="132" rx="42" ry="11" fill={darkMode ? "#091c15" : "#e0ede7"} fillOpacity="0.5" stroke={darkMode ? "#1DBA74" : "#127A56"} strokeWidth="1" strokeOpacity="0.4" />
        
        {/* House */}
        <polygon points="72,122 128,122 128,90 72,90" fill="url(#houseGlow)" stroke={darkMode ? "#1DBA74" : "#127A56"} strokeWidth="1" strokeOpacity="0.2" />
        <rect x="85" y="100" width="30" height="20" rx="2" fill="url(#coreGlow)" className="animate-pulse" />
        <polygon points="67,90 100,62 133,90" fill={darkMode ? "#0f291e" : "#eef6f3"} fillOpacity="0.5" stroke={darkMode ? "#2AD88C" : "#127A56"} strokeWidth="1" strokeOpacity="0.3" />

        {/* Platform Shield badge */}
        <g transform="translate(100, 143)">
          <circle r="6" fill={darkMode ? "#07120D" : "#ffffff"} stroke={darkMode ? "#1DBA74" : "#127A56"} strokeWidth="1" />
          <circle r="1.5" fill="#1DBA74" />
        </g>
      </svg>
    </div>
  );
};

// Main Export Component
const ThreeDHouse = ({ darkMode = true }) => {
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current.x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      mousePos.current.y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="w-full h-full relative flex items-center justify-center opacity-90">
      <CanvasErrorBoundary fallback={<StaticFallback darkMode={darkMode} />}>
        <Canvas
          camera={{ position: [0, 0.3, 5.0], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
          <HouseScene mousePos={mousePos} darkMode={darkMode} />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
};

export default ThreeDHouse;
