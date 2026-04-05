import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { toon, TOON } from '../materials/ToonMaterials.js';

// Extend Three.js with BVH support
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// Dynamic track imports
const trackModules = import.meta.glob('../tracks/*/index.js');

export class TrackLoader {
  constructor() {
    this.currentTrack = null;
    this.loadedTracks = new Map();
  }

  async load(trackId, scene) {
    // Check cache
    if (this.loadedTracks.has(trackId)) {
      return this.loadedTracks.get(trackId);
    }

    // Dynamic import
    const modulePath = `../tracks/${trackId}/index.js`;
    const importFn = trackModules[modulePath];
    if (!importFn) {
      console.warn(`Track module not found: ${trackId}, using default`);
      return this._buildDefaultTrack(scene);
    }

    const mod = await importFn();
    const trackDef = mod.default || mod.track;

    // Build geometry
    const trackData = trackDef.buildGeometry(scene);

    // Compute BVH for collision mesh
    if (trackData.collisionMesh) {
      trackData.collisionMesh.geometry.computeBoundsTree();
    }

    const result = { ...trackDef, ...trackData };

    // Normalize wall mesh reference — support both old (wallMesh) and new (walls.collision) formats
    if (!result.wallMesh && result.walls?.collision) {
      result.wallMesh = result.walls.collision;
    }

    this.loadedTracks.set(trackId, result);
    this.currentTrack = result;
    return result;
  }

  _buildDefaultTrack(scene) {
    // Simple flat oval track for testing
    const trackGroup = new THREE.Group();

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = toon(TOON.GRASS);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    trackGroup.add(ground);

    // Track road - oval shape using CatmullRom
    const points = [];
    const segments = 64;
    const radiusX = 30;
    const radiusZ = 20;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(t) * radiusX, 0.05, Math.sin(t) * radiusZ));
    }
    const curve = new THREE.CatmullRomCurve3(points, true);

    // Road surface
    const roadWidth = 12;
    const roadSegments = 200;
    const roadPoints = curve.getPoints(roadSegments);
    const roadShape = new THREE.Shape();
    roadShape.moveTo(-roadWidth / 2, 0);
    roadShape.lineTo(roadWidth / 2, 0);

    const roadGeo = this._buildRoadGeometry(curve, roadWidth, roadSegments);
    const roadMat = toon(TOON.ROAD);
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Collision mesh (same as road)
    const collisionGeo = roadGeo.clone();
    collisionGeo.computeBoundsTree();
    const collisionMesh = new THREE.Mesh(collisionGeo, new THREE.MeshBasicMaterial({ visible: false }));
    trackGroup.add(collisionMesh);

    // Walls
    const wallGeo = this._buildWallGeometry(curve, roadWidth, roadSegments, 1.5);
    const wallMat = toon(TOON.BARRIER);
    const wallMeshLeft = new THREE.Mesh(wallGeo.left, wallMat);
    const wallMeshRight = new THREE.Mesh(wallGeo.right, wallMat);
    trackGroup.add(wallMeshLeft, wallMeshRight);

    const wallCollisionGroup = new THREE.Group();
    wallCollisionGroup.add(
      new THREE.Mesh(wallGeo.left.clone(), new THREE.MeshBasicMaterial({ visible: false })),
      new THREE.Mesh(wallGeo.right.clone(), new THREE.MeshBasicMaterial({ visible: false }))
    );

    // Sky
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.008);

    // Lighting — PBR quality
    const hemi = new THREE.HemisphereLight(0x88AAFF, 0x223344, 0.8);
    scene.add(hemi);
    const dirLight = new THREE.DirectionalLight(0xffd580, 2.0);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 60;
    dirLight.shadow.camera.bottom = -60;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x4466AA, 0.5);
    fillLight.position.set(-10, 8, -5);
    scene.add(fillLight);

    scene.add(trackGroup);

    // Start/finish line
    const startLineGeo = new THREE.PlaneGeometry(roadWidth, 1);
    const startLineMat = toon('#ffffff');
    const startLine = new THREE.Mesh(startLineGeo, startLineMat);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(radiusX, 0.07, 0);
    scene.add(startLine);

    // Item box positions
    const itemBoxPositions = [];
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      const pt = curve.getPoint(t);
      pt.y = 0.8;
      itemBoxPositions.push(pt);
    }

    // Checkpoints
    const checkpoints = [];
    const numCheckpoints = 16;
    for (let i = 0; i < numCheckpoints; i++) {
      const t = i / numCheckpoints;
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      checkpoints.push({ position: pt.clone(), normal: normal.clone(), width: roadWidth });
    }

    // Start positions (8)
    const startPositions = [];
    for (let i = 0; i < 8; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const t = row * 0.008;
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const heading = Math.atan2(-tangent.x, -tangent.z);
      const offset = (col === 0 ? -2 : 2);
      const sideDir = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      pt.addScaledVector(sideDir, offset);
      pt.y = 0.4;
      startPositions.push({ position: pt, heading });
    }

    // Waypoints for AI
    const waypointPath = [];
    for (let i = 0; i < 100; i++) {
      const pt = curve.getPoint(i / 100);
      pt.y = 0.4;
      waypointPath.push(pt);
    }

    return {
      id: 'default',
      name: 'TEST TRACK',
      cup: 'test',
      lapCount: 3,
      collisionMesh,
      wallMesh: wallCollisionGroup,
      trackGroup,
      curve,
      checkpoints,
      startPositions,
      itemBoxPositions,
      waypointPath,
      surfaceZones: [],
      hazards: [],
      respawnY: -10,
    };
  }

  _buildRoadGeometry(curve, width, segments) {
    const points = curve.getPoints(segments);
    const tangents = [];
    for (let i = 0; i < points.length; i++) {
      tangents.push(curve.getTangent(i / segments));
    }

    const vertices = [];
    const indices = [];
    const normals = [];
    const uvs = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const t = tangents[i];
      const side = new THREE.Vector3(-t.z, 0, t.x).normalize();

      const left = new THREE.Vector3().copy(p).addScaledVector(side, -width / 2);
      const right = new THREE.Vector3().copy(p).addScaledVector(side, width / 2);

      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);

      normals.push(0, 1, 0, 0, 1, 0);
      uvs.push(0, i / segments, 1, i / segments);

      if (i < points.length - 1) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }

  _buildWallGeometry(curve, roadWidth, segments, wallHeight) {
    const points = curve.getPoints(segments);
    const tangents = [];
    for (let i = 0; i < points.length; i++) {
      tangents.push(curve.getTangent(i / segments));
    }

    const buildSide = (offset) => {
      const vertices = [];
      const indices = [];
      const normals = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const t = tangents[i];
        const side = new THREE.Vector3(-t.z, 0, t.x).normalize();

        const base = p.clone().addScaledVector(side, offset);
        const inward = offset > 0 ? -1 : 1;
        const n = side.clone().multiplyScalar(inward);

        vertices.push(base.x, base.y, base.z);
        vertices.push(base.x, base.y + wallHeight, base.z);
        normals.push(n.x, 0, n.z, n.x, 0, n.z);

        if (i < points.length - 1) {
          const b = i * 2;
          indices.push(b, b + 2, b + 1);
          indices.push(b + 1, b + 2, b + 3);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setIndex(indices);
      return geo;
    };

    return {
      left: buildSide(-roadWidth / 2 - 0.3),
      right: buildSide(roadWidth / 2 + 0.3),
    };
  }
}
