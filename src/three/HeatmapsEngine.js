
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls.js";

export class HeatmapsEngine {
  constructor({ host }) {
    this.host = host;

    this.offset = new THREE.Vector3(-270, -200, 900);

    this._raf = null;
    this._resizeObserver = null;

    this.selection = {
      region: "Right Axilla",
      patientDataMode: "norm", // normalised or frequency
      displaySites: true,
    };

    this.heatmapAttrs = {};          // map of region name to Float32BufferAttribute of heatmap colours
    this.discretePoints = null;      // map from json
    this.mesh = null;                // the heatmap mesh with heatmap colours applied
    this.heatmapRoot = null;

    this._setControlsTarget = this._setControlsTarget.bind(this);
    this._disposed = false;

  }

  async init() {
    this._disposed = false;
    this.scene = new THREE.Scene();

    const { width, height } = this._getHostSize();

    this.camera = new THREE.PerspectiveCamera(35, width / height, 1, 10000);
    this.camera.position.set(1496.96865501004, 3213.1316867226697, -232.08816356744805);
    this.camera.up.set(0, 0, 1);

    // lights
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 3);
    dirLight1.position.set(1, 1, 1);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 3);
    dirLight2.position.set(-1, -1, -1);
    this.scene.add(dirLight2);

    const ambientLight = new THREE.AmbientLight(0x404040, 10);
    this.scene.add(ambientLight);

    // renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.display = "block";
    this.host.appendChild(this.renderer.domElement);

    // controls
    this.controls = new ArcballControls(this.camera, this.renderer.domElement, this.scene);
    this.controls.setGizmosVisible(false);

    this.host.style.touchAction = "none";

    await this._loadHeatmapColours();
    if (this._disposed) return;
    await this._loadDiscretePoints();
    if (this._disposed) return;
    await this._loadHeatmapMesh();
    if (this._disposed) return;

    // start with a  default region
    const meta = this.getMeta();
    this.selection.region = meta.defaultRegion;

    // resize observer
    this._resizeObserver = new ResizeObserver(() => this._resizeToHost());
    this._resizeObserver.observe(this.host);

    this._animate();
  }

  //  Public API

  getMeta() {
    const regions = Object.keys(this.heatmapAttrs).sort((a, b) => a.localeCompare(b));
    const patientDataKeys = this.discretePoints ? Object.keys(this.discretePoints) : [];
    const defaultRegion =
      regions.includes("Right Axilla") ? "Right Axilla" : (regions[0] ?? "Right Axilla");

    return { regions, patientDataKeys, defaultRegion };
  }

  setHeatmapSelection(next) {
    this.selection = { ...this.selection, ...next };
    this._applyHeatmap();
    this._applyDiscretePoints();
  }

  setViewPreset(preset) {
    if (!this.controls || !this.camera) return;

    const pivot = (this.controls.target?.clone?.() ?? new THREE.Vector3(0, 0, 0));
    const distance = this.camera.position.distanceTo(pivot);

    const dir = new THREE.Vector3(0, 1, 0);
    if (preset === "Posterior") dir.set(0, -1, 0);
    else if (preset === "Left lateral") dir.set(-1, 0, 0);
    else if (preset === "Right lateral") dir.set(1, 0, 0);
    else if (preset === "Anterior") dir.set(0, 1, 0);
    else if (preset === "All") {
      this.controls.reset();
      this.camera.up.set(0, 0, 1);
      this._setControlsTarget(pivot);
      this.controls.update();
      return;
    }

    this.camera.position.copy(pivot).addScaledVector(dir, distance);
    this.camera.up.set(0, 0, 1);
    this._setControlsTarget(pivot);
    this.controls.update();
  }

  zoomIn() {
    this._dollyToFocus(0.85);
  }

  zoomOut() {
    this._dollyToFocus(1.18);
  }

  resetAll() {
    this.controls?.reset();
    this.controls?.update();

    // clear discrete overlay
    this._clearDiscreteOverlay();

    // reapply current selection
    this._applyHeatmap();
    this._applyDiscretePoints();
  }

  dispose() {
    this._disposed = true;
    if (this._raf) cancelAnimationFrame(this._raf);

    this._resizeObserver?.disconnect();
    this._resizeObserver = null;

    this.controls?.dispose();

    if (this.renderer?.domElement?.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    // dispose overlays
    this._clearDiscreteOverlay(true);

    // dispose scene resources
    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose?.());
        }
      });
    }

    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
  }

  // Internal

  async _loadHeatmapColours() {
    const raw = await fetch(`${import.meta.env.BASE_URL}data/heat_maps_verts_colors.json`).then((r) => r.json());

    const parseColor = (c) => {
      const r = (c >> 16) & 255;
      const g = (c >> 8) & 255;
      const b = c & 255;
      return [r / 255, g / 255, b / 255];
    };

    this.heatmapAttrs = {};
    for (const [key, arr] of Object.entries(raw)) {
      const colors = new Float32Array(arr.length * 3);
      for (let i = 0; i < arr.length; i++) {
        const [rr, gg, bb] = parseColor(arr[i]);
        const j = i * 3;
        colors[j] = rr;
        colors[j + 1] = gg;
        colors[j + 2] = bb;
      }
      this.heatmapAttrs[key] = new THREE.Float32BufferAttribute(colors, 3);
    }
  }

  async _loadDiscretePoints() {
    this.discretePoints = await fetch(`${import.meta.env.BASE_URL}data/discrete_points_normalized.json`).then((r) => r.json());
  }

  async _loadHeatmapMesh() {
    const loader = new GLTFLoader();

    const gltf = await new Promise((resolve, reject) => {
      loader.load(
        `${import.meta.env.BASE_URL}data/human_mesh.glb`,
        resolve,
        undefined,
        reject
      );
    });

    // find first mesh
    let foundMesh = null;
    gltf.scene.traverse((obj) => {
      if (!foundMesh && obj.isMesh) foundMesh = obj;
    });

    if (!foundMesh) throw new Error("No mesh found in human_mesh.glb");

    foundMesh.geometry.computeVertexNormals();

    foundMesh.material = new THREE.MeshPhongMaterial({
      color: "#FFFFFF",
      specular: "#33334C",
      opacity: 1,
      transparent: false,
      shininess: 20,
      side: THREE.DoubleSide,
      vertexColors: true,
    });

    // keep references
    this.mesh = foundMesh;
    this.heatmapRoot = gltf.scene;
    if (this._disposed || !this.scene) return;

    // match skin selection positioning convention
    this.heatmapRoot.position.add(this.offset);

    this.scene.add(this.heatmapRoot);

    // discrete overlay group (instanced mesh lives here)
    this.discreteGroup = new THREE.Group();
    this.heatmapRoot.add(this.discreteGroup);

    // apply initial colours
    this._applyHeatmap();
  }

  _applyHeatmap() {
    if (!this.mesh?.geometry) return;

    const region = this.selection.region;
    const attr = this.heatmapAttrs[region];

    if (!attr) return;

    this.mesh.geometry.setAttribute("color", attr);
    if (this.mesh.geometry.attributes.color) {
      this.mesh.geometry.attributes.color.needsUpdate = true;
    }
  }

