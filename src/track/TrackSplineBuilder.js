import * as THREE from 'three';
import { computeBoundsTree } from 'three-mesh-bvh';
import { toon, TOON, getGradientMap } from '../materials/ToonMaterials.js';

// Extend BufferGeometry prototype once
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Clamp a value between min and max. */
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * For a given t in [0,1] look up the surfaceMap and return the surface type string.
 * surfaceMap: Array<{tStart: number, tEnd: number, type: string}>
 */
function surfaceAtT(t, surfaceMap) {
  if (!surfaceMap || surfaceMap.length === 0) return 'road';
  for (const entry of surfaceMap) {
    if (t >= entry.tStart && t <= entry.tEnd) return entry.type;
  }
  return 'road';
}

/**
 * For a given t in [0,1] look up the widthMap and return a numeric width.
 * widthMap: Array<{tStart: number, tEnd: number, width: number}>
 * Falls back to defaultWidth if no range matches.
 */
function widthAtT(t, widthMap, defaultWidth) {
  if (!widthMap || widthMap.length === 0) return defaultWidth;
  for (const entry of widthMap) {
    if (t >= entry.tStart && t <= entry.tEnd) return entry.width;
  }
  return defaultWidth;
}

// ---------------------------------------------------------------------------

export class TrackSplineBuilder {
  // =========================================================================
  // PUBLIC API
  // =========================================================================

  /**
   * Build a complete track data structure from 3D control points.
   *
   * @param {Array<{pos: THREE.Vector3, surfaceType?: string, width?: number}>} controlPoints
   * @param {object} opts
   *   closed        {boolean}  - whether the spline is closed (default true)
   *   segments      {number}   - spline tessellation segments (default 300)
   *   defaultWidth  {number}   - road width in world units (default 12)
   *   wallHeight    {number}   - barrier height (default 1.5)
   *   branches      {Array}    - optional branching paths: [{tFork, tMerge, controlPoints, id}]
   * @returns {TrackData} object with geometry, navigation data, and Three.js meshes
   */
  static buildTrack(controlPoints, opts = {}) {
    const {
      closed       = true,
      segments     = 300,
      defaultWidth = 12,
      wallHeight   = 1.5,
      branches     = [],
    } = opts;

    // ---- Build the CatmullRom spline from control points ------------------
    const positions = controlPoints.map(cp => cp.pos instanceof THREE.Vector3 ? cp.pos : new THREE.Vector3(cp.pos.x, cp.pos.y, cp.pos.z));
    const curve = new THREE.CatmullRomCurve3(positions, closed, 'catmullrom', 0.5);

    // ---- Build surfaceMap and widthMap from control point metadata ---------
    const surfaceMap = [];
    const widthMap   = [];
    const n = controlPoints.length;
    for (let i = 0; i < n; i++) {
      const cp = controlPoints[i];
      const tStart = i / n;
      const tEnd   = (i + 1) / n;
      if (cp.surfaceType) {
        surfaceMap.push({ tStart, tEnd, type: cp.surfaceType });
      }
      if (cp.width !== undefined) {
        widthMap.push({ tStart, tEnd, width: cp.width });
      }
    }

    // ---- Compute total arc length -----------------------------------------
    const arcLengthDivisions = segments * 2;
    curve.arcLengthDivisions = arcLengthDivisions;
    // Prime the cumulative length cache
    curve.getLengths(arcLengthDivisions);
    const totalLength = curve.getLength();

    // ---- Build geometry -----------------------------------------------------
    const curveOpts = { segments, defaultWidth, wallHeight, totalLength, surfaceMap, widthMap };

    const roadMesh       = TrackSplineBuilder.buildRoadMesh(curve, curveOpts);
    const curbsMesh      = TrackSplineBuilder.buildCurbs(curve, curveOpts);
    const collisionMesh  = TrackSplineBuilder.buildCollisionMesh(curve, curveOpts);
    const wallsMeshes    = TrackSplineBuilder.buildWalls(curve, curveOpts);

    // BVH on collision geometry
    collisionMesh.geometry.computeBoundsTree();
    for (const child of wallsMeshes.collision.children) {
      if (child.geometry) child.geometry.computeBoundsTree();
    }

    // ---- Navigation data ---------------------------------------------------
    const waypoints   = TrackSplineBuilder.generateWaypoints(curve, surfaceMap, widthMap, { defaultWidth, totalLength });
    TrackSplineBuilder.computeRacingLine(waypoints);
    const checkpointCount = Math.max(8, Math.floor(waypoints.length / 8));
    const checkpoints = TrackSplineBuilder.generateCheckpoints(curve, checkpointCount, defaultWidth);
    const startPositions    = TrackSplineBuilder.generateStartPositions(curve, 8);
    const itemBoxPositions  = TrackSplineBuilder.generateItemBoxPositions(curve, 12);

    // ---- Process branches --------------------------------------------------
    const branchData = [];
    for (const branch of branches) {
      const bPositions = branch.controlPoints.map(cp => cp.pos instanceof THREE.Vector3 ? cp.pos : new THREE.Vector3(cp.pos.x, cp.pos.y, cp.pos.z));
      const bCurve     = new THREE.CatmullRomCurve3(bPositions, false, 'catmullrom', 0.5);
      bCurve.arcLengthDivisions = segments;
      bCurve.getLengths(segments);
      const bTotalLen = bCurve.getLength();
      const bOpts     = { segments, defaultWidth, wallHeight, totalLength: bTotalLen, surfaceMap: [], widthMap: [] };
      const bRoad     = TrackSplineBuilder.buildRoadMesh(bCurve, bOpts);
      const bCurbs    = TrackSplineBuilder.buildCurbs(bCurve, bOpts);
      const bCollision = TrackSplineBuilder.buildCollisionMesh(bCurve, bOpts);
      bCollision.geometry.computeBoundsTree();
      const bWaypoints = TrackSplineBuilder.generateWaypoints(bCurve, [], [], { defaultWidth, totalLength: bTotalLen });
      TrackSplineBuilder.computeRacingLine(bWaypoints);
      branchData.push({
        id:         branch.id,
        tFork:      branch.tFork,
        tMerge:     branch.tMerge,
        curve:      bCurve,
        roadMesh:   bRoad,
        curbsMesh:  bCurbs,
        collision:  bCollision,
        waypoints:  bWaypoints,
      });
    }

    return {
      // Spline
      curve,
      totalLength,
      closed,
      // Geometry / meshes
      roadMesh,
      curbsMesh,
      collisionMesh,
      walls: wallsMeshes,
      // Navigation
      waypoints,
      checkpoints,
      startPositions,
      itemBoxPositions,
      // Metadata
      surfaceMap,
      widthMap,
      defaultWidth,
      segments,
      // Branches
      branches: branchData,
    };
  }

