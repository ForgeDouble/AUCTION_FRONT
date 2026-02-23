// ChatTypes.ts
export type ChatMessageType = "TALK" | "IMAGE" | "FILE";
export interface ChatRoomDto {
  roomId: string;
  title: string;
  lastMessage?: string;
  lastAt?: string;
  unread?: number;
  // peerUserId?: number;
  adminChat?: boolean;
  peerNickname?: string;
  productId?: number;

  inquiry?: boolean;
  userKeywords?: string;

  peerEmail?: string;
  peerProfileImageUrl?: string | null;
}

export interface ChatMessageDto {
  messageId: string;
  roomId: string;
  senderId: string;
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