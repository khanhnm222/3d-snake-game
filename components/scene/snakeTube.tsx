import * as THREE from 'three'
import type { SnakeTheme } from '@/lib/snakeTheme'
import { terrainHeight } from '@/utils/terrain'
import { dragonScaleTexture, hornGeometry } from './objects/procedural'

// ── Continuous snake body ────────────────────────────────────────────
// One skinned tube swept along a Catmull-Rom curve through the segment
// positions, rebuilt every frame. Unlike a chain of capsules it has no
// seams or bead-like bulges however long the snake gets: it bends smoothly
// through turns, tapers from neck to tail tip, follows the terrain height,
// and carries a continuous dorsal pattern and pale belly.
//
// Dragon look: large keeled overlapping scales with an iridescent sheen,
// ridged belly plates (ventral scutes) and a row of curved dorsal spikes.

const SAMPLES_PER_SEG = 6    // curve samples between two grid segments
const RADIAL          = 18   // vertices around the cross-section (+1 seam)
const HALF_W          = 0.4  // body half-width at full girth
const HALF_H          = 0.275
const BELLY_FLAT      = 0.78 // underside flattening (snakes have flat bellies)
const SLITHER_AMP     = 0.06
const PATTERN_PERIOD  = 1.0  // one dorsal blotch per world unit
const SCUTE_LEN       = 0.2  // belly plate length
const SPIKE_EVERY     = 0.32 // dorsal spike spacing
const SPIKE_H         = 0.24 // spike height at full girth

export interface PathPoint {
  x: number
  z: number
  /** Extra height above the ground (e.g. a rearing head in the menu scene) */
  lift?: number
}

const _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3(), _p3 = new THREE.Vector3()
const _t  = new THREE.Vector3(), _side = new THREE.Vector3(), _up = new THREE.Vector3()
const _Y  = new THREE.Vector3(0, 1, 0)
const _c  = new THREE.Color()
const _x  = new THREE.Vector3()
const _m  = new THREE.Matrix4()
const _sc = new THREE.Vector3()
const _q  = new THREE.Quaternion()
const _o  = new THREE.Vector3()
const HORN_IVORY = new THREE.Color('#e8dcc0')

function smooth01(t: number) {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t, t3 = t2 * t
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
}

/** Shared dragon-hide material settings (body tube + head) */
export function dragonSkinParams(): THREE.MeshPhysicalMaterialParameters {
  const scales = dragonScaleTexture()
  return {
    vertexColors: true,
    map: scales,
    bumpMap: scales,
    bumpScale: 1.6,
    roughness: 0.36,
    metalness: 0.28,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25,
    iridescence: 0.55,
    iridescenceIOR: 1.4,
    iridescenceThicknessRange: [180, 520],
  }
}

export class SnakeTube {
  /** Add this to the scene - holds the body mesh and the dorsal spikes */
  readonly group = new THREE.Group()
  readonly mesh: THREE.Mesh
  private spikes!: THREE.InstancedMesh
  private spikeCapacity = 0
  private spikeMat: THREE.MeshPhysicalMaterial
  private heightAt: (x: number, z: number) => number
  private geometry = new THREE.BufferGeometry()
  private capacity = 0            // rings allocated
  private pos!: Float32Array
  private nor!: Float32Array
  private uv!: Float32Array
  private col!: Float32Array
  // Per-sample scratch (centre line)
  private cx: number[] = []
  private cz: number[] = []
  private cy: number[] = []
  private cs: number[] = []
  private cl: number[] = []
  private body  = [new THREE.Color(), new THREE.Color(), new THREE.Color()]
  private spine = new THREE.Color()
  private belly = new THREE.Color()

  constructor(opts: { heightAt?: (x: number, z: number) => number } = {}) {
    this.heightAt = opts.heightAt ?? ((x, z) => terrainHeight(x, z))
    const material = new THREE.MeshPhysicalMaterial(dragonSkinParams())
    this.mesh = new THREE.Mesh(this.geometry, material)
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.frustumCulled = false   // bounds change every frame
    this.group.add(this.mesh)

    this.spikeMat = new THREE.MeshPhysicalMaterial({
      roughness: 0.32, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.2,
    })
    this.ensureCapacity(64)
    this.ensureSpikes(64)
  }

  setTheme(theme: SnakeTheme) {
    theme.body.forEach((c, i) => this.body[i].set(c))
    this.spine.set(theme.spine)
    this.belly.set(theme.belly)
    this.spikeMat.color.set(theme.spine).lerp(HORN_IVORY, 0.35)
  }

  dispose() {
    this.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
    this.spikes.dispose()
    this.spikeMat.dispose()
  }

