import { useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import { Container } from "../components/Container";
import { API_URL } from "../constants";

export const LoginPage: React.FC = () => {
    const history = useHistory();
    const onSubmit = () => {
        history.replace('/dashboard')
    };


const loginWithGitHub = async () => {
    const res = await fetch(API_URL+'oauth/login');
    const data = await res.json()
    window.location.href = data['redirect'];
};

useEffect(() => {
    loginWithGitHub();
},[]);
        return (<Container small centered>
            <input type="submit" value="Login with GitHub" onClick={loginWithGitHub} />
            {/* 
            <input type="text" placeholder="Username" />
            <input type="password" placeholder="Password" />
            <input type="submit" value="Login" className="success" onClick={onSubmit} />

            <p><Link to="/forgot">Forgot Password</Link></p>
            <p><Link to="/register">Register a new user</Link></p> */}
        </Container>);
}
