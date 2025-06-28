import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';


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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional: softer edges
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8; // Try between 0.5 to 1.0 for subtler light

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = autoRotate;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;
    
    // HDRI environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envMap = new RGBELoader()
      .setDataType(THREE.HalfFloatType)
      .load('/hdr/env_1k.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.background = texture; // or null if you want transparency
        texture.dispose();
        pmremGenerator.dispose();
      });
      
    // reflective material
    const basic_material = new THREE.MeshStandardMaterial({
      // envMap: envMap,
      // metalness: 1, // Fully metallic for strong reflections
      // roughness: 0.1,
      side: THREE.DoubleSide // Smooth surface for clear reflections
    });
  const loader = new OBJLoader();


    // Material with camera-aware ripple
 const material = new THREE.ShaderMaterial({
  vertexShader: `
    uniform vec3 cameraPos;
    uniform float time;
    uniform float rippleStrength;
    uniform vec3 baseColor;

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vec3 pos = position;

      float dist = distance(cameraPos, (modelMatrix * vec4(pos, 1.0)).xyz);
      float maxY = 0.7;
      float fade = smoothstep(maxY, 0.0, pos.y);
      float ripple = sin(dist * 6.0 - time * 2.0) * 0.04 * fade * rippleStrength;
      pos.z += ripple;

      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPos.xyz;
      vNormal = normalize(normalMatrix * normal);

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
    fragmentShader: `
      uniform vec3 baseColor;
      uniform vec3 cameraPos;
      uniform samplerCube envMap;

      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;

      void main() {
        vec3 viewDir = normalize(vWorldPosition - cameraPos);
        vec3 reflectDir = reflect(viewDir, normalize(vNormal));
        vec3 reflectedColor = textureCube(envMap, reflectDir).rgb;

        vec3 finalColor = mix(baseColor, reflectedColor, .9);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    uniforms: {
      cameraPos: { value: new THREE.Vector3() },
      time: { value: 0 },
      rippleStrength: { value: 1.0 },
      baseColor: { value: new THREE.Color(0.8, 0.5, 0.5) },
      // envMap: { value: scene.environment }, // or pmrem-processed HDR
       envMap: { value: scene.environment }, // or pmrem-processed HDR
    },
    side: THREE.DoubleSide,
    // envMapIntensity: 1.0,
  });


    new THREE.Mesh(
      // The Tshirt
        loader.load(
          '/obj/roundneck_tshirt_obj.obj',  
          (object) => {

            object.traverse((child) => {
              if (child.isMesh) {
                // Optional: apply your ripple shader to imported mesh instead of default material
                child.material = material;
                child.castShadow = true;
                child.receiveShadow = true;
                object.scale.set(4,4,4);
                object.translateY(-2);

                scene.add(object);

              }
            });

            scene.add(object);
          },
          (xhr) => {
            console.log(`Loading OBJ: ${(xhr.loaded / xhr.total) * 100}%`);
          },
          (error) => {
            console.error('Error loading OBJ:', error);
          }
        )

    );
   

  


    //gROUND

    const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0xdddddd })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.2;
    ground.receiveShadow = true;
    scene.add(ground);

    // scene.add(new THREE.AmbientLight(0xffffff, 1));

    // Animate
    let lastCameraPos = new THREE.Vector3();
    let rippleStrength = 1.0;
    let rippleTarget = 1.0;
    let rippleTimer = 0;
    const rippleFadeDelay = 200; // 1 second
    // const rippleFadeDuration = 1000; // 1 second fade

    function animate(t) {
      requestAnimationFrame(animate);

      // Detect camera movement
      const camMoved = !camera.position.equals(lastCameraPos);
      if (camMoved) {
        rippleTarget = 1.0;
        rippleTimer = performance.now();
        lastCameraPos.copy(camera.position);
      } else {
        const timeSinceMove = performance.now() - rippleTimer;
        if (timeSinceMove > rippleFadeDelay) {
          rippleTarget = 0.0;
        }
      }

      // Smoothly interpolate ripple strength
      rippleStrength += (rippleTarget - rippleStrength) * 0.1;

      material.uniforms.cameraPos.value.copy(camera.position);
      material.uniforms.time.value = t * 0.001;
      material.uniforms.rippleStrength.value = rippleStrength;

      renderer.render(scene, camera);
    }

    animate();


    // Lighting


   const sun = new THREE.DirectionalLight(0xffffff, .8);
    sun.position.set(3, 5, 2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -3;
    sun.shadow.camera.right = 3;
    sun.shadow.camera.top = 3;
    sun.shadow.camera.bottom = -3;
    sun.shadow.camera.near = .2;
    sun.shadow.camera.far = 10;

    scene.add(sun);



    // const center = new THREE.Vector3();

    // new THREE.Mesh(
    //   loader.load(
    //     '/obj/test_piece.obj', // Replace with the path to your .obj file
    //     (object) => {
          
    //       console.log(object.position);
    //       object.position.set(0,.5,0);
    //       object.rotateX(60);
    //       object.rotateY(30);
    //       console.log(object.position);


    //       object.traverse((child) => {
    //         if (child.isMesh) {
    //           child.material = reflectiveMaterial;
    //         }
    //       });
    //       // Add the loaded object to the scene
    //         object.scale.set(.6,.6,.6);

    //       scene.add(object);
    //       },
    //     (xhr) => {
    //       console.log(`Loading progress: ${(xhr.loaded / xhr.total) * 100}%`);
    //       },
    //     (error) => {
    //       console.error('An error occurred while loading the OBJ file:', error);
    //       }
    //   )


    // );
    
    // Debug cube

    // const cube = new THREE.Mesh(
    //   new THREE.BoxGeometry(1, 1, 1),
    //   new THREE.MeshStandardMaterial({ color: 'hotpink' })
    // );


    // const light = new THREE.DirectionalLight(0xffffff, 1);
    // light.position.set(5, 10, 7.5);
    // scene.add(light);

    // const animate = () => {
    //   requestAnimationFrame(animate);
    //   controls.update();
    //   renderer.render(scene, camera);
    // };
    // animate();

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