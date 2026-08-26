/**
 * Small dependency-free fuzzy matcher. Characters must appear in order;
 * scoring rewards consecutive runs, word starts and early matches. Enough
 * for a few hundred polities without shipping a search library.
 */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (q.length === 0) return 0
  let qi = 0
  let score = 0
  let streak = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      streak++
      const wordStart = ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === '-'
      score += 2 + streak * 2 + (wordStart ? 6 : 0) - ti * 0.05
      qi++
    } else {
      streak = 0
    }
  }
  if (qi < q.length) return -1 // not all query chars found
  if (t.startsWith(q)) score += 20
  // Prefer tighter targets: "Ottoman Empire" over "Ottoman & Khedival
  // Egypt" for the query "ottoman".
  score -= t.length * 0.2
  return score
}

export interface SearchDoc {
  id: string
  haystacks: string[]
}

export function search(query: string, docs: SearchDoc[], limit: number): string[] {
  if (!query.trim()) return []
  return docs
    .map((d) => ({
      id: d.id,
      score: Math.max(...d.haystacks.map((h) => fuzzyScore(query, h))),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.id)
}
