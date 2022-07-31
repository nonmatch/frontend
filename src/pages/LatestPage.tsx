import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../api";
import { Container } from "../components/Container";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { API_URL } from "../constants";
import { getFunction } from "../repositories/function";
import { getUser } from "../repositories/user";
import { Submission } from "../types";

interface LatestSubmission extends Submission {
    functionName: string,
    functionSize: number
}

export const LatestPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [submissions, setSubmissions] = useState<LatestSubmission[]>([]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            setIsLoading(true);
            get(API_URL + '/submissions').then(
                async (data) => {
                    // Load all functions
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].owner === null || data[i].owner === 0) {
                            data[i].ownerName = 'anonymous';
                        } else {
                            let user = await getUser(data[i].owner);
                            data[i].ownerName = user.username;
                        }
                        const func = await getFunction(data[i].function);
                        data[i].functionName = func.name;
                        data[i].functionSize = func.size;
                        data[i].time_created = DateTime.fromISO(data[i].time_created).toLocaleString({
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: 'numeric',
                            minute: '2-digit',
                            timeZoneName: 'short'
                        });
                    }
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
        fetchSubmissions()
    }, []);

    return (<Container centered>
        <h1 className="mt-4 mb-2">Latest Submissions</h1>
        <table className="sortable-theme-slick" data-sortable>
            <thead>
                <tr><th>Function</th><th>Size</th><th>Score</th><th>Owner</th><th>Created</th><th data-sortable="false"></th></tr>
            </thead>
            <tbody>
                {
                    isLoading
                        ? <tr><td colSpan={5}><LoadingIndicator /></td></tr>
                        :
                        submissions.map((submission) => (
                            <tr key={submission.id}>
                                <td>{submission.functionName}</td>
                                <td>{submission.functionSize}</td>
                                <td>{submission.score}</td>
                                <td>{submission.ownerName}</td>
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
    </Container>);
}