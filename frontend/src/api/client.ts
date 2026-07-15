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


export async function apiPut(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
  });

  return res.json();
}