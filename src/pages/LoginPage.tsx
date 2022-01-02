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

/*useEffect(() => {
    loginWithGitHub();
},[]);*/
        return (<Container small>
            <h1 className="mt-4">Login</h1>
            <p>To be able to submit Pull Requests using your GitHub account, you need to sign in using that account.<br />It is not possible to request permissions for one repository only, so it will request permissions for all public repositories.<br />
            Even if you do not log in, you can still add your username and email for the git commit when submitting a matching function.
            </p>
            <button className="btn btn-secondary" onClick={loginWithGitHub}>
                <i className="fa fa-github fa-fw"></i>
                <span>Login with GitHub</span>
            </button>
            {/* 
            <input type="text" placeholder="Username" />
            <input type="password" placeholder="Password" />
            <input type="submit" value="Login" className="success" onClick={onSubmit} />

            <p><Link to="/forgot">Forgot Password</Link></p>
            <p><Link to="/register">Register a new user</Link></p> */}
        </Container>);
}
