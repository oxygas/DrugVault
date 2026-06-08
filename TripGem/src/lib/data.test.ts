import { describe, it, expect } from 'vitest'
import { searchSubstances } from './data'

describe('searchSubstances', () => {
  it('should return substances matching exact name', async () => {
    const results = await searchSubstances('mdma', 5)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name.toLowerCase()).toBe('mdma')
  })

  it('should tolerate common typos', async () => {
    const results = await searchSubstances('ketmin', 5)
    console.log('ketmin results:', results.map(r => r.name))
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name.toLowerCase()).toBe('ketamine')
  })

  it('should find substances by alias', async () => {
    const results = await searchSubstances('molly', 5)
    console.log('molly results:', results.map(r => r.name))
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name.toLowerCase()).toBe('mdma')
  })
})

