import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PlayerSearch from "./pages/PlayerSearch"; // 搜尋球員頁面
import PlayerDetail from "./pages/PlayerDetail"; // 球員詳情頁面

function App() {
  return (
    <Router>
      <Routes>
        {/* 首頁 */}
        <Route path="/" element={<Home />} />
        
        {/* 球員搜尋頁面 */}
        <Route path="/search" element={<PlayerSearch />} />
        
        {/* 球員詳情頁面，動態路由 */}
        <Route path="/player/:id" element={<PlayerDetail />} />
      </Routes>
    </Router>
  );
}

export default App;