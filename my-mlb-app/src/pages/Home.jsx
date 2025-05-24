import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to MLB Player Search</h1>

      <div className="home-buttons" style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/search">
          <button className="home-nav-button">Search</button>
        </Link>

        <Link to="/leaderboard">
          <button className="home-nav-button">Leaderboard</button>
        </Link>

        <Link to="/MatchUp">
          <button className="home-nav-button">Match Up</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;