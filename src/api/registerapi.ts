// api/registerapi.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE;

export type ApiResponse<T> = { status_code: number; status_message: string; result: T };

export type RegisterRequest = {
  email: string;
  name: string;
  password: string;
  gender: "M" | "F" | "W";
  birthday: string;
  phone: string;
  address?: string;
  nickname?: string;
};

export async function registerUser(body: RegisterRequest): Promise<void> {
  const fd = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, String(v));
  });

  const res = await fetch(`${API_BASE_URL}/user/register`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Register failed (${res.status})`);
  }
}