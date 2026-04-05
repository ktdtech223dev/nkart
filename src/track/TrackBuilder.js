import * as THREE from 'three';
import { computeBoundsTree } from 'three-mesh-bvh';
import { toon, TOON, getGradientMap } from '../materials/ToonMaterials.js';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;

/**
 * Shared track construction utilities — all materials are MeshToonMaterial
 * using the mandated toon color palette regardless of what track files pass in.
 */
export class TrackBuilder {

  // -------------------------------------------------------------------------
  // Road geometry
  // -------------------------------------------------------------------------
  static buildRoad(curve, width = 12, segments = 200, yOffset = 0.05) {
    const points = curve.getPoints(segments);
    const vertices = [], indices = [], normals = [], uvs = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const t = curve.getTangent(i / segments);
      const side = new THREE.Vector3(-t.z, 0, t.x).normalize();
      const left  = p.clone().addScaledVector(side, -width / 2);
      const right = p.clone().addScaledVector(side,  width / 2);
      left.y  += yOffset;
      right.y += yOffset;
      vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
      normals.push(0, 1, 0, 0, 1, 0);
      uvs.push(0, i / segments, 1, i / segments);
      if (i < points.length - 1) {
        const b = i * 2;
        indices.push(b, b+1, b+2, b+1, b+3, b+2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }

  // Always returns toon road material — ignores tintColor
  static makeRoadMaterial(tintColor) {
    return toon(TOON.ROAD);
  }

  // Kept for desk_dash compatibility — returns canvas texture
  static makeWoodTexture(baseColor = 0xd4b483) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const c = new THREE.Color(baseColor);
    ctx.fillStyle = `#${c.getHexString()}`;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 30; i++) {
      const x = (i / 30) * size + (Math.random() - 0.5) * 8;
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 8, size * 0.33, x - 6, size * 0.66, x + 3, size);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  // -------------------------------------------------------------------------
  // Walls — always bold orange (#FF6B00)
  // -------------------------------------------------------------------------
  static buildWalls(curve, roadWidth, segments, wallHeight = 1.5, wallColor) {
    const points = curve.getPoints(segments);

    const buildSide = (offset) => {
      const verts = [], idx = [], norms = [];
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const t = curve.getTangent(i / segments);
        const side = new THREE.Vector3(-t.z, 0, t.x).normalize();
        const base = p.clone().addScaledVector(side, offset);
        const inward = offset > 0 ? -1 : 1;
        verts.push(base.x, base.y, base.z, base.x, base.y + wallHeight, base.z);
        norms.push(side.x * inward, 0, side.z * inward, side.x * inward, 0, side.z * inward);
        if (i < points.length - 1) {
          const b = i * 2;
          idx.push(b, b+2, b+1, b+1, b+2, b+3);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute('normal',   new THREE.Float32BufferAttribute(norms, 3));
      geo.setIndex(idx);
      return geo;
    };

    const mat = toon(TOON.BARRIER);
    const wallL = new THREE.Mesh(buildSide(-roadWidth / 2 - 0.3), mat);
    const wallR = new THREE.Mesh(buildSide( roadWidth / 2 + 0.3), mat);
    wallL.castShadow = true;
    wallR.castShadow = true;
    const group = new THREE.Group();
    group.add(wallL, wallR);

    const collisionGroup = new THREE.Group();
    collisionGroup.add(
      new THREE.Mesh(wallL.geometry.clone(), new THREE.MeshBasicMaterial({ visible: false })),
      new THREE.Mesh(wallR.geometry.clone(), new THREE.MeshBasicMaterial({ visible: false }))
    );
    return { visual: group, collision: collisionGroup };
  }

  // -------------------------------------------------------------------------
  // F1-style alternating red/white curbs
  // -------------------------------------------------------------------------
  static addCurbs(scene, curve, roadWidth, segments = 120) {
    const points   = curve.getPoints(segments);
    const matRed   = toon(TOON.CURB_RED);
    const matWhite = toon(TOON.CURB_WHITE);
    const curbW = 0.7, curbH = 0.07, curbL = 1.4;

    for (let i = 0; i < points.length - 1; i++) {
      const p = points[i];
      const t = curve.getTangent(i / segments);
      const side = new THREE.Vector3(-t.z, 0, t.x).normalize();
      const isRed = Math.floor(i / 3) % 2 === 0;
      const mat = isRed ? matRed : matWhite;

      [-1, 1].forEach(sign => {
        const geo = new THREE.BoxGeometry(curbW, curbH, curbL);
        const mesh = new THREE.Mesh(geo, mat);
        const pos = p.clone().addScaledVector(side, sign * (roadWidth / 2 + curbW / 2 + 0.3));
        mesh.position.copy(pos);
        mesh.position.y += curbH / 2;
        mesh.rotation.y = Math.atan2(t.x, t.z);
        scene.add(mesh);
      });
    }
  }

  // -------------------------------------------------------------------------
  // Sky — always uses toon palette tri-gradient
  // -------------------------------------------------------------------------
  static createSky(scene, topColor, bottomColor, fogColor, fogDensity) {
    scene.background = new THREE.Color(TOON.SKY_MID);
    scene.fog = new THREE.FogExp2(new THREE.Color(TOON.SKY_HORIZON), fogDensity || 0.006);

    const skyGeo = new THREE.SphereGeometry(200, 16, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor:    { value: new THREE.Color(TOON.SKY_TOP) },
        midColor:    { value: new THREE.Color(TOON.SKY_MID) },
        bottomColor: { value: new THREE.Color(TOON.SKY_HORIZON) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          vec3 col = mix(bottomColor, midColor, smoothstep(-0.1, 0.3, h));
          col = mix(col, topColor, smoothstep(0.3, 0.8, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
    return sky;
  }

  // -------------------------------------------------------------------------
  // Lighting — mandated three-light toon rig (ignores params)
  // -------------------------------------------------------------------------
  static createLighting(scene, ambientColor, ambientIntensity, dirColor, dirIntensity, dirPos, shadows = true) {
    const sun = new THREE.DirectionalLight(0xFFF5E0, 3.0);
    sun.position.set(10, 20, 10);
    if (shadows) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 0.5;
      sun.shadow.camera.far  = 200;
      sun.shadow.camera.left   = -80;
      sun.shadow.camera.right  =  80;
      sun.shadow.camera.top    =  80;
      sun.shadow.camera.bottom = -80;
      sun.shadow.bias = -0.001;
    }
    scene.add(sun);

    const ambient = new THREE.AmbientLight(0x4A6FA5, 0.8);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x8B6914, 0.5);
    scene.add(hemi);

    return { sun, ambient, hemi };
  }

  // -------------------------------------------------------------------------
  // Ground — bright Mario Kart green checkerboard
  // -------------------------------------------------------------------------
  static createGround(scene, color, size = 200) {
    const texSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = texSize; canvas.height = texSize;
    const ctx = canvas.getContext('2d');
    const tileSize = texSize / 8;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#5DBB63' : '#4AAD58';
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    const mat = new THREE.MeshToonMaterial({
      map: tex,
      color: 0xffffff,
      gradientMap: getGradientMap(),
    });
    const geo  = new THREE.PlaneGeometry(size, size, 4, 4);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -0.1;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  // -------------------------------------------------------------------------
  // Billboard trees
  // -------------------------------------------------------------------------
  static addBillboardTrees(scene, positions) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 192;
    const ctx = canvas.getContext('2d');
    // Trunk
    ctx.fillStyle = '#6B3A2A';
    ctx.fillRect(52, 140, 24, 52);
    // Shadow foliage
    ctx.fillStyle = '#2D7A35';
    ctx.beginPath(); ctx.arc(64, 90, 52, 0, Math.PI * 2); ctx.fill();
    // Main foliage
    ctx.fillStyle = '#3E9B47';
    ctx.beginPath(); ctx.arc(64, 82, 50, 0, Math.PI * 2); ctx.fill();
    // Highlight
    ctx.fillStyle = '#5DBB63';
    ctx.beginPath(); ctx.arc(52, 68, 28, 0, Math.PI * 2); ctx.fill();
    // Dark outline
    ctx.strokeStyle = '#1A4A1E';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(64, 82, 50, 0, Math.PI * 2); ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1 });

    for (const pos of positions) {
      const sprite = new THREE.Sprite(mat.clone());
      sprite.position.set(pos.x, (pos.y || 0) + 5, pos.z);
      sprite.scale.set(6, 9, 1);
      scene.add(sprite);
    }
  }

  // -------------------------------------------------------------------------
  // Grandstand bleachers
  // -------------------------------------------------------------------------
  static addGrandstands(scene, positions) {
    const colors = ['#E8002D', '#0033A0', '#FFFFFF', '#FFD700', '#00AA44'];
    positions.forEach(({ x, y = 0, z, width = 12, depth = 4, height = 3, facing = 0 }) => {
      const sections = 5;
      const sectionW = width / sections;
      for (let s = 0; s < sections; s++) {
        const col = colors[s % colors.length];
        for (let tier = 0; tier < 3; tier++) {
          const geo  = new THREE.BoxGeometry(sectionW - 0.2, height / 3 - 0.1, depth);
          const mesh = new THREE.Mesh(geo, toon(col));
          mesh.castShadow = true;
          mesh.position.set(
            x + (s - sections / 2 + 0.5) * sectionW,
            y + tier * (height / 3) + height / 6,
            z + tier * (depth * 0.3)
          );
          mesh.rotation.y = facing;
          scene.add(mesh);
        }
        const wallGeo  = new THREE.BoxGeometry(sectionW - 0.1, height + 1, 0.4);
        const wallMesh = new THREE.Mesh(wallGeo, toon('#333333'));
        wallMesh.castShadow = true;
        wallMesh.position.set(x + (s - sections / 2 + 0.5) * sectionW, y + height / 2, z + depth);
        wallMesh.rotation.y = facing;
        scene.add(wallMesh);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Start/finish checkered banner
  // -------------------------------------------------------------------------
  static addFinishBanner(scene, position, heading = 0, roadWidth = 12) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const tileW = 32, tileH = 32;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 2; y++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#000000' : '#FFFFFF';
        ctx.fillRect(x * tileW, y * tileH, tileW, tileH);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshToonMaterial({
      map: tex, color: 0xffffff, gradientMap: getGradientMap(), side: THREE.DoubleSide,
    });
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth + 2, 2.5), mat);
    banner.position.set(position.x, (position.y || 0) + 4.5, position.z);
    banner.rotation.y = heading;
    scene.add(banner);

    const pillarMat = toon('#888888');
    [-(roadWidth / 2 + 0.5), roadWidth / 2 + 0.5].forEach(offset => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6, 8), pillarMat);
      pillar.castShadow = true;
      pillar.position.set(
        position.x + Math.sin(heading) * offset,
        (position.y || 0) + 3,
        position.z + Math.cos(heading) * offset
      );
      scene.add(pillar);
    });
  }

