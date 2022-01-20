import { Link } from "react-router-dom";
import { User } from "../types";
import { useLocalStorage } from "../utils";
import { TlhBridge } from "./TlhBridge";

interface NavbarProps {
  currentUser: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser }) => {
  const [showBridge] = useLocalStorage('showTlhBridge', false);

  return (
    <nav className="navbar navbar-expand-md navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand" to="/">NONMATCH</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-md-0">
            {currentUser != null && <li className="nav-item"><Link to="/dashboard" className="nav-link" >Dashboard</Link></li>}
            <li className="nav-item"><Link to="/" className="nav-link">Functions</Link></li>
            {currentUser != null && currentUser.id === 2 && <li className="nav-item"><Link to="/asm_funcs" className="nav-link">ASM_FUNCs</Link></li>}
            {showBridge && <TlhBridge></TlhBridge>}
          </ul>


          <ul className="navbar-nav ms-auto">
            {(currentUser == null)
              ? <li className="nav-item"><Link to="/login" className="nav-link">Login</Link></li>
              : <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="navbarDropdown" href="/" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  {currentUser.username}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                  <li><Link className="dropdown-item" to="/pr">Create PR</Link></li>
                  {
                    currentUser.id === 2 && <>
                      <li><Link className="dropdown-item" to="/custom">Editor for custom code</Link></li>
                      <li><Link className="dropdown-item" to="/cexplore">Load from CExplore</Link></li>
                    </>
                  }
                  <li><Link className="dropdown-item" to="/settings">Settings</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/logout">Logout</Link></li>
                </ul>
              </li>
            }
          </ul>
        </div>
      </div>
    </nav>
  );
}