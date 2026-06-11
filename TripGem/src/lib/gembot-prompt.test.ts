import { describe, it, expect } from 'vitest'
import { isGreeting, enrichQueryWithSubstanceData, buildSystemPrompt, estimateMaxTokens } from './gembot-prompt'

describe('isGreeting', () => {
  it('should return true for "hello"', () => {
    expect(isGreeting('hello')).toBe(true)
  })

  it('should return true for "hi"', () => {
    expect(isGreeting('hi')).toBe(true)
  })

  it('should return true for "hey there!"', () => {
    expect(isGreeting('hey there!')).toBe(true)
  })

  it('should return true for "good morning"', () => {
    expect(isGreeting('good morning')).toBe(true)
  })

  it('should return false for "what is lsd"', () => {
    expect(isGreeting('what is lsd')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isGreeting('')).toBe(false)
  })

  it('should handle leading/trailing whitespace', () => {
    expect(isGreeting('  hello  ')).toBe(true)
  })
})

describe('buildSystemPrompt', () => {
  it('should return a non-empty string containing GemBot', () => {
    const prompt = buildSystemPrompt()
    expect(prompt.length).toBeGreaterThan(0)
    expect(prompt).toContain('GemBot')
    expect(prompt).toContain('Harm:')
  })
})

describe('enrichQueryWithSubstanceData', () => {
  it('should return contextFound:false for greetings', async () => {
    const result = await enrichQueryWithSubstanceData('hello')
    expect(result.contextFound).toBe(false)
    expect(result.contextBlock).toBe('')
  })

  it('should return contextFound:false for short queries', async () => {
    const result = await enrichQueryWithSubstanceData('a')
    expect(result.contextFound).toBe(false)
    expect(result.contextBlock).toBe('')
  })

  it('should find context for a known substance (mdma)', async () => {
    const result = await enrichQueryWithSubstanceData('mdma')
    expect(result.contextFound).toBe(true)
    expect(result.contextBlock).toContain('MDMA')
    expect(result.contextBlock).toContain('Harm:')
  })

  it('should find context for a known substance (lsd)', async () => {
    const result = await enrichQueryWithSubstanceData('lsd')
    expect(result.contextFound).toBe(true)
    expect(result.contextBlock).toContain('LSD')
  })

  it('should return contextFound:false for gibberish', async () => {
    const result = await enrichQueryWithSubstanceData('asdfghjkl')
    expect(result.contextFound).toBe(false)
    expect(result.contextBlock).toBe('')
  })

  it('should build combo context for "mdma and cannabis"', async () => {
    const result = await enrichQueryWithSubstanceData('mdma and cannabis')
    expect(result.contextFound).toBe(true)
    expect(result.contextBlock).toContain('Context:')
    expect(result.contextBlock).toContain('MDMA')
    expect(result.contextBlock).toContain('Cannabis')
  })

  it('should build combo context with "+" separator', async () => {
    const result = await enrichQueryWithSubstanceData('lsd + mdma')
    expect(result.contextFound).toBe(true)
    expect(result.contextBlock).toContain('LSD')
    expect(result.contextBlock).toContain('MDMA')
  })

  it('should build combo context with "with" separator', async () => {
    const result = await enrichQueryWithSubstanceData('lsd with mdma')
    expect(result.contextFound).toBe(true)
    expect(result.contextBlock).toContain('LSD')
    expect(result.contextBlock).toContain('MDMA')
  })

  it('should handle single-pattern query "what is lsd"', async () => {
    const result = await enrichQueryWithSubstanceData('what is lsd')
    expect(result.contextFound).toBe(true)
    expect(result.contextBlock).toContain('LSD')
  })

  it('should handle comparison query returning multiple substances', async () => {
    const result = await enrichQueryWithSubstanceData('compare lsd and mdma')
    expect(result.contextFound).toBe(true)
    expect(result.contextBlock).toContain('LSD')
    expect(result.contextBlock).toContain('MDMA')
  })
})

describe('estimateMaxTokens', () => {
  it('should return 150 for greetings', () => {
    const result = estimateMaxTokens('hello', { contextBlock: '', contextFound: false, substanceCount: 0, hasRichData: false })
    expect(result).toBe(150)
  })

  it('should return low tokens for short general queries', () => {
    const result = estimateMaxTokens('what is lsd', { contextBlock: '', contextFound: false, substanceCount: 0, hasRichData: false })
    expect(result).toBe(400)
  })

  it('should return higher tokens for complex general queries', () => {
    const result = estimateMaxTokens('what is the difference between mdma and lsd', { contextBlock: '', contextFound: false, substanceCount: 0, hasRichData: false })
    expect(result).toBe(600)
  })

  it('should return high tokens for single substance with context', () => {
    const result = estimateMaxTokens('tell me about lsd', { contextBlock: 'Context: LSD...', contextFound: true, substanceCount: 1, hasRichData: false })
    expect(result).toBe(1500)
  })

  it('should return even higher tokens when rich data is available', () => {
    const result = estimateMaxTokens('tell me about lsd', { contextBlock: 'Context: LSD...', contextFound: true, substanceCount: 1, hasRichData: true })
    expect(result).toBe(2000)
  })

  it('should return 2000 for combo queries with 2 substances', () => {
    const result = estimateMaxTokens('mdma and cannabis combo', { contextBlock: 'Context: MDMA... Cannabis...', contextFound: true, substanceCount: 2, hasRichData: false })
    expect(result).toBe(2400)
  })

  it('should return 2800 for 3 substance queries', () => {
    const result = estimateMaxTokens('compare lsd mdma cannabis', { contextBlock: 'Context: LSD... MDMA... Cannabis...', contextFound: true, substanceCount: 3, hasRichData: false })
    expect(result).toBe(3200)
  })

  it('should cap at 5000 tokens', () => {
    const result = estimateMaxTokens('compare all the stimulants and depressants and everything', { contextBlock: 'Context: ...', contextFound: true, substanceCount: 10, hasRichData: true })
    expect(result).toBeLessThanOrEqual(5000)
  })

  it('should add bonus for complex query words', () => {
    const simple = estimateMaxTokens('tell me about lsd', { contextBlock: '...', contextFound: true, substanceCount: 1, hasRichData: false })
    const complex = estimateMaxTokens('how to use lsd safely', { contextBlock: '...', contextFound: true, substanceCount: 1, hasRichData: false })
    expect(complex).toBeGreaterThan(simple)
  })
})