  private ensureSpikes(n: number) {
    if (n <= this.spikeCapacity) return
    const cap = Math.max(n, this.spikeCapacity * 2)
    if (this.spikes) { this.group.remove(this.spikes); this.spikes.dispose() }
    this.spikes = new THREE.InstancedMesh(hornGeometry(1, 0.3, 0.9), this.spikeMat, cap)
    this.spikes.castShadow = true
    this.spikes.frustumCulled = false
    this.spikes.count = 0
    this.group.add(this.spikes)
    this.spikeCapacity = cap
  }

  private ensureCapacity(rings: number) {
    if (rings <= this.capacity) return
    const cap = Math.max(rings, this.capacity * 2)
    const vpr = RADIAL + 1
    this.pos = new Float32Array(cap * vpr * 3)
    this.nor = new Float32Array(cap * vpr * 3)
    this.uv  = new Float32Array(cap * vpr * 2)
    this.col = new Float32Array(cap * vpr * 3)
    const idx = new Uint32Array((cap - 1) * RADIAL * 6)
    let k = 0
    for (let r = 0; r < cap - 1; r++) {
      for (let j = 0; j < RADIAL; j++) {
        const a = r * vpr + j, b = a + 1, c = a + vpr, d = c + 1
        idx[k++] = a; idx[k++] = c; idx[k++] = b
        idx[k++] = b; idx[k++] = c; idx[k++] = d
      }
    }
    const g = this.geometry
    g.dispose() // release the old GPU buffers; they re-upload on next render
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('normal',   new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('uv',       new THREE.BufferAttribute(this.uv, 2).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('color',    new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage))
    g.setIndex(new THREE.BufferAttribute(idx, 1))
    this.capacity = cap
  }

  /**
   * Rebuild the tube along `path` (index 0 = head). `time` drives the
   * slither wave.
   */
  update(path: PathPoint[], time: number) {
    const n = path.length
    if (n < 2) { this.mesh.visible = false; return }
    this.mesh.visible = true

    // Control points: path + one extrapolated point so the tail tip extends
    // past the last segment centre (like the old tail cone).
    const last = path[n - 1], prev = path[n - 2]
    const ctrl = (i: number, out: THREE.Vector3) => {
      // .y carries the optional lift
      if (i < 0) {
        out.set(2 * path[0].x - path[1].x, path[0].lift ?? 0, 2 * path[0].z - path[1].z)
      } else if (i >= n) {
        const k = 0.65 * (i - n + 1)
        out.set(last.x + (last.x - prev.x) * k, 0, last.z + (last.z - prev.z) * k)
      } else {
        out.set(path[i].x, path[i].lift ?? 0, path[i].z)
      }
      return out
    }

    // 1. Sample the centre line
    const cx = this.cx, cz = this.cz, cy = this.cy, cs = this.cs, cl = this.cl
    cx.length = cz.length = cy.length = cs.length = cl.length = 0
    const segs = n // n-1 real gaps + 1 into the extrapolated tail point
    for (let i = 0; i < segs; i++) {
      ctrl(i - 1, _p0); ctrl(i, _p1); ctrl(i + 1, _p2); ctrl(i + 2, _p3)
      for (let k = 0; k < SAMPLES_PER_SEG; k++) {
        const t = k / SAMPLES_PER_SEG
        cx.push(catmull(_p0.x, _p1.x, _p2.x, _p3.x, t))
        cz.push(catmull(_p0.z, _p1.z, _p2.z, _p3.z, t))
        cl.push(Math.max(0, catmull(_p0.y, _p1.y, _p2.y, _p3.y, t)))
      }
    }
    ctrl(n, _p1)
    cx.push(_p1.x); cz.push(_p1.z); cl.push(0)
    const rings = cx.length
    this.ensureCapacity(rings)

    // Arc length (incl. lift) for pattern / taper
    let S = 0
    cs.push(0)
    for (let r = 1; r < rings; r++) {
      S += Math.hypot(cx[r] - cx[r - 1], cz[r] - cz[r - 1], cl[r] - cl[r - 1])
      cs.push(S)
    }

    // Girth profile: slim neck → full body → long tapering tail
    const tailLen = Math.min(3.2, S * 0.6)
    const girth = (s: number) => {
      let f = 0.86 + 0.14 * smooth01(s / 1.2)
      f *= 1 + 0.05 * Math.sin(Math.PI * s / Math.max(S, 0.001))
      if (s > S - tailLen) f *= Math.max(0.03, Math.pow((S - s) / tailLen, 0.85))
      return f
    }

    // Terrain-following centre height (belly rests on the ground)
    for (let r = 0; r < rings; r++) {
      cy.push(this.heightAt(cx[r], cz[r]) + cl[r] + HALF_H * girth(cs[r]) * 0.92)
    }

    // 2. Sweep the cross-section
    const vpr = RADIAL + 1
    const pos = this.pos, nor = this.nor, uv = this.uv, col = this.col
    this.ensureSpikes(Math.ceil(S / SPIKE_EVERY) + 2)
    let spikeCount = 0
    let nextSpike = 0.55   // first spike just behind the head
    for (let r = 0; r < rings; r++) {
      const a = r === 0 ? 0 : r - 1, b = r === rings - 1 ? r : r + 1
      _t.set(cx[b] - cx[a], cy[b] - cy[a], cz[b] - cz[a])
      if (_t.lengthSq() < 1e-10) _t.set(0, 0, -1)
      _t.normalize()
      _side.crossVectors(_t, _Y)
      if (_side.lengthSq() < 1e-8) _side.set(1, 0, 0)
      _side.normalize()
      _up.crossVectors(_side, _t).normalize()

      const s = cs[r]
      const f = girth(s)
      const w = HALF_W * f, h = HALF_H * f
      // Travelling slither wave, fading in behind the head
      const wave = Math.sin(s * 1.9 - time * 5) * SLITHER_AMP * smooth01((s - 0.8) / 1.5)
      const ox = cx[r] + _side.x * wave, oz = cz[r] + _side.z * wave, oy = cy[r]

      // Dorsal spike: sits on the top of the cross-section, curving tailward
      if (s >= nextSpike && s < S - 0.25) {
        nextSpike += SPIKE_EVERY
        const sz = SPIKE_H * f * (0.85 + 0.3 * Math.abs(Math.sin(s * 3.1)))
        _o.set(ox + _up.x * h * 0.9, oy + _up.y * h * 0.9, oz + _up.z * h * 0.9)
        _x.crossVectors(_up, _t)
        _m.makeBasis(_x, _up, _t)
        _q.setFromRotationMatrix(_m)
        _sc.set(sz * 0.9, sz, sz)
        _m.compose(_o, _q, _sc)
        this.spikes.setMatrixAt(spikeCount++, _m)
      }

      // Dorsal saddle / lateral spot rhythm along the body
      const phase = (s / PATTERN_PERIOD) % 1
      const saddle = smooth01((Math.cos(phase * Math.PI * 2) - 0.2) / 0.6)
      const spot   = smooth01((Math.cos((phase + 0.5) * Math.PI * 2) - 0.45) / 0.5)
      const band   = 0.5 + 0.5 * Math.sin(s * 0.9)

      for (let j = 0; j <= RADIAL; j++) {
        const th = (j / RADIAL) * Math.PI * 2
        const cs_ = Math.cos(th), sn = Math.sin(th)
        const lx = w * cs_
        const ly = h * sn * (sn < 0 ? BELLY_FLAT : 1)
        const vi = (r * vpr + j) * 3
        pos[vi]     = ox + _side.x * lx + _up.x * ly
        pos[vi + 1] = oy + _side.y * lx + _up.y * ly
        pos[vi + 2] = oz + _side.z * lx + _up.z * ly
        // Ellipse normal
        const nx = h * cs_, ny = w * sn
        const nl = Math.hypot(nx, ny) || 1
        nor[vi]     = (_side.x * nx + _up.x * ny) / nl
        nor[vi + 1] = (_side.y * nx + _up.y * ny) / nl
        nor[vi + 2] = (_side.z * nx + _up.z * ny) / nl

        const ui = (r * vpr + j) * 2
        uv[ui] = j / RADIAL
        uv[ui + 1] = s * 0.6

        // Colour: base shades → dorsal saddles on top → spots on flanks → pale belly
        _c.copy(this.body[1]).lerp(band > 0.5 ? this.body[2] : this.body[0], Math.abs(band - 0.5) * 0.6)
        const top = smooth01((sn - 0.5) / 0.35)
        _c.lerp(this.spine, top * saddle * 0.85)
        const flank = smooth01((Math.abs(cs_) - 0.72) / 0.22) * (sn > -0.2 ? 1 : 0)
        _c.lerp(this.spine, flank * spot * 0.7)
        // Belly: pale ventral plates with dark grooves between them
        const bellyK = smooth01((-sn - 0.3) / 0.35)
        if (bellyK > 0) {
          const fr = (s / SCUTE_LEN) % 1
          const groove = 1 - smooth01(Math.min(fr, 1 - fr) / 0.12)
          _c.lerp(this.belly, bellyK)
          _c.multiplyScalar(1 - groove * 0.45 * bellyK)
        }
        col[vi] = _c.r; col[vi + 1] = _c.g; col[vi + 2] = _c.b
      }
    }

    this.spikes.count = spikeCount
    this.spikes.instanceMatrix.needsUpdate = true

    const g = this.geometry
    g.attributes.position.needsUpdate = true
    g.attributes.normal.needsUpdate = true
    g.attributes.uv.needsUpdate = true
    g.attributes.color.needsUpdate = true
    g.setDrawRange(0, (rings - 1) * RADIAL * 6)
  }
}
