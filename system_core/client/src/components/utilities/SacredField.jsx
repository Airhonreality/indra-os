import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useAppState } from '../../state/app_state';

/**
 * SacredField — The Global Background Field of INDRA
 * 
 * An agnostic Three.js environment that provides visual pulses, 
 * fractal textures, and mantric relaxation across all views.
 */
export const SacredField = ({ children }) => {
    const containerRef = useRef();
    const sceneRef = useRef({ 
        scene: null, renderer: null, camera: null, 
        mainGroup: null, particles: null
    });

    const isConnected = useAppState(s => s.isConnected);
    const activeWorkspaceId = useAppState(s => s.activeWorkspaceId); // Assuming we can get this from state or context
    // Actually, App state might not have all context, but we can use what's available.

    useEffect(() => {
        if (!containerRef.current) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        const mainGroup = new THREE.Group();
        scene.add(mainGroup);

        // --- SACRED GEOMETRY: PARTICLE FIELD ---
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
            
            colors[i * 3] = 0.5; // Gold-ish
            colors[i * 3 + 1] = 0.4;
            colors[i * 3 + 2] = 0.1;
        }

        const particleGeom = new THREE.BufferGeometry();
        particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(particleGeom, particleMat);
        mainGroup.add(particles);

        // --- SUBTLE RINGS (PHI BASED) ---
        const rings = new THREE.Group();
        for (let i = 0; i < 5; i++) {
            const r = 2 + i * 1.618;
            const geo = new THREE.RingGeometry(r, r + 0.01, 64);
            const mat = new THREE.MeshBasicMaterial({ 
                color: '#FFD700', 
                transparent: true, 
                opacity: 0.05,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(geo, mat);
            ring.rotation.x = Math.PI / 2;
            rings.add(ring);
        }
        mainGroup.add(rings);

        sceneRef.current = { scene, renderer, camera, mainGroup, particles, rings };

        let frame;
        const animate = () => {
            frame = requestAnimationFrame(animate);
            
            mainGroup.rotation.y += 0.0002;
            rings.rotation.z += 0.0001;
            
            const time = Date.now() * 0.0005;
            particles.position.y = Math.sin(time) * 0.1;
            
            // Pulse based on some state? For now just a mantra pulse
            const pulse = 1 + Math.sin(time * 2) * 0.02;
            mainGroup.scale.setScalar(pulse);

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {/* The Field */}
            <div 
                ref={containerRef} 
                className="sacred-field-canvas"
                style={{ 
                    position: 'fixed', top: 0, left: 0, 
                    width: '100vw', height: '100vh', 
                    zIndex: -1, 
                    pointerEvents: 'none',
                    background: 'var(--color-bg-void)' 
                }} 
            />
            {/* The Content */}
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                {children}
            </div>
        </div>
    );
};
