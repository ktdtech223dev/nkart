import * as THREE from 'three';

// ---------------------------------------------------------------------------
// CheckpointNode (internal data shape, not exported separately)
// ---------------------------------------------------------------------------
// {
//   position:  THREE.Vector3,
//   normal:    THREE.Vector3,   -- defines the crossing plane (typically = track tangent)
//   width:     number,          -- half-width of the gate for proximity culling
//   type:      'start' | 'checkpoint' | 'fork' | 'merge' | 'finish',
//   pathIds:   string[],        -- which path(s) this node belongs to
//   required:  boolean,         -- must this node be visited for a valid lap? (default true)
// }

// ---------------------------------------------------------------------------

export class CheckpointGraph {
  constructor() {
    /** @type {Map<string, object>} id -> CheckpointNode */
    this.nodes = new Map();

    /** @type {Array<{from: string, to: string, pathId: string}>} */
    this.edges = [];

    /** @type {string|null} */
    this.startNodeId = null;

    /** @type {string|null} */
    this.finishNodeId = null;

    this.totalLaps     = 3;
    this.onLapComplete = null;  // (lapNumber, lapTime, progress) => void
    this.onRaceFinish  = null;  // (progress) => void
    this.onWrongWay    = null;  // (progress) => void

    // Internal: adjacency list built lazily by _buildAdjacency()
    this._adjacency   = null;  // Map<fromId, Array<{toId, pathId}>>
    this._prevAdjacency = null; // Map<toId, Array<{fromId, pathId}>> (reverse)

    // Per-path required node sets, keyed by pathId
    // Built lazily from edge graph
    this._pathNodes   = null;  // Map<pathId, Set<nodeId>>
  }

  // =========================================================================
  // GRAPH CONSTRUCTION
  // =========================================================================

  /**
   * Add a checkpoint node.
   * @param {string} id
   * @param {object} node - { position, normal, width, type, pathIds, required }
   */
  addNode(id, node) {
    const n = {
      position: node.position instanceof THREE.Vector3
        ? node.position
        : new THREE.Vector3(node.position.x, node.position.y, node.position.z),
      normal: node.normal instanceof THREE.Vector3
        ? node.normal.normalize()
        : new THREE.Vector3(node.normal.x, node.normal.y, node.normal.z).normalize(),
      width:    node.width   !== undefined ? node.width   : 12,
      type:     node.type    || 'checkpoint',
      pathIds:  node.pathIds || ['main'],
      required: node.required !== undefined ? node.required : true,
    };

    this.nodes.set(id, n);

    // Auto-assign start/finish if not already set
    if (n.type === 'start'  && this.startNodeId  === null) this.startNodeId  = id;
    if (n.type === 'finish' && this.finishNodeId === null) this.finishNodeId = id;

    // Invalidate cached adjacency
    this._adjacency     = null;
    this._prevAdjacency = null;
    this._pathNodes     = null;
  }

  /**
   * Connect two nodes along a path.
   * @param {string} fromId
   * @param {string} toId
   * @param {string} [pathId='main']
   */
  addEdge(fromId, toId, pathId = 'main') {
    this.edges.push({ from: fromId, to: toId, pathId });
    this._adjacency     = null;
    this._prevAdjacency = null;
    this._pathNodes     = null;
  }

  // =========================================================================
  // PER-KART PROGRESS STATE
  // =========================================================================

  /**
   * Create a fresh per-kart progress object.
   * @returns {object}
   */
  createKartProgress() {
    return {
      currentNodeId:  this.startNodeId,   // which node we're heading toward next
      nodesVisited:   new Set(),          // set of node IDs visited this lap
      pathTaken:      'main',             // current branch / path
      lapCount:       0,
      finishTime:     null,              // performance.now() when race ended, or null
      lastCrossTime:  0,                 // performance.now() of last crossing
      lastDotSign:    0,                 // sign of last dot product (for edge-detect)
      lapStartTime:   performance.now(), // for lap timing
      wrongWayCooldown: 0,              // frames remaining before wrong-way can fire again
    };
  }

  // =========================================================================
  // UPDATE (called every physics tick)
  // =========================================================================

