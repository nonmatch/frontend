import { DateTime } from "luxon";
import { useEffect, useState } from "react"
import { Link, RouteComponentProps, useHistory } from "react-router-dom";
import { get, post, sendDelete } from "../api";
import { Container } from "../components/Container"
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { Column, TableHead } from "../components/TableHead";
import { API_URL } from "../constants";
import { getFunction } from "../repositories/function";
import { getCurrentUser, getUser } from "../repositories/user";
import { Func, FunctionComment, Submission } from "../types"
import { showTooltips, useTitle } from "../utils";
import { useSortableTable } from "../utils/sortableTable";
import Markdown from "react-markdown";

import './SubmissionsPage.css'

interface Params {
    function: string
}

// TODO order submissions by score ascending

export const SubmissionsPage: React.FC<RouteComponentProps<Params>> = ({ match }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [func, setFunc] = useState<Func | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [comments, setComments] = useState<FunctionComment[]>([]);
    const [ownComment, setOwnComment] = useState<FunctionComment | null>(null);
    const [commentText, setCommentText] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const history = useHistory();

    useTitle('Submissions for ' + func?.name);

    useEffect(() => {
        const fetchSubmissions = async () => {
            setIsLoading(true);
            const currentUser = await getCurrentUser();
            setIsLoggedIn(currentUser != null)

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

                    setSubmissions(data);

                    get(API_URL + '/functions/' + match.params.function + '/comments').then(
                        async (data) => {
                            // Load all users
                            for (let i = 0; i < data.length; i++) {
                                if (data[i].user === null || data[i].user === 0) {
                                    data[i].userName = 'anonymous';
                                } else {
                                    if (data[i].user === currentUser?.id) {
                                        setOwnComment(data[i]);
                                        setCommentText(data[i].text);
                                    }

                                    let user = await getUser(data[i].user);
                                    data[i].userName = user.username;
                                }
                            }
                            setComments(data);

                            setIsLoading(false);
                            // Show tooltips
                            showTooltips();
                        }
                    )
                },
                (error) => {
                    setIsLoading(false);
                    setError(error);
                    console.error(error);
                }
            )
        }
        fetchSubmissions();
    }, [match.params.function]);

    const createComment = () => {
        setIsLoading(true);
        setError(null);
        post(API_URL + '/functions/' + match.params.function + '/comments', {
            text: commentText
        }).then(
            (data) => {
                history.go(0);
            },
            (error) => {
                setIsLoading(false);
                console.error(error)
                setError(error);
            }
        )
    };

    const deleteComment = () => {
        if (ownComment) {
            if (window.confirm('Do you really want to delete this comment?')) {
                sendDelete(API_URL + '/comments/' + ownComment.id, {}).then(
                    () => {
history.go(0);
                    },
                    (error) => {
                        console.error(error)
                        setError(error);
                    }
                );
            }
        }
    };

    const columns: Column[] = [
        { label: 'Owner', accessor: 'ownerName', sortable: true },
        { label: 'Score', accessor: 'score', sortable: true },
        { label: 'Fakeness Score', accessor: 'fakeness_score', sortable: true },
        { label: 'Created', accessor: 'time_created', sortable: true },
        { label: '', accessor: '', sortable: false }
    ];

    const [tableData, handleSorting] = useSortableTable(submissions);

    return (<Container centered>
        <ErrorAlert error={error}></ErrorAlert>
        <h1 className="mt-4 mb-2">Select Submission{
            func ? ' for Function ' + func.name
                : ''
        } </h1>

        <div>
            {
                !isLoading && comments.map((comment, id) => (
                    <div key={id}>
                        <b className="commentAuthor">{comment.userName}</b> <Markdown className="comment" allowedElements={['p', 'a', 'strong', 'em', 'code']}>{comment.text}</Markdown>
                    </div>
                ))
            }

            <table className="sortable">
                <TableHead columns={columns} handleSorting={handleSorting}></TableHead>
                <tbody>
                    {
                        isLoading
                            ? <tr><td colSpan={4}><LoadingIndicator /></td></tr>
                            :
                            tableData().map((submission: Submission) => (
                                <tr key={submission.id}>
                                    <td>{submission.ownerName}</td>
                                    <td>{submission.score} {
                                        submission.score === 0
                                            ? <span data-bs-toggle="tooltip" data-bs-placement="right" title={'This submission generates matching asm code.'}><span className="badge rounded-pill bg-success ms-1">matching</span></span>
                                            : submission.is_equivalent && <span data-bs-toggle="tooltip" data-bs-placement="right" title={'This submission is marked as functionally equivalent. This code should behave the same way as the original asm code.'}><span className="badge rounded-pill bg-primary ms-1">equivalent</span></span>
                                    }</td>
                                    <td>{submission.fakeness_score}</td>
                                    <td>{submission.time_created}</td>
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
        </div>
        <Link to={"/functions/" + match.params.function + "/submissions/0"} className="btn btn-outline-primary" style={{ marginTop: "20px" }}>Start with Blank Slate</Link>

        {
            isLoggedIn &&
            <div>
                <h3 className="mt-4">Comment</h3>
                <textarea placeholder="Comment" className="form-control"
                    rows={4}
                    cols={40}
                    style={{ width: 'auto' }}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)} />
                {
                    ownComment !== null
                        ? <div>
                            <button className="btn btn-primary mt-2 mb-4 mx-2" onClick={createComment}>Update Comment</button>
                            <button className="btn btn-danger mt-2 mb-4 mx-2" onClick={deleteComment}>Delete Comment</button>
                        </div>
                        : <button className="btn btn-primary mt-2 mb-4" onClick={createComment}>Add Comment</button>
                }

            </div>
        }

    </Container>)
}