// // src/pages/chat/ChatListPopup.tsx
// import React, { useEffect } from "react";
// import { useChat } from "@/contexts/ChatProvider";
// import ChatRoomList from "@/components/ChatRoomList";

// const ChatListPopup: React.FC = () => {
//   const { rooms, unread, refreshRooms, openAdminAndSelect } = useChat();

//   useEffect(() => {
//     refreshRooms();
//   }, []);

//   const openRoom = async (roomId: string) => {
//     // 이 팝업을 채팅화면으로 전환
//     window.location.href = `/chat?roomId=${encodeURIComponent(roomId)}`;
//   };

//   const createAdminRoom = async () => {
//     await openAdminAndSelect();
//     // 최신 상태로 채팅 페이지로 전환
//     const latest = rooms[0]?.roomId;
//     const target = latest ?? "";
//     window.location.href = `/chat?roomId=${encodeURIComponent(target)}`;
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-white">
//       <div className="flex items-center justify-between p-4 border-b border-white/10">
//         <h1 className="font-bold">내 채팅방</h1>
//         <button
//           onClick={createAdminRoom}
//           title="관리자에게 문의하기"
//           className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-xl"
//         >
//           +
//         </button>
//       </div>

//       <div className="p-2">
//         <ChatRoomList
//           rooms={rooms}
//           activeRoomId={undefined}
//           unread={unread}
//           onSelect={openRoom}
//         />
//       </div>
//     </div>
//   );
// };

// export default ChatListPopup;
