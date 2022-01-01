import { Link } from "react-router-dom";
import { User } from "../types";

interface NavbarProps {
    currentUser: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({currentUser}) => {
        return (
            <nav className="navbar navbar-expand-md navbar-light bg-light">
            <div className="container">
              <a className="navbar-brand" href="#">NONMATCH</a>
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">

                {currentUser != null && 
                <li className="nav-item"><Link to="/dashboard" className="nav-link" >Dashboard</Link></li>}
                <li className="nav-item"><Link to="/functions" className="nav-link">Functions</Link></li>
                {//<li><Link to="/leaderboard">Leaderboard</Link></li>
                }
                
                </ul>

                <ul className="navbar-nav ms-auto">{(currentUser == null)
                ? <li className="nav-item"><Link to="/login" className="btn btn-secondary">
                <i className="fa fa-github fa-fw"></i>
                <span>Login with GitHub</span>
            </Link></li>
                :                  <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  {currentUser.username}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                  <li><a className="dropdown-item" href="#">Settings</a></li>
                  <li><hr className="dropdown-divider"/></li>
                  <li><a className="dropdown-item" href="#">Logout</a></li>
                </ul>
              </li>}
            </ul>
                {/*
                  <li className="nav-item">
                    <a className="nav-link active" aria-current="page" href="#">Home</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#">Link</a>
                  </li>
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                      Dropdown
                    </a>
                    <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                      <li><a className="dropdown-item" href="#">Action</a></li>
                      <li><a className="dropdown-item" href="#">Another action</a></li>
                      <li><hr className="dropdown-divider"/></li>
                      <li><a className="dropdown-item" href="#">Something else here</a></li>
                    </ul>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link disabled" href="#" tabIndex={-1}aria-disabled="true">Disabled</a>
                  </li>
                </ul>
                <form className="d-flex">
                  <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
                  <button className="btn btn-outline-success" type="submit">Search</button>
                </form>*/}
              </div>
            </div>
        {/*
        <nav className="navbar navbar-expand-lg navbar-dark">
            <div className="container-fluid">
            <ul className="navbar-nav">
                {currentUser != null && 
                <li className="nav-item"><Link to="/dashboard">Dashboard</Link></li>}
                <li className="nav-item"><Link to="/functions">Functions</Link></li>
                {//<li><Link to="/leaderboard">Leaderboard</Link></li>
                }
                {(currentUser == null)
                ? <li className="nav-item"><Link to="/login" className="btn btn-secondary">
                <i className="fa fa-github fa-fw"></i>
                <span>Login with GitHub</span>
            </Link></li>
                : <b>{currentUser.username}</b>}
            </ul>
            </div>
        </nav>
                */}
          </nav>
        );
}