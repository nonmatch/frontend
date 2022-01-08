import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../api";
import { Container } from "../components/Container";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { API_URL } from "../constants";
import { getFunction } from "../repositories/function";
import { Submission } from "../types";

interface DashboardSubmission extends Submission {
    functionName: string,
    functionSize: number
}

export const DashboardPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [submissions, setSubmissions] = useState<DashboardSubmission[]>([]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            setIsLoading(true);
            get(API_URL + 'user/functions').then(
                async (data) => {
                    // Load all functions
                    for (let i = 0; i < data.length; i++) {
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
        <h1 className="mt-4 mb-2">Dashboard</h1>
        <p>Your latest tries at matching functions</p>
        <table className="sortable-theme-slick" data-sortable>
            <thead>
                <tr><th>Function</th><th>Size</th><th>Score</th><th>Created</th><th data-sortable="false"></th></tr>
            </thead>
            <tbody>
                {
                    isLoading
                        ? <tr><td colSpan={4}><LoadingIndicator /></td></tr>
                        :
                        submissions.map((submission) => (
                            <tr key={submission.id}>
                                <td>{submission.functionName}</td>
                                <td>{submission.functionSize}</td>
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
    </Container>);
}