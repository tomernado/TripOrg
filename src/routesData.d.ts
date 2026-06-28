export interface Poi {
  name: string
  coords: [number, number]
  description: string
}

export interface DayConfig {
  day: number
  title: string
  distance: string
  terrain: string
  safetyTip: string
  routePoints: [number, number][]
  pois: Poi[]
}

export const config: Record<string, DayConfig>
