import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

// Simple third-person drift game built for the GP workbook.
// Two modes: prototype (primitives) and full (loaded mesh + texture).

const container = document.getElementById("three-container");
if (container) container.tabIndex = 0; // focusable to capture space without scrolling
const scoreEl = document.getElementById("score");
const speedEl = document.getElementById("speed");
const driftEl = document.getElementById("drift");
const trackStateEl = document.getElementById("trackState");
const ghostLapEl = document.getElementById("ghostLap");
const lapCountEl = document.getElementById("lapCount");
const checkpointEl = document.getElementById("checkpoint");
const modeInputs = document.querySelectorAll('input[name="mode"]');
const resetBtn = document.getElementById("resetBtn");
const touchControlsEl = document.getElementById("touchControls");

let renderer, scene, camera;
let trackMesh, groundMesh;
let skybox = null;
let decorations = [];  // Trees and bushes
let clock = new THREE.Clock();
let currentMode = "prototype";
let score = 0;
let driftScore = 0;
let driftHold = 0;
let boostTimer = 0;
let lapCount = 0;
let checkpointsPassed = [];
let checkpoints = [];
const NUM_CHECKPOINTS = 5;
const CHECKPOINT_RADIUS = 15;

const TRACK_WIDTH = 12;
const TRACK_HALF = TRACK_WIDTH * 0.5;
let MAX_SPEED = 24;
let BOOST_SPEED = 35;
let BOOST_DURATION = 3.4;
const CAR_HEIGHT = 0.6;
const CAR_YAW_OFFSET = 0; // adjust model facing; 0 means heading vector is forward
const CAMERA_BEHIND_OFFSET = Math.PI; // keep camera behind the heading by default

// Player stats (can be upgraded with cards)
const playerStats = {
  maxSpeed: 24,
  acceleration: 36,
  boostSpeed: 35,
  boostDuration: 3.4,
  driftGrip: 0.75,
  handling: 2.0,
};

// Base values for reference
const BASE_STATS = { ...playerStats };

// Card definitions with rarities and effects
const CARD_POOL = {
  common: [
    { name: "Steady Foot", stat: "acceleration", amount: 3, desc: "+3 Acceleration" },
    { name: "Basic Tune", stat: "maxSpeed", amount: 3, desc: "+3 Top Speed" },
    { name: "Grip Tape", stat: "driftGrip", amount: 0.03, desc: "+3% Drift Grip" },
    { name: "Quick Turn", stat: "handling", amount: 0.15, desc: "+0.15 Handling" },
    { name: "Nitro Sip", stat: "boostDuration", amount: 0.2, desc: "+0.2s Boost Duration" },
    { name: "Engine Polish", stat: "boostSpeed", amount: 2, desc: "+2 Boost Speed" },
  ],
  rare: [
    { name: "Turbo Whisper", stat: "acceleration", amount: 6, desc: "+6 Acceleration" },
    { name: "Speed Demon", stat: "maxSpeed", amount: 6, desc: "+6 Top Speed" },
    { name: "Drift King", stat: "driftGrip", amount: 0.06, desc: "+6% Drift Grip" },
    { name: "Precision Steering", stat: "handling", amount: 0.3, desc: "+0.3 Handling" },
    { name: "Extended Tank", stat: "boostDuration", amount: 0.5, desc: "+0.5s Boost Duration" },
    { name: "Afterburner", stat: "boostSpeed", amount: 6, desc: "+6 Boost Speed" },
  ],
  legendary: [
    { name: "Rocket Fuel", stat: "acceleration", amount: 12, desc: "+12 Acceleration" },
    { name: "Warp Drive", stat: "maxSpeed", amount: 12, desc: "+12 Top Speed" },
    { name: "Ice Veins", stat: "driftGrip", amount: 0.12, desc: "+12% Drift Grip" },
    { name: "Telepathic Wheel", stat: "handling", amount: 0.5, desc: "+0.5 Handling" },
    { name: "Infinite Nitro", stat: "boostDuration", amount: 1.2, desc: "+1.2s Boost Duration" },
    { name: "Hyperdrive", stat: "boostSpeed", amount: 12, desc: "+12 Boost Speed" },
  ]
};

const RARITY_COLORS = {
  common: { bg: '#4a4a4a', glow: '#888888', text: '#cccccc' },
  rare: { bg: '#4a1a6b', glow: '#9b4dca', text: '#d4a5ff' },
  legendary: { bg: '#6b4a00', glow: '#ffd700', text: '#ffec8b' }
};

const keyState = new Map();

const trackPath = buildTrackPath();

const car = {
  group: new THREE.Group(),
  body: null,
  heading: Math.PI / 2,
  pos: new THREE.Vector2(trackPath[0].x, trackPath[0].y),
  vel: new THREE.Vector2(),
};

const ghost = {
  mesh: null,
  t: 0,
  speed: 0.025,  // Starting at 25% of max speed
  maxSpeed: 0.10,  // 100% ghost speed
};

const obstacles = [];

// Game state
let gameState = 'waiting';  // 'waiting', 'countdown', 'racing', 'gameover', 'cardSelection'
let countdownTimer = 0;
let countdownNumber = 3;
let playerFinishedLap = false;  // Track if player crossed finish before ghost
let pendingCards = [];  // Cards to choose from after lap
let lapTimer = 0;  // Current lap time in seconds
let lastLapTime = 0;  // Time of last completed lap
let bestLapTime = Infinity;  // Best lap time

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c14);

  camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 600);
  camera.position.set(0, 14, 22);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xb3d5ff, 0x101010, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(12, 18, 6);
  sun.castShadow = true;
  scene.add(sun);

  groundMesh = buildGround(currentMode);
  scene.add(groundMesh);

  trackMesh = buildTrack(currentMode);
  scene.add(trackMesh);

  // Keep the car group in the scene so we can swap visuals without re-adding controls.
  scene.add(car.group);

  buildObstacles();
  buildCheckpoints();
  buildGhost();
  buildDecorations();
  buildCarVisual(currentMode);
  updateSceneForMode(currentMode);

  resetRun();

  setupUI();
  setupInput();

  window.addEventListener("resize", onResize);
  renderer.setAnimationLoop(tick);
}

function buildGround(mode = currentMode) {
  const geo = new THREE.PlaneGeometry(800, 800, 1, 1);
  let mat;
  
  if (mode === "full") {
    // Create grass texture with darker circles
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    
    // Base grass green
    ctx.fillStyle = "#3a8c3a";
    ctx.fillRect(0, 0, 512, 512);
    
    // Add darker green circles randomly
    ctx.fillStyle = "#2d6b2d";
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 15 + Math.random() * 40;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add some lighter patches
    ctx.fillStyle = "#4ca64c";
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 10 + Math.random() * 25;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0 });
  } else {
    mat = new THREE.MeshStandardMaterial({ color: 0x0c111a, roughness: 1, metalness: 0 });
  }
  
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  return mesh;
}

