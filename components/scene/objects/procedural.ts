import * as THREE from 'three'

// ── Shared procedural helpers for scene props ────────────────────────
// Everything here is deterministic and cached at module level so every
// instance of a prop shares the same GPU buffers / textures.

// Deterministic pseudo-random — never use Math.random() inside render
export function pr(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 31.3) * 43758.5453
  return x - Math.floor(x)
}

// Cheap 3D value noise built from a position hash (same position → same value,
// so displaced non-indexed geometry stays watertight)
function hash3(x: number, y: number, z: number, seed: number): number {
  const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed * 4.1337) * 43758.5453
  return h - Math.floor(h)
}

function smooth(t: number) { return t * t * (3 - 2 * t) }

export function noise3(x: number, y: number, z: number, seed = 0): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi)
  const l = THREE.MathUtils.lerp
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz, seed)
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  )
}

// Fractal noise in roughly [-1, 1]
export function fbm(x: number, y: number, z: number, seed = 0, octaves = 3): number {
  let sum = 0, amp = 0.5, freq = 1, norm = 0
  for (let o = 0; o < octaves; o++) {
    sum  += (noise3(x * freq, y * freq, z * freq, seed + o * 17) * 2 - 1) * amp
    norm += amp
    amp  *= 0.5
    freq *= 2.03
  }
  return sum / norm
}

const cache = new Map<string, unknown>()
function cached<T>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key) as T
}

