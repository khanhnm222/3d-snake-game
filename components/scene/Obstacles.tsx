'use client'
import { ROUND1_OBSTACLES } from '@/store/store'
import Pipeline from './obstacles/Pipeline'
import Slope    from './obstacles/Slope'
import Hill     from './obstacles/Hill'

export default function Obstacles() {
  return (
    <>
      {ROUND1_OBSTACLES.map(ob => {
        switch (ob.type) {
          case 'pipe':  return <Pipeline key={ob.id} ob={ob} />
          case 'slope': return <Slope    key={ob.id} ob={ob} />
          case 'hill':  return <Hill     key={ob.id} ob={ob} />
          default:      return null
        }
      })}
    </>
  )
}
