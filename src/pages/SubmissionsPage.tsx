import { DateTime } from "luxon";
import { useEffect, useState } from "react"
import { Link, RouteComponentProps } from "react-router-dom";
import { get } from "../api";
import { Container } from "../components/Container"
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { API_URL } from "../constants";
import { getFunction } from "../repositories/function";
import { getUser } from "../repositories/user";
import { Func, Submission } from "../types"
import { useTitle } from "../utils";
interface Params {
    function: string
}

// TODO order submissions by score ascending

export const SubmissionsPage: React.FC<RouteComponentProps<Params>> = ({ match }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [func, setFunc] = useState<Func | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useTitle('Submissions for ' + func?.name);

    useEffect(() => {
        const fetchSubmissions = async () => {
            setIsLoading(true);
            getFunction(parseInt(match.params.function)).then(
                (func) => {
                    setFunc(func)
                },
                (error) => {
                    setIsLoading(false);
                    setError(error);
                    console.error(error)
                });

            get(API_URL + '/functions/' + match.params.function + '/submissions').then(
                async (data) => {
                    // Load all owners
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].owner === null || data[i].owner === 0) {
                            data[i].ownerName = 'anonymous';
                        } else {
                            console.log(data[i].owner);
                            let user = await getUser(data[i].owner);
                            data[i].ownerName = user.username;
                        }
                        data[i].time_created = DateTime.fromISO(data[i].time_created).toLocaleString({
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: 'numeric',
                            minute: '2-digit',
                            timeZoneName: 'short'
                        });
                    }
                    // TODO only one submission? -> redirect
                    setIsLoading(false);
                    setSubmissions(data);
                    // Make table sortable
                    (window as any).Sortable.init();
                },
                (error) => {
                    setIsLoading(false);
                    setError(error);
                    console.error(error);
                }
            )
        }
        fetchSubmissions()
    }, [match.params.function]);
    return (<Container centered>
        <ErrorAlert error={error}></ErrorAlert>
        <h1 className="mt-4 mb-2">Select Submission{
            func ? ' for Function ' + func.name
                : ''
        } </h1>
        <table className="sortable-theme-slick" data-sortable>
            <thead>
                <tr><th>Owner</th><th>Score</th><th>Created</th><th data-sortable="false"></th></tr>
            </thead>
            <tbody>
                {
                    isLoading
                        ? <tr><td colSpan={4}><LoadingIndicator /></td></tr>
                        :
                        submissions.map((submission) => (
                            <tr key={submission.id}>
                                <td>{submission.ownerName}</td>
                                <td>{submission.score}</td>
                                <td>{submission.time_created}</td>{/*Format to users timezone*/}
                                <td>
                                    <Link className="btn btn-outline-primary btn-sm" to={"/functions/" + submission.function + "/submissions/" + submission.id}>
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))
                }
            </tbody>
        </table>
        <Link to={"/functions/" + match.params.function + "/submissions/0"} className="btn btn-outline-primary" style={{ marginTop: "20px" }}>Start with blank slate</Link>
    </Container>)
}