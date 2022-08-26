import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { Navbar } from './components/Navbar';
import { FunctionsPage } from './pages/FunctionsPage';
import { SubmissionsPage } from './pages/SubmissionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { getCurrentUser } from './repositories/user';
import { User } from './types';
import { LogoutPage } from './pages/LogoutPage';
import eventBus from './eventBus';
import { PullRequestPage } from './pages/PullRequestPage';
import { StatsPage } from './pages/StatsPage';

import './App.css'
import { CExplorePage } from './pages/CExplorePage';
import { getStatusFromTrello } from './repositories/trello';
import { LatestPage } from './pages/LatestPage';
import { SearchPage } from './pages/SearchPage';

const App: React.FC = () => {

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    const loadCurrentUser = async () => {
        getCurrentUser().then(setCurrentUser, (error) => {
            setErrorMessage('The backend could not be reached.');
            setError(error);
            // Fetch Trello status page
            getStatusFromTrello().then((text) => setErrorMessage(text), () => setErrorMessage('The backend could not be reached.\nInternet could not be reached.\nAre you connected?'));
        });
    };

    useEffect(() => {
        const onUserChanged = () => {
            loadCurrentUser();
        };

        loadCurrentUser()

        // TODO fix: call current instance of onUserChanged
        eventBus.on('user-changed', onUserChanged);
        return () => {
            eventBus.remove('user-changed', onUserChanged);
        };
    }, []);

    if (error != null) {
        return (
            <div className="container col-10 mt-5 alert alert-danger d-flex align-items-center" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-3" viewBox="0 0 16 16" role="img" aria-label="Warning:">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                </svg>
                <div style={{ flex: 1, whiteSpace: 'pre' }}>{errorMessage}
                </div>
                <a className="alert-link" href="/" onClick={() => { window.location.reload() }}>Retry Loading Page</a>
            </div>
        );
    }
    return (

        <Router><div
            className="App" style={{
                display: "flex",
                flexDirection: "column"
            }}>
            <Navbar currentUser={currentUser} />

            <Switch>
                <Route path="/" exact component={FunctionsPage} />
                <Route path="/asm_funcs" component={FunctionsPage} />
                <Route path="/with_code" component={FunctionsPage} />
                <Route path="/without_code" component={FunctionsPage} />
                <Route path="/equivalent" component={FunctionsPage} />
                <Route path="/non_equivalent" component={FunctionsPage} />
                <Route path="/all" component={FunctionsPage} />
                <Route path="/login" component={LoginPage} />
                <Route path="/dashboard" component={DashboardPage} />
                <Route path="/functions/:function/submissions/:submission" component={EditorPage} />
                <Redirect from="/z/:function/:submission" to="/functions/:function/submissions/:submission" />
                <Route path="/custom" component={EditorPage} />
                <Route path="/functions/:function" component={SubmissionsPage} />
                <Route path="/pr" component={PullRequestPage} />
                <Route path="/cexplore" component={CExplorePage} />
                <Route path="/latest" component={LatestPage} />
                <Route path="/stats" component={StatsPage} />
                <Route path="/settings" component={SettingsPage} />
                <Route path="/search" component={SearchPage} />
                <Route path="/logout" component={LogoutPage} />
                <Route component={NotFoundPage} />
            </Switch>
        </div>
        </Router>
    );

}

export default App;