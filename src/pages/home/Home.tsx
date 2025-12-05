import React, { useState, useEffect } from "react";
import {
Search,
Clock,
Gavel,
TrendingUp,
ArrowRight,
Play,
Award,
Shield,
} from "lucide-react";

const Home = () => {
const [currentSlide, setCurrentSlide] = useState(0);
const [timeLeft, setTimeLeft] = useState({
hours: 2,
minutes: 45,
seconds: 30,
});

// 슬라이드 자동 전환 (일단 유지)
useEffect(() => {
const timer = setInterval(() => {
setCurrentSlide((prev) => (prev + 1) % 3);
}, 4000);
return () => clearInterval(timer);
}, []);

// 카운트다운 타이머
useEffect(() => {
const timer = setInterval(() => {
setTimeLeft((prev) => {
if (prev.seconds > 0) {
return { ...prev, seconds: prev.seconds - 1 };
} else if (prev.minutes > 0) {
return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
} else if (prev.hours > 0) {
return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
}
return prev;
});
}, 1000);
return () => clearInterval(timer);
}, []);

const featuredItems = [
{
id: 1,
title: "빈티지 롤렉스 서브마리너",
currentBid: "₩2,450,000",
image:
"https://images.unsplash.com/photo-1594576662059-74d0d09c4001?w=400&h=300&fit=crop",
bids: 23,
timeLeft: "2시간 45분",
},
{
id: 2,
title: "조선시대 백자 항아리",
currentBid: "₩850,000",
image:
"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
bids: 15,
timeLeft: "1시간 20분",
},
{
id: 3,
title: "한정판 스니커즈",
currentBid: "₩320,000",
image:
"https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop",
bids: 42,
timeLeft: "45분",
},
];

const categories = [
{ name: "예술품", icon: "🎨", count: "1,234개" },
{ name: "시계", icon: "⌚", count: "567개" },
{ name: "골동품", icon: "🏺", count: "890개" },
{ name: "보석", icon: "💎", count: "456개" },
{ name: "자동차", icon: "🚗", count: "123개" },
{ name: "전자제품", icon: "📱", count: "789개" },
];

return (
<div className="min-h-screen bg-slate-50">

<section className="border-b border-slate-200 bg-slate-50">
<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
<div className="flex flex-col items-center text-center gap-10">

<span className="text-xs tracking-[0.2em] uppercase text-slate-400">
Premium Auction Platform
</span>

        {/* 메인 타이틀 */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            경매의 새로운{" "}
            <span className="text-purple-600">차원</span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 max-w-3xl mx-auto">
            전 세계 희귀한 아이템들을 실시간으로 경매하세요.
            안전하고 투명한 거래로 꿈꿔왔던 아이템을 손에 넣을 수 있는
            프리미엄 경매 플랫폼입니다.
          </p>
        </div>

        {/* 검색바 */}
        <div className="w-full max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="원하는 아이템을 검색해보세요..."
              className="w-full pl-12 pr-28 py-3.5 rounded-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500/60"
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              검색
            </button>
          </div>
        </div>

        {/* 통계 */}
        {/* <div className="w-full max-w-3xl">
          <div className="grid grid-cols-4 border border-slate-200 rounded-2xl bg-white">
            <div className="py-4 px-3 text-center">
              <div className="text-xs text-slate-500 mb-1">활성 사용자</div>
              <div className="text-xl font-semibold text-slate-900">
                50K+
              </div>
            </div>
            <div className="py-4 px-3 text-center border-l border-slate-200">
              <div className="text-xs text-slate-500 mb-1">총 거래액</div>
              <div className="text-xl font-semibold text-slate-900">
                ₩120억
              </div>
            </div>
            <div className="py-4 px-3 text-center border-l border-slate-200">
              <div className="text-xs text-slate-500 mb-1">성공 경매</div>
              <div className="text-xl font-semibold text-slate-900">
                15K+
              </div>
            </div>
            <div className="py-4 px-3 text-center border-l border-slate-200">
              <div className="text-xs text-slate-500 mb-1">만족도</div>
              <div className="text-xl font-semibold text-slate-900">
                99.8%
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  </section>

  {/* 라이브 경매 섹션 */}
  <section className="py-16">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row gap-10 items-start">
        {/* 마감임박 카드 */}
        {/* <div className="w-full md:w-80">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"> */}
            {/* <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-900">
                마감 임박 경매
              </span>
              <span className="text-[11px] text-slate-400">
                실시간 카운트다운
              </span>
            </div> */}
            {/* <div className="flex justify-between">
              <div className="text-center flex-1">
                <div className="text-3xl font-semibold text-red-600">
                  {timeLeft.hours.toString().padStart(2, "0")}
                </div>
                <div className="text-xs text-slate-500 mt-1">시간</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-3xl font-semibold text-red-600">
                  {timeLeft.minutes.toString().padStart(2, "0")}
                </div>
                <div className="text-xs text-slate-500 mt-1">분</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-3xl font-semibold text-red-600">
                  {timeLeft.seconds.toString().padStart(2, "0")}
                </div>
                <div className="text-xs text-slate-500 mt-1">초</div>
              </div>
            </div> */}
            {/* <p className="mt-4 text-xs text-slate-500 leading-relaxed">
              곧 종료되는 경매를 한 눈에 확인하고,
              마지막 순간까지 입찰 기회를 놓치지 마세요.
            </p> */}
          {/* </div> */}
        {/* </div> */}

        {/* 추천 아이템 리스트 */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                지금 진행 중인 핫한 경매
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                놓치면 아쉬운 프리미엄 아이템들
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-slate-900/80 text-white px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {item.timeLeft}
                  </div>
                  <div className="absolute inset-0 bg-black/25 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="text-[11px] text-slate-500 mb-0.5">
                        현재 입찰가
                      </div>
                      <div className="text-lg font-semibold text-emerald-600">
                        {item.currentBid}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 mb-0.5">
                        입찰 수
                      </div>
                      <div className="text-sm font-semibold text-purple-600">
                        {item.bids}개
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 text-sm font-medium">
                    입찰 참여하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* 카테고리 섹션 */}
  <section className="py-16 bg-white border-y border-slate-200">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            인기 카테고리
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            관심 있는 분야의 아이템을 빠르게 찾아보세요.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {categories.map((category, index) => (
          <div
            key={index}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-5 text-center hover:bg-white hover:shadow-sm transition-all duration-150 cursor-pointer"
          >
            <div className="text-3xl mb-2">{category.icon}</div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              {category.name}
            </h3>
            <p className="text-xs text-slate-500">{category.count}</p>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* 특징 섹션 */}
  <section className="py-16 bg-slate-50">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-3">
          AuctionHub이 제공하는 경험
        </h2>
        <p className="text-sm md:text-base text-slate-600">
          안전성과 편의성을 동시에 만족시키는 경매 환경을 제공합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            안전한 거래 구조
          </h3>
          <p className="text-sm text-slate-600">
            에스크로 기반 정산과 철저한 본인 인증으로
            사기 없는 거래 환경을 유지합니다.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            실시간 입찰 경험
          </h3>
          <p className="text-sm text-slate-600">
            초 단위로 반영되는 입찰 정보와 직관적인 UI로
            라이브 경매의 긴장감을 그대로 전달합니다.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4">
            <Award className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            검증된 아이템
          </h3>
          <p className="text-sm text-slate-600">
            전문가 검수와 이력 관리로,
            신뢰할 수 있는 프리미엄 아이템만 선별하여 제공합니다.
          </p>
        </div>
      </div>
    </div>
  </section>

  {/* CTA 섹션 */}
  <section className="py-16 bg-white">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-slate-900 rounded-3xl px-8 py-10 md:px-12 md:py-12 text-center text-white">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">
          지금 바로 AuctionHub와 함께하세요
        </h2>
        <p className="text-sm md:text-base text-slate-200 mb-8">
          몇 번의 클릭만으로 회원가입을 완료하고,
          첫 번째 프리미엄 경매를 시작해보세요.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-3 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100">
            무료 회원가입
            <ArrowRight className="inline-block ml-2 h-4 w-4" />
          </button>
          <button className="px-8 py-3 rounded-full border border-slate-500 text-sm font-semibold text-slate-100 hover:bg-slate-800">
            경매 둘러보기
          </button>
        </div>
      </div>
    </div>
  </section>

  {/* 푸터 */}
  <footer className="bg-slate-900 border-t border-slate-800 py-12 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Gavel className="h-7 w-7 text-purple-300" />
            <span className="text-xl font-semibold text-white">
              AuctionHub
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            프리미엄 아이템을 안전하고 투명하게 거래할 수 있는
            온라인 경매 플랫폼입니다.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 text-sm">
            서비스
          </h3>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li>경매 참여</li>
            <li>판매하기</li>
            <li>감정 서비스</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 text-sm">
            고객지원
          </h3>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li>FAQ</li>
            <li>1:1 문의</li>
            <li>이용약관</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 text-sm">
            연락처
          </h3>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li>📞 1588-1234</li>
            <li>📧 help@auctionhub.kr</li>
            <li>🕒 평일 09:00 - 18:00</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 mt-8 pt-6 text-center text-slate-500 text-xs">
        <p>&copy; 2025 AuctionHub. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div>


);
};

export default Home;