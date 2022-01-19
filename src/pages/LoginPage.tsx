import { Container } from "../components/Container";
import { API_URL, isProd } from "../constants";

export const LoginPage: React.FC = () => {
    const loginWithGitHub = async () => {
        const res = await fetch(API_URL + '/oauth/login');
        const data = await res.json()
        window.location.href = data['redirect'];
    };

    const mockLogin = () => {
        window.location.href = API_URL + '/generate_token?mock=true';
    };

    return (<Container small>
        <h1 className="mt-4">Login</h1>
        <p>To be able to submit Pull Requests using your GitHub account, you need to sign in using that account.<br />It is not possible to request permissions for one repository only, so it will request permissions for all public repositories.<br />
            Even if you do not log in, you can still add your username and email for the git commit when submitting a matching function.
        </p>
        <button className="btn btn-secondary" onClick={loginWithGitHub}>
            <i className="fa fa-github fa-fw"></i>
            <span>Login with GitHub</span>
        </button>

        {
            !isProd && <button className="btn btn-warning ms-4" onClick={mockLogin}>
                Mock Login
            </button>
        }
    </Container>);
}
