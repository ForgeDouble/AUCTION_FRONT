export type ChatMessageType = "TALK" | "IMAGE" | "FILE" | "SYSTEM";

export type ChatAvatarItem = {
  nickname?: string;
  email?: string;
  profileImageUrl?: string | null;
};
export interface ChatRoomDto {
  roomId: string;
  title: string;
  lastMessage?: string;
  lastAt?: string;
  unread?: number;

  adminChat?: boolean;
  productId?: number;

  peerNickname?: string;
  peerEmail?: string;
  peerProfileImageUrl?: string | null;

  inquiry?: boolean;
  userKeywords?: string;

  avatarStack?: ChatAvatarItem[];
  avatarMoreCount?: number;
}

export interface ChatMessageDto {
  messageId: string;
  roomId: string;
  senderId: string;
  senderUserId?: number | null;

  senderNickname: string;
  senderProfileImageUrl?: string;

  content: string;
  createdAt: string;
  type: ChatMessageType;

  mine?: boolean;
}

export interface ChatSendDto {
  roomId: string;
  content: string;
}