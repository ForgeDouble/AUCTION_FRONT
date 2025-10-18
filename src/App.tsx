import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Navbar from "./components/Navbar";
import AuctionDetail from "./pages/auction_detail/AuctionDetail";
import LoginPage from "./pages/login/LoginPage";
import AuctionListPage from "./pages/auction_list/AuctionListPage";
import { AuthProvider } from "./contexts/AuthProvider";

function App() {
  return (
    <>
      <AuthProvider>
        <Routes>
          <Route element={<Navbar />}>
            <Route path="/" element={<Home />} />
            <Route
              path="/auction_detail/:productId"
              element={<AuctionDetail />}
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auction_list" element={<AuctionListPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </>
  );
}

export default App;
