import type { ApiResponse } from "../../type/CommonType";

import type {
  BidListDto,
  ProductListDto,
  UserDto,
  UserUpdateDto,
} from "./MyPageDto";

export const fetchLoginUser = async (
  token: string | null,
): Promise<ApiResponse<UserDto>> => {
  const response = await fetch(`http://localhost:8080/user/detail`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sellers: ${response.status}`);
  }

  return response.json();
};

export const fetchProductsByUser = async (
  token: string | null,
  page: number = 0,
  size: number = 10,
): Promise<
  ApiResponse<{
    content: ProductListDto[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
  }>
> => {
  const response = await fetch(
    `http://localhost:8080/product/allByUser?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return response.json();
};

export const fetchBidsByUser = async (
  token: string | null,
  page: number = 0,
  size: number = 10,
): Promise<
  ApiResponse<{
    content: BidListDto[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
  }>
> => {
  const response = await fetch(
    `http://localhost:8080/bid/allByUser?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};

export const fetchProductsByWishlist = async (
  token: string | null,
  page: number = 0,
  size: number = 10,
): Promise<
  ApiResponse<{
    content: ProductListDto[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
  }>
> => {
  const response = await fetch(
    `http://localhost:8080/product/allByWishlist?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return response.json();
};

export const fetchUpdateUser = async (
  token: string | null,
  userUpdateDto: UserUpdateDto,
): Promise<ApiResponse<null>> => {
  const formData = new FormData();

  formData.append("name", userUpdateDto.name);
  formData.append("nickname", userUpdateDto.nickname);
  formData.append("phone", userUpdateDto.phone);
  formData.append("address", userUpdateDto.address);
  formData.append("gender", userUpdateDto.gender);
  formData.append("birthday", userUpdateDto.birthday);

  const response = await fetch(`http://localhost:8080/user/update`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch UserUpdate: ${response.status}`);
  }

  return response.json();
};
