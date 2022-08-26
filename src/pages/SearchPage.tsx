import { useState } from "react";
import { Link } from "react-router-dom";
import { post } from "../api";
import { Container } from "../components/Container";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { Column, TableHead } from "../components/TableHead";
import { API_URL, DECOMP_ME_FRONTEND } from "../constants";
import { Func } from "../types";
import { useSortableTable } from "../utils/sortableTable";

export const SearchPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [name, setName] = useState<string>('');
    const [functions, setFunctions] = useState<Func[]>([]);

    const search = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        if (name.length < 5) {
            setError(new Error('Search string needs to be five characters long.'));
            return;
        }
        post(API_URL + '/search', {'name': name}).then((data) => {
            setIsLoading(false);
            setFunctions(data);
        }, setError);
    };

    const columns: Column[] = [
        { label: 'File', accessor: 'file', sortable: true },
        { label: 'Function', accessor: 'name', sortable: true },
        { label: 'Size', accessor: 'size', sortable: true },
        { label: 'Best Score', accessor: 'best_score', sortable: true },
        { label: 'NONMATCH', accessor: 'is_asm_func', sortable: true },
        { label: 'Equivalent', accessor: 'has_equivalent_try', sortable: true },
        { label: '', accessor: '', sortable: false }
    ];

    const [tableData, handleSorting] = useSortableTable(functions);

    return (<Container centered>
        <ErrorAlert error={error}></ErrorAlert>
        <h1 className="mt-4">Search</h1>
        <form className="row g-3 mb-2" onSubmit={search}>
            <div className="col-md-8">
                <input type="text" className="form-control" placeholder="Function Name" value={name} onChange={e => setName(e.target.value)}></input>
            </div>
            <div className="col-md-4">
                <button type="submit" className="btn btn-primary">Search</button>
           </div>
        </form>

        <table className="sortable">
            <TableHead columns={columns} handleSorting={handleSorting}></TableHead>
            <tbody>
                {isLoading
                    ? <tr><td colSpan={5}><LoadingIndicator /></td></tr>
                    :
                    tableData().map((func: Func) => (
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
                            <td>
                                {func.decomp_me_matched
                                    ? <a href={DECOMP_ME_FRONTEND + '/scratch/' + func.decomp_me_scratch} className="decompMe" data-bs-toggle="tooltip" data-bs-placement="right" title={'This function has been matched over on decomp.me.'}><i className="fa fa-check-circle fa-fw"></i>{func.name}</a>
                                    : (
                                        func.lockedByName
                                            ? <span data-bs-toggle="tooltip" data-bs-placement="right" title={func.lockedByName + ' is currently working on this function.'} style={{ cursor: 'not-allowed' }}><i className="fa fa-lock fa-lg fa-fw"></i>{func.name}</span>
                                            : func.name
                                    )
                                }
                            </td>
                            <td>{func.size}</td>
                            <td>{func.best_score}</td>
                            <td>{func.is_asm_func ? 'ASM_FUNC' : 'NONMATCH'}</td>
                            <td>{func.has_equivalent_try ? 'Yes' : 'No'}</td>
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
    </Container>
    );
};