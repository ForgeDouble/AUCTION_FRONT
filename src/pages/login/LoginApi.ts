import type { loginDto } from "./LoginDto";

export const fetchLogin = async (loginDto: loginDto): Promise<string> => {
  const response = await fetch(`http://localhost:8080/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginDto),
    credentials: "include", // 필요하면 쿠키 포함
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};