  /**
   * Update a kart's checkpoint progress.
   * @param {{ position: THREE.Vector3, rotation: THREE.Euler }} kartState
   * @param {object} progress - created by createKartProgress()
   * @returns {{ crossedCheckpoint: boolean, lapCompleted: boolean, wrongWay: boolean }}
   */
  update(kartState, progress) {
    const result = {
      crossedCheckpoint: false,
      lapCompleted:      false,
      wrongWay:          false,
    };

    if (!kartState || !progress) return result;
    if (progress.finishTime !== null) return result;

    const adj      = this._getAdjacency();
    const prevAdj  = this._getPrevAdjacency();
    const pos      = kartState.position;
    const nodeId   = progress.currentNodeId;
    if (!nodeId) return result;

    const node = this.nodes.get(nodeId);
    if (!node) return result;

    // ---- Proximity gate: ignore if kart is too far laterally -----------------
    const toKart = new THREE.Vector3().subVectors(pos, node.position);
    const xzDist = Math.hypot(toKart.x, toKart.z);
    const gateW  = (node.width || 12) + 8;
    if (xzDist > gateW) {
      // Decrement wrong-way cooldown even when not near current node
      if (progress.wrongWayCooldown > 0) progress.wrongWayCooldown--;
      return result;
    }

    // ---- Dot product with plane normal (forward = positive) ------------------
    const dot     = toKart.dot(node.normal);
    const dotSign = Math.sign(dot);

    const prevSign = progress.lastDotSign;
    progress.lastDotSign = dotSign;

    if (prevSign === 0) {
      // First frame near this checkpoint — just record sign, don't fire
      return result;
    }

    // ---- Forward crossing: sign went from negative to positive ---------------
    if (prevSign < 0 && dotSign > 0) {
      result.crossedCheckpoint = true;
      progress.nodesVisited.add(nodeId);
      progress.lastCrossTime = performance.now();

      // Handle fork: pick the branch path based on proximity
      if (node.type === 'fork') {
        progress.pathTaken = this._detectForkBranch(pos, nodeId, adj);
      }

      // Handle merge: switch back to the main (or downstream) path
      if (node.type === 'merge') {
        const downstreamEdges = adj.get(nodeId) || [];
        if (downstreamEdges.length > 0) {
          progress.pathTaken = downstreamEdges[0].pathId;
        }
      }

      // Advance to next node in graph
      const nextNodeId = this._nextNode(nodeId, adj, progress.pathTaken);
      progress.lastDotSign = 0; // reset sign so we re-detect near next node
      progress.currentNodeId = nextNodeId;

      // ---- Check for lap completion -----------------------------------------
      if (nodeId === this.finishNodeId || node.type === 'finish') {
        if (this._lapIsValid(progress)) {
          progress.lapCount++;
          const now     = performance.now();
          const lapTime = now - progress.lapStartTime;
          progress.lapStartTime = now;
          progress.nodesVisited = new Set(); // reset for next lap

          result.lapCompleted = true;

          if (progress.lapCount >= this.totalLaps) {
            progress.finishTime = now;
            if (this.onRaceFinish) this.onRaceFinish(progress);
          } else {
            if (this.onLapComplete) this.onLapComplete(progress.lapCount, lapTime, progress);
          }
        }
      }

      return result;
    }

    // ---- Wrong-way: sign went from positive to negative ----------------------
    if (prevSign > 0 && dotSign < 0 && progress.wrongWayCooldown <= 0) {
      result.wrongWay = true;
      progress.wrongWayCooldown = 90; // ~1.5 s at 60 fps
      if (this.onWrongWay) this.onWrongWay(progress);
    }

    if (progress.wrongWayCooldown > 0) progress.wrongWayCooldown--;

    return result;
  }

  // =========================================================================
  // RACE PROGRESS
  // =========================================================================

  /**
   * Compute race progress as a float for position sorting.
   * Higher = further ahead. Returns laps + fraction of current lap done.
   */
  getRaceProgress(progress) {
    if (!progress) return 0;

    const lapsDone  = progress.lapCount;
    const pathNodes = this._getPathNodes();
    const pathId    = progress.pathTaken || 'main';
    const required  = pathNodes.get(pathId) || pathNodes.get('main') || new Set();
    const total     = required.size;

    if (total === 0) return lapsDone;

    let visited = 0;
    for (const id of required) {
      if (progress.nodesVisited.has(id)) visited++;
    }

    return lapsDone + (visited / total);
  }

  // =========================================================================
  // BACKWARD COMPAT: build from flat checkpoints array
  // =========================================================================

