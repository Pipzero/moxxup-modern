import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const Player = forwardRef(({ sceneBackground = true, autoRotate = false }, ref) => {
  const containerRef = useRef(null);
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();

  useEffect(() => {
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = autoRotate;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;


    
    // HDRI environment
    const environmentMap = new RGBELoader()
      .setDataType(THREE.HalfFloatType)
      .load('/hdr/env_1k.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.background = texture; // or null if you want transparency
      });
      
    // reflective material
    const reflectiveMaterial = new THREE.MeshStandardMaterial({
      envMap: environmentMap,
      metalness: 1, // Fully metallic for strong reflections
      roughness: 0.1, // Smooth surface for clear reflections
    });

    // The Carabiner
    const loader = new OBJLoader();

    // const center = new THREE.Vector3();

    new THREE.Mesh(
      loader.load(
        '/obj/test_piece.obj', // Replace with the path to your .obj file
        (object) => {
          
          console.log(object.position);
          object.position.set(0,.5,0);
          object.rotateX(60);
          object.rotateY(30);
          console.log(object.position);


          object.traverse((child) => {
            if (child.isMesh) {
              child.material = reflectiveMaterial;
            }
          });
          // Add the loaded object to the scene
            object.scale.set(.6,.6,.6);

          scene.add(object);
          },
        (xhr) => {
          console.log(`Loading progress: ${(xhr.loaded / xhr.total) * 100}%`);
          },
        (error) => {
          console.error('An error occurred while loading the OBJ file:', error);
          }
      )


    );
    
    // Debug cube

    // const cube = new THREE.Mesh(
    //   new THREE.BoxGeometry(1, 1, 1),
    //   new THREE.MeshStandardMaterial({ color: 'hotpink' })
    // );


    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [sceneBackground, autoRotate]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    renderFront: () => console.log('renderFront() called'),
    renderBack: () => console.log('renderBack() called')
  }));

  return <div className="player-container" ref={containerRef} />;
});

export default Player;