export type Turn = { question: string; answer: string };
export type Assessment = {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
};
export type Interview = {
  id: string;
  role: string;
  topics: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  answered: number;
  total: number;
  currentQuestion: string | null;
  turns: Turn[];
  assessment: Assessment | null;
};
export type Health = { status: string; mode: 'real' | 'demo'; model: string };

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the Spring Boot backend. Start it on port 8080.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? `Server error ${response.status}`);
  return data as T;
}

export const api = {
  health: () => request<Health>('/health'),
  create: (role: string, topics: string, numberOfQuestions: number) =>
    request<Interview>('/interviews', 'POST', { role, topics, numberOfQuestions }),
  answer: (id: string, answer: string) =>
    request<Interview>(`/interviews/${id}/answers`, 'POST', { answer }),
  get: (id: string) => request<Interview>(`/interviews/${id}`),
  list: () => request<Interview[]>('/interviews'),
};