function buildSkybox() {
  // Create a sky gradient with puffy white clouds
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  
  // Sky gradient from light blue at horizon to deeper blue at top
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#1e90ff");    // Dodger blue at top
  gradient.addColorStop(0.4, "#87ceeb");  // Sky blue mid
  gradient.addColorStop(0.7, "#b0e0e6");  // Powder blue lower
  gradient.addColorStop(1, "#e0f0ff");    // Very light at horizon
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  
  // Draw puffy clouds
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  const drawCloud = (cx, cy, scale) => {
    ctx.beginPath();
    // Main body
    ctx.arc(cx, cy, 30 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 25 * scale, cy - 10 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.arc(cx - 25 * scale, cy + 5 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 15 * scale, cy + 15 * scale, 22 * scale, 0, Math.PI * 2);
    ctx.arc(cx - 15 * scale, cy - 12 * scale, 18 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 40 * scale, cy + 5 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
  };
  
  // Scatter clouds across the sky
  drawCloud(150, 100, 1.2);
  drawCloud(400, 80, 1.5);
  drawCloud(700, 120, 1.0);
  drawCloud(900, 70, 1.3);
  drawCloud(250, 180, 0.8);
  drawCloud(550, 150, 1.1);
  drawCloud(850, 170, 0.9);
  drawCloud(100, 220, 1.0);
  drawCloud(650, 220, 1.4);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  
  return texture;
}

function isPointNearTrack(x, z, margin = 20) {
  // Check if a point is too close to the track
  for (let i = 0; i < trackPath.length; i++) {
    const dx = x - trackPath[i].x;
    const dz = z - trackPath[i].y;  // trackPath uses x,y but world uses x,z
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < TRACK_WIDTH / 2 + margin) {
      return true;
    }
  }
  return false;
}

function createPineTree(scale = 1) {
  const group = new THREE.Group();
  
  const trunkHeight = 0.6 * scale;
  const trunkGeom = new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, trunkHeight, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b3b1a });
  const trunk = new THREE.Mesh(trunkGeom, trunkMat);
  trunk.position.y = trunkHeight / 2;
  group.add(trunk);
  
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x0b6623 });
  const coneCount = 3;
  for (let i = 0; i < coneCount; i++) {
    const radius = 0.6 * scale * (1 - i * 0.18);
    const height = 0.8 * scale * (1 - i * 0.12);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 8), foliageMat);
    cone.position.y = trunkHeight + i * 0.28 * scale + height / 2 - 0.08 * scale;
    group.add(cone);
  }
  
  return group;
}

function createRoundTree(scale = 1) {
  const group = new THREE.Group();
  
  const trunkGeom = new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 1.2 * scale, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b3a29 });
  const trunk = new THREE.Mesh(trunkGeom, trunkMat);
  trunk.position.y = 0.6 * scale;
  group.add(trunk);
  
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x228833 });
  const l1 = new THREE.Mesh(new THREE.SphereGeometry(0.6 * scale, 8, 6), leafMat);
  l1.position.set(0, 1.35 * scale, 0);
  group.add(l1);
  const l2 = new THREE.Mesh(new THREE.SphereGeometry(0.45 * scale, 8, 6), leafMat);
  l2.position.set(0.35 * scale, 1.1 * scale, 0.1 * scale);
  group.add(l2);
  const l3 = new THREE.Mesh(new THREE.SphereGeometry(0.45 * scale, 8, 6), leafMat);
  l3.position.set(-0.35 * scale, 1.1 * scale, -0.1 * scale);
  group.add(l3);
  
  return group;
}

function createBush(scale = 1) {
  const group = new THREE.Group();
  
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x2d5a2d });
  
  // Multiple spheres for bushy appearance
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.4 * scale, 8, 6), bushMat);
  s1.position.set(0, 0.35 * scale, 0);
  group.add(s1);
  
  const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.3 * scale, 8, 6), bushMat);
  s2.position.set(0.25 * scale, 0.25 * scale, 0.15 * scale);
  group.add(s2);
  
  const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.3 * scale, 8, 6), bushMat);
  s3.position.set(-0.2 * scale, 0.28 * scale, -0.1 * scale);
  group.add(s3);
  
  return group;
}

function buildDecorations() {
  // Clear existing decorations
  decorations.forEach(d => scene.remove(d));
  decorations.length = 0;
  
  if (currentMode !== "full") return;
  
  // Define areas to place trees (outside track bounds)
  const numTrees = 80;
  const numBushes = 50;
  const areaSize = 300;
  
  // Place pine trees
  for (let i = 0; i < numTrees / 2; i++) {
    let x, z, attempts = 0;
    do {
      x = (Math.random() - 0.5) * areaSize * 2;
      z = (Math.random() - 0.5) * areaSize * 2;
      attempts++;
    } while (isPointNearTrack(x, z, 25) && attempts < 50);
    
    if (attempts < 50) {
      const scale = 2 + Math.random() * 3;
      const tree = createPineTree(scale);
      tree.position.set(x, 0, z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      scene.add(tree);
      decorations.push(tree);
    }
  }
  
  // Place round trees
  for (let i = 0; i < numTrees / 2; i++) {
    let x, z, attempts = 0;
    do {
      x = (Math.random() - 0.5) * areaSize * 2;
      z = (Math.random() - 0.5) * areaSize * 2;
      attempts++;
    } while (isPointNearTrack(x, z, 25) && attempts < 50);
    
    if (attempts < 50) {
      const scale = 1.5 + Math.random() * 2.5;
      const tree = createRoundTree(scale);
      tree.position.set(x, 0, z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      scene.add(tree);
      decorations.push(tree);
    }
  }
  
  // Place bushes
  for (let i = 0; i < numBushes; i++) {
    let x, z, attempts = 0;
    do {
      x = (Math.random() - 0.5) * areaSize * 2;
      z = (Math.random() - 0.5) * areaSize * 2;
      attempts++;
    } while (isPointNearTrack(x, z, 18) && attempts < 50);
    
    if (attempts < 50) {
      const scale = 1 + Math.random() * 1.5;
      const bush = createBush(scale);
      bush.position.set(x, 0, z);
      bush.rotation.y = Math.random() * Math.PI * 2;
      scene.add(bush);
      decorations.push(bush);
    }
  }
}

function makeStripedTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#2d3139";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#6de2d6";
  ctx.lineWidth = 12;
  for (let i = -2; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-14, i * 52 + 18);
    ctx.lineTo(size + 14, i * 52 + 18);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 1);
  return tex;
}