// ── Rock / clump geometry ────────────────────────────────────────────
// Noise-displaced icosphere. `flatBottom` squashes everything below y=flatY
// so the rock sits on the ground instead of balancing on a point.
// Vertex colours bake in weathering: darker crevices + optional moss on top.
export function rockGeometry(seed: number, opts: {
  detail?: number; rough?: number; flatY?: number; moss?: boolean
} = {}): THREE.BufferGeometry {
  const { detail = 3, rough = 0.28, flatY = -0.18, moss = true } = opts
  return cached(`rock:${seed}:${detail}:${rough}:${flatY}:${moss}`, () => {
    const g = new THREE.IcosahedronGeometry(0.5, detail)
    const pos = g.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const v = new THREE.Vector3()
    const base = new THREE.Color('#ffffff')
    const crevice = new THREE.Color('#8a8a8a')
    const mossCol = new THREE.Color('#9fc07a')
    const tmp = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const n = v.clone().normalize()
      // Large-scale lumpiness + fine grit
      const big  = fbm(n.x * 1.6, n.y * 1.6, n.z * 1.6, seed, 3)
      const grit = fbm(n.x * 6.0, n.y * 6.0, n.z * 6.0, seed + 99, 2)
      const r = 0.5 * (1 + big * rough + grit * rough * 0.25)
      v.copy(n).multiplyScalar(r)
      // Slightly flattened top + flat base
      if (v.y < flatY) v.y = flatY + (v.y - flatY) * 0.12
      pos.setXYZ(i, v.x, v.y, v.z)

      // Weathering colour: convex = light, concave = crevice
      tmp.copy(base).lerp(crevice, THREE.MathUtils.clamp(-big * 1.8 + 0.25, 0, 1))
      if (moss) {
        const m = THREE.MathUtils.smoothstep(n.y + fbm(n.x * 3, n.y * 3, n.z * 3, seed + 7, 2) * 0.35, 0.55, 0.85)
        tmp.lerp(mossCol, m * 0.85)
      }
      // Darker toward the ground (ambient occlusion)
      tmp.multiplyScalar(THREE.MathUtils.lerp(0.62, 1, THREE.MathUtils.smoothstep(v.y, flatY, 0.2)))
      colors.set([tmp.r, tmp.g, tmp.b], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  })
}

// Soft lumpy blob for foliage clumps (smoother than rocks, AO-darkened underside)
export function foliageGeometry(seed: number): THREE.BufferGeometry {
  return cached(`foliage:${seed}`, () => {
    const g = new THREE.IcosahedronGeometry(0.5, 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize()
      const lump = fbm(v.x * 2.4, v.y * 2.4, v.z * 2.4, seed, 3)
      const leafy = fbm(v.x * 9, v.y * 9, v.z * 9, seed + 31, 2)
      const r = 0.5 * (1 + lump * 0.32 + leafy * 0.08)
      pos.setXYZ(i, v.x * r, v.y * r * 0.9, v.z * r)
      // Sun-kissed top, shaded interior underneath
      const shade = THREE.MathUtils.lerp(0.5, 1.08, THREE.MathUtils.smoothstep(v.y, -0.8, 0.9))
      const k = shade * (1 + leafy * 0.25)
      colors.set([k, k, k * 0.92], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  })
}

// ── Leaf / petal / blade geometry ────────────────────────────────────
// A leaf lying along +Z from the origin, width along X, curling in Y.
//   curl  — how far the tip droops (negative) or lifts (positive)
//   cup   — how much the edges fold up (gives a V-shaped mid-rib)
//   shape — width profile exponent (lower = rounder, higher = pointier)
export function leafGeometry(opts: {
  length?: number; width?: number; curl?: number; cup?: number
  shape?: number; segs?: number; tipWidth?: number
} = {}): THREE.BufferGeometry {
  const { length = 1, width = 0.35, curl = -0.35, cup = 0.12, shape = 0.9, segs = 8, tipWidth = 0 } = opts
  return cached(`leaf:${length}:${width}:${curl}:${cup}:${shape}:${segs}:${tipWidth}`, () => {
    const cols = 3 // left edge, mid-rib, right edge
    const verts: number[] = []
    const uvs: number[] = []
    const colors: number[] = []
    const idx: number[] = []
    for (let j = 0; j <= segs; j++) {
      const t = j / segs
      const w = (Math.pow(Math.sin(Math.PI * Math.min(t * 0.92 + 0.04, 1)), shape) + tipWidth * t) * width * 0.5
      const z = t * length
      const y = curl * t * t * length
      for (let c = 0; c < cols; c++) {
        const s = c - 1 // -1, 0, 1
        verts.push(s * w, y + Math.abs(s) * cup * w * 2, z)
        uvs.push(c / (cols - 1), t)
        // Mid-rib slightly lighter, base darker
        const k = (s === 0 ? 1.12 : 0.92) * THREE.MathUtils.lerp(0.7, 1.05, t)
        colors.push(k, k, k)
      }
    }
    for (let j = 0; j < segs; j++) {
      for (let c = 0; c < cols - 1; c++) {
        const a = j * cols + c, b = a + 1, d = a + cols, e = d + 1
        idx.push(a, d, b, b, d, e)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  })
}

// A single grass blade rising along +Y, bending toward +Z. Base dark, tip light.
export function bladeGeometry(height = 1, width = 0.06, bend = 0.35, segs = 5): THREE.BufferGeometry {
  return cached(`blade:${height}:${width}:${bend}:${segs}`, () => {
    const verts: number[] = []
    const colors: number[] = []
    const idx: number[] = []
    for (let j = 0; j <= segs; j++) {
      const t = j / segs
      const w = width * 0.5 * (1 - t * 0.92)
      const y = t * height
      const z = bend * t * t * height
      verts.push(-w, y, z, w, y, z)
      const k = THREE.MathUtils.lerp(0.45, 1.15, t)
      colors.push(k, k, k * 0.9, k, k, k * 0.9)
    }
    for (let j = 0; j < segs; j++) {
      const a = j * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  })
}

// Tube along a gently bent curve (stems, branches, reeds)
export function stemGeometry(height: number, radius: number, bendX: number, bendZ: number, tubular = 8, radial = 6) {
  return cached(`stem:${height}:${radius}:${bendX}:${bendZ}:${tubular}:${radial}`, () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(bendX * 0.3, height * 0.35, bendZ * 0.3),
      new THREE.Vector3(bendX * 0.75, height * 0.7, bendZ * 0.75),
      new THREE.Vector3(bendX, height, bendZ),
    ])
    const g = new THREE.TubeGeometry(curve, tubular, radius, radial, false)
    // Taper toward the top
    const pos = g.attributes.position as THREE.BufferAttribute
    const p = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i)
      const t = THREE.MathUtils.clamp(p.y / height, 0, 1)
      const c = curve.getPointAt(t)
      const k = THREE.MathUtils.lerp(1, 0.55, t)
      pos.setXYZ(i, c.x + (p.x - c.x) * k, p.y, c.z + (p.z - c.z) * k)
    }
    g.computeVertexNormals()
    return { geometry: g, top: curve.getPointAt(1), curve }
  })
}

// ── Textures ─────────────────────────────────────────────────────────

function canvasTexture(key: string, size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, srgb = true) {
  return cached(`tex:${key}`, () => {
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    draw(ctx, size)
    const t = new THREE.CanvasTexture(c)
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  })
}

// Radial falloff used for contact shadows and glow halos
export function radialTexture(): THREE.CanvasTexture {
  return canvasTexture('radial', 128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    g.addColorStop(0.0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.7)')
    g.addColorStop(0.7, 'rgba(255,255,255,0.22)')
    g.addColorStop(1.0, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
  }, false)
}

// Bark: vertical fissures (greyscale — multiplied with the material colour)
export function barkTexture(): THREE.CanvasTexture {
  const t = canvasTexture('bark', 256, (ctx, s) => {
    ctx.fillStyle = '#b8b8b8'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < 70; i++) {
      const x = pr(i, 1) * s
      const w = 1 + pr(i, 2) * 4
      const shade = Math.floor(60 + pr(i, 3) * 90)
      ctx.strokeStyle = `rgb(${shade},${shade},${shade})`
      ctx.lineWidth = w
      ctx.beginPath()
      ctx.moveTo(x, 0)
      for (let y = 0; y <= s; y += 16) ctx.lineTo(x + Math.sin(y * 0.05 + i) * 4, y)
      ctx.stroke()
    }
    for (let i = 0; i < 400; i++) {
      const v = Math.floor(150 + pr(i, 9) * 105)
      ctx.fillStyle = `rgba(${v},${v},${v},0.35)`
      ctx.fillRect(pr(i, 7) * s, pr(i, 8) * s, 2, 3 + pr(i, 6) * 6)
    }
  })
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2, 2)
  return t
}