  /**
   * Build a linear CheckpointGraph from a plain checkpoints array.
   * Each entry: { position, normal, width }
   * Compatible with the old CheckpointSystem format.
   *
   * @param {Array<{position: THREE.Vector3, normal: THREE.Vector3, width: number}>} checkpoints
   * @param {number} [lapCount=3]
   * @returns {CheckpointGraph}
   */
  static fromCheckpointsArray(checkpoints, lapCount = 3) {
    const graph = new CheckpointGraph();
    graph.totalLaps = lapCount;

    if (!checkpoints || checkpoints.length === 0) return graph;

    // First checkpoint is both start and finish (as with a closed loop)
    checkpoints.forEach((cp, i) => {
      const isFirst  = i === 0;
      const isLast   = i === checkpoints.length - 1;
      const id       = isFirst ? 'start' : (isLast ? 'finish' : `cp${i}`);
      const type     = isFirst ? 'start' : (isLast ? 'finish' : 'checkpoint');
      graph.addNode(id, {
        position: cp.position,
        normal:   cp.normal,
        width:    cp.width || 12,
        type,
        pathIds:  ['main'],
        required: true,
      });
    });

    // Linear edges: start -> cp1 -> cp2 -> ... -> finish -> (wraps via lap logic)
    const ids = ['start', ...checkpoints.slice(1, -1).map((_, i) => `cp${i + 1}`), 'finish'];
    for (let i = 0; i < ids.length - 1; i++) {
      graph.addEdge(ids[i], ids[i + 1], 'main');
    }
    // After finish, next lap restarts from start
    graph.addEdge('finish', 'start', 'main');

    return graph;
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  /** Build and cache forward adjacency list. */
  _getAdjacency() {
    if (this._adjacency) return this._adjacency;
    const adj = new Map();
    for (const { from, to, pathId } of this.edges) {
      if (!adj.has(from)) adj.set(from, []);
      adj.get(from).push({ toId: to, pathId });
    }
    this._adjacency = adj;
    return adj;
  }

  /** Build and cache reverse adjacency list. */
  _getPrevAdjacency() {
    if (this._prevAdjacency) return this._prevAdjacency;
    const rev = new Map();
    for (const { from, to, pathId } of this.edges) {
      if (!rev.has(to)) rev.set(to, []);
      rev.get(to).push({ fromId: from, pathId });
    }
    this._prevAdjacency = rev;
    return rev;
  }

  /**
   * Build per-path required node sets.
   * Traverses all edges to find every node reachable on each pathId.
   */
  _getPathNodes() {
    if (this._pathNodes) return this._pathNodes;

    const map = new Map();
    for (const { from, to, pathId } of this.edges) {
      if (!map.has(pathId)) map.set(pathId, new Set());
      const s = map.get(pathId);
      // Only include required nodes
      const fn = this.nodes.get(from);
      const tn = this.nodes.get(to);
      if (fn && fn.required) s.add(from);
      if (tn && tn.required) s.add(to);
    }
    this._pathNodes = map;
    return map;
  }

  /**
   * Determine the next node id from nodeId given current pathTaken.
   * Prefers edges on pathTaken, falls back to first available edge.
   */
  _nextNode(nodeId, adj, pathTaken) {
    const edges = adj.get(nodeId) || [];
    if (edges.length === 0) return this.startNodeId;

    // Try to find an edge matching the current path
    const match = edges.find(e => e.pathId === pathTaken);
    if (match) return match.toId;

    // Fall back to first edge
    return edges[0].toId;
  }

  /**
   * When a kart crosses a fork node, determine which branch it's taking
   * by looking at the XZ distance to each branch's first downstream node.
   */
  _detectForkBranch(kartPos, forkNodeId, adj) {
    const edges = adj.get(forkNodeId) || [];
    if (edges.length <= 1) {
      return edges.length === 1 ? edges[0].pathId : 'main';
    }

    let bestPathId = edges[0].pathId;
    let bestDist   = Infinity;

    for (const { toId, pathId } of edges) {
      const nextNode = this.nodes.get(toId);
      if (!nextNode) continue;
      const dx = kartPos.x - nextNode.position.x;
      const dz = kartPos.z - nextNode.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist) {
        bestDist   = dist;
        bestPathId = pathId;
      }
    }

    return bestPathId;
  }

  /**
   * Check if a lap is valid: the kart must have visited every required node
   * on their chosen path (or the main path for nodes shared by all paths).
   */
  _lapIsValid(progress) {
    const pathNodes = this._getPathNodes();
    const pathId    = progress.pathTaken || 'main';

    // Gather required nodes for this path
    // Also include nodes that appear on ALL paths (shared required)
    const required = pathNodes.get(pathId) || new Set();

    // If there are no tracked required nodes (e.g. simple linear graph),
    // just require that at least startNodeId was visited
    if (required.size === 0) {
      return progress.nodesVisited.size > 0;
    }

    // Every required node for the taken path must have been visited
    for (const nodeId of required) {
      // skip finish node itself — it's what triggered this check
      if (nodeId === this.finishNodeId) continue;
      if (!progress.nodesVisited.has(nodeId)) {
        return false;
      }
    }

    return true;
  }
}
