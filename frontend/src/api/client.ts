
const BASE = 'http://localhost:8000/api'

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


  if (!res.ok) {
    const errorData = await res.json();

    throw { response: { data: errorData } };
  }

  return res.json()
}