function buildTrackPath() {
  // Tight, twisty drift circuit - minimal straights, constant turning
  // Scaled down and packed with corners for non-stop drifting action
  const control = [
    // Start into immediate turns
    new THREE.Vector2(0, -120),       // start/finish
    new THREE.Vector2(35, -105),      // quick right
    new THREE.Vector2(60, -75),       // T1 entry
    new THREE.Vector2(75, -40),       // T1 apex
    new THREE.Vector2(70, 0),         // T1 exit
    
    // Tight esses - continuous direction changes
    new THREE.Vector2(50, 30),        // S1 entry
    new THREE.Vector2(25, 50),        // S1 apex
    new THREE.Vector2(50, 75),        // S2 entry
    new THREE.Vector2(75, 95),        // S2 apex
    new THREE.Vector2(55, 115),       // S2 exit
    
    // Tight sweeper into hairpin
    new THREE.Vector2(25, 130),       // sweeper entry
    new THREE.Vector2(-15, 135),      // sweeper apex
    new THREE.Vector2(-50, 120),      // sweeper exit
    
    // Double hairpin section
    new THREE.Vector2(-75, 90),       // hairpin 1 entry
    new THREE.Vector2(-95, 55),       // hairpin 1 apex
    new THREE.Vector2(-80, 25),       // hairpin 1 exit
    new THREE.Vector2(-95, -10),      // hairpin 2 entry
    new THREE.Vector2(-110, -45),     // hairpin 2 apex
    new THREE.Vector2(-90, -70),      // hairpin 2 exit
    
    // Technical back section
    new THREE.Vector2(-60, -85),      // chicane entry
    new THREE.Vector2(-30, -75),      // chicane left
    new THREE.Vector2(-45, -95),      // chicane right
    new THREE.Vector2(-20, -110),     // chicane exit
  ];

  // Catmull-Rom spline interpolation for smooth curves
  const pts = [];
  const stepsPerSegment = 24;
  const tension = 0.5;
  
  for (let i = 0; i < control.length; i++) {
    const p0 = control[(i - 1 + control.length) % control.length];
    const p1 = control[i];
    const p2 = control[(i + 1) % control.length];
    const p3 = control[(i + 2) % control.length];
    
    for (let s = 0; s < stepsPerSegment; s++) {
      const t = s / stepsPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      
      // Catmull-Rom basis functions
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );
      pts.push(new THREE.Vector2(x, y));
    }
  }
  // Close the loop
  pts.push(pts[0].clone());
  return pts;
}

function buildTrackShape() {
  const outer = [];
  const inner = [];
  const width = TRACK_WIDTH;
  for (let i = 0; i < trackPath.length; i++) {
    const p = trackPath[i];
    const n = trackPath[(i + 1) % trackPath.length];
    const dir = new THREE.Vector2().subVectors(n, p).normalize();
    const normal = new THREE.Vector2(-dir.y, dir.x);
    outer.push(new THREE.Vector2(p.x + normal.x * width * 0.5, p.y + normal.y * width * 0.5));
    inner.push(new THREE.Vector2(p.x - normal.x * width * 0.5, p.y - normal.y * width * 0.5));
  }
  const shape = new THREE.Shape(outer);
  shape.holes.push(new THREE.Path(inner.reverse()));
  return shape;
}

