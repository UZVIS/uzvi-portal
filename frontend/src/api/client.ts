const BASE = '/api'

export async function apiGet(path: string) {
  const res = await fetch(`${BASE}${path}`)
  return res.json()
}

export async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}
