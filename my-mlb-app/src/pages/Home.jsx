import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to MLB Player Search</h1>

      <Link to="/search">
        <button className="home-nav-button">Player Search</button>
      </Link>
    </div>
  );
}

export default Home;