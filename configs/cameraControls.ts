// Module-level state shared between the canvas pointer handlers and useFrame.
// Using plain objects instead of React state avoids re-renders in the hot path.

export const freeLook = {
  yaw:   0,   // horizontal offset in radians (+ = left, - = right)
  pitch: 0,   // vertical offset in radians   (+ = up,   - = down)
}

export const drag = {
  active: false,
  lastX: 0,
  lastY: 0,
}

export const SENS_X   = 0.006          // radians per pixel horizontal
export const SENS_Y   = 0.005          // radians per pixel vertical
export const PITCH_MIN = -1.1          // ~-63°  (look down limit)
export const PITCH_MAX =  0.9          // ~+52°  (look up limit)