_applyDiscretePoints() {
  if (!this.discretePoints || !this.discreteGroup) return;

  // remove old overlay
  this._clearDiscreteOverlay();
  if (!this.selection.displaySites) return;

  // select correct dataset key
  let key = this.selection.region;
  if (this.selection.patientDataMode === "freq") key = `${key} Frequency`;

  const data = this.discretePoints[key];
  if (!data?.positions?.length) return;

  const count = data.positions.length;

  // Geometry
  const geom = new THREE.SphereGeometry(10, 16, 16);

  // give the sphere a vertex color attribute (white)
  // so vertexColors never renders as black if instanceColor is not picked up
  const vCount = geom.getAttribute("position").count;
  const baseColors = new Float32Array(vCount * 3);
  baseColors.fill(1); // white
  geom.setAttribute("color", new THREE.BufferAttribute(baseColors, 3));

  // material
  const mat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: "#33334C",
    shininess: 20,
    vertexColors: true,
  });

  const instanced = new THREE.InstancedMesh(geom, mat, count);

  // allocate and attach instanceColor
  instanced.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(count * 3),
    3
  );
  instanced.geometry.setAttribute("instanceColor", instanced.instanceColor);

  // transforms
  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3(0.5, 0.5, 0.5);

  const arr = instanced.instanceColor.array;

  for (let i = 0; i < count; i++) {
    const pos = data.positions[i];
    p.set(pos[0], pos[1], pos[2]); // no offset 

    m.compose(p, q, s);
    instanced.setMatrixAt(i, m);

    // colour
    let c;
    if (this.selection.patientDataMode === "freq") {
      c = new THREE.Color(0, 0, 0);
    } else {
      const cv = data.colors?.[i];
      // colours stored as packed 0xRRGGBB numbers from the original version
      console.log("sample colour value:", data.colors?.[0], typeof data.colors?.[0]);
      c = (typeof cv === "number" && Number.isFinite(cv)) ? new THREE.Color(cv) : new THREE.Color(0, 0, 0);
    }

    const j = i * 3;
    arr[j] = c.r;
    arr[j + 1] = c.g;
    arr[j + 2] = c.b;
  }

  instanced.instanceMatrix.needsUpdate = true;
  instanced.instanceColor.needsUpdate = true;
  instanced.frustumCulled = false;

  // if the program compiled before instanceColor existed force recompile 
  instanced.material.needsUpdate = true;
  this._discreteInstanced = instanced;
  this.discreteGroup.add(instanced);
}

  _clearDiscreteOverlay(dispose = false) {
    if (this._discreteInstanced) {
      this.discreteGroup.remove(this._discreteInstanced);

      if (dispose) {
        this._discreteInstanced.geometry?.dispose?.();
        this._discreteInstanced.material?.dispose?.();
      }

      this._discreteInstanced = null;
    }
  }

  _dollyToFocus(scale) {
    const focus =this._getFocusPoint();

    const v = new THREE.Vector3().subVectors(this.camera.position, focus);
    v.multiplyScalar(scale);
    this.camera.position.copy(focus).add(v);

    this._setControlsTarget(focus);
    this.controls?.update();
  }


   _getFocusPoint() {
    // use the element clicked by user 
    if (this.SELECTED && this.hasFocusPoint) return this.focusPoint;

    // Otherwise fall back to controls target if available else origin
    if (this.controls?.target) return this.controls.target;
    return this.focusPoint.set(0, 0, 0);
  }

  _setControlsTarget(point) {
    if (!this.controls) return;

    if (this.controls.target?.copy) {
      this.controls.target.copy(point);
    }
    if (typeof this.controls.setTarget === "function") {
      this.controls.setTarget(point.x, point.y, point.z);
    }
    if (typeof this.controls.setCenter === "function") {
      this.controls.setCenter(point);
    }
  }

  _animate() {
    this._raf = requestAnimationFrame(() => this._animate());
    this._render();
  }

  _render() {
    this.renderer.render(this.scene, this.camera);
  }

  _resizeToHost() {
    const { width, height } = this._getHostSize();
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  _getHostSize() {
    const r = this.host.getBoundingClientRect();
    return { width: Math.max(1, r.width), height: Math.max(1, r.height) };
  }
  


_lerp(a, b, t) {
  return a + (b - a) * t;
}

_colorFromLegendScalar(v) {
  const t = Math.max(0, Math.min(255, v)) / 255;

  const stops = [
    { t: 0.00, c: new THREE.Color("#0033ff") },
    { t: 0.25, c: new THREE.Color("#00d5ff") },
    { t: 0.50, c: new THREE.Color("#00ff66") },
    { t: 0.75, c: new THREE.Color("#ffe600") },
    { t: 1.00, c: new THREE.Color("#ff2a00") },
  ];

  let i = 0;
  while (i < stops.length - 2 && t > stops[i + 1].t) i++;

  const a = stops[i];
  const b = stops[i + 1];
  const localT = (t - a.t) / (b.t - a.t);

  return new THREE.Color(
    this._lerp(a.c.r, b.c.r, localT),
    this._lerp(a.c.g, b.c.g, localT),
    this._lerp(a.c.b, b.c.b, localT)
  );
}
}
