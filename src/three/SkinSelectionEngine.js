import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

export class SkinSelectionEngine {
  constructor({ host, onRowsChange }) {
    this.host = host;
    this.onRowsChange = onRowsChange;
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.selectable = [];
    this.INTERSECTED = null;
    this.SELECTED = null;
    this.rows = [];
    this.showFlags = { showNodecodes: true, showDrainage: true, showPatientCounts: true };
    this.offset = new THREE.Vector3(-270, -200, 900);
    this.lymph_lookup = {};
    this._drag = false;
    this._needsHoverUpdate = false;
    this.focusPoint = new THREE.Vector3(0, 0, 0);
    this.hasFocusPoint = false;
    this._isPointerDown = false;
    this._downClient = { x: 0, y: 0 };
    this._dragThresholdPx = 4;
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
  }

  async init() {
    this.scene = new THREE.Scene();

    const { width, height } = this._getHostSize();
    this.camera = new THREE.PerspectiveCamera(35, width / height, 1, 10000);
    this.camera.position.set(1496.96865501004, 3213.1316867226697, -232.08816356744805);
    this.camera.up = new THREE.Vector3(0, 0, 1);

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

    // label renderer
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(width, height);
    this.labelRenderer.domElement.style.position = "absolute";
    this.labelRenderer.domElement.style.inset = "0";
    this.labelRenderer.domElement.style.pointerEvents = "none";
    this.host.appendChild(this.labelRenderer.domElement);

    // controls
    this.controls = new ArcballControls(this.camera, this.renderer.domElement, this.scene);
    this.controls.setGizmosVisible(false);

    // tooltip label
    this.tooltip = this._addLabel("0", new THREE.Vector3(0, 0, 0), "tt");
    this.tooltip.visible = false;

    await this._loadData();
    await this._loadModel();

    this.host.style.touchAction = "none";

    this.host.addEventListener("pointermove", this._onPointerMove);
    this.host.addEventListener("pointerdown", this._onPointerDown);
    this.host.addEventListener("pointerup", this._onPointerUp);
    this.host.addEventListener("pointercancel", this._onPointerUp);

    // resize observer for container based resizing 
    this._resizeObserver = new ResizeObserver(() => this._resizeToHost());
    this._resizeObserver.observe(this.host);

    this._animate();
  }

  // Public API
  setShowFlags(flags) {
    this.showFlags = { ...this.showFlags, ...flags };
    this._applyLabels();
  }

  setViewPreset(preset) {
    if (!this.controls || !this.camera) return;

    // Pivot around the selected element if there is one else fall back
    const pivot = this._getFocusPoint().clone();

    // Keep the same distance from pivot and not the origin 
    const distance = this.camera.position.distanceTo(pivot);

    // Direction vectors for each preset
    const dir = new THREE.Vector3(0, 1, 0);
    if (preset === "Posterior") dir.set(0, -1, 0);
    else if (preset === "Left lateral") dir.set(-1, 0, 0);
    else if (preset === "Right lateral") dir.set(1, 0, 0);
    else if (preset === "Anterior") dir.set(0, 1, 0);
    else if (preset === "All") {
      // All means reset but keep pivot locked to selection if any
      this.controls.reset();
      this.camera.up.set(0, 0, 1);
      this._setControlsTarget(pivot);
      this.controls.update();
      return;
    }

    // Move camera to pivot + direction * distance
    this.camera.position.copy(pivot).addScaledVector(dir, distance);

    // Ensure consistent up
    this.camera.up.set(0, 0, 1);

    // Make the controls orbit around the selected element
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
    //  Reset the camera and controls
    this.controls?.reset();
    this.controls?.update();

    // Clear focus so zoom no longer uses the old clicked point
    this.hasFocusPoint = false;
    this.focusPoint?.set?.(0, 0, 0);

    // Put the controls pivot back to default 
    if (this.focusPoint) this._setControlsTarget(this.focusPoint);

    // Clear selected mesh visual state
    if (this.SELECTED?.material?.color) {
      this.SELECTED.material.color.set("#E5B27F");
      this.SELECTED.material.opacity = 0.5;
    }
    this.SELECTED = null;

    // Clear hover highlight 
    if (this.INTERSECTED?.material?.emissive) {
      this.INTERSECTED.material.emissive.setHex(0x000000);
    }
    this.INTERSECTED = null;

    // Hide all lymph markers and labels
    for (const obj of Object.values(this.lymph_lookup)) {
      obj.sphere.visible = false;
      obj.label.visible = false;
    }

    // Hide tooltip and clear rows cache
    if (this.tooltip) this.tooltip.visible = false;
    this.rows = [];

    //  Tell React to clear the table
    this.onRowsChange?.([]);
  }


