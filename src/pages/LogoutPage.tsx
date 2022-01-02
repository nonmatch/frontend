import { useState } from "react";
import { Container } from "../components/Container";
import eventBus from "../eventBus";
import { resetCurrentUser } from "../repositories/user";

export const LogoutPage: React.FC = () => {
    const [loggedOut, setLoggedOut] = useState(false);

    const logout = () => {
        setLoggedOut(true);
        // TODO actually log out
        resetCurrentUser();
        eventBus.dispatch('user-changed', null);  
    };

    return (
        <Container>
            <h1 className="mt-4">Logout</h1>
            {loggedOut ? 
            <div><p>You are now logged out</p></div>
            :            <div><p>Do you really want to log out?</p>
            <button className="btn btn-danger" onClick={logout}>Logout</button>
            </div>

            }
        </Container>
    );
}