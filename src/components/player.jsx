import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Player = forwardRef(
  (
    {
      sceneBackground,
      // colorTheme,
      autoRotate = false
      // onEditorShow = () => {},
      // setImgFront = () => {},
      // setImgBack = () => {},
      // setTextAngle = () => {},
      // removeActiveTextFront = () => {},
      // removeActiveTextBack = () => {},
      // onProgress = () => {}
    },
    ref
  ) => {
    const containerRef = useRef(null);
    const sceneRef = useRef();
    const rendererRef = useRef();
    const cameraRef = useRef();
    const controlsRef = useRef();

    useEffect(() => {
      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 1.5, 5);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.autoRotate = autoRotate;

      // ✅ Load HDR environment
      new RGBELoader()
        .setDataType(THREE.HalfFloatType)
        .load('/hdr/env_1k.hdr', (hdrTexture) => {
          hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = hdrTexture;
          scene.background = sceneBackground ? hdrTexture : null;
        });

      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      sceneRef.current = scene;
      rendererRef.current = renderer;
      cameraRef.current = camera;
      controlsRef.current = controls;

      // 🧼 Cleanup
      return () => {
        renderer.dispose();
        container.removeChild(renderer.domElement);
      };
    }, [sceneBackground, autoRotate]);

    // 🎮 Expose API to parent
    useImperativeHandle(ref, () => ({
      renderFront() {
        console.log('Rendering front preview');
      },
      renderBack() {
        console.log('Rendering back preview');
      }
    }));

    return <div className="player-container" ref={containerRef} />;
  }
);

export default Player;
