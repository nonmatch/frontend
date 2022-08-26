import { useEffect, useState } from "react";
import { Container } from "../components/Container";
import eventBus from "../eventBus";
import { getCurrentUser, saveCurrentUser } from "../repositories/user";
import { User } from "../types";
import { useLocalStorage, useTitle } from "../utils";

export const SettingsPage: React.FC = () => {

    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [showTlhBridge, setShowTlhBridge] = useLocalStorage('showTlhBridge', false);
    const [useLocalCExplore, setUseLocalCExplore] = useLocalStorage('useLocalCExplore', false);

    const loadCurrentUser = async () => {
        getCurrentUser().then((user) => {
            setCurrentUser(user);
            if (user) {
                setUsername(user.username);
                setEmail(user.email);
            }
        }, (error) => {
            console.error(error)
        });
    };

    useEffect(() => {
        loadCurrentUser()
    }, []);

    useTitle('NONMATCH Settings');

    const save = async () => {
        const user = currentUser;
        if (!user) {
            return;
        }
        user.username = username;
        user.email = email;
        //    setCurrentUser(user);
        await saveCurrentUser(user);
        // TODO somehow trigger the redraw of the App component?
        // maybe pass the component down here through the route?
        eventBus.dispatch('user-changed', user);
        console.log('DISPATCH');
        // TODO show toast that we saved successfully
    };



    // TODO maybe allow to refetch the avatar from GitHub?
    return (<Container>
        <h1 className="mt-4">Settings</h1>
        <h2 className="mt-3">Git</h2>
        This username and email are used in the git commit if you submit a matching function.
        <div className="mb-3 mt-3">
            <label htmlFor="username">Username</label>
            <input type="username" className="form-control" id="username" placeholder="Enter username"
                value={username}
                onChange={(e) => { setUsername(e.target.value) }}
            />
        </div>
        <div className="mb-3">
            <label htmlFor="email">Email address</label>
            <input type="email" className="form-control" id="email" placeholder="Enter email"
                value={email}
                onChange={(e) => { setEmail(e.target.value) }} />
        </div>
        <button type="submit" className="btn btn-primary" onClick={save}>Save</button>

        <h2 className="mt-4">Configuration</h2>
        <div className="form-check">
            <input type="checkbox" id="showTlhBridge" className="form-check-input" checked={showTlhBridge} onChange={e => {
                setShowTlhBridge(e.target.checked);
                eventBus.dispatch('show-bridge-changed', e.target.checked);
            }} />
            <label className="form-check-label" htmlFor="showTlhBridge">Show tlh Bridge</label>
        </div>
        <div className="form-check">
            <input type="checkbox" id="useLocalCExplore" className="form-check-input" checked={useLocalCExplore} onChange={e => setUseLocalCExplore(e.target.checked)} />
            <label className="form-check-label" htmlFor="useLocalCExplore" title="Use the CExplore instance at http://localhost:10240">Use Local CExplore Instance</label>
        </div>

    </Container>);
}