// Dragon hide: large overlapping, pointed scales, each with a raised central
// keel, dark gaps between them and a glossy highlight toward the free edge.
// Greyscale — used as colour map (multiplied with the theme colour) and bump.
// Texture V runs head → tail, so the scale tips point toward +V (canvas up),
// and rows nearer the head are drawn last so they overlap the rows behind.
export function dragonScaleTexture(): THREE.CanvasTexture {
  const t = canvasTexture('dragonScales', 512, (ctx, s) => {
    ctx.fillStyle = '#262626'           // deep crevices between scales
    ctx.fillRect(0, 0, s, s)
    const cols = 6, rows = 6
    const cw = s / cols, rh = s / rows
    for (let r = -1; r <= rows + 1; r++) {          // top (tail side) → bottom (head side)
      for (let c = -1; c <= cols; c++) {
        const cx = c * cw + (r % 2 ? cw / 2 : 0) + cw / 2
        const base = r * rh + rh * 1.05              // rounded root of the scale
        const tip  = base - rh * 1.55               // pointed free edge
        const hw   = cw * 0.56
        const shape = new Path2D()
        shape.moveTo(cx, tip)
        shape.bezierCurveTo(cx + hw * 0.55, tip + rh * 0.35, cx + hw, base - rh * 0.55, cx + hw * 0.8, base - rh * 0.12)
        shape.quadraticCurveTo(cx, base + rh * 0.22, cx - hw * 0.8, base - rh * 0.12)
        shape.bezierCurveTo(cx - hw, base - rh * 0.55, cx - hw * 0.55, tip + rh * 0.35, cx, tip)

        // Body of the scale: darker root, brighter toward the tip
        const g = ctx.createLinearGradient(cx, base, cx, tip)
        g.addColorStop(0, '#7a7a7a')
        g.addColorStop(0.55, '#c4c4c4')
        g.addColorStop(1, '#e6e6e6')
        ctx.fillStyle = g
        ctx.fill(shape)

        // Rim shading so each scale reads as a curved plate
        ctx.save()
        ctx.clip(shape)
        const rim = ctx.createRadialGradient(cx, base - rh * 0.5, hw * 0.2, cx, base - rh * 0.45, hw * 1.15)
        rim.addColorStop(0, 'rgba(0,0,0,0)')
        rim.addColorStop(0.75, 'rgba(0,0,0,0.12)')
        rim.addColorStop(1, 'rgba(0,0,0,0.55)')
        ctx.fillStyle = rim
        ctx.fillRect(cx - hw, tip, hw * 2, base - tip + rh * 0.3)

        // Central keel ridge
        const k = ctx.createLinearGradient(cx - hw * 0.18, 0, cx + hw * 0.18, 0)
        k.addColorStop(0, 'rgba(255,255,255,0)')
        k.addColorStop(0.5, 'rgba(255,255,255,0.75)')
        k.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = k
        ctx.beginPath()
        ctx.moveTo(cx, tip + rh * 0.08)
        ctx.lineTo(cx + hw * 0.16, base - rh * 0.35)
        ctx.lineTo(cx, base)
        ctx.lineTo(cx - hw * 0.16, base - rh * 0.35)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        // Thin dark outline
        ctx.strokeStyle = 'rgba(20,20,20,0.85)'
        ctx.lineWidth = 2
        ctx.stroke(shape)
      }
    }
  })
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2, 1.5)
  return t
}

