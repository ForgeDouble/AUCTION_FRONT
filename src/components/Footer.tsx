import { Gavel } from "lucide-react";

const Footer = () => {
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
                <li>경매 참여</li>
                <li>판매하기</li>
                <li>감정 서비스</li>
              </ul>
            </div>

            <div>
              <h3 className="text-gray-900 font-semibold mb-4 text-sm">
                고객지원
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>FAQ</li>
                <li>1:1 문의</li>
                <li>이용약관</li>
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
