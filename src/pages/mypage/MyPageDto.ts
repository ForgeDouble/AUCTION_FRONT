export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
}

export interface UserDto {
  userId: number;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  address: string;
  birthday: string;
  gender: string;
  profileImageUrl: string | null;
  warning: number;
  createdAt: string;
}
