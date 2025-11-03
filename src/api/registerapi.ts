export type ApiResponse<T> = { status_code: number; status_message: string; result: T };

export type RegisterRequest = {
  email: string;
  name: string;
  password: string;
  gender: "M" | "F" | "W";
  birthday: string; // yyyy.MM.dd
  phone: string;    // 010-1234-5678
  address?: string;
  nickname?: string;
};

export async function registerUser(body: RegisterRequest): Promise<void> {
  const fd = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, String(v));
  });

  const res = await fetch(`http://localhost:8080/user/register`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Register failed (${res.status})`);
  }
}