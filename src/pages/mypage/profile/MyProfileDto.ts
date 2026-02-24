import type { Gender } from "../MyPageDto";

/** 마이페이지 유저 조회 dto */
export interface UserDto {
  userId: number;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  address: string;
  birthday: string;
  gender: Gender;
  profileImageUrl: string | null;
  warning: number;
  createdAt: string;
}

/** 프로필 입력창 props */
export interface ProfileFieldProps {
  label: string;
  value: string | undefined;
  icon: React.ComponentType<{ className?: string }>;
  isEditable?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  type?: string;
  options?: { value: string; label: string }[];
  isEditing: boolean;
  helperText?: string;
}

/** 메뉴 props */
export interface MenuItemProps {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  colorClass?: string;
}

export type FormState = {
  phone: string;
  address: string;
  nickname: string;
};

export type Errors = Partial<Record<keyof FormState, string>>;