function buildTrack(mode) {
  if (trackMesh) scene.remove(trackMesh);
  // Build track as smooth ribbon mesh using BufferGeometry
  const mat =
    mode === "full"
      ? new THREE.MeshStandardMaterial({ color: 0x4a4e58, roughness: 0.85, metalness: 0.08, side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({ color: 0x3d3f46, roughness: 1, side: THREE.DoubleSide });

  // Generate left and right edge vertices
  const leftEdge = [];
  const rightEdge = [];
  const halfWidth = TRACK_WIDTH / 2;
  
  for (let i = 0; i < trackPath.length; i++) {
    const curr = trackPath[i];
    const prev = trackPath[(i - 1 + trackPath.length) % trackPath.length];
    const next = trackPath[(i + 1) % trackPath.length];
    
    // Average tangent for smooth normals at corners
    const t1 = new THREE.Vector2().subVectors(curr, prev).normalize();
    const t2 = new THREE.Vector2().subVectors(next, curr).normalize();
    const tangent = new THREE.Vector2().addVectors(t1, t2).normalize();
    
    // Normal perpendicular to tangent
    const normal = new THREE.Vector2(-tangent.y, tangent.x);
    
    leftEdge.push(new THREE.Vector3(
      curr.x + normal.x * halfWidth,
      0.08,
      curr.y + normal.y * halfWidth
    ));
    rightEdge.push(new THREE.Vector3(
      curr.x - normal.x * halfWidth,
      0.08,
      curr.y - normal.y * halfWidth
    ));
  }
  
  // Build triangle strip as indexed BufferGeometry
  const vertices = [];
  const indices = [];
  const normals = [];
  
  for (let i = 0; i < leftEdge.length; i++) {
    // Left vertex
    vertices.push(leftEdge[i].x, leftEdge[i].y, leftEdge[i].z);
    normals.push(0, 1, 0);
    // Right vertex
    vertices.push(rightEdge[i].x, rightEdge[i].y, rightEdge[i].z);
    normals.push(0, 1, 0);
  }
  
  // Create triangles
  for (let i = 0; i < leftEdge.length - 1; i++) {
    const li = i * 2;
    const ri = i * 2 + 1;
    const nli = (i + 1) * 2;
    const nri = (i + 1) * 2 + 1;
    // Two triangles per quad
    indices.push(li, ri, nli);
    indices.push(ri, nri, nli);
  }
  
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  
  const trackGroup = new THREE.Group();
  trackGroup.add(mesh);
  
  // Add racing curbs (red/white striped edges)
  const curbWidth = 1.8;
  const curbHeight = 0.12;
  addCurbs(trackGroup, leftEdge, curbWidth, curbHeight, 1);
  addCurbs(trackGroup, rightEdge, curbWidth, curbHeight, -1);
  
  // Add center dashed line
  addCenterLine(trackGroup);
  
  // Add start/finish line
  addStartFinishLine(trackGroup);
  
  return trackGroup;
}

function addCurbs(group, edge, width, height, side) {
  // Create alternating red/white curb segments
  const segmentLength = 8;
  let accumulated = 0;
  let colorIndex = 0;
  
  for (let i = 0; i < edge.length - 1; i++) {
    const p0 = edge[i];
    const p1 = edge[i + 1];
    const dx = p1.x - p0.x;
    const dz = p1.z - p0.z;
    const len = Math.hypot(dx, dz);
    
    accumulated += len;
    if (accumulated > segmentLength) {
      accumulated = 0;
      colorIndex++;
    }
    
    const color = colorIndex % 2 === 0 ? 0xff2222 : 0xffffff;
    const curbMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    
    // Direction and normal
    const dir = new THREE.Vector3(dx, 0, dz).normalize();
    const normal = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(side);
    
    const curbGeo = new THREE.BoxGeometry(width, height, len + 0.1);
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(
      (p0.x + p1.x) / 2 + normal.x * width * 0.5,
      height / 2,
      (p0.z + p1.z) / 2 + normal.z * width * 0.5
    );
    curb.rotation.y = Math.atan2(dx, dz);
    group.add(curb);
  }
}

function addCenterLine(group) {
  // Dashed white center line
  const dashLength = 4;
  const gapLength = 6;
  let accumulated = 0;
  let inDash = true;
  
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  
  for (let i = 0; i < trackPath.length - 1; i++) {
    const p0 = trackPath[i];
    const p1 = trackPath[i + 1];
    const dx = p1.x - p0.x;
    const dz = p1.y - p0.y;
    const len = Math.hypot(dx, dz);
    
    accumulated += len;
    const threshold = inDash ? dashLength : gapLength;
    if (accumulated > threshold) {
      accumulated = 0;
      inDash = !inDash;
    }
    
    if (inDash) {
      const lineGeo = new THREE.BoxGeometry(0.3, 0.02, len + 0.05);
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set((p0.x + p1.x) / 2, 0.1, (p0.y + p1.y) / 2);
      line.rotation.y = Math.atan2(dx, dz);
      group.add(line);
    }
  }
}

function addStartFinishLine(group) {
  // Checkered start/finish line
  const start = trackPath[0];
  const next = trackPath[1];
  const dir = new THREE.Vector2().subVectors(next, start).normalize();
  const normal = new THREE.Vector2(-dir.y, dir.x);
  
  const checkerSize = 1.5;
  const rows = 2;
  const cols = Math.ceil(TRACK_WIDTH / checkerSize);
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isWhite = (r + c) % 2 === 0;
      const mat = new THREE.MeshStandardMaterial({ 
        color: isWhite ? 0xffffff : 0x111111, 
        roughness: 0.3 
      });
      const geo = new THREE.BoxGeometry(checkerSize, 0.02, checkerSize);
      const tile = new THREE.Mesh(geo, mat);
      
      const offsetAlong = (r - 0.5) * checkerSize;
      const offsetAcross = (c - cols / 2 + 0.5) * checkerSize;
      
      tile.position.set(
        start.x + dir.x * offsetAlong + normal.x * offsetAcross,
        0.11,
        start.y + dir.y * offsetAlong + normal.y * offsetAcross
      );
      tile.rotation.y = Math.atan2(dir.x, dir.y);
      group.add(tile);
    }
  }
}

function buildObstacles() {
  const matFull = new THREE.MeshStandardMaterial({ color: 0x1f6feb, emissive: 0x0d2d52, emissiveIntensity: 0.35, roughness: 0.45 });
  const matProto = new THREE.MeshStandardMaterial({ color: 0xd97757 });
  const obstacleMaterial = currentMode === "full" ? matFull : matProto;

  // Place obstacles deterministically along the outer side of the track path.
  const step = Math.max(12, Math.floor(trackPath.length / 22));
  for (let i = 0; i < trackPath.length; i += step) {
    const p = trackPath[i];
    const n = trackPath[(i + 1) % trackPath.length];
    const dir = new THREE.Vector2().subVectors(n, p).normalize();
    const normal = new THREE.Vector2(-dir.y, dir.x);
    const offset = TRACK_WIDTH * 2.2;
    const jitter = (Math.random() - 0.5) * 4;
    const pos = new THREE.Vector2(
      p.x + normal.x * offset + dir.x * jitter,
      p.y + normal.y * offset + dir.y * jitter
    );
    const geo = new THREE.BoxGeometry(1.5 + Math.random() * 0.5, 1 + Math.random() * 0.4, 1.5 + Math.random() * 0.5);
    const mesh = new THREE.Mesh(geo, obstacleMaterial.clone());
    mesh.position.set(pos.x, geo.parameters.height / 2, pos.y);
    mesh.castShadow = true;
    mesh.userData.bobPhase = Math.random() * Math.PI * 2;
    scene.add(mesh);
    obstacles.push(mesh);
  }
}

function buildGhost() {
  // Create a transparent version of the car as the ghost
  const g = new THREE.Group();
  
  // Transparent materials
  const bodyMat = new THREE.MeshStandardMaterial({ 
    color: 0x7dd3fc, 
    transparent: true, 
    opacity: 0.4,
    emissive: 0x1f6feb,
    emissiveIntensity: 0.3
  });
  const cabinMat = new THREE.MeshStandardMaterial({ 
    color: 0x1e293b, 
    transparent: true, 
    opacity: 0.3 
  });
  const wheelMat = new THREE.MeshStandardMaterial({ 
    color: 0x333333, 
    transparent: true, 
    opacity: 0.35 
  });
  
  // Main body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.6, 4.0),
    bodyMat
  );
  body.position.y = 0.5;
  g.add(body);
  
  // Cabin
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.5, 1.8),
    cabinMat
  );
  cabin.position.set(0, 0.95, -0.3);
  g.add(cabin);
  
  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const positions = [[0.85, 0.35, 1.3], [-0.85, 0.35, 1.3], [0.85, 0.35, -1.3], [-0.85, 0.35, -1.3]];
  for (const [wx, wy, wz] of positions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(wx, wy, wz);
    g.add(wheel);
  }
  
  const start = trackPath[0];
  g.position.set(start.x, CAR_HEIGHT, start.y);
  ghost.mesh = g;
  scene.add(g);
}

