import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";

class ConfigurableSphere {
  // Class implementation remains unchanged
  constructor({
    numberOfZones = 15,
    sphereRadius = 1,
    zoneOpacities = [],
    zoneColors = [],
    zoneWidths = [],
    rotationSpeed = 0.01,
    zoneRotationSpeed = 0.005,
    centralZoneIndex = 8
  } = {}) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    
    this.params = {
      numberOfZones,
      sphereRadius,
      zoneOpacities,
      zoneColors,
      zoneWidths,
      rotationSpeed,
      zoneRotationSpeed,
      centralZoneIndex
    };

    this.zones = [];
    this.core = null;
    this.isDragging = false;
    this.lastMousePosition = { x: 0, y: 0 };
    this.rotationDelta = { x: 0, y: 0 };

    this.init();
    this.setupEventListeners();
    this.animate();
  }

  init() {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0); // Set transparent background
    this.camera.position.z = 6;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 3);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 0);
    this.scene.add(directionalLight);
    
    // Create scene group
    this.sceneGroup = new THREE.Group();
    this.sceneGroup.rotation.set(Math.PI / 2, 1, 2);
    this.scene.add(this.sceneGroup);

    // Create core sphere with PhongMaterial for better lighting
    const coreGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff6e00,
        shininess: 100
    });
    this.core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.sceneGroup.add(this.core);

    this.createZones();
}

  createZones() {
    let currentStartPhi = 0;

    for (let i = 0; i < this.params.numberOfZones; i++) {
      const zoneWidth = this.params.zoneWidths.length > 0 
        ? this.params.zoneWidths[i % this.params.zoneWidths.length] 
        : Math.PI / this.params.numberOfZones;

      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      const segments = 100;

      const startPhi = currentStartPhi;
      const endPhi = startPhi + zoneWidth;
      currentStartPhi = endPhi;

      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;

        for (let k = 0; k <= 1; k++) {
          const phi = k === 0 ? startPhi : endPhi;
          const x = this.params.sphereRadius * Math.sin(phi) * Math.cos(theta);
          const y = this.params.sphereRadius * Math.cos(phi);
          const z = this.params.sphereRadius * Math.sin(phi) * Math.sin(theta);
          vertices.push(x, y, z);
        }
      }

      const indices = [];
      for (let j = 0; j < segments; j++) {
        const base = j * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      const zoneOpacity = this.params.zoneOpacities.length > 0 
        ? this.params.zoneOpacities[i % this.params.zoneOpacities.length] 
        : 1;

      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: zoneOpacity,
        side: THREE.DoubleSide,
      });

      const zone = new THREE.Mesh(geometry, material);
      
      zone.userData.isClockwise = i % 4 === 1 || i % 4 === 2;
      zone.userData.isAntiClockwise = i % 4 === 0 || i % 4 === 3;

      this.sceneGroup.add(zone);
      this.zones.push(zone);
    }
  }

  setupEventListeners() {
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.lastMousePosition = { x: e.clientX, y: e.clientY };
  }

  handleMouseMove(e) {
    if (this.isDragging) {
      this.rotationDelta.x += (e.clientY - this.lastMousePosition.y) * 0.002;
      this.rotationDelta.y += (e.clientX - this.lastMousePosition.x) * 0.002;
      this.lastMousePosition = { x: e.clientX, y: e.clientY };
    }
  }

  handleMouseUp() {
    this.isDragging = false;
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.sceneGroup.rotation.y += this.rotationDelta.y;
    this.sceneGroup.rotation.x += this.rotationDelta.x;

    this.rotationDelta.x *= 0.95;
    this.rotationDelta.y *= 0.95;

    this.zones.forEach(zone => {
      if (zone.userData.isClockwise) {
        zone.rotation.y += this.params.zoneRotationSpeed;
      } else if (zone.userData.isAntiClockwise) {
        zone.rotation.y -= this.params.zoneRotationSpeed;
      }
    });

    this.core.rotation.y += this.params.rotationSpeed;

    this.renderer.render(this.scene, this.camera);
  }

  mount(container) {
    container.appendChild(this.renderer.domElement);
  }
}

// ... existing code ...

const container = document.getElementById('dynamiclogo');

const sphere = new ConfigurableSphere({
    numberOfZones: 13,
    sphereRadius: 1.5,
    zoneWidths: [
        Math.PI / 10,  // Narrow zone
        Math.PI / 10,  // Wide zone
        Math.PI / 10,
        Math.PI / 30   // Medium zone
    ],
    zoneOpacities: [
        0,  // Translucent zone
        1,
        0,
        1  // More opaque zone 
    ],
    zoneColors: [
        0xffffff,  // White zones
        0xffffff,
        0xffffff,
        0xffffff,
    ],
    rotationSpeed: 0.005,
    zoneRotationSpeed: 0.002,
    centralZoneIndex: 7
});

// Add some basic styling to match the Canvas setup
if (container) {
    container.style.height = '70vh';
    sphere.mount(container);
} else {
    console.error('Container element not found!');
}