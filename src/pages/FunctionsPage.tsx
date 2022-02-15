import { useEffect, useState } from "react"
import { Link, RouteComponentProps } from "react-router-dom";
import { get } from "../api";
import { Container } from "../components/Container"
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { API_URL } from "../constants";
import { isFileLocked } from "../repositories/trello";
import { Func } from "../types"
import { makeSortable, showTooltips } from "../utils";

export const FunctionsPage: React.FC<RouteComponentProps> = ({ location }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [functions, setFunctions] = useState<Func[]>([]);
    const [error, setError] = useState<Error | null>(null);

    enum Content {
        NONMATCH,
        ASM_FUNC
    };

    const content = location.pathname === '/asm_funcs' ? Content.ASM_FUNC : Content.NONMATCH;

    useEffect(() => {
        const fetchFunctions = async () => {
            setIsLoading(true);
            const path = content === Content.NONMATCH ? '/functions' : '/asm_functions';
            get(API_URL + path).then(
                async (data) => {
                    setIsLoading(false);

                    for (let i = 0; i < data.length; i++) {
                        data[i].locked = await isFileLocked(data[i].file);
                    }
                    setFunctions(data);
                    // Make table sortable
                    makeSortable();
                    // Show tooltips
                    showTooltips();
                },
                (error) => {
                    setIsLoading(false);
                    setError(error);
                }
            )
        }

        fetchFunctions();
    }, [location.pathname, content, Content.NONMATCH]);
    return (<Container centered>
        <ErrorAlert error={error}></ErrorAlert>
        <h1 className="mt-4 mb-2">{content === Content.NONMATCH ? 'NONMATCH' : 'ASM_FUNC'} Functions</h1>
        <table className="sortable-theme-slick" data-sortable>
            <thead>
                <tr><th>File</th><th>Function</th><th>Size</th><th>Best Score</th><th data-sortable="false"></th></tr>
            </thead>
            <tbody>
                {isLoading
                    ? <tr><td colSpan={5}><LoadingIndicator /></td></tr>
                    : functions.map((func) => (
                        <tr key={func.id}>
                            <td>
                                {func.locked
                                    ?
                                    func.locked.username === 'wip'
                                        ? <span data-bs-toggle="tooltip" data-bs-placement="right" title={'This file is marked as WIP in Trello.'} style={{ cursor: 'text' }}><i className="fa fa-pencil fa-fw"></i>{func.file}</span>
                                        : <span data-bs-toggle="tooltip" data-bs-placement="right" title={func.locked.username + ' is currently working on this file.'} style={{ cursor: 'not-allowed' }}><i className="fa fa-lock fa-lg fa-fw"></i>{func.file}</span>
                                    : func.file
                                }
                            </td>
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
        {
            !isLoading && <div className="mt-3 mb-4 text-secondary">
                Found {functions.length} Functions
            </div>
        }
    </Container>)
}