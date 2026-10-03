import { describe, expect, it } from 'vitest'
import { parseSearchQuery } from './parseSearchQuery'

describe('combined city/country input', () => {
  it.each([
    ['Johor', { city: 'Johor' }],
    ['Johor, Malaysia', { city: 'Johor', countryCode: 'MY' }],
    ['Johor, MY', { city: 'Johor', countryCode: 'MY' }],
    ['  Johor , my  ', { city: 'Johor', countryCode: 'MY' }],
    ['Johor, mALAYsia', { city: 'Johor', countryCode: 'MY' }],
    [' Kuala   Lumpur ', { city: 'Kuala Lumpur' }],
    ['Kuala  Lumpur, Malaysia', { city: 'Kuala Lumpur', countryCode: 'MY' }],
    ['Singapore', { city: 'Singapore' }],
    ['Malaysia', { city: 'Malaysia' }],
    ['新山, MY', { city: '新山', countryCode: 'MY' }],
    ["St. John's, CA", { city: "St. John's", countryCode: 'CA' }],
    ['São Paulo, Brazil', { city: 'São Paulo', countryCode: 'BR' }],
    ['Seoul, Korea, Republic of', { city: 'Seoul', countryCode: 'KR' }],
    ['Palikir, Micronesia, Federated States of', { city: 'Palikir', countryCode: 'FM' }],
    ['London, United   Kingdom', { city: 'London', countryCode: 'GB' }],
    ['London, UK', { city: 'London', countryCode: 'GB' }],
    ['Kinshasa, CD', { city: 'Kinshasa', countryCode: 'CD' }],
  ])('normalizes %s without changing its location meaning', (input, query) => {
    expect(parseSearchQuery(input)).toEqual({ ok: true, query })
  })

  it.each(['', '   ', ', MY', ' ,Malaysia', 'Johor,', 'Johor,  ', 'Johor,,MY',
    'Johor, Atlantis', 'Johor, ZZ', 'Johor, MYS', 'Johor, 458', 'Johor, MY,',
    'Austin, TX, US', 'Johor, __proto__', 'Johor, constructor'])('rejects %j without dropping its suffix', (input) => {
    expect(parseSearchQuery(input)).toEqual({ ok: false, error: expect.any(String) })
  })

  it('requires disambiguation for a shared country alias', () => {
    expect(parseSearchQuery('Kinshasa, Congo')).toEqual({
      ok: false,
      error: 'That country name is ambiguous. Use a two-letter code: CG or CD.',
    })
  })
})
