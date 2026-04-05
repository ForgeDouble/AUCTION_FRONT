<img width="1024" height="261" alt="bid-logo" src="https://github.com/user-attachments/assets/13a3b6d7-c5fe-44f3-aad3-eea92a859552" />

<br/>

# AUCTION Frontend

실시간 입찰, 채팅, 신고, 알림, 관리자 모니터링 기능을 제공하는 경매 서비스 프론트엔드입니다.  
React와 Vite 기반으로 구현되었으며, 사용자 화면과 관리자 화면(MOS)을 함께 제공합니다.

<br/>

## 🙋🏻 팀원

| **이명규** | **한동길** |
| :------: | :------: |
| [<img src="https://avatars.githubusercontent.com/leem5514" height="150" width="150"><br/>@leem5514](https://github.com/leem5514) | [<img src="https://avatars.githubusercontent.com/kkameoo" height="150" width="150"><br/>@kkameoo](https://github.com/kkameoo) |

<br/>

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

### Communication
![REST API](https://img.shields.io/badge/REST_API-000000?style=for-the-badge&logo=fastapi&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

### Notification
![Firebase Cloud Messaging](https://img.shields.io/badge/FCM-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

## 🚀 Frontend 실행 방법

### 1. 실행 환경
- Node.js 18 이상
- npm 기준

### 2. 프로젝트 클론
- 프론트엔드 레포지토리를 클론합니다.
- 프로젝트 폴더로 이동합니다.

```bash
git clone [프론트 레포지토리 주소]
cd [프론트 프로젝트 폴더명]
```

### 3. 패키지 설치
프로젝트 루트 경로에서 의존성을 설치합니다.

```bash
npm install
```

### 4. 환경 변수 설정
프로젝트 루트 경로에 .env 파일을 생성한 뒤 아래 값을 설정합니다.

```env
VITE_API_BASE=http://localhost:8080
VITE_ADMIN_USER_ID=ADMIN

VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID
```

### 5. 개발 서버 실행

```bash
npm run dev
```

기본 접속 주소

```text
http://localhost:5173
```

### 6. 빌드

```bash
npm run build
```

빌드 결과물은 dist 폴더에 생성됩니다.

### 7. 실행 시 주의사항
- 백엔드 서버가 먼저 실행되어 있어야 정상적으로 API 요청이 가능합니다.
- 로그인, 회원가입, 상품 조회, 입찰, 채팅, 신고, 알림 기능은 백엔드 API와 연결되어 동작합니다.
- 알림 기능을 사용할 경우 Firebase 설정이 필요합니다.

<br/>

## 🖥️ UI/UX 단위 테스트 결과서

<details>
<summary><b>회원가입 & 로그인</b></summary>

### 회원가입
![회원가입](https://github.com/user-attachments/assets/c14efc9b-5329-4e13-a0dc-35d93e9b93f3)

### 로그인
![로그인](https://github.com/user-attachments/assets/9435d624-ace9-42f2-be4e-78ef5b94e9eb)

</details>

<details>
<summary><b>마이페이지</b></summary>

### 프로필 수정
![프로필수정](https://github.com/user-attachments/assets/6c7b0a3f-9e4f-4709-97c9-b84bfc25947e)

### 내 상점
![내상점](https://github.com/user-attachments/assets/61a3dca4-3a33-4bdd-9ff9-bfc039d9dbdf)

### 입찰 내역
![입찰내역](https://github.com/user-attachments/assets/ebd62128-cd1f-4aee-94c1-b260d663aa21)

### 리뷰 작성 및 조회
![리뷰작성확인](https://github.com/user-attachments/assets/7770f67b-ff90-4a2f-a31c-fb530e57bd4e)

</details>

<details>
<summary><b>상품 & 입찰</b></summary>

### 상품 등록
![상품생성](https://github.com/user-attachments/assets/b8995958-8e1a-4590-8a55-693b133d4f5a)

### 상품 리스트 및 상세
![상품 리스트 상세](https://github.com/user-attachments/assets/dce4062c-b351-4039-83eb-7c8383ca5e5a)

### 상품 필터링
![상품필터링1-1](https://github.com/user-attachments/assets/565be046-0783-4d69-826a-b89a4e4054ed)
![상품필터링1-2](https://github.com/user-attachments/assets/abc1d42e-9105-4241-876a-9795b1453a83)

### 상품 수정
![상품수정](https://github.com/user-attachments/assets/dedcb5af-9b83-4cf5-b963-d44e1f72844e)

### 판매자 프로필
![판매자상점2](https://github.com/user-attachments/assets/d15636fe-83d6-4199-a0f6-1b247803cb8e)

### 입찰 종료
![입찰종료](https://github.com/user-attachments/assets/6d19b3fc-494a-468d-ac05-e3b9c50fb7b6)

</details>

<details>
<summary><b>신고 처리</b></summary>

### 상품 신고
![상품신고](https://github.com/user-attachments/assets/a9c3520d-dcd3-4022-b6dd-9a51027064fa)

### 신고 처리 결과
![상품신고처리](https://github.com/user-attachments/assets/6e43ad89-0dbc-483f-883c-902821709735)

</details>

<details>
<summary><b>알림</b></summary>

### 알림
![알림](https://github.com/user-attachments/assets/2a435349-8a55-4ab9-93cb-f202f288c1e7)

</details>

<details>
<summary><b>리뷰</b></summary>

### 리뷰 작성
![리뷰작성확인](https://github.com/user-attachments/assets/2879a1a0-c504-40c2-bc53-a5a8ee69aff9)

<!-- 리뷰 확인 이미지가 있다면 아래 형식으로 추가 -->
<!-- ![리뷰확인](이미지링크) -->

</details>

<details>
<summary><b>채팅</b></summary>

### 문의 방 생성 및 문의하기
![문의채팅](https://github.com/user-attachments/assets/6e3ace32-18f0-4e9f-8046-6f8436144468)

### 유저 간 채팅
![유저채팅](https://github.com/user-attachments/assets/28d873c2-6143-47c2-99e3-5787c253d559)

### 관리자 채팅방 생성 및 채팅
![관리자채팅](https://github.com/user-attachments/assets/48e6ad72-6177-4d02-a381-926f993b7350)

</details>

<details>
<summary><b>MOS</b></summary>

### 지표 확인
![관리자개요](https://github.com/user-attachments/assets/81904c9f-a8f0-4359-b624-5e97bf44f658)

### 관리자 경매 모니터링
![관리자경매모니터링](https://github.com/user-attachments/assets/c8f4834a-cea3-4e6f-be35-0584282cbaa3)

### 관리자 신고 확인
![관리자신고상세화면2](https://github.com/user-attachments/assets/0da6a29d-11ac-443f-af40-fcc260229990)

### 관리자 인수인계
![관리자인수인계](https://github.com/user-attachments/assets/2a41889f-550f-483f-bb45-d8acb234fb82)

### 관리자 일정관리
![관리자캘린더](https://github.com/user-attachments/assets/51fdb799-88d6-4a17-9a0b-4e1df0bdd2c2)

### 관리자 유저관리
![관리자유저권한관리](https://github.com/user-attachments/assets/23a869c7-f31f-4da6-b3ad-45540e1a6220)

</details>