  dispose() {
    if (this._raf) cancelAnimationFrame(this._raf);

    this.host?.removeEventListener("pointermove", this._onPointerMove);
    this.host?.removeEventListener("pointerdown", this._onPointerDown);
    this.host?.removeEventListener("pointerup", this._onPointerUp);
    this.host?.removeEventListener("pointercancel", this._onPointerUp);


    this._resizeObserver?.disconnect();
    this._resizeObserver = null;

    this.controls?.dispose();

    // Remove DOM nodes safely
    if (this.renderer?.domElement?.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    if (this.labelRenderer?.domElement?.parentNode) this.labelRenderer.domElement.parentNode.removeChild(this.labelRenderer.domElement);

    // Dispose scene resources 
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
    this.labelRenderer = null;
    this.scene = null;
  }

  // Private methods
  async _loadData() {
    const [lymphs, dataElements, patientCounts] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/lymphs_positions.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/data_elements.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/element_patient_counts.json`).then((r) => r.json()),
    ]);
    this.data_elements = dataElements;
    this.patient_counts = patientCounts;

    const sphereGeometry = new THREE.SphereGeometry(18, 32, 32);

    const makeSphere = (pos) => {
      const mat = new THREE.MeshPhongMaterial({
        color: 0x00ff00,      // keep original green
        opacity: 1,
        transparent: false,
        shininess: 20,
      });

      const s = new THREE.Mesh(sphereGeometry, mat);
      s.position.copy(pos);
      s.visible = false;
      this.scene.add(s);
      return s;
    };

    const makeRichLabel = (code, pos) => {
      const div = document.createElement("div");
      div.className = "label lymph";

      const codeSpan = document.createElement("span");
      codeSpan.className = "code";
      codeSpan.textContent = code;

      const pctSpan = document.createElement("span");
      pctSpan.className = "pct";
      pctSpan.textContent = "";

      div.appendChild(codeSpan);
      div.appendChild(pctSpan);

      const obj = new CSS2DObject(div);

      // Lift label above the node
      obj.position.copy(pos).add(new THREE.Vector3(0, 0, 25));

      obj.visible = false;
      this.scene.add(obj);

      return { obj, div, codeSpan, pctSpan };
    };

    this.lymph_lookup = {};

    // Store references
    for (const l of lymphs) {
      const pos = new THREE.Vector3(l.position[0], l.position[1], l.position[2]).add(this.offset);
      const sphere = makeSphere(pos);
      const labelParts = makeRichLabel(l.label, pos);

      this.lymph_lookup[l.label] = {
        nodePos: pos.clone(),
        sphere,
        label: labelParts.obj,
        labelDiv: labelParts.div,
        codeSpan: labelParts.codeSpan,
        pctSpan: labelParts.pctSpan,
      };
    }
  }

  async _loadModel() {
    const loader = new GLTFLoader();

    await new Promise((resolve, reject) => {
      loader.load(
        `${import.meta.env.BASE_URL}/data/scene.glb`,
        (gltf) => {
          let root = gltf.scene.children[0];

          for (const child of root.children) {
            child.geometry?.computeVertexNormals?.();

            if (child.name === "Lines") {
              const material = new THREE.LineBasicMaterial({ color: 0x000000 });
              const mesh = new THREE.LineSegments(child.geometry, material);
              mesh.position.add(this.offset);
              this.scene.add(mesh);
              child.visible = false;
            } else {
              child.material = new THREE.MeshPhongMaterial({
                color: "#E5B27F",
                specular: "#33334C",
                opacity: 0.5,
                transparent: true,
                shininess: 20,
                side: THREE.DoubleSide,
              });
              this.selectable.push(child);
            }
          }

          root.position.add(this.offset);
          this.scene.add(root);

          resolve();
        },
        undefined,
        reject
      );
    });
  }

    _dollyToFocus(scale) {
    const focus = this._getFocusPoint();

    // Move camera along the line from focus  camera
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

  // defensive three.js working
  _setControlsTarget(point) {
    if (!this.controls) return;

    // Some builds expose .target (OrbitControls style)
    if (this.controls.target?.copy) {
      this.controls.target.copy(point);
    }

    // Some ArcballControls builds expose setTarget(x,y,z)
    if (typeof this.controls.setTarget === "function") {
      this.controls.setTarget(point.x, point.y, point.z);
    }

    // Some ArcballControls builds expose setCenter(Vector3)
    if (typeof this.controls.setCenter === "function") {
      this.controls.setCenter(point);
    }
  }

  _animate() {
    this._raf = requestAnimationFrame(() => this._animate());
    this._render();
  }

  _render() {
    if (this._needsHoverUpdate) {
      this._updateHover();
      this._needsHoverUpdate = false;
    }
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  _onPointerMove(e) {
    const rect = this.host.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newX = x * 2 - 1;
    const newY = -(y * 2 - 1);

    // Only flag for update if position actually changed
    if (Math.abs(this.pointer.x - newX) > 0.001 ||
      Math.abs(this.pointer.y - newY) > 0.001) {
      this.pointer.x = newX;
      this.pointer.y = newY;
      this._needsHoverUpdate = true; // SET FLAG
    }



    // Only treat movement as drag if the pointer is currently down
    if (this._isPointerDown && !this._drag) {
      const dx = e.clientX - this._downClient.x;
      const dy = e.clientY - this._downClient.y;
      if (Math.hypot(dx, dy) >= this._dragThresholdPx) {
        this._drag = true;
      }
    }
  }

  _onPointerDown(e) {
    this._isPointerDown = true;
    this._drag = false;
    this._downClient.x = e.clientX;
    this._downClient.y = e.clientY;

    // keep receiving pointer events even if the cursor leaves the host
    this.host.setPointerCapture?.(e.pointerId);
  }


  _onPointerUp(e) {
    // Release pointer capture 
    this.host.releasePointerCapture?.(e.pointerId);

    const wasDrag = this._drag;

    // Always clear pointer state
    this._isPointerDown = false;
    this._drag = false;

    // If the user dragged the mouse make sure to not treat this as a click
    if (wasDrag) return;

    // If the pointer-up happened outside the host ignore it 
    if (!this._isClientPointInsideHost(e.clientX, e.clientY)) return;

    // Make sure the raycast uses the pointer-up position 
    this._updatePointerFromEvent(e);

    // Reraycast on click to get a reliable object and the hit point
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.selectable, true);
    if (hits.length === 0) return;

    const clickedObject = hits[0].object;

    // Determine whether the selection is actually changing
    const selectionChanged = this.SELECTED !== clickedObject;

    // reset previous selection colour
    if (this.SELECTED?.material?.color) {
      this.SELECTED.material.color.set("#E5B27F");
      this.SELECTED.material.opacity = 0.5;
    }

    this.SELECTED = clickedObject;
    if (this.SELECTED?.material?.color) this.SELECTED.material.color.setHex(0xff0000);

    // Update zoom focus ONLY if selection changed or nothing was focused yet
    if (selectionChanged || !this.hasFocusPoint) {
      const centre = this._getCenterPoint(this.SELECTED);
      this.focusPoint.copy(centre);
      this.hasFocusPoint = true;
      this._setControlsTarget(centre);
    }

    // hide all lymph markers
    for (const v of Object.values(this.lymph_lookup)) {
      v.sphere.visible = false;
      v.label.visible = false;
    }

    const name = this.SELECTED.name;
    const rows =
      this.data_elements?.[name] ||
      this.data_elements?.[name.replace(/_/g, " ")] ||
      [];

    this.rows = rows;
    this.onRowsChange?.(rows);

    // tooltip count
    const elementKey = name.replace("element_", "");
    const count = this.patient_counts?.[elementKey] ?? 0;
    if (this.tooltip) {
      this.tooltip.element.textContent = String(count);
      this.tooltip.visible = Boolean(this.showFlags.showPatientCounts);
      this.tooltip.position.copy(this._getCenterPoint(this.SELECTED));
    }

    // show markers for each row
    for (const r of rows) {
      const item = this.lymph_lookup[r.code];
      if (!item) continue;

      item.sphere.visible = true;
      item.label.visible = true;

      // set label contents
      item.codeSpan.textContent = r.code;
      item.pctSpan.textContent = `${String(r.percentage).trim()}%`;

      // scale sphere by drainage percentage (0.5 to 1 range)
      const pct = parseFloat(r.percentage) / 50;
      item.sphere.scale.setScalar(pct).clampScalar(0.5, 1);
    }

    this._applyLabels();
  }


  _applyLabels() {
    const { showNodecodes, showDrainage, showPatientCounts } = this.showFlags;

    // tooltip visibility
    if (this.tooltip) {
      this.tooltip.visible = Boolean(this.SELECTED) && Boolean(showPatientCounts);
    }
    // Update label visibility and classes
    for (const r of this.rows) {
      const item = this.lymph_lookup[r.code];
      if (!item) continue;

      // Update CSS classes for showing and hiding parts
      const div = item.labelDiv;

      div.classList.toggle('hide-code', !showNodecodes);
      div.classList.toggle('hide-pct', !showDrainage);

      // Show label if at least one part is visible
      item.label.visible = showNodecodes || showDrainage;

      // Keep sphere visible
      item.sphere.visible = true;
    }
  }

  _addLabel(text, position, additionalClass) {
    const div = document.createElement("div");
    div.className = `label ${additionalClass}`;
    div.textContent = text;

    const label = new CSS2DObject(div);
    label.position.copy(position);
    this.scene.add(label);
    return label;
  }

  _getCenterPoint(mesh) {
    const geometry = mesh.geometry;
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    mesh.localToWorld(center);
    return center;
  }

  _resizeToHost() {
    const { width, height } = this._getHostSize();
    if (!this.camera || !this.renderer || !this.labelRenderer) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.labelRenderer.setSize(width, height);
  }

  _getHostSize() {
    const r = this.host.getBoundingClientRect();
    return { width: Math.max(1, r.width), height: Math.max(1, r.height) };
  }

  _isClientPointInsideHost(clientX, clientY) {
    const rect = this.host.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }

  _updatePointerFromEvent(e) {
    const rect = this.host.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    this.pointer.x = x * 2 - 1;
    this.pointer.y = -(y * 2 - 1);
  }

  _updateHover() {
    // Only raycast when called and not every frame
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.selectable, true);

    if (hits.length > 0) {
      const obj = hits[0].object;
      if (this.INTERSECTED !== obj) {
        // Remove previous highlight
        if (this.INTERSECTED?.material?.emissive) {
          this.INTERSECTED.material.emissive.setHex(0x000000);
        }

        // Add new highlight
        this.INTERSECTED = obj;
        if (this.INTERSECTED?.material?.emissive) {
          this.INTERSECTED.material.emissive.setHex(0xff0000);
        }
      }
    } else {
      // Clear highlight
      if (this.INTERSECTED?.material?.emissive) {
        this.INTERSECTED.material.emissive.setHex(0x000000);
      }
      this.INTERSECTED = null;
    }
  }
}
