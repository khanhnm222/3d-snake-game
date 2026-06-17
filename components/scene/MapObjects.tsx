'use client'
import { ROUND1_OBJECTS } from '@/store/store'
import Rock      from './objects/Rock'
import Plant     from './objects/Plant'
import Flower    from './objects/Flower'
import Mushroom  from './objects/Mushroom'
import Tree      from './objects/Tree'
import GrassTuft from './objects/GrassTuft'
import Pond      from './objects/Pond'

export default function MapObjects() {
  return (
    <>
      {ROUND1_OBJECTS.map(obj => {
        const pos: [number, number, number] = [obj.position.x, 0, obj.position.z]
        const props = { position: pos, scale: obj.scale, rotation: obj.rotation, variant: obj.variant }
        switch (obj.type) {
          case 'rock':     return <Rock      key={obj.id} {...props} />
          case 'plant':    return <Plant     key={obj.id} {...props} />
          case 'flower':   return <Flower    key={obj.id} {...props} />
          case 'mushroom': return <Mushroom  key={obj.id} {...props} />
          case 'tree':     return <Tree      key={obj.id} {...props} />
          case 'grass':    return <GrassTuft key={obj.id} {...props} />
          case 'pond':     return <Pond      key={obj.id} position={pos} scale={obj.scale} />
          default:         return null
        }
      })}
    </>
  )
}