// ChatTypes.ts
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
}

export interface ChatMessageDto {
  messageId: string;
  roomId: string;
  senderId: string;
  senderNickname: string;
  senderProfileImageUrl?: string;
  content: string;
  createdAt: string;
  mine?: boolean;
}



export interface ChatSendDto {
    roomId: string;
    content: string;
}