import { useState } from "react";
import { post, resetToken } from "../api";
import { Container } from "../components/Container";
import { ErrorAlert } from "../components/ErrorAlert";
import { API_URL } from "../constants";
import eventBus from "../eventBus";
import { resetCurrentUser } from "../repositories/user";

export const LogoutPage: React.FC = () => {
    const [loggedOut, setLoggedOut] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const logout = () => {
        post(API_URL + '/oauth/logout', {}).then(
            () => {
                setLoggedOut(true);
                resetToken();
                resetCurrentUser();
                eventBus.dispatch('user-changed', null);
            },
            setError
        );
    };

    return (
        <Container>
            <ErrorAlert error={error}></ErrorAlert>
            <h1 className="mt-4">Logout</h1>
            {loggedOut
                ? <div><p>You are now logged out</p></div>
                : <div><p>Do you really want to log out?</p>
                    <button className="btn btn-danger" onClick={logout}>Logout</button>
                </div>
            }
        </Container>
    );
}