  // -------------------------------------------------------------------------
  // Checkpoint generation
  // -------------------------------------------------------------------------
  static generateCheckpoints(curve, count = 16, roadWidth = 12) {
    const checkpoints = [];
    for (let i = 0; i < count; i++) {
      const t      = i / count;
      const pt     = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      // Use forward tangent as normal so dot>0 means kart has crossed ahead of this gate
      checkpoints.push({ position: pt.clone(), normal: tangent.clone().normalize(), width: roadWidth });
    }
    return checkpoints;
  }

  static generateStartPositions(curve, count = 8) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      // Start slightly before the start/finish line so karts cross cp0 going forward
      const t   = 0.985 + row * 0.003;
      const pt  = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const heading  = Math.atan2(-tangent.x, -tangent.z);
      const sideDir  = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      pt.addScaledVector(sideDir, col === 0 ? -2 : 2);
      pt.y = 0.4;
      positions.push({ position: pt, heading });
    }
    return positions;
  }

  static generateWaypoints(curve, count = 100) {
    const waypoints = [];
    for (let i = 0; i < count; i++) {
      const pt = curve.getPoint(i / count);
      pt.y = 0.4;
      waypoints.push(pt);
    }
    return waypoints;
  }

  static generateItemBoxPositions(curve, count = 12) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const pt = curve.getPoint(i / count);
      pt.y = 0.8;
      positions.push(pt);
    }
    return positions;
  }

  // -------------------------------------------------------------------------
  // Atmosphere particles
  // -------------------------------------------------------------------------
  static createParticles(scene, config) {
    const { count = 50, spread = 30, color = '#ffffff', speed = 0.05, size = 0.1 } = config;
    const geo       = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] =  Math.random() * spread * 0.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat    = new THREE.PointsMaterial({ color: new THREE.Color(color), size, transparent: true, opacity: 0.5, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    return points;
  }

  // -------------------------------------------------------------------------
  // Generic prop helper
  // -------------------------------------------------------------------------
  static addProp(scene, geoType, params, material, position, rotation, scale) {
    let geo;
    switch (geoType) {
      case 'box':      geo = new THREE.BoxGeometry(...params);      break;
      case 'cylinder': geo = new THREE.CylinderGeometry(...params); break;
      case 'sphere':   geo = new THREE.SphereGeometry(...params);   break;
      case 'cone':     geo = new THREE.ConeGeometry(...params);     break;
      case 'torus':    geo = new THREE.TorusGeometry(...params);    break;
      default:         geo = new THREE.BoxGeometry(1, 1, 1);
    }
    const mesh = new THREE.Mesh(geo, material);
    if (position) mesh.position.set(...position);
    if (rotation) mesh.rotation.set(...rotation);
    if (scale)    mesh.scale.set(...(Array.isArray(scale) ? scale : [scale, scale, scale]));
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  }
}
