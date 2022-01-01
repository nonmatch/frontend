import { useEffect, useState } from "react"
import { Link, RouteComponentProps } from "react-router-dom";
import { get } from "../api";
import { Container } from "../components/Container"
import { API_URL } from "../constants";
import { Func, Submission } from "../types"

interface Params {
    function: string
}

export const FunctionPage: React.FC<RouteComponentProps<Params>>  = ({match}) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    const fetchSubmissions = async() => {
        get(API_URL+'functions/'+match.params.function+'/submissions').then(
            (data) => {

                // TODO only one submission? -> redirect
                setSubmissions(data);
                // Make table sortable
                (window as any).Sortable.init();
            },
            (error) => {
                console.error(error)
            }
        )
    }

    useEffect(() => {
        fetchSubmissions()
    }, []);
    return (<Container centered>
        <h1 style={{paddingTop:"20px"}}>Select Submission for Function [TODO]</h1>
        <table className="sortable-theme-slick" data-sortable>
        <thead>
            <tr><th>Owner</th><th>Score</th><th data-sortable="false"></th></tr>
            </thead>
            <tbody>
        {
            submissions.map((submission) => (
                <tr key={submission.id}><td>{submission.owner}</td><td>{submission.score}</td>
                <td>
                    <Link to={"/functions/"+submission.function+"/submissions/"+submission.id}>
                        Edit
                    </Link>
                </td>
                </tr>
            ))
        }
        </tbody>
        </table>
        <Link to={"/functions/"+match.params.function+"/submissions/0"} className="btn btn-outline-primary" style={{marginTop:"20px"}}>Start with blank slate</Link>
    </Container>)
}