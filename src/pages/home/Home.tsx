import React, { useState, useEffect } from "react";
import {
  Search,
  Clock,
  Gavel,
  TrendingUp,
  Star,
  ArrowRight,
  Play,
  Users,
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

  // 슬라이드 자동 전환
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              경매의 새로운
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                차원
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              전 세계 희귀한 아이템들을 실시간으로 경매하세요. 안전하고 투명한
              거래로 꿈꿔왔던 아이템을 손에 넣으세요.
            </p>

            {/* 검색바 */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="원하는 아이템을 검색해보세요..."
                  className="w-full pl-12 pr-32 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300">
                  검색
                </button>
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">50K+</div>
                <div className="text-gray-400">활성 사용자</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">₩120억</div>
                <div className="text-gray-400">총 거래액</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">15K+</div>
                <div className="text-gray-400">성공 경매</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">99.8%</div>
                <div className="text-gray-400">만족도</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 라이브 경매 섹션 */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              🔥 지금 진행 중인 핫한 경매
            </h2>
            <p className="text-gray-300 text-lg">
              놓치면 후회할 프리미엄 아이템들
            </p>
          </div>

          {/* 타이머 */}
          <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 backdrop-blur-lg border border-red-500/30 rounded-2xl p-6 mb-12 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              ⏰ 마감임박 경매
            </h3>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-400">
                  {timeLeft.hours.toString().padStart(2, "0")}
                </div>
                <div className="text-gray-400">시간</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-400">
                  {timeLeft.minutes.toString().padStart(2, "0")}
                </div>
                <div className="text-gray-400">분</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-400">
                  {timeLeft.seconds.toString().padStart(2, "0")}
                </div>
                <div className="text-gray-400">초</div>
              </div>
            </div>
          </div>

          {/* 추천 아이템 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {item.timeLeft}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-sm text-gray-400">현재 입찰가</div>
                      <div className="text-2xl font-bold text-green-400">
                        {item.currentBid}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">입찰 수</div>
                      <div className="text-lg font-bold text-purple-400">
                        {item.bids}개
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold">
                    입찰하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 카테고리 섹션 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              인기 카테고리
            </h2>
            <p className="text-gray-300 text-lg">
              다양한 분야의 프리미엄 아이템들을 만나보세요
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center hover:transform hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>
                <h3 className="text-white font-bold mb-2">{category.name}</h3>
                <p className="text-gray-400 text-sm">{category.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              왜 AuctionHub일까요?
            </h2>
            <p className="text-gray-300 text-lg">
              안전하고 혁신적인 경매 플랫폼의 특별함
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                100% 안전 보장
              </h3>
              <p className="text-gray-300">
                블록체인 기술과 에스크로 시스템으로 안전한 거래를 보장합니다
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                실시간 입찰
              </h3>
              <p className="text-gray-300">
                AI 기반 실시간 가격 분석과 스마트 입찰 시스템을 제공합니다
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                전문가 인증
              </h3>
              <p className="text-gray-300">
                모든 아이템은 전문가의 감정을 거쳐 진품만을 보장합니다
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            지금 시작해보세요!
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            특별한 아이템들이 당신을 기다리고 있습니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 font-bold text-lg flex items-center justify-center">
              무료 회원가입
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button className="border-2 border-white/30 text-white px-8 py-4 rounded-2xl hover:bg-white/10 transition-all duration-300 font-bold text-lg">
              경매 둘러보기
            </button>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-black/40 backdrop-blur-lg border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Gavel className="h-8 w-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">
                  AuctionHub
                </span>
              </div>
              <p className="text-gray-400">
                혁신적인 경매 플랫폼으로 안전하고 투명한 거래를 제공합니다.
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">서비스</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    경매 참여
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    판매하기
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    감정 서비스
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">고객지원</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    1:1 문의
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    이용약관
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">연락처</h3>
              <ul className="space-y-2 text-gray-400">
                <li>📞 1588-1234</li>
                <li>📧 help@auctionhub.kr</li>
                <li>🕒 평일 09:00 - 18:00</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AuctionHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
