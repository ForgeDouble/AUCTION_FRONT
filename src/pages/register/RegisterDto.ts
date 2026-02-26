export type Gender = "M" | "F";

export type FormState = {
  email: string;
  name: string;
  password: string;
  passwordConfirm: string;
  gender: Gender;
  birthdayInput: string;
  phone: string;
  address: string;
  nickname: string;
  agree: boolean;
};

export type Errors = Partial<Record<keyof FormState, string>>;

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
