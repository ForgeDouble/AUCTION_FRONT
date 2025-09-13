import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Navbar from "./components/Navbar";
import AuctionDetail from "./pages/auction_detail/AuctionDetail";

function App() {
  return (
    <>
      <Routes>
        <Route element={<Navbar />}>
          <Route path="/" element={<Home />} />
          <Route path="/auction_detail" element={<AuctionDetail />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
