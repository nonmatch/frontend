import { useState } from "react";
import { Link } from "react-router-dom";
import './TlhBridge.css';

export const TlhBridge: React.FC = () => {

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<Error | null>(null);


    const connect = () => {
        setIsConnected(true);
    };

    if (error) {
        return (
            <li className="nav-item">
                <span className="nav-link">
                    Error
                    <span className="indicator error"></span>
                </span>
            </li>);
    } else if (isConnecting) {
        return (
        <li className="nav-item">
            <span className="nav-link">
                Connecting
                <span className="indicator"></span>
            </span>
        </li>);
    } else if (isConnected) {
        return (
            <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="navbarDropdown" href="/" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Tlh Bridge
                    <span className="indicator success"></span>
                </a>
                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li><Link className="dropdown-item" to="/pr">Fetch Decompilation from Ghidra</Link></li>
                  <li><Link className="dropdown-item" to="/settings">Upload Function to Repo</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/logout">Disconnect</Link></li>
                </ul>
              </li>
        );
    } else {
        return (
            <li className="nav-item">
                <span onClick={connect} className="nav-link">
                    Connect to tlh
                </span>
            </li>
        );
    }
}