function buildCheckpoints() {
  // Clear existing checkpoints
  checkpoints.forEach(cp => scene.remove(cp.visual));
  checkpoints = [];
  
  // Place checkpoints evenly around the track
  const step = Math.floor(trackPath.length / NUM_CHECKPOINTS);
  
  for (let i = 0; i < NUM_CHECKPOINTS; i++) {
    const idx = i * step;
    const p = trackPath[idx];
    const next = trackPath[(idx + 1) % trackPath.length];
    
    // Direction along track
    const dir = new THREE.Vector2().subVectors(next, p).normalize();
    const angle = Math.atan2(dir.x, dir.y);
    
    // Visual gate
    const gateGroup = new THREE.Group();
    
    // Two poles
    const poleMat = new THREE.MeshStandardMaterial({ 
      color: i === 0 ? 0x22ff22 : 0xffaa00,  // Green for start/finish, orange for others
      emissive: i === 0 ? 0x115511 : 0x553300,
      emissiveIntensity: 0.5
    });
    const poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    
    const leftPole = new THREE.Mesh(poleGeo, poleMat);
    leftPole.position.set(-TRACK_WIDTH * 0.55, 3, 0);
    gateGroup.add(leftPole);
    
    const rightPole = new THREE.Mesh(poleGeo, poleMat);
    rightPole.position.set(TRACK_WIDTH * 0.55, 3, 0);
    gateGroup.add(rightPole);
    
    // Top bar
    const barGeo = new THREE.BoxGeometry(TRACK_WIDTH * 1.1, 0.4, 0.4);
    const bar = new THREE.Mesh(barGeo, poleMat);
    bar.position.set(0, 6, 0);
    gateGroup.add(bar);
    
    // Checkpoint number
    gateGroup.position.set(p.x, 0, p.y);
    gateGroup.rotation.y = angle;
    
    scene.add(gateGroup);
    
    checkpoints.push({
      index: i,
      pos: new THREE.Vector2(p.x, p.y),
      visual: gateGroup,
      passed: false
    });
  }
}

function buildCarVisual(mode = currentMode) {
  const setBody = (obj) => {
    if (car.body) car.group.remove(car.body);
    car.body = obj;
    car.group.add(obj);
  };
  const proto = makePrototypeCar();
  setBody(proto);

  if (mode === "full") {
    // Load car texture for full mode
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      "../WB08-sgunshor/textures/car_sparkle.png",
      (tex) => {
        const texturedCar = makePrototypeCar();
        texturedCar.traverse((c) => {
          if (c.isMesh && c.geometry.parameters && c.geometry.parameters.width > 1) {
            c.material = new THREE.MeshStandardMaterial({
              map: tex,
              metalness: 0.3,
              roughness: 0.5
            });
          }
        });
        setBody(texturedCar);
      },
      undefined,
      () => {
        // keep prototype on failure
      }
    );
  }
}

function makePrototypeCar() {
  const g = new THREE.Group();
  // Main body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.6, 4.0),
    new THREE.MeshStandardMaterial({ color: 0x82aaff, metalness: 0.15, roughness: 0.7 })
  );
  body.position.y = 0.5;
  body.castShadow = true;
  g.add(body);
  // Cabin
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.5, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.1 })
  );
  cabin.position.set(0, 0.95, -0.3);
  cabin.castShadow = true;
  g.add(cabin);
  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
  const positions = [[0.85, 0.35, 1.3], [-0.85, 0.35, 1.3], [0.85, 0.35, -1.3], [-0.85, 0.35, -1.3]];
  for (const [wx, wy, wz] of positions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(wx, wy, wz);
    wheel.castShadow = true;
    g.add(wheel);
  }
  return g;
}

function setupUI() {
  modeInputs.forEach((input) => {
    input.addEventListener("change", (e) => switchMode(e.target.value));
  });
  resetBtn.addEventListener("click", resetRun);

  const touchButtons = document.querySelectorAll(".touch-controls button");
  touchButtons.forEach((btn) => {
    const key = btn.dataset.key;
    const set = (value) => keyState.set(key, value);
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      set(true);
    });
    btn.addEventListener("pointerup", (e) => {
      e.preventDefault();
      set(false);
    });
    btn.addEventListener("pointerleave", () => set(false));
  });
}

function setupInput() {
  const hideTouchUI = () => {
    if (touchControlsEl) touchControlsEl.classList.add("hidden");
  };
  const showTouchUI = () => {
    if (touchControlsEl) touchControlsEl.classList.remove("hidden");
  };

  window.addEventListener("keydown", (e) => {
    keyState.set(e.code, true);
    if (e.code === "Space") {
      e.preventDefault();
    }
    hideTouchUI();
  });
  window.addEventListener("keyup", (e) => keyState.set(e.code, false));

  // Mouse drag adjusts camera yaw so touch/mouse users get interaction beyond keys.
  let dragging = false;
  let lastX = 0;
  container.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    if (e.pointerType === "touch") {
      showTouchUI();
    } else {
      hideTouchUI();
    }
    container.focus({ preventScroll: true });
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    cameraPivotAngle += dx * 0.005;
    if (e.pointerType === "mouse") hideTouchUI();
  });
  window.addEventListener("pointerup", () => (dragging = false));

  window.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") showTouchUI();
  });
}

let cameraPivotAngle = 0;

function updateSceneForMode(mode) {
  if (mode === "full") {
    // Blue sky with clouds
    skybox = buildSkybox();
    scene.background = skybox;
  } else {
    // Dark prototype mode
    skybox = null;
    scene.background = new THREE.Color(0x0a0c14);
  }
}

function switchMode(next) {
  if (next === currentMode) return;
  currentMode = next;
  
  // Update sky/background
  updateSceneForMode(next);
  
  // Update ground
  scene.remove(groundMesh);
  groundMesh = buildGround(next);
  scene.add(groundMesh);
  
  // Update track
  scene.remove(trackMesh);
  trackMesh = buildTrack(next);
  scene.add(trackMesh);
  
  // Update obstacles
  obstacles.forEach((o) => scene.remove(o));
  obstacles.length = 0;
  buildObstacles();
  
  // Update decorations (trees/bushes)
  buildDecorations();
  
  // Update car
  buildCarVisual(next);
}

function resetRun() {
  score = 0;
  driftScore = 0;
  lapCount = 0;
  checkpointsPassed = [];
  checkpoints.forEach(cp => cp.passed = false);
  const start = trackPath[0];
  car.pos.set(start.x, start.y);
  car.vel.set(0, 0);
  car.heading = Math.PI / 2;
  driftHold = 0;
  boostTimer = 0;
  ghost.t = 0;
  ghost.speed = ghost.maxSpeed * 0.25;  // Reset ghost to 25% speed
  playerFinishedLap = false;
  pendingCards = [];
  lapTimer = 0;
  lastLapTime = 0;
  bestLapTime = Infinity;
  
  // Reset player stats to base values
  Object.keys(BASE_STATS).forEach(key => {
    playerStats[key] = BASE_STATS[key];
  });
  
  gameState = 'waiting';
  showStartMenu();
}