// Curved, tapering horn / spike: rises along +Y and sweeps back toward +Z
export function hornGeometry(length: number, radius: number, curl: number): THREE.BufferGeometry {
  return cached(`horn:${length}:${radius}:${curl}`, () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, length * 0.45, curl * length * 0.12),
      new THREE.Vector3(0, length * 0.78, curl * length * 0.4),
      new THREE.Vector3(0, length * 0.92, curl * length * 0.85),
    ])
    const tubular = 10, radial = 8
    const g = new THREE.TubeGeometry(curve, tubular, radius, radial, false)
    const pos = g.attributes.position as THREE.BufferAttribute
    const p = new THREE.Vector3()
    for (let i = 0; i <= tubular; i++) {
      const t = i / tubular
      const c = curve.getPointAt(t)
      const k = Math.pow(1 - t, 0.9) + 0.02
      for (let j = 0; j <= radial; j++) {
        const vi = i * (radial + 1) + j
        p.fromBufferAttribute(pos, vi)
        pos.setXYZ(vi, c.x + (p.x - c.x) * k, c.y + (p.y - c.y) * k, c.z + (p.z - c.z) * k)
      }
    }
    g.computeVertexNormals()
    return g
  })
}

// Weathered painted steel: paint mottling, rust patches and drip streaks
export function rustTexture(): THREE.CanvasTexture {
  const t = canvasTexture('rust', 512, (ctx, s) => {
    ctx.fillStyle = '#d8d8d8'
    ctx.fillRect(0, 0, s, s)
    // Paint mottling
    for (let i = 0; i < 260; i++) {
      const v = Math.floor(185 + pr(i, 21) * 70)
      ctx.fillStyle = `rgba(${v},${v},${v},0.35)`
      ctx.beginPath()
      ctx.arc(pr(i, 22) * s, pr(i, 23) * s, 4 + pr(i, 24) * 22, 0, Math.PI * 2)
      ctx.fill()
    }
    // Rust patches
    for (let i = 0; i < 38; i++) {
      const x = pr(i, 31) * s, y = pr(i, 32) * s, r = 6 + pr(i, 33) * 26
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, 'rgba(120,58,22,0.95)')
      g.addColorStop(0.6, 'rgba(160,86,40,0.6)')
      g.addColorStop(1, 'rgba(160,86,40,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // Rust drip streaks (texture V runs around the pipe; streaks go "down")
    for (let i = 0; i < 60; i++) {
      const x = pr(i, 41) * s, y = pr(i, 42) * s
      const len = 20 + pr(i, 43) * 90
      const g = ctx.createLinearGradient(x, y, x, y + len)
      g.addColorStop(0, 'rgba(130,64,26,0.55)')
      g.addColorStop(1, 'rgba(130,64,26,0)')
      ctx.fillStyle = g
      ctx.fillRect(x, y, 1.5 + pr(i, 44) * 3, len)
    }
  })
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2, 1)
  return t
}
