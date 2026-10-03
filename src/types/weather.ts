export type Location = {
  city: string
  countryCode: string
  state?: string
  latitude: number
  longitude: number
}

export type Weather = {
  location: Location
  temperature: number
  category: string
  description: string | null
  humidity: number | null
  minimum: number | null
  maximum: number | null
  observedAt: number | null
  utcOffset: number | null
  observation: string | null
  observationDisplay: string | null
  partial: boolean
}