function showStartMenu() {
  gameState = 'waiting';
  // Position car at start
  const start = trackPath[0];
  car.pos.set(start.x, start.y);
  car.vel.set(0, 0);
  car.heading = Math.PI / 2;
  ghost.t = 0;
}

function startCountdown() {
  gameState = 'countdown';
  countdownNumber = 3;
  countdownTimer = 0;
  playerFinishedLap = false;
  lapTimer = 0;  // Reset lap timer for new lap
  
  // Reset positions for race
  const start = trackPath[0];
  car.pos.set(start.x, start.y);
  car.vel.set(0, 0);
  car.heading = Math.PI / 2;
  ghost.t = 0;
}

function updateCountdown(dt) {
  if (gameState !== 'countdown') return;
  
  countdownTimer += dt;
  
  if (countdownTimer >= 1) {
    countdownTimer = 0;
    countdownNumber--;
    
    if (countdownNumber <= 0) {
      gameState = 'racing';
    }
  }
}

function tick() {
  const dt = clock.getDelta();
  
  // Handle countdown
  updateCountdown(dt);
  
  // Only update physics when racing
  if (gameState === 'racing') {
    updatePhysics(dt);
    updateCheckpoints();
    lapTimer += dt;  // Update lap timer
  }
  
  animateGhost(dt);
  animateObstacles(dt);
  updateCamera();
  updateHUD(dt);
  
  // Draw countdown/start overlay
  drawOverlay();
  
  renderer.render(scene, camera);
}

