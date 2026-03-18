import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * FractalLogo - The Sacred Geometry Engine of INDRA
 * Implementation:
 * - Fibonacci Solar Heart: Central disc + 8 arms in golden spirals.
 * - Mycelial Rhizomes: Fractal L-system branching.
 * - Sacred Eyes: "Flower of Life" (7 circles) inside nodes.
 * - Artistic Direction: LoFi, Jewel-like, purely mathematical.
 */
export const FractalLogo = ({ active = true, theme = 'light' }) => {
    const containerRef = useRef();
    const sceneRef = useRef({ 
        scene: null, renderer: null, camera: null, 
        mainGroup: null 
    });

    useEffect(() => {
        if (!containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
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

        // --- COLORS & TOKENS: SACRED GOLD ---
        const PHI = 1.61803398875;
        const ACCENT_COLOR = new THREE.Color('#FFD700'); // Pure Gold
        const SECONDARY_COLOR = new THREE.Color('#DAA520'); // Goldenrod
        const DARK_ACCENT = new THREE.Color('#B8860B'); // Dark Golden

        const mainGroup = new THREE.Group();
        scene.add(mainGroup);

        sceneRef.current = { scene, renderer, camera, mainGroup };

        // Helper: Circle Geometry
        const createCircle = (radius, segments = 32) => {
            const points = [];
            for (let i = 0; i <= segments; i++) {
                const a = (i / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
            }
            return new THREE.BufferGeometry().setFromPoints(points);
        };

        // 1. SOLAR HEART (Core of the Sun)
        const heartGroup = new THREE.Group();
        const heartRadius = 0.6;
        for (let i = 1; i <= 3; i++) {
            const r = heartRadius / Math.pow(PHI, i-1);
            const circle = new THREE.Line(createCircle(r, 64), new THREE.LineBasicMaterial({
                color: ACCENT_COLOR,
                transparent: true,
                opacity: 0.9 / i, // Increased base opacity
                linewidth: 2 // Hint for compatible engines
            }));
            heartGroup.add(circle);
        }
        mainGroup.add(heartGroup);

        // 2. MYCELIAL RAYS (Branching out)
        const raysGroup = new THREE.Group();
        const rayCount = 8;
        
        const createRhizome = (origin, angle, depth, scale) => {
            if (depth === 0) {
                createFlowerOfLife(origin, raysGroup, scale * 0.15);
                return;
            }

            const length = scale * PHI;
            const target = new THREE.Vector3(
                origin.x + Math.cos(angle) * length,
                origin.y + Math.sin(angle) * length,
                origin.z + (Math.random() - 0.5) * 0.1
            );

            // The Line
            const lineGeom = new THREE.BufferGeometry().setFromPoints([origin, target]);
            const mat = new THREE.LineBasicMaterial({
                color: ACCENT_COLOR,
                transparent: true,
                opacity: 0.2 + (depth * 0.2), // Stronger lines for depth
                linewidth: 2
            });
            const line = new THREE.Line(lineGeom, mat);
            raysGroup.add(line);

            // Fractal Branching (2 children)
            const spread = (137.5 * Math.PI) / 180; // Golden angle divergence
            const branchScale = scale / PHI;
            
            createRhizome(target, angle + (spread * 0.2), depth - 1, branchScale);
            createRhizome(target, angle - (spread * 0.2), depth - 1, branchScale);
        };

        // 3. FLOWER OF LIFE (The Eye Node)
        const createFlowerOfLife = (pos, group, r) => {
            const eyeGroup = new THREE.Group();
            eyeGroup.position.copy(pos);
            
            // Central circle
            eyeGroup.add(new THREE.Line(createCircle(r, 16), new THREE.LineBasicMaterial({ 
                color: ACCENT_COLOR, transparent: true, opacity: 1.0, linewidth: 2 // Max opacity
            })));

            // 6 Petal circles
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const petal = new THREE.Line(createCircle(r, 16), new THREE.LineBasicMaterial({ 
                    color: ACCENT_COLOR, transparent: true, opacity: 0.7, linewidth: 2
                }));
                petal.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
                eyeGroup.add(petal);
            }
            group.add(eyeGroup);
        };

        // Init Rays
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            createRhizome(new THREE.Vector3(0,0,0), angle, 4, 0.8);
        }
        mainGroup.add(raysGroup);

        // --- ANIMATION ---
        let frame;
        const clock = new THREE.Clock();

        const animate = () => {
            frame = requestAnimationFrame(animate);
            if (!active) return;

            const time = clock.getElapsedTime();
            
            // IRIDISCENT COLOR MUTATION (Axiomatic Shift)
            // Cycle between Gold (45), Magenta (300), and Cyan (180)
            const hueShift = (Math.sin(time * 0.2) * 0.5 + 0.5); // 0 to 1
            const baseHue = 35 + (hueShift * 60); // Shifts around Gold/Orange to Magenta-tinted
            
            // Apply to materials
            mainGroup.traverse(child => {
                if (child.isLine || child.isMesh) {
                    const color = new THREE.Color().setHSL((baseHue / 360) % 1, 0.8, 0.6);
                    child.material.color.lerp(color, 0.05); // Smooth lerp for relaxation
                    
                    // Subtle breathing opacity
                    if (child.material.transparent) {
                        child.material.opacity = (child.material.userData?.originalOpacity || 0.6) * (1 + Math.sin(time * 2) * 0.1);
                    }
                }
            });

            mainGroup.rotation.z += 0.0003;
            heartGroup.rotation.z -= 0.0005;
            
            // Subtle breathing of the lines
            mainGroup.position.y = Math.sin(time * 0.5) * 0.05;
            mainGroup.scale.setScalar(1 + Math.sin(time * 0.8) * 0.02);

            renderer.render(scene, camera);
        };
        
        // Store original opacities for breathing effect
        mainGroup.traverse(child => {
            if (child.material) {
                child.material.userData.originalOpacity = child.material.opacity;
            }
        });

        animate();

        // --- RESIZE ---
        const handleResize = () => {
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
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
    }, [active]);

    return (
        <div 
            ref={containerRef} 
            style={{ 
                position: 'absolute', top: 0, left: 0, 
                width: '100%', height: '100%', 
                zIndex: 0,
                pointerEvents: 'none'
            }} 
        />
    );
};
