import { useEffect, useState } from "react"
import { Link } from "react-router-dom";
import { get } from "../api";
import { Container } from "../components/Container"
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { API_URL } from "../constants";
import { Func } from "../types"

export const AsmFuncsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [functions, setFunctions] = useState<Func[]>([]);
    const [error, setError] = useState<Error | null>(null);

    const fetchFunctions = async () => {
        setIsLoading(true);
        get(API_URL + 'asm_functions').then(
            async (data) => {
                setIsLoading(false);
                setFunctions(data);
                // Make table sortable
                (window as any).Sortable.init();
            },
            (error) => {
                setIsLoading(false);
                setError(error);
            }
        )
    }

    useEffect(() => {
        fetchFunctions()
    }, []);
    return (<Container centered>
        <ErrorAlert error={error}></ErrorAlert>
        <h1 className="mt-4 mb-2">ASM_FUNC Functions</h1>
        <table className="sortable-theme-slick" data-sortable>
            <thead>
                <tr><th>File</th><th>Function</th><th>Size</th><th>Best Score</th><th data-sortable="false"></th></tr>
            </thead>
            <tbody>
                {isLoading
                    ? <tr><td colSpan={5}><LoadingIndicator /></td></tr>
                    : functions.map((func) => (
                        <tr key={func.id}>
                            <td>{func.file}</td>
                            <td>{func.name}</td>
                            <td>{func.size}</td>
                            <td>{func.best_score}</td>
                            <td>
                                <Link className="btn btn-outline-primary btn-sm" to={"/functions/" + func.id}>
                                    Edit
                                </Link>
                            </td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
    </Container>)
}