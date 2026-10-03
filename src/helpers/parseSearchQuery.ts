import { getAlpha2Codes, getNames, registerLocale } from 'i18n-iso-countries'
import english from 'i18n-iso-countries/langs/en.json'

registerLocale(english)

export type SearchQuery = { city: string; countryCode?: string }
export type SearchQueryResult =
  | { ok: true; query: SearchQuery }
  | { ok: false; error: string }

const normalizeSpaces = (value: string) => value.trim().replace(/\s+/gu, ' ')
const countryKey = (value: string) => normalizeSpaces(value).normalize('NFC').toLowerCase()
const countryCodes = new Set(Object.keys(getAlpha2Codes()))
const namesToCodes = new Map<string, Set<string>>()

// Keep duplicate aliases ambiguous rather than silently selecting a country.
for (const [code, names] of Object.entries(getNames('en', { select: 'all' }))) {
  for (const name of names) {
    const key = countryKey(name)
    const codes = namesToCodes.get(key) ?? new Set<string>()
    codes.add(code)
    namesToCodes.set(key, codes)
  }
}

export function parseSearchQuery(input: string): SearchQueryResult {
  const separator = input.indexOf(',')
  const city = normalizeSpaces(separator === -1 ? input : input.slice(0, separator))

  if (!city) return { ok: false, error: 'Enter a city, for example Johor or Johor, MY.' }
  if (separator === -1) return { ok: true, query: { city } }

  const country = normalizeSpaces(input.slice(separator + 1))
  if (!country) {
    return { ok: false, error: 'Enter a country after the comma, or remove the comma to search by city only.' }
  }

  const code = country.toUpperCase()
  if (/^[A-Z]{2}$/u.test(code) && countryCodes.has(code)) {
    return { ok: true, query: { city, countryCode: code } }
  }

  const matches = namesToCodes.get(countryKey(country))
  if (matches && matches.size > 1) {
    return { ok: false, error: `That country name is ambiguous. Use a two-letter code: ${[...matches].join(' or ')}.` }
  }
  const countryCode = matches?.values().next().value
  if (countryCode) return { ok: true, query: { city, countryCode } }

  return {
    ok: false,
    error: 'Enter a recognized English country name or two-letter code, such as Malaysia or MY. Do not include a state.',
  }
}
