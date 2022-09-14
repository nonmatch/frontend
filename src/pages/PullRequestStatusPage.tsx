import { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { io } from 'socket.io-client';
import { get } from '../api';
import { Container } from '../components/Container';
import { ErrorAlert } from '../components/ErrorAlert';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { API_URL } from '../constants';
import { Pr } from '../types';
import { showTooltips } from '../utils';

import './PullRequestStatusPage.css'

interface Params {
    id: string
}

export const PullRequestStatusPage: React.FC<RouteComponentProps<Params>> = ({ match }) => {

    interface StatusSubmission {
        id: number,
        name: string,
        edited: boolean,
        formatted: boolean,
        commited: boolean
    }

    interface Status {
        pr: number,
        message: string,
        progress: number,
        submissions: StatusSubmission[]
    }

    const prId = parseInt(match.params.id);


    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [url, setUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<Status | null>(null);
    const [pr, setPr] = useState<Pr | null>(null);

    useEffect(() => {
        const fetchPr = async () => {
            setIsLoading(true);
            get(API_URL + '/pr/' + prId).then(
                (data) => {
                    setIsLoading(false);
                    setPr(data);
                },
                (error) => {
                    setIsLoading(false);
                    setError(error);
                }
            )
        };


        // Connect to websocket to get status.
        const connect = () => {
            const socket = io(API_URL);
            socket.on('disconnect', function () {
                console.log('disconnected');
            });
            socket.on('connect_error', function () {
                console.log('connection failed');
            });
            socket.on('connect', () => {
                console.log('connect');
            });
            socket.on('status', (data) => {
                if (data.pr === prId) {
                    setStatus(data);
                    showTooltips();
                }
            });
            socket.on('finish', (data) => {
                if (data.pr === prId) {
                    setUrl(data.url);
                }
            });
            socket.on('error', (data) => {
                if (data.pr === prId) {
                    setError(Error(data.message));
                }
            });
            socket.emit('test', 'test');
        };

        fetchPr();
        connect();
    }, [prId]);


    const getProgressBarClasses = () => {
        if (error !== null) {
            return 'progress-bar progress-bar-striped bg-danger';
        } else if (status === null) {
            return 'progress-bar progress-bar-striped progress-bar-animated bg-secondary';
        } else {
            if (status.progress === 0) {
                return 'progress-bar progress-bar-striped progress-bar-animated bg-secondary';
            } else if (status.progress === 1) {
                return 'progress-bar progress-bar-striped bg-success';
            } else {
                return 'progress-bar progress-bar-striped progress-bar-animated';
            }
        }
    };


    return (
        <Container>
            <h1 className="mt-4">{"Pull Request Status"}</h1>
            <ErrorAlert error={error}></ErrorAlert>
            {
                isLoading ? <LoadingIndicator></LoadingIndicator>
                    : <>
                        {pr != null &&
                        <>
                        <h3>{pr.title}</h3>
                        {pr.error && <p>This Pull Request could not be created due to an error.</p>}
                        <ErrorAlert error={pr.error ? Error(pr.error) : null}></ErrorAlert>
                        {pr.is_submitted && <><p>This Pull Request was successfully created.</p><a href={pr.url} className="btn btn-success" target="_blank" rel="noopener noreferrer">View Pull Request</a></>}
                        {status === null && error === null && !pr.is_submitted && !pr.is_error && <p>Waiting for background task to be started...</p>}
                        {status !== null && <p>{status.message}</p> }
                        {(status !== null || (pr !== null && pr.is_submitted === false && pr.is_error === false)) &&<div className="progress">
                            <div className={getProgressBarClasses()} role="progressbar" style={{ width: (status !== null ? status.progress : 0.1) * 100 + '%' }}></div>
                        </div>
                        }
                        </>
                        }

                        {status != null &&
                            <div>
                                <table className="status-table">
                                    <thead>
                                        <tr>
                                            <th>Function</th>
                                            <th><span data-bs-toggle="tooltip" data-bs-placement="right" title="Edit the code to include this submission."><i className="fa fa-pencil"></i></span></th>
                                            <th><span data-bs-toggle="tooltip" data-bs-placement="right" title="Format the code."><i className="fa fa-align-left"></i></span></th>
                                            <th><span data-bs-toggle="tooltip" data-bs-placement="right" title="Create the commit."><i className="fa fa-code-fork"></i></span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            status.submissions.map(submission => (
                                                <tr key={submission.id}>
                                                    <td>
                                                        {submission.name}
                                                    </td>
                                                    <td>
                                                        {submission.edited ? <i className="fa fa-check text-success"></i> : <i className="fa fa-hourglass text-secondary"></i>}
                                                    </td>
                                                    <td>
                                                        {submission.formatted ? <i className="fa fa-check text-success"></i> : <i className="fa fa-hourglass text-secondary"></i>}
                                                    </td>
                                                    <td>
                                                        {submission.commited ? <i className="fa fa-check text-success"></i> : <i className="fa fa-hourglass text-secondary"></i>}
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                                {url && <a href={url} className="btn btn-success mt-4" target="_blank" rel="noopener noreferrer">View Pull Request</a>}
                            </div>}
                    </>
            }
        </Container>
    );
};
