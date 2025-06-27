import React, { Component, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import {PMREMGenerator} from "three/src/extras/PMREMGenerator";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import HdrFile from "../static/textures/lebombo_1k.hdr";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
// import CONSTANTS from "../constants/index";
import normal from "../static/textures/16_normals_tiled.png";
import ao from "../static/textures/16_ao_tiled.png";
const queryString = window.location.search.split("?").join("");
const parts = queryString
  .split("&")
  .map((p) => p.split("="))
  .map(([key, value]) => ({ [key]: value }))
  .reduce(
    (acc, item) => ({
      ...acc,
      ...item,
    }),
    {}
  );

var envMapGlobal;

const initialStyle = {
  height: +parts.height || getHeightByInner(), // we can control scene size by setting container dimensions
  textAlign: "center",
  width: +parts.width || getWidthByInner(),
  borderRadius: 5,
  overflow: "hidden",
  marginBottom: 20,
  transition: "opacity 1s linear",
};

var tileSize = 40;
var normalMap = new THREE.TextureLoader().load(normal);
normalMap.wrapS = THREE.RepeatWrapping;
normalMap.wrapT = THREE.RepeatWrapping;
normalMap.flipY = true;
normalMap.repeat.set(tileSize, tileSize);

var aoMap = new THREE.TextureLoader().load(ao);
// aoMap.wrapS = THREE.RepeatWrapping;
// aoMap.wrapT = THREE.RepeatWrapping;
// aoMap.flipY = true;
// aoMap.repeat.set(tileSize, tileSize);


function getHeightByInner() {
  const footerHeight = 37;
  if (window.innerWidth < 371) {
    return window.innerHeight - 234 + footerHeight;
  }
  if (window.innerWidth < 451) {
    return window.innerHeight - 133 + footerHeight;
  }
  if (window.innerWidth < 500) {
    return window.innerHeight - 144 + footerHeight;
  }
  if (window.innerHeight < 451) {
    return window.innerHeight - 144 + footerHeight;
  }
  if (window.innerHeight < 651) {
    return window.innerHeight - 115 + footerHeight;
  }
  return window.innerHeight - 184;
}

function getWidthByInner() {
  // if (window.innerHeight < 451) {
  //     return window.innerWidth - 41;
  // }
  // if (window.innerWidth < 451 || window.innerHeight < 451) {
  //     return window.innerWidth - 55;
  // }
  // if (window.innerWidth < 501 || window.innerHeight < 651) {
  //     return window.innerWidth - 70;
  // }
  // return window.innerWidth - 150;
  return window.innerWidth;
}

class Player extends Component {
  state = {
    style: { ...initialStyle },
    loading: true,
  };
  textureLoader = new THREE.TextureLoader();


  componentDidMount() {
    this.sceneSetup();
    this.addLights();
    this.loadTheModel();
    this.startAnimationLoop();
    window.addEventListener("resize", this.handleWindowResize);
  }

  renderFront = (options) => this.renderText(options, true);
  renderBack = (options) => this.renderText(options, false);

  /**
   * take canvas snapshot and place that onto the model surface
   */
  material = {
    color: 0xffffff,
    normalMap: normalMap,
    roughness: 0.6,
    metalness: 1,
    reflectivity: 0,
    side: THREE.DoubleSide,
    envMap: envMapGlobal,
    aoMap: aoMap,
    envMapIntensity: 1,
    normalScale: new THREE.Vector2(1, 1),
  };
  renderText = (
    {
      x,
      y,
      textIndex = -1,
      shouldDiscardSelection = false,
      isMoved = false,
      shouldScaleUp,
      withMapping = true,
    },
    isFront = this.isFront()
  ) => {
    const {
      image,
      boundsArray,
      isSelectionActive,
      activeCoords,
      activeIndex,
      backgroundColor,
    } = this.props[isFront ? "setImgFront" : "setImgBack"](
      {
        x,
        y,
        textIndex,
        shouldDiscardSelection,
        isMoved,
        shouldScaleUp,
      },
      isFront
    );
    if (withMapping) {
      this.allBounds = boundsArray;
      this.activeBounds = activeCoords;
      this.activeIndex = activeIndex;
      this.isSelectionActive = isSelectionActive;
    }
    const shouldUpdateBg = this.backgroundColor !== backgroundColor;
    this.backgroundColor = backgroundColor;
    


    if (this.props.sceneBackground) {
      this.scene.background = envMapGlobal;
    } else {
      this.scene.background = null;
    }
    


    this.textureLoader.load(image, (texture) => {
      this.scene.environment = envMapGlobal;
      this.scene.traverse((el) => {
        if (el.type === "Mesh") {
          if (el.name.includes("cloth")) {
            el.morphTargetInfluences[0] = 30;
            el.morphTargetInfluences[1] = 30;
            console.log(el.morphTargetInfluences[0]);
            if (el.name.includes("front") && isFront) {
              el.material = new THREE.MeshPhysicalMaterial({
                map: texture,
                emissiveIntensity: 0,
                ...this.material,
              });
            }
            if (el.name.includes("back") && !isFront) {
              // console.log('update back')
              el.material = new THREE.MeshPhysicalMaterial({
                map: texture,
                emissiveIntensity: 0,
                ...this.material,
                // envMap: envMapGlobal,
              });
            }
          }
        }
      });
    });
    if (shouldUpdateBg) {
      this.textureLoader.load(backgroundColor, (bgTexture) => {
        this.scene.traverse((el) => {
          if (el.type === "Mesh") {
            if (el.name.includes("cloth")) {
              if (
                !el.name.includes("front") &&
                !el.name.includes("back") &&
                shouldUpdateBg
              ) {
                console.log("update bg");
                el.material = new THREE.MeshPhysicalMaterial({
                  map: bgTexture,

                  emissiveIntensity: 0,
                  ...this.material,
                  // envMap: envMapGlobal
                });
              }
            }
          }
        });
      });
    }
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    // if (prevProps.colorTheme !== this.props.colorTheme) {
    //     this.scene.background = this.props.colorTheme === CONSTANTS.SITE_THEME.White ?
    //        this.scene.background = new THREE.Color( 0xffffff ) :
    //         this.scene.background = new THREE.Color( 0x000000 );
    // }

    if (prevProps.autoRotate !== this.props.autoRotate) {
      this.controls.autoRotate = this.props.autoRotate;
    }

    // this.scene.background = new THREE.Color( 0xff00ff );
    // this.scene.background = new THREE.CubeTextureLoader()
    //   .setPath("../static/textures/pisaHDR")
    //   .load(["px.hdr", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"]);
    // this.scene.environment = this.scene.background;
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleWindowResize);
    window.cancelAnimationFrame(this.requestID);
    this.controls.dispose();
  }

  // Standard scene setup in Three.js. Check "Creating a scene" manual for more information
  // https://threejs.org/docs/#manual/en/introduction/Creating-a-scene
  sceneSetup = () => {
    // get container dimensions and use them for scene sizing
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      40, // fov = field of view
      width / height, // aspect ratio
      0.1, // near plane
      1000 // far plane
    );
    this.camera.position.x = 0; // is used here to set some distance from a cube that is located at x = 0
    this.camera.position.y = 0.4; // is used here to set some distance from a cube that is located at y = 0
    this.camera.position.z = 1.2; // is used here to set some distance from a cube that is located at z = 0
    this.camera.lookAt(0, 100, 1000); // is used here to set some distance from a cube that is located at z = 0
    // this.scene.background = new THREE.Color( 0xffffff );

    this.initControls();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.setPixelRatio(
      window.devicePixelRatio ? window.devicePixelRatio : 1
    );
    this.renderer.setSize(width, height);
    this.renderer.domElement.id = "ot-player";

    this.mount.appendChild(this.renderer.domElement); // mount using React ref

    var loader = new RGBELoader();
    var pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    loader.setDataType(THREE.UnsignedByteType);
    loader.load(HdrFile, function (texture) {
      console.log("i'am here!!!!!");

      var envMap = pmremGenerator.fromEquirectangular(texture).texture;

      envMapGlobal = envMap;
      // envMapGlobal.rotation = 2;

      texture.dispose();
      pmremGenerator.dispose();
    });
  };

  moved = false;
  styleCursor = "";

  initControls = () => {
    // OrbitControls allow a camera to orbit around the object
    // https://threejs.org/docs/#examples/controls/OrbitControls
    this.controls = new OrbitControls(this.camera, this.mount);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.15;
    this.controls.rotateSpeed = 0.15;
    /**
     * todo: we need to add something similar to clara.io rotation momentum based on orbit controls of threejs
     * probably inertia/damping
     * https://stackoverflow.com/questions/20285892/inertia-in-orbitcontrols-from-threejs
     */

    /**
     * restrict vertical angle rotation
     */
    this.controls.minPolarAngle = Math.PI / 2 - Math.PI / 12;
    this.controls.maxPolarAngle = Math.PI / 2 + Math.PI / 12;
    /**
     * disable moving the model through the scene
     */
    this.controls.enablePan = false;
    this.controls.enableZoom = true;
    this.controls.minDistance = 0.3;
    this.controls.maxDistance = 1;
    /**
     * enable orbit controls rotation
     */
    /**
     * todo: auto rotating and controls should be enabled
     */
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = -0.5;
    // this.controls.enabled = false;

    this.controls.addEventListener("change", () => {
      this.moved = true;
    });
  };

  onSideChange = () => {
    // update bounding mapping for the new side
    this.renderText({ shouldDiscardSelection: true });
    // reset the other side selection without mapping updates
    this.renderText(
      { shouldDiscardSelection: true, withMapping: false },
      !this.isFront()
    );
  };

  // Code below is taken from Three.js OBJ Loader example
  // https://threejs.org/docs/#examples/en/loaders/OBJLoader
  loadTheModel = () => {
    // instantiate a loader
    // const loader = new OBJLoader();
    const loader = new GLTFLoader();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/examples/js/libs/draco/");
    loader.setDRACOLoader(dracoLoader);

    // load a resource
    loader.load(
      // // resource URL relative to the /public/index.html of the app
      // "whole-shirt-sliced.obj",
      // // called when resource is loaded

      "t-shirt.gltf",
      // called when the resource is loaded

      (object) => {
        this.scene.add(object.scene);

        this.frontSide = null;
        this.backSide = null;

        // get the newly added object by name specified in the OBJ model (that is Elephant_4 in my case)
        // you can always set console.log(this.scene) and check its children to know the name of a model
        this.scene.traverse((el) => {
          if (el.type === "Group") {
            el.position.set(0, 0.03, 0);
            // el.scale.x = -1;
          }
          if (el.type === "Mesh") {
            // change some custom props of the element: placement, color, rotation, anything that should be
            // done once the model was loaded and ready for display
            if (el.material.name.includes("Front")) {
              this.frontSide = el;
              el.name = "front-cloth";
              // console.log("El:");
              // console.log(el);
            } else if (el.material.name.includes("Back")) {
              el.name = "back-cloth";
              this.backSide = el;
              // console.log("El:");
              // console.log(el);
              // console.log(el.morphTargetInfluences);
            } else {
              el.name = "other-cloth";
            }
            el.material = new THREE.MeshPhysicalMaterial({
              emissiveIntensity: 0,
            });
            el.material.color.set("#ffffff");
            // el.material.normalMap = normalMap;
          }
        });

        /**
         * todo: investigate the issue with texture loading in FF
         */
        setTimeout(() => {
          this.renderText({ shouldDiscardSelection: false }, false);
          // last render stays in state, so we render front last to keep its bounds in memory
          this.renderText({ shouldDiscardSelection: false }, true);
        }, 1000);

        /**
         * white line perpendicular helper setup
         * transparent by default, change opacity to 1 for helper enabling
         */
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(0, 0, 1),
        ]);
        this.line = new THREE.Line(
          geometry,
          new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
          })
        );
        this.line.name = "line";
        this.scene.add(this.line);

        /**
         * mouse helper setup
         */
        this.mouseHelper = new THREE.Mesh(
          new THREE.BoxBufferGeometry(1, 1, 10),
          new THREE.MeshNormalMaterial()
        );
        this.mouseHelper.visible = false;
        this.mouseHelper.name = "mouseHelper";
        this.scene.add(this.mouseHelper);

        this.moved = false;

        window.addEventListener("mousewheel", (e) => {
          //  - get wheel scroll direction
          //  - if mouse is over the active element
          //  - if there is no drag (cursor = pointer)
          //  - then send scaleX / scaleY to player for the active element

          if (this.mount.style.cursor === "pointer") {
            const { isActiveHovered } = this.checkImageBounds();
            if (isActiveHovered) {
              this.renderText({
                shouldScaleUp: e.wheelDelta > 0,
              });
            }
          }
        });

        const genericClickStart = (e) => {
          this.updateMouse(e);

          const {
            textIndex,
            pointX,
            pointY,
            isRotation,
            isRemoveBtn,
          } = this.checkImageBounds();

          if (isRotation) {
            this.styleCursor = "ew-resize";
          } else if (isRemoveBtn) {
            this.styleCursor = "no-drop";
          } else if (textIndex !== -1) {
            this.styleCursor = "pointer";
          } else {
            this.mount.style.cursor = "auto";
            this.styleCursor = "auto";
          }

          this.controls.enabled =
            this.mount.style.cursor === "auto" || this.styleCursor === "auto";

          this.moved = false;

          if (
            this.mount.style.cursor === "no-drop" ||
            this.styleCursor === "no-drop"
          ) {
            this.isFront()
              ? this.props.removeActiveTextFront()
              : this.props.removeActiveTextBack();
          }
          /**
           * allow text rotation only when there is some text selected
           */
          if (
            (this.mount.style.cursor === "ew-resize" ||
              this.styleCursor === "ew-resize") &&
            this.isSelectionActive
          ) {
            /**
             * init rotate
             */
            this.mount.style.cursor = "wait";
            this.styleCursor = "wait";
            this.controls.enabled = false;
          }

          if (
            this.mount.style.cursor === "pointer" ||
            this.styleCursor === "pointer"
          ) {
            /**
             * activate currently hovered object
             */
            const { textIndex } = this.checkImageBounds();
            this.renderText({
              x: 0,
              y: 0,
              textIndex,
              shouldDiscardSelection: false,
            });
            /**
             * init drag
             */
            this.mount.style.cursor = "move";
            this.styleCursor = "move";
            this.controls.enabled = false;

            this.origin = this.checkIntersection();
          }

          if (
            this.mount.style.cursor === "auto" ||
            this.styleCursor === "auto"
          ) {
            this.isControlled = true;
            this.isFrontStart = this.isFront();
          }
        };

        window.addEventListener("mousedown", genericClickStart);
        window.addEventListener("touchstart", genericClickStart);

        const genericClickEnd = (e) => {
          if (this.isControlled) {
            this.isControlled = false;
            this.props.useState({ isFront: this.isFront() });

            if (
              (this.isFrontStart && this.isFront()) ||
              (!this.isFrontStart && !this.isFront())
            ) {
              /**
               * detect click outside
               */
              if (
                (this.mount.style.cursor === "auto" ||
                  this.styleCursor === "auto") &&
                !this.moved
              ) {
                /**
                 * should detect canvas dy id to avoid false positives
                 */
                if (e.target.id === "ot-player") {
                  this.onSideChange();
                }
              }
            } else {
              this.onSideChange();
            }

            return;
          }

          /**
           * end of rotation
           */
          if (
            this.mount.style.cursor === "wait" ||
            this.styleCursor === "wait"
          ) {
            this.mount.style.cursor = "auto";
            this.styleCursor = "auto";
            /**
             * the difference from moving is that move end on the text
             * but rotation could end up anywhere
             * todo: add intersection check
             */
            this.controls.enabled = true;
            /**
             * todo: think of a better way to manage rotation end instead of restarting controls
             */
            this.controls.dispose();
            this.initControls();
            return;
          }
          /**
           * detect click outside
           */
          if (
            (this.mount.style.cursor === "auto" ||
              this.styleCursor === "auto") &&
            !this.moved
          ) {
            /**
             * should detect canvas dy id to avoid false positives
             */
            if (e.target.id === "ot-player") {
              this.renderText({ shouldDiscardSelection: true });
            }
          }

          if (
            this.mount.style.cursor === "move" ||
            this.styleCursor === "move"
          ) {
            /**
             * drop text (apply last drag position)
             */
            this.mount.style.cursor = "pointer";
            this.styleCursor = "pointer";

            /**
             * if text was not moved, then just select it
             */
            if (!this.moved) {
              const { textIndex } = this.checkImageBounds();
              /**
               * todo: probably mark selected text somehow?
               */
              this.renderText({
                x: 0,
                y: 0,
                textIndex,
                shouldDiscardSelection: false,
              });
            }
          } else {
            // todo: should be used for new text placement
            // const { x, y } = checkIntersection();
            // if ( ! moved && intersection.intersects ) {
            //     this.renderText(x, y)
            // }
          }
        };

        window.addEventListener("mouseup", genericClickEnd);
        window.addEventListener("touchend", genericClickEnd);

        const onTouchMove = (event) => {
          if (this.isControlled) return;

          this.updateMouse(event);

          /**
           * todo: check rotation only for currently active text
           */
          const {
            textIndex,
            pointX,
            pointY,
            isRotation,
            isRemoveBtn,
          } = this.checkImageBounds();

          /**
           * move text
           */
          if (
            this.mount.style.cursor === "move" ||
            this.styleCursor === "move"
          ) {
            const { x: x1, y: y1 } = this.origin;
            const dx = pointX - x1;
            const dy = pointY - y1;

            this.renderText({
              x: dx,
              y: dy,
              textIndex,
              shouldDiscardSelection: false,
              isMoved: true,
            });

            this.origin = {
              x: x1 + dx,
              y: y1 + dy,
            };
            return;
          }

          /**
           * rotate text
           */
          if (
            this.mount.style.cursor === "wait" ||
            this.styleCursor === "wait"
          ) {
            this.props.setTextAngle(pointX, pointY);
            this.renderText({ shouldDiscardSelection: false });
            return;
          }
          /**
           * check if rotation start is allowed
           */
          if (isRotation) {
            this.mount.style.cursor = "ew-resize";
            this.styleCursor = "ew-resize";
            return;
          }
          /**
           * check if remove btn hovered
           */
          if (isRemoveBtn) {
            this.mount.style.cursor = "no-drop";
            this.styleCursor = "no-drop";
            return;
          }

          if (textIndex !== -1) {
            this.mount.style.cursor = "pointer";
            this.styleCursor = "pointer";
          } else {
            this.mount.style.cursor = "auto";
            this.styleCursor = "auto";
          }

          this.controls.enabled =
            this.mount.style.cursor === "auto" || this.styleCursor === "auto";
        };

        window.addEventListener("mousemove", onTouchMove);
        window.addEventListener("touchmove", onTouchMove);

        setTimeout(() => {
          this.setState({ loading: false });
        }, 1000);
      },
      // called when loading is in progresses
      (xhr) => {
        const loadingPercentage = Math.ceil((xhr.loaded / xhr.total) * 100);
        console.log(loadingPercentage + "% loaded");

        // update parent react component to display loading percentage
        this.props.onProgress(loadingPercentage);
      },
      // called when loading has errors
      (error) => {
        console.log("An error happened:" + error);
      }
    );
  };

  /**
   * white line perpendicular helper
   */
  line;
  /**
   * mouse helper to work with line perpendicular
   */
  mouseHelper;
  /**
   * x,y on screen
   * @type {{x: number, y: number}}
   */
  mouse = new THREE.Vector2();
  /**
   * Raycaster intersection with object surface
   * @type {{normal: Vector3, intersects: boolean, point: Vector3}}
   */
  intersection = {
    intersects: false,
    point: new THREE.Vector3(),
    normal: new THREE.Vector3(),
  };
  intersects = [];
  raycaster = new THREE.Raycaster();
  checkIntersection = () => {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.raycaster.intersectObject(
      this.isFront() ? this.frontSide : this.backSide,
      true,
      this.intersects
    );

    if (this.intersects.length > 0) {
      /**
       * save surface position intersection (for text placement)
       */
      const uv = this.intersects[0].uv;
      /**
       * update white line helper position
       */
      const p = this.intersects[0].point;
      this.mouseHelper.position.copy(p);
      this.intersection.point.copy(p);

      const n = this.intersects[0].face.normal.clone();
      n.transformDirection(
        this.isFront() ? this.frontSide.matrixWorld : this.backSide.matrixWorld
      );
      n.multiplyScalar(10);
      n.add(this.intersects[0].point);

      this.intersection.normal.copy(this.intersects[0].face.normal);
      this.mouseHelper.lookAt(n);

      const positions = this.line.geometry.attributes.position;
      positions.setXYZ(0, p.x, p.y, p.z);
      positions.setXYZ(1, n.x, n.y, n.z);
      positions.needsUpdate = true;

      this.intersection.intersects = true;
      this.intersects.length = 0;

      /**
       * return surface intersection position (for text placement)
       */
      return uv;
    } else {
      this.intersection.intersects = false;
      return {};
    }
  };

  /**
   * Detect image/text intersection on a texture by coords
   *
   * @returns {{pointX: number, pointY: number, textIndex: number, isRotation: boolean, isRemoveBtn: boolean}}
   */
  checkImageBounds = () => {
    const { x, y } = this.checkIntersection();

    /**
     * credits https://github.com/substack/point-in-polygon
     * @param point [x: number, y: number]
     * @param vs
     * @returns {boolean}
     */
    const isInside = function (point, vs) {
      // ray-casting algorithm based on
      // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

      const x = point[0],
        y = point[1];

      let inside = false;
      for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0],
          yi = vs[i][1];
        const xj = vs[j][0],
          yj = vs[j][1];

        const intersect =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) {
          inside = !inside;
        }
      }

      return inside;
    };

    const getRemoveBtnHover = () => {
      if (!this.allBounds) return false;
      if (!this.isSelectionActive) return false;
      const btnSize = 0.0125;
      return this.allBounds.some(
        ({ coords }, index) =>
          index === this.activeIndex &&
          isInside(
            [x, y],
            [
              [coords[2][0] - btnSize, coords[2][1] + btnSize],
              [coords[2][0] + btnSize, coords[2][1] + btnSize],
              [coords[2][0] + btnSize, coords[2][1] - btnSize],
              [coords[2][0] - btnSize, coords[2][1] - btnSize],
            ]
          )
      );
    };

    /**
     * check only currently active text rotation
     */
    const getRotationHover = () => {
      if (!this.allBounds) return false;
      if (!this.isSelectionActive) return false;
      return this.allBounds.some(
        ({ knobCoords }, index) =>
          index === this.activeIndex && isInside([x, y], knobCoords)
      );
    };
    /**
     * text bounds are calculated taking rotation into account
     */
    const getTextIndex = () => {
      if (!this.allBounds) return -1;
      return this.allBounds.findIndex(({ coords }) => isInside([x, y], coords));
    };

    /**
     * check active bounds first
     * @returns {boolean}
     */
    const checkActiveBounds = () => {
      if (!this.activeBounds) return false;
      if (!this.isSelectionActive) return false;
      return isInside([x, y], this.activeBounds.coords);
    };

    return {
      isRemoveBtn: getRemoveBtnHover(),
      /**
       * todo: pass active text bounds
       */
      isRotation: getRotationHover(),
      /**
       * index of a text in a textArray of canvas
       */
      textIndex: checkActiveBounds() ? this.activeIndex : getTextIndex(),
      /**
       * current surface intersection x and y
       */
      pointX: x,
      pointY: y,
      isActiveHovered: checkActiveBounds(),
    };
  };
  /**
   * update mouse/touch coordinates
   */
  updateMouse = (e) => {
    let x, y;

    // mobile touch detection https://stackoverflow.com/a/25481098/8465699
    if (e.touches) {
      x = e.touches[0].pageX;
      y = e.touches[0].pageY;

      // touch move detection from three.js
    } else if (e.changedTouches) {
      x = e.changedTouches[0].pageX;
      y = e.changedTouches[0].pageY;

      // regular click coords
    } else {
      x = e.clientX;
      y = e.clientY;
    }

    // get player coords
    const bounds = this.mount.getBoundingClientRect();

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    this.mouse.x = ((x - bounds.x) / bounds.width) * 2 - 1;
    this.mouse.y = -((y - bounds.y) / bounds.height) * 2 + 1;
  };

  // adding some lights to the scene
  addLights = () => {
    const lights = [];
    const spotlightSettings = {
      color: 0xffffff,
      intensity: 1.8,
      mapSizeH: 1024,
      mapSizeW: 1024,
      shadCamNear: 512,
      shadCamFar: 4096,
      shadCamFov: 30,
    };

    // set color and intensity of lights
    // lights[0] = new THREE.RectAreaLight( 0xffffff, 20, 1000, 1000 );
    lights[0] = new THREE.SpotLight(0xffffff);

    lights[0].intensity = spotlightSettings.intensity;
    lights[0].shadow.mapSize.height = spotlightSettings.color;
    lights[0].shadow.camera.near = spotlightSettings.shadCamNear;
    lights[0].shadow.camera.far = spotlightSettings.shadCamFar;
    lights[0].shadow.camera.fov = spotlightSettings.shadCamFov;

    lights[1] = new THREE.SpotLight(0xffffff);

    lights[1].intensity = spotlightSettings.intensity;
    lights[1].shadow.mapSize.height = spotlightSettings.color;
    lights[1].shadow.camera.near = spotlightSettings.shadCamNear;
    lights[1].shadow.camera.far = spotlightSettings.shadCamFar;
    lights[1].shadow.camera.fov = spotlightSettings.shadCamFov;

    // place some lights around the scene for best looks and feel
    lights[0].position.set(0, 1200, 1200);
    lights[1].position.set(0, 600, -1200);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    // this.scene.add(lights[0]);
    // this.scene.add(lights[1]);
    this.scene.add(ambientLight);
    // this.scene.add( lights[ 1 ] );
    // this.scene.add( lights[ 2 ] );
  };

  startAnimationLoop = () => {
    this.renderer.render(this.scene, this.camera);
    /**
     * update controls to make rotation working
     */
    this.controls.update();

    // The window.requestAnimationFrame() method tells the browser that you wish to perform
    // an animation and requests that the browser call a specified function
    // to update an animation before the next repaint
    this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
  };

  isFront = () => {
    this.angle = THREE.Math.radToDeg(this.controls.getAzimuthalAngle());
    return this.angle >= -90 && this.angle < 90;
  };

  handleWindowResize = () => {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;

    // const width = getWidthByInner();
    // const height = getHeightByInner();

    this.setState({
      style: { ...initialStyle, width: width, height: height },
    });

    this.renderer.setSize(width, height);

    this.renderer.setPixelRatio(
      window.devicePixelRatio ? window.devicePixelRatio : 1
    );

    this.camera.aspect = width / height;

    // Note that after making changes to most of camera properties you have to call
    // .updateProjectionMatrix for the changes to take effect.
    this.camera.updateProjectionMatrix();
  };

  rotateTo = (deg) => {
    this.controls.autoRotate = false;
    let rotation = THREE.Math.radToDeg(this.controls.getAzimuthalAngle());

    if (rotation < 0) {
      rotation += 360;
    }

    // case deg = 0, rotation >= 180 => rotation++ => 360 => 0
    // case deg = 0, rotation < 180 => rotation-- => 0

    // case deg = 180, rotation >= 0, rotation < 180 => rotation++ => 180
    // case deg = 180, rotation >= 180 => rotation-- => 180

    const increment =
      (deg === 0 && rotation >= 180) ||
      (deg === 180 && rotation >= 0 && rotation < 180);

    const initialPoint = increment && deg === 0 ? 360 : deg;

    // distance between initial and end points
    const distance = Math.abs(initialPoint - rotation);

    // every point should be calculated as an item of [0,1]
    // initially distance = 1
    // distance will decrease with every new frame like distanceNew / distance

    this.timerId = setInterval(() => {
      // we should calculate distanceNew for every frame
      const distanceNew = Math.abs(initialPoint - rotation);

      // calculate easing
      const easeInOut = (t) =>
        t < 0.05 ? 5 * t : 3 * (-1 + (4 - 2 * (t + 0.3)) * (t + 0.3));
      const delta = easeInOut(distanceNew / distance);

      rotation = increment ? rotation + delta : rotation - delta;

      if (deg === 0 && rotation >= 180) {
        // check 360 => set 0
        if (rotation >= 359.9) {
          this.finalizeRotation(deg);
        }
      }
      if (deg === 0 && rotation < 180) {
        // check 0 => set 0
        if (rotation <= 0.1) {
          this.finalizeRotation(deg);
        }
      }
      if (deg === 180 && rotation >= 0 && rotation < 180) {
        // check 180 => set 180
        if (rotation >= 179.9) {
          this.finalizeRotation(deg);
        }
      }
      if (deg === 180 && rotation >= 180) {
        // check 180 => set 180
        if (rotation <= 180.1) {
          this.finalizeRotation(deg);
        }
      }

      this.controls.minAzimuthAngle = THREE.Math.degToRad(rotation);
      this.controls.maxAzimuthAngle = THREE.Math.degToRad(rotation);
    }, 5);
  };

  finalizeRotation = (deg) => {
    clearInterval(this.timerId);
    /**
     * set final angle
     */
    this.controls.minAzimuthAngle = THREE.Math.degToRad(deg);
    this.controls.maxAzimuthAngle = THREE.Math.degToRad(deg);
    /**
     * set vertical angle
     */
    // todo: add slow rotation for the vertical angle too
    // this.controls.minPolarAngle = Math.PI/2;
    // this.controls.maxPolarAngle = Math.PI/2;

    this.props.useState({ isFront: this.isFront()});
    this.onSideChange();

    setTimeout(() => {
      // from the threejs docs:
      // .maxAzimuthAngle : Float
      // How far you can orbit horizontally, upper limit. If set, the interval [ min, max ] must be
      // a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI ). Default is Infinity.
      this.controls.minAzimuthAngle = -Infinity;
      this.controls.maxAzimuthAngle = Infinity;
      /**
       * set vertical angle
       */
      // this.controls.minPolarAngle = Math.PI / 2 - Math.PI / 10;
      // this.controls.maxPolarAngle = Math.PI / 2 + Math.PI / 10;
    }, 100);
  };

  rotateToFront = (isFront) => {
    clearInterval(this.timerId);
    this.rotateTo(isFront ? 0 : 180);
  };

  render() {
    return (
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        {this.state.loading && (
          <div className={`lds-ellipsis`}>
            
            <div className={`${this.props.colorTheme}`}></div>
            <div className={`${this.props.colorTheme}`}></div>
            <div className={`${this.props.colorTheme}`}></div>
            <div className={`${this.props.colorTheme}`}></div>
          </div>
        )}
        <div
          onMouseDown={() => (this.controls.autoRotate = false)}
          onTouchStart={() => (this.controls.autoRotate = false)}
          style={{
            ...this.state.style,
            opacity: this.state.loading ? 0 : 1,
          }}
          ref={(ref) => (this.mount = ref)}
        />
      </div>
    );
  }

  timerId = null;
}

export default Player;