function drawOverlay() {
  // Create or get overlay element
  let overlay = document.getElementById('gameOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'gameOverlay';
    overlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 120px;
      font-weight: bold;
      color: white;
      text-shadow: 0 0 30px cyan, 0 0 60px blue;
      z-index: 100;
      font-family: Arial, sans-serif;
    `;
    container.style.position = 'relative';
    container.appendChild(overlay);
  }
  
  if (gameState === 'waiting') {
    const speedPercent = Math.round((ghost.speed / ghost.maxSpeed) * 100);
    overlay.innerHTML = `<div id="startButton" style="text-align: center; cursor: pointer;">
      <div style="font-size: 48px; margin-bottom: 20px;">🏎️ DRIFT RALLY 🏎️</div>
      <div style="font-size: 32px;">Click to Start Race</div>
      <div style="font-size: 20px; margin-top: 10px;">Lap ${lapCount + 1} - Ghost Speed: ${speedPercent}%</div>
    </div>`;
    overlay.style.display = 'block';
    overlay.style.pointerEvents = 'auto';
    
    // Add click listener directly to overlay
    if (!overlay.dataset.listenerAdded) {
      overlay.dataset.listenerAdded = 'true';
      overlay.addEventListener('mousedown', (e) => {
        if (gameState === 'waiting') {
          e.preventDefault();
          e.stopPropagation();
          startCountdown();
        }
      });
      overlay.addEventListener('touchstart', (e) => {
        if (gameState === 'waiting') {
          e.preventDefault();
          startCountdown();
        }
      });
    }
  } else if (gameState === 'countdown') {
    const display = countdownNumber > 0 ? countdownNumber : 'GO!';
    const color = countdownNumber > 0 ? 'white' : '#00ff00';
    overlay.innerHTML = `<span style="color: ${color}">${display}</span>`;
    overlay.style.display = 'block';
    overlay.style.pointerEvents = 'none';
  } else if (gameState === 'gameover') {
    overlay.innerHTML = `<div id="gameOverButton" style="text-align: center; cursor: pointer;">
      <div style="font-size: 48px; margin-bottom: 20px; color: #ff4444;">💀 GAME OVER 💀</div>
      <div style="font-size: 28px;">The ghost beat you!</div>
      <div style="font-size: 24px; margin-top: 15px;">Final Score: ${Math.round(score)}</div>
      <div style="font-size: 24px;">Laps Completed: ${lapCount}</div>
      <div style="font-size: 20px; margin-top: 20px;">Click to Try Again</div>
    </div>`;
    overlay.style.display = 'block';
    overlay.style.pointerEvents = 'auto';
    
    // Add retry listener
    if (!overlay.dataset.retryListenerAdded) {
      overlay.dataset.retryListenerAdded = 'true';
      overlay.addEventListener('mousedown', (e) => {
        if (gameState === 'gameover') {
          e.preventDefault();
          resetRun();
        }
      });
    }
  } else if (gameState === 'cardSelection') {
    // Only rebuild card selection if not already showing
    if (!overlay.dataset.cardSelectionBuilt) {
      overlay.innerHTML = buildCardSelectionHTML();
      overlay.dataset.cardSelectionBuilt = 'true';
    }
    overlay.style.display = 'block';
    overlay.style.pointerEvents = 'auto';
  } else {
    overlay.dataset.cardSelectionBuilt = '';  // Reset flag when leaving card selection
    overlay.style.display = 'none';
    overlay.style.pointerEvents = 'none';
  }
}

function rollCardRarity() {
  const roll = Math.random();
  if (roll < 0.20) return 'legendary';
  if (roll < 0.50) return 'rare';
  return 'common';
}

function generateCards(count = 3) {
  const cards = [];
  for (let i = 0; i < count; i++) {
    const rarity = rollCardRarity();
    const pool = CARD_POOL[rarity];
    const card = pool[Math.floor(Math.random() * pool.length)];
    cards.push({ ...card, rarity, id: i });
  }
  return cards;
}

function showCardSelection() {
  pendingCards = generateCards(3);
  gameState = 'cardSelection';
}

function selectCard(cardId) {
  const card = pendingCards.find(c => c.id === cardId);
  if (!card) return;
  
  // Apply the stat buff
  playerStats[card.stat] += card.amount;
  
  // Update the game constants that use these stats
  MAX_SPEED = playerStats.maxSpeed;
  BOOST_SPEED = playerStats.boostSpeed;
  BOOST_DURATION = playerStats.boostDuration;
  
  // Clear pending cards and start next lap
  pendingCards = [];
  startCountdown();
}

function buildCardSelectionHTML() {
  let html = `
    <div style="text-align: center;">
      <div style="font-size: 36px; margin-bottom: 30px; color: #00ff88;">🏆 LAP ${lapCount} COMPLETE! 🏆</div>
      <div style="font-size: 24px; margin-bottom: 20px;">Choose your upgrade:</div>
      <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
  `;
  
  for (const card of pendingCards) {
    const colors = RARITY_COLORS[card.rarity];
    html += `
      <div class="upgrade-card" data-card-id="${card.id}" style="
        background: linear-gradient(145deg, ${colors.bg}, #1a1a2e);
        border: 3px solid ${colors.glow};
        border-radius: 15px;
        padding: 20px;
        width: 180px;
        cursor: pointer;
        box-shadow: 0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}40;
        transition: transform 0.2s, box-shadow 0.2s;
      " onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}80';"
         onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}40';">
        <div style="font-size: 12px; text-transform: uppercase; color: ${colors.text}; margin-bottom: 10px; letter-spacing: 2px;">
          ${card.rarity}
        </div>
        <div style="font-size: 18px; font-weight: bold; color: white; margin-bottom: 15px;">
          ${card.name}
        </div>
        <div style="font-size: 14px; color: #aaaaaa;">
          ${card.desc}
        </div>
      </div>
    `;
  }
  
  html += `
      </div>
    </div>
  `;
  
  // Add click handlers after a small delay to let DOM update
  setTimeout(() => {
    document.querySelectorAll('.upgrade-card').forEach(cardEl => {
      cardEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const cardId = parseInt(cardEl.dataset.cardId);
        selectCard(cardId);
      });
      cardEl.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const cardId = parseInt(cardEl.dataset.cardId);
        selectCard(cardId);
      });
    });
  }, 50);
  
  return html;
}

function updatePhysics(dt) {
  const driftActive = keyState.get("Space") === true;
  const forward = new THREE.Vector2(Math.sin(car.heading), Math.cos(car.heading));
  const side = new THREE.Vector2(forward.y, -forward.x);

  const accel = new THREE.Vector2();
  if (keyState.get("KeyW")) accel.addScaledVector(forward, playerStats.acceleration);
  if (keyState.get("KeyS")) accel.addScaledVector(forward, -26);
  car.vel.addScaledVector(accel, dt);

  const forwardSpeed = car.vel.dot(forward);
  const sideSpeed = car.vel.dot(side);
  
  // Grip physics - drifting has very low lateral grip for real sliding feel
  // Normal driving has high grip making turns harder without drifting
  const grip = driftActive ? playerStats.driftGrip : 0.97;  // Low drift grip = more sliding, high normal grip = harder to turn
  
  // When drifting, preserve more of the slide momentum for that "sliding on ice" feel
  const slidePreserve = driftActive ? 0.92 : 0.5;  // How much sideways velocity carries over
  const newSideSpeed = sideSpeed * grip + (sideSpeed * (1 - grip) * slidePreserve);
  
  car.vel.copy(forward.clone().multiplyScalar(forwardSpeed).add(side.clone().multiplyScalar(newSideSpeed)));

  // Steering - much harder when not drifting, very responsive when drifting
  const steer = (keyState.get("KeyA") ? 1 : 0) - (keyState.get("KeyD") ? 1 : 0);
  const steerBase = driftActive ? playerStats.handling : 1.4;  // Drifting = easier steering, normal = sluggish
  
  // Speed-dependent steering (understeer at high speed when not drifting)
  const speedFactor = Math.abs(forwardSpeed) / playerStats.maxSpeed;
  const understeer = driftActive ? 1.0 : Math.max(0.4, 1.0 - speedFactor * 0.6);
  const steerGain = steerBase * Math.min(1, speedFactor + 0.3) * understeer;
  car.heading += steer * steerGain * dt;

  // Counter-steer bonus when drifting - turning into the slide gives extra rotation
  if (driftActive && Math.abs(sideSpeed) > 1) {
    const slideDir = Math.sign(sideSpeed);
    const counterSteer = steer * slideDir;  // positive if steering into the slide
    if (counterSteer > 0) {
      car.heading += counterSteer * 0.8 * dt;  // bonus rotation for counter-steering
    }
  }

  // Drifting slows you down unless you're turning
  const isTurning = Math.abs(steer) > 0.5;
  const driftDrag = isTurning ? 0.2 : 1.0;  // much more drag if drifting straight
  const baseDrag = driftActive ? driftDrag : 1.4;
  
  // Off-track slowdown
  const onTrack = isOnTrack(car.pos);
  const offTrackPenalty = onTrack ? 0 : 2.5;
  const totalDrag = baseDrag + offTrackPenalty;
  car.vel.multiplyScalar(Math.max(0, 1 - totalDrag * dt));

  if (driftActive) {
    driftHold += dt;
  } else {
    if (driftHold > 1.0) {
      boostTimer = playerStats.boostDuration;
      const boosted = Math.min(playerStats.boostSpeed, car.vel.length() + 6);
      if (car.vel.length() > 0.1) {
        car.vel.setLength(boosted);
      }
      // Boost visual effect - flash the car
      triggerBoostEffect();
    }
    driftHold = 0;
  }

  if (boostTimer > 0) {
    boostTimer -= dt;
    // Pulsing boost glow
    if (car.body) {
      const pulse = Math.sin(clock.elapsedTime * 20) * 0.3 + 0.7;
      car.body.traverse((c) => {
        if (c.isMesh && c.material && c.material.emissive) {
          c.material.emissive.setHex(0x00ffff);
          c.material.emissiveIntensity = pulse * 0.5;
        }
      });
    }
  } else {
    // Reset emissive when boost ends
    if (car.body) {
      car.body.traverse((c) => {
        if (c.isMesh && c.material && c.material.emissive) {
          c.material.emissiveIntensity = 0;
        }
      });
    }
  }

  const speed = car.vel.length();
  const maxSpeed = boostTimer > 0 ? playerStats.boostSpeed : playerStats.maxSpeed;
  if (speed > maxSpeed) car.vel.setLength(maxSpeed);

  car.pos.addScaledVector(car.vel, dt);
  car.group.position.set(car.pos.x, CAR_HEIGHT, car.pos.y);
  car.group.rotation.y = car.heading + CAR_YAW_OFFSET; // face forward

  // onTrack already computed above for drag
  const scoreDelta = onTrack ? 6 * dt : -3 * dt;
  score = Math.max(0, score + scoreDelta);

  if (driftActive && speed > 2) {
    driftScore += 9 * dt;
    score += 10 * dt;
  } else {
    driftScore = Math.max(0, driftScore - 8 * dt);
  }

  for (const obs of obstacles) {
    const dx = car.pos.x - obs.position.x;
    const dz = car.pos.y - obs.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 1.6) {
      car.vel.multiplyScalar(0.35);
      score = Math.max(0, score - 8 * dt - 4);
      obs.rotation.y += 2.5 * dt;
    }
  }

  // Subtle banking so the car leans while drifting.
  if (car.body) {
    const bank = THREE.MathUtils.clamp(sideSpeed * 0.1, -0.3, 0.3);
    car.body.rotation.z = bank;
  }
}

function animateGhost(dt) {
  if (!ghost.mesh) return;
  if (gameState === 'racing') {
    const prevT = ghost.t;
    ghost.t = ghost.t + dt * ghost.speed;
    
    // Check if ghost completed a lap
    if (ghost.t >= 1) {
      if (!playerFinishedLap) {
        // Ghost finished first - game over!
        gameState = 'gameover';
        ghost.t = 0;
        return;
      } else {
        // Player already finished, ghost wraps around
        ghost.t = ghost.t % 1;
      }
    }
  }
  const idx = ghost.t * (trackPath.length - 1);
  const i0 = Math.floor(idx);
  const i1 = Math.min(trackPath.length - 1, i0 + 1);
  const lerpT = idx - i0;
  const p0 = trackPath[i0];
  const p1 = trackPath[i1];
  const x = THREE.MathUtils.lerp(p0.x, p1.x, lerpT);
  const z = THREE.MathUtils.lerp(p0.y, p1.y, lerpT);
  ghost.mesh.position.set(x, CAR_HEIGHT, z);
  ghost.mesh.rotation.y = Math.atan2(p1.x - p0.x, p1.y - p0.y);
  ghostLapEl.textContent = `${Math.round(ghost.t * 100)}%`;
}

function updateCheckpoints() {
  if (gameState !== 'racing') return;  // Don't check during countdown
  
  for (const cp of checkpoints) {
    const dist = car.pos.distanceTo(cp.pos);
    
    if (dist < CHECKPOINT_RADIUS && !cp.passed) {
      // Checkpoint 0 is start/finish - only count lap if all others passed
      if (cp.index === 0) {
        const allOthersPassed = checkpoints.slice(1).every(c => c.passed);
        if (allOthersPassed) {
          // Player completed a lap!
          playerFinishedLap = true;
          
          // Record lap time
          lastLapTime = lapTimer;
          if (lapTimer < bestLapTime) {
            bestLapTime = lapTimer;
          }
          
          // Only count if player beat the ghost
          lapCount++;
          score += 100;  // Lap bonus
          
          // Increase ghost speed for next lap (5% increase each lap, up to 100%)
          ghost.speed = Math.min(ghost.maxSpeed, ghost.speed + ghost.maxSpeed * 0.05);
          
          // Reset all checkpoints for next lap
          checkpoints.forEach(c => c.passed = false);
          
          // Show card selection instead of starting countdown
          showCardSelection();
        }
      } else {
        cp.passed = true;
        score += 15;  // Checkpoint bonus
      }
      
      // Visual feedback - pulse the gate
      cp.visual.scale.setScalar(1.2);
      setTimeout(() => cp.visual.scale.setScalar(1.0), 200);
    }
  }
}

function animateObstacles(dt) {
  for (const obs of obstacles) {
    obs.userData.bobPhase += dt * 1.6;
    obs.position.y = 0.8 + Math.sin(obs.userData.bobPhase) * 0.15;
  }
}

function updateCamera() {
  const distance = 12;
  const height = 4.2;
  const behind = new THREE.Vector3(
    Math.sin(car.heading + cameraPivotAngle + CAMERA_BEHIND_OFFSET) * distance,
    height,
    Math.cos(car.heading + cameraPivotAngle + CAMERA_BEHIND_OFFSET) * distance
  );
  const target = new THREE.Vector3(car.pos.x, 0.8, car.pos.y);
  camera.position.copy(target).add(behind);
  camera.lookAt(target);
}

function updateHUD() {
  speedEl.textContent = car.vel.length().toFixed(1);
  driftEl.textContent = driftScore.toFixed(1);
  scoreEl.textContent = score.toFixed(1);
  trackStateEl.textContent = isOnTrack(car.pos) ? "On track" : "Off track";
  
  // Lap counter
  if (lapCountEl) lapCountEl.textContent = lapCount;
  
  // Checkpoint progress
  if (checkpointEl) {
    const passed = checkpoints.filter(cp => cp.passed).length;
    checkpointEl.textContent = `${passed}/${NUM_CHECKPOINTS}`;
  }
  
  // Lap timer
  const lapTimerEl = document.getElementById('lapTimer');
  if (lapTimerEl) {
    lapTimerEl.textContent = formatTime(lapTimer);
  }
  
  // Last lap time
  const lastLapEl = document.getElementById('lastLap');
  if (lastLapEl) {
    lastLapEl.textContent = lastLapTime > 0 ? formatTime(lastLapTime) : '--:--.--';
  }
  
  // Best lap time
  const bestLapEl = document.getElementById('bestLap');
  if (bestLapEl) {
    bestLapEl.textContent = bestLapTime < Infinity ? formatTime(bestLapTime) : '--:--.--';
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function triggerBoostEffect() {
  // Create burst particles
  const particleCount = 12;
  for (let i = 0; i < particleCount; i++) {
    const geo = new THREE.SphereGeometry(0.15, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9 });
    const particle = new THREE.Mesh(geo, mat);
    particle.position.copy(car.group.position);
    particle.position.y += 0.5;
    scene.add(particle);
    
    const angle = (i / particleCount) * Math.PI * 2;
    const speed = 8 + Math.random() * 4;
    const vx = Math.cos(angle) * speed;
    const vz = Math.sin(angle) * speed;
    let vy = 2 + Math.random() * 2;
    
    // Animate and remove
    let life = 0.6;
    const animate = () => {
      life -= 0.016;
      if (life <= 0) {
        scene.remove(particle);
        geo.dispose();
        mat.dispose();
        return;
      }
      particle.position.x += vx * 0.016;
      particle.position.y += vy * 0.016;
      particle.position.z += vz * 0.016;
      vy -= 9.8 * 0.016 * 0.5;
      mat.opacity = life / 0.6;
      particle.scale.setScalar(life / 0.6);
      requestAnimationFrame(animate);
    };
    animate();
  }
}

function closestPointOnSegment(p, a, b) {
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abLenSq = abx * abx + aby * aby;
  const t = THREE.MathUtils.clamp((apx * abx + apy * aby) / abLenSq, 0, 1);
  return new THREE.Vector2(a.x + abx * t, a.y + aby * t);
}

function distanceToTrack(pos) {
  let best = Infinity;
  for (let i = 0; i < trackPath.length - 1; i++) {
    const a = trackPath[i];
    const b = trackPath[i + 1];
    const cp = closestPointOnSegment(pos, a, b);
    const d = pos.distanceTo(cp);
    if (d < best) best = d;
  }
  return best;
}

function isOnTrack(pos) {
  return distanceToTrack(pos) < TRACK_HALF;
}

function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
