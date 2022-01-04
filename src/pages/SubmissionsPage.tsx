import { useEffect, useState } from "react"
import { Link, RouteComponentProps } from "react-router-dom";
import { get } from "../api";
import { Container } from "../components/Container"
import { LoadingIndicator } from "../components/LoadingIndicator";
import { API_URL } from "../constants";
import { getFunction } from "../repositories/function";
import { getUser } from "../repositories/user";
import { Func, Submission } from "../types"

interface Params {
    function: string
}

// TODO order submissions by score ascending

export const SubmissionsPage: React.FC<RouteComponentProps<Params>> = ({ match }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [func, setFunc] = useState<Func | null>(null)

    const fetchSubmissions = async () => {
        setIsLoading(true);
        getFunction(parseInt(match.params.function)).then(
            (func) => {
                setFunc(func)
            },
            (error) => {
                setIsLoading(false);
                console.error(error)
            }
        )

        get(API_URL + 'functions/' + match.params.function + '/submissions').then(
            async (data) => {
                // Load all owners
                for (let i = 0; i < data.length; i++) {

                    let user = await getUser(data[i].owner);
                    data[i].ownerName = user.username;
                }
                // TODO only one submission? -> redirect
                setIsLoading(false);
                setSubmissions(data);
                // Make table sortable
                (window as any).Sortable.init();
            },
            (error) => {
                setIsLoading(false);
                console.error(error)
            }
        )
    }

    useEffect(() => {
        fetchSubmissions()
    }, []);
    return (<Container centered>
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