  // =========================================================================
  // GEOMETRY BUILDERS
  // =========================================================================

  /**
   * Build a flat ribbon road mesh with UV coordinates.
   * UV.x = 0..1 across road width; UV.y = arc-length fraction along spline.
   */
  static buildRoadMesh(curve, opts = {}) {
    const {
      segments     = 300,
      defaultWidth = 12,
      totalLength  = 1,
      surfaceMap   = [],
      widthMap     = [],
    } = opts;

    const vertices = [];
    const normals  = [];
    const uvs      = [];
    const indices  = [];
    const colors   = [];

    const count = segments + 1;

    // Pre-compute cumulative arc lengths for UV.y
    const lengths = curve.getLengths(segments);

    for (let i = 0; i < count; i++) {
      const t     = i / segments;
      const pt    = curve.getPoint(t);
      const tang  = curve.getTangent(t).normalize();

      // Side vector always in the XZ plane (ground normal = +Y)
      const side  = new THREE.Vector3(-tang.z, 0, tang.x).normalize();

      const w     = widthAtT(t, widthMap, defaultWidth);
      const halfW = w / 2;

      const arcLen = lengths[i] !== undefined ? lengths[i] : (t * totalLength);
      const uvY    = arcLen / Math.max(totalLength, 0.001);

      // Left and right vertices
      const left  = pt.clone().addScaledVector(side, -halfW);
      const right = pt.clone().addScaledVector(side,  halfW);

      vertices.push(left.x,  left.y,  left.z);
      vertices.push(right.x, right.y, right.z);

      normals.push(0, 1, 0,  0, 1, 0);
      uvs.push(0, uvY,  1, uvY);

      // Surface color tint (very subtle: road = dark grey, grass = green tint)
      const surf = surfaceAtT(t, surfaceMap);
      const col  = _surfaceColor(surf);
      colors.push(...col, ...col);

      if (i < segments) {
        const b = i * 2;
        // Two triangles per quad
        indices.push(b,     b + 1, b + 2);
        indices.push(b + 1, b + 3, b + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,  3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,      2));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors,   3));
    geo.setIndex(indices);

    const mat  = toon(TOON.ROAD, { vertexColors: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Build curb geometry: alternating red/white every 2 world units along spline.
   * Curbs are flat strips 0.4 wide, 0.2 high on each side of the road.
   */
  static buildCurbs(curve, opts = {}) {
    const {
      segments     = 300,
      defaultWidth = 12,
      totalLength  = 1,
      widthMap     = [],
    } = opts;

    const CURB_WIDTH  = 0.4;
    const CURB_HEIGHT = 0.2;
    const STRIPE_LEN  = 2.0; // alternation every 2 world units

    const matRed   = toon(TOON.CURB_RED);
    const matWhite = toon(TOON.CURB_WHITE);

    const redVertsL  = [], redVertsR  = [];
    const whiVertsL  = [], whiVertsR  = [];
    const redIdxL    = [], redIdxR    = [];
    const whiIdxL    = [], whiIdxR    = [];

    const count = segments + 1;
    const lengths = curve.getLengths(segments);

    for (let i = 0; i < count; i++) {
      const t      = i / segments;
      const pt     = curve.getPoint(t);
      const tang   = curve.getTangent(t).normalize();
      const side   = new THREE.Vector3(-tang.z, 0, tang.x).normalize();
      const w      = widthAtT(t, widthMap, defaultWidth);
      const halfW  = w / 2;
      const arcLen = lengths[i] !== undefined ? lengths[i] : (t * totalLength);

      // Which stripe? 0 = red, 1 = white
      const isRed = (Math.floor(arcLen / STRIPE_LEN) % 2) === 0;

      // Inner and outer edges of curb on each side
      const leftInner  = pt.clone().addScaledVector(side, -(halfW));
      const leftOuter  = pt.clone().addScaledVector(side, -(halfW + CURB_WIDTH));
      leftInner.y  += CURB_HEIGHT;
      leftOuter.y  += CURB_HEIGHT;

      const rightInner = pt.clone().addScaledVector(side, halfW);
      const rightOuter = pt.clone().addScaledVector(side, halfW + CURB_WIDTH);
      rightInner.y += CURB_HEIGHT;
      rightOuter.y += CURB_HEIGHT;

      if (isRed) {
        const bL = redVertsL.length / 3;
        redVertsL.push(leftOuter.x, leftOuter.y, leftOuter.z);
        redVertsL.push(leftInner.x, leftInner.y, leftInner.z);
        const bR = redVertsR.length / 3;
        redVertsR.push(rightInner.x, rightInner.y, rightInner.z);
        redVertsR.push(rightOuter.x, rightOuter.y, rightOuter.z);
        if (i < segments) {
          redIdxL.push(bL,     bL + 1, bL + 2);
          redIdxL.push(bL + 1, bL + 3, bL + 2);
          redIdxR.push(bR,     bR + 1, bR + 2);
          redIdxR.push(bR + 1, bR + 3, bR + 2);
        }
      } else {
        const bL = whiVertsL.length / 3;
        whiVertsL.push(leftOuter.x, leftOuter.y, leftOuter.z);
        whiVertsL.push(leftInner.x, leftInner.y, leftInner.z);
        const bR = whiVertsR.length / 3;
        whiVertsR.push(rightInner.x, rightInner.y, rightInner.z);
        whiVertsR.push(rightOuter.x, rightOuter.y, rightOuter.z);
        if (i < segments) {
          whiIdxL.push(bL,     bL + 1, bL + 2);
          whiIdxL.push(bL + 1, bL + 3, bL + 2);
          whiIdxR.push(bR,     bR + 1, bR + 2);
          whiIdxR.push(bR + 1, bR + 3, bR + 2);
        }
      }
    }

    const group = new THREE.Group();
    const _makeMesh = (verts, idx, mat) => {
      if (verts.length === 0) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      g.computeVertexNormals();
      g.setIndex(idx);
      const m = new THREE.Mesh(g, mat);
      m.receiveShadow = true;
      return m;
    };

    const mRL = _makeMesh(redVertsL, redIdxL, matRed);
    const mRR = _makeMesh(redVertsR, redIdxR, matRed);
    const mWL = _makeMesh(whiVertsL, whiIdxL, matWhite);
    const mWR = _makeMesh(whiVertsR, whiIdxR, matWhite);

    if (mRL) group.add(mRL);
    if (mRR) group.add(mRR);
    if (mWL) group.add(mWL);
    if (mWR) group.add(mWR);
    return group;
  }

  /**
   * Build a collision mesh: slightly wider than the road, invisible to renderer.
   * Also calls computeBoundsTree() for BVH acceleration.
   */
  static buildCollisionMesh(curve, opts = {}) {
    const {
      segments     = 300,
      defaultWidth = 12,
      widthMap     = [],
    } = opts;

    const COLLISION_EXTRA = 0.5; // wider on each side
    const vertices = [];
    const indices  = [];
    const count    = segments + 1;

    for (let i = 0; i < count; i++) {
      const t    = i / segments;
      const pt   = curve.getPoint(t);
      const tang = curve.getTangent(t).normalize();
      const side = new THREE.Vector3(-tang.z, 0, tang.x).normalize();
      const w    = widthAtT(t, widthMap, defaultWidth) + COLLISION_EXTRA * 2;
      const halfW = w / 2;

      const left  = pt.clone().addScaledVector(side, -halfW);
      const right = pt.clone().addScaledVector(side,  halfW);

      vertices.push(left.x,  left.y,  left.z);
      vertices.push(right.x, right.y, right.z);

      if (i < segments) {
        const b = i * 2;
        indices.push(b,     b + 1, b + 2);
        indices.push(b + 1, b + 3, b + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat  = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    // computeBoundsTree called by caller (buildTrack) after this returns
    return mesh;
  }

  /**
   * Build wall / barrier meshes along road edges.
   * Returns { visual: THREE.Group, collision: THREE.Group }
   */
  static buildWalls(curve, opts = {}) {
    const {
      segments     = 300,
      defaultWidth = 12,
      wallHeight   = 1.5,
      widthMap     = [],
    } = opts;

    const WALL_OFFSET = 0.3; // gap between curb and wall

    const buildSideGeometry = (sign) => {
      const verts = [];
      const norms = [];
      const idx   = [];
      const count = segments + 1;
      for (let i = 0; i < count; i++) {
        const t    = i / segments;
        const pt   = curve.getPoint(t);
        const tang = curve.getTangent(t).normalize();
        const side = new THREE.Vector3(-tang.z, 0, tang.x).normalize();
        const w    = widthAtT(t, widthMap, defaultWidth);
        const halfW = w / 2 + 0.4 + WALL_OFFSET; // past curb

        const base = pt.clone().addScaledVector(side, sign * halfW);
        const top  = base.clone();
        top.y += wallHeight;

        verts.push(base.x, base.y, base.z);
        verts.push(top.x,  top.y,  top.z);

        // Inward-facing normal
        const inward = side.clone().multiplyScalar(-sign);
        norms.push(inward.x, inward.y, inward.z);
        norms.push(inward.x, inward.y, inward.z);

        if (i < segments) {
          const b = i * 2;
          if (sign > 0) {
            idx.push(b, b + 2, b + 1,  b + 1, b + 2, b + 3);
          } else {
            idx.push(b, b + 1, b + 2,  b + 1, b + 3, b + 2);
          }
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute('normal',   new THREE.Float32BufferAttribute(norms, 3));
      geo.setIndex(idx);
      return geo;
    };

    const geoL = buildSideGeometry(-1);
    const geoR = buildSideGeometry( 1);

    const matVis = toon(TOON.BARRIER);
    const matCol = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });

    const wallL = new THREE.Mesh(geoL, matVis);
    const wallR = new THREE.Mesh(geoR, matVis);
    wallL.castShadow = true;
    wallR.castShadow = true;

    const colL = new THREE.Mesh(geoL.clone(), matCol);
    const colR = new THREE.Mesh(geoR.clone(), matCol);

    const visual    = new THREE.Group();
    const collision = new THREE.Group();
    visual.add(wallL, wallR);
    collision.add(colL, colR);

    return { visual, collision };
  }

  // =========================================================================
  // NAVIGATION DATA
  // =========================================================================

  /**
   * Generate waypoints for AI navigation — one per ~1.5 world units along spline.
   * Each waypoint: { position, tangent, normal, width, surfaceType,
   *                  racingLineOffset, curvature, index }
   */
  static generateWaypoints(curve, surfaceMap = [], widthMap = [], opts = {}) {
    const { defaultWidth = 12, totalLength = null } = opts;

    const len      = totalLength !== null ? totalLength : curve.getLength();
    const step     = 1.5; // world units per waypoint
    const count    = Math.max(4, Math.ceil(len / step));
    const waypoints = [];

    for (let i = 0; i < count; i++) {
      const t      = i / count;
      const pos    = curve.getPoint(t);
      const tang   = curve.getTangent(t).normalize();
      // Ground-plane normal: always world up perpendicular to tangent
      const normal = new THREE.Vector3(0, 1, 0);
      const w      = widthAtT(t, widthMap, defaultWidth);
      const surf   = surfaceAtT(t, surfaceMap);

      waypoints.push({
        index:            i,
        t,
        position:         pos,
        tangent:          tang,
        normal,
        width:            w,
        surfaceType:      surf,
        racingLineOffset: 0,  // filled in by computeRacingLine
        curvature:        0,  // filled in below
      });
    }

    // Compute curvatures — cross(tangent[i], tangent[i+2]).length / step^2
    // step in t-space: 1/count
    const tStep = 1 / count;
    for (let i = 0; i < waypoints.length; i++) {
      const iNext2 = (i + 2) % waypoints.length;
      const t0     = waypoints[i].tangent;
      const t2     = waypoints[iNext2].tangent;
      const cross  = new THREE.Vector3().crossVectors(t0, t2);
      // Signed curvature: use Y component of cross (positive = left turn, negative = right)
      const signedCurv = cross.y / (tStep * tStep);
      waypoints[i].curvature = signedCurv;
    }

    return waypoints;
  }

  /**
   * Compute racing line offset for each waypoint using 3-waypoint lookahead.
   * Mutates waypoints[i].racingLineOffset in place.
   * offset = clamp(-width*0.4, width*0.4, -curvature * width * 0.35)
   */
  static computeRacingLine(waypoints) {
    const n = waypoints.length;
    for (let i = 0; i < n; i++) {
      const wp0 = waypoints[i];
      const wp1 = waypoints[(i + 1) % n];
      const wp2 = waypoints[(i + 2) % n];

      // Average curvature over lookahead window
      const avgCurv = (wp0.curvature + wp1.curvature + wp2.curvature) / 3;
      const w       = wp0.width;
      const rawOff  = -avgCurv * w * 0.35;
      wp0.racingLineOffset = clamp(rawOff, -w * 0.4, w * 0.4);
    }
  }

  /**
   * Generate checkpoints — one per 8 waypoints (evenly spaced along spline).
   * Returns array of { position, normal, width, t }
   */
  static generateCheckpoints(curve, count = 16, defaultWidth = 12) {
    const checkpoints = [];
    for (let i = 0; i < count; i++) {
      const t       = i / count;
      const pos     = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      checkpoints.push({
        position: pos.clone(),
        normal:   tangent.clone(),  // forward tangent defines the crossing plane
        width:    defaultWidth,
        t,
      });
    }
    return checkpoints;
  }

  /**
   * Generate start grid positions at t~0.985 with correct heading.
   * Returns array of { position, heading }
   */
  static generateStartPositions(curve, count = 8) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const row    = Math.floor(i / 2);
      const col    = i % 2;
      const t      = 0.985 - row * 0.003;
      const pt     = curve.getPoint(t);
      const tang   = curve.getTangent(t).normalize();
      const heading = Math.atan2(tang.x, tang.z);
      const side   = new THREE.Vector3(-tang.z, 0, tang.x).normalize();
      pt.addScaledVector(side, col === 0 ? -2.5 : 2.5);
      pt.y = Math.max(pt.y, 0.4);
      positions.push({ position: pt.clone(), heading });
    }
    return positions;
  }

  /**
   * Generate item box positions — evenly spaced along spline.
   * Returns array of THREE.Vector3.
   */
  static generateItemBoxPositions(curve, count = 12) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const t  = i / count;
      const pt = curve.getPoint(t);
      pt.y += 0.8;
      positions.push(pt.clone());
    }
    return positions;
  }
}

// ---------------------------------------------------------------------------
// Private utilities
// ---------------------------------------------------------------------------

/**
 * Return an [r, g, b] normalized color triple for a surface type.
 * Used for vertex coloring of the road mesh.
 */
function _surfaceColor(surfaceType) {
  switch (surfaceType) {
    case 'grass':   return [0.365, 0.733, 0.388]; // #5DBB63
    case 'dirt':    return [0.545, 0.353, 0.169]; // #8B5A2B
    case 'ice':     return [0.678, 0.847, 0.902]; // #ADD8E6
    case 'boost':   return [1.000, 0.843, 0.000]; // #FFD700
    case 'road':
    default:
      return [0.173, 0.173, 0.173];               // #2C2C2C
  }
}
