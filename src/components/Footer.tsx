import { Gavel } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  const openChatListPopup = () => {
    const w = 420;
    const h = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);

    const win = window.open(
      "/chat-list",
      "chat_list_popup",
      "popup=yes,width=" +
        w +
        ",height=" +
        h +
        ",left=" +
        left +
        ",top=" +
        top +
        ",resizable=yes,scrollbars=yes",
    );

    if (!win) {
      navigate("/chat-list");
      return;
    }
    win.focus();
  };
  return (
    <>
      {/* 푸터 */}
      <footer className="bg-gray-50 border-t border-black/20 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Gavel className="h-7 w-7 text-[rgb(118,90,255)]" />
                <span className="text-xl font-semibold text-gray-900">
                  AuctionHub
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                프리미엄 아이템을 안전하고 투명하게 거래할 수 있는 온라인 경매
                플랫폼입니다.
              </p>
            </div>

            <div>
              <h3 className="text-gray-900 font-semibold mb-4 text-sm">
                서비스
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li
                  onClick={() => navigate(`/auction_list`)}
                  className="cursor-pointer hover:text-gray-400"
                >
                  경매 참여
                </li>
                <li
                  onClick={() => navigate(`/sell_product`)}
                  className="cursor-pointer hover:text-gray-400"
                >
                  판매하기
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-gray-900 font-semibold mb-4 text-sm">
                고객지원
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>FAQ</li>
                <li
                  onClick={() => openChatListPopup()}
                  className="cursor-pointer hover:text-gray-400"
                >
                  1:1 문의
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-gray-900 font-semibold mb-4 text-sm">
                연락처
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>📞 1588-1234</li>
                <li>📧 help@auctionhub.kr</li>
                <li>🕒 평일 09:00 - 18:00</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-black/20 mt-8 pt-6 text-center text-gray-500 text-xs">
            <p>&copy; 2025 AuctionHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
