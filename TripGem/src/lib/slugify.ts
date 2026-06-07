export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const STOP_WORDS = new Set([
  'the','a','an','is','it','in','on','at','to','for','of','by',
  'and','or','but','not','so','if','as','be','do','does','did',
  'are','was','were','been','being','have','has','had',
  'what','how','why','when','where','who','which',
  'this','that','these','those','its','their','your','our',
  'about','with','without','from','into','through','after','before',
  'all','each','every','some','any','no','none',
  'can','will','would','could','should','may','might',
  'very','just','than','then','also','well','here','there',
  'up','down','out','off','over','under','again','further',
  'once','only','own','same','too','more','most','much','many',
])
