import { useCallback, useEffect, useState } from "react"
import { Link, RouteComponentProps } from "react-router-dom";
import { get, post } from "../api";
import { Container } from "../components/Container"
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { Column, TableHead } from "../components/TableHead";
import { API_URL, DECOMP_ME_FRONTEND } from "../constants";
import { isFileLocked } from "../repositories/trello";
import { getCurrentUser, getUser } from "../repositories/user";
import { Func, User } from "../types"
import { showTooltips, useLocalStorage, useTitle } from "../utils";
import { useSortableTable } from "../utils/sortableTable";

export const FunctionsPage: React.FC<RouteComponentProps> = ({ location }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [functions, setFunctions] = useState<Func[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [hiddenFunctions, setHiddenFunctions] = useLocalStorage('hiddenFunctions', []);

    const [filterNonmatch, setFilterNonmatch] = useState('none');
    const [filterEquivalent, setFilterEquivalent] = useState('none');

    const titles = {
        0: 'NONMATCH Functions',
        1: 'ASM_FUNC Functions',
        2: 'Functions with code',
        3: 'Functions without code',
        4: 'Equivalent Functions',
        5: 'Non-Equivalent Functions',
        6: 'Functions'
    };

    enum Content {
        NONMATCH,
        ASM_FUNC,
        WITH_CODE,
        WITHOUT_CODE,
        EQUIVALENT,
        NON_EQUIVALENT,
        ALL
    };

    const content = {
        '/nonmatch': Content.NONMATCH,
        '/asm_funcs': Content.ASM_FUNC,
        '/with_code': Content.WITH_CODE,
        '/without_code': Content.WITHOUT_CODE,
        '/equivalent': Content.EQUIVALENT,
        '/non_equivalent': Content.NON_EQUIVALENT,
        '/': Content.ALL
    }[location.pathname] || Content.NONMATCH;

    useTitle(titles[content]);

    const lockFunction = (id: number) => {
        post(API_URL + '/functions/' + id + '/lock', {}).then(() => {
            fetchFunctions(false);
        }, setError);
    }

    const unlockFunction = (id: number) => {
        post(API_URL + '/functions/' + id + '/unlock', {}).then(() => {
            fetchFunctions(false);
        }, setError);
    }

    const fetchFunctions = async (indicateLoading: boolean) => {
        if (indicateLoading) {
            setIsLoading(true);
        }
        const path = {
            0: '/functions',
            1: '/asm_functions',
            2: '/with_code',
            3: '/without_code',
            4: '/equivalent',
            5: '/non_equivalent',
            6: '/all_functions'
        }[content];
        get(API_URL + path).then(
            async (data) => {

                for (let i = 0; i < data.length; i++) {
                    data[i].locked = await isFileLocked(data[i].file);
                    if (data[i].locked_by) {
                        let user = await getUser(data[i].locked_by);
                        data[i].lockedByName = user.username;
                    }
                }
                setFunctions(data);
                // Show tooltips
                showTooltips();
                setIsLoading(false);
            },
            (error) => {
                setIsLoading(false);
                setError(error);
            }
        )
    }

    useEffect(() => {
        getCurrentUser().then((user) => {
            setCurrentUser(user);
        }, (error) => { });
        fetchFunctions(true);
        // eslint-disable-next-line
    }, [location.pathname, content, Content.NONMATCH]);

    const hideFunction = (id: number) => {
        setHiddenFunctions([...hiddenFunctions, id]);
    };

    const columns: Column[] = [
        { label: 'File', accessor: 'file', sortable: true },
        { label: 'Function', accessor: 'name', sortable: true },
        { label: 'Size', accessor: 'size', sortable: true },
        { label: 'Best Matching Fakeness Score', accessor: 'best_fakeness_score', sortable: true },
        { label: '', accessor: '', sortable: false }
    ];

    const filteredFunctions = useCallback(() => {
        return functions.filter(func =>
            (
                filterNonmatch === 'none' ||
                (filterNonmatch === 'asm_func') === func.is_asm_func
            ) &&
            (
                filterEquivalent === 'none' ||
                (filterEquivalent === 'yes') === func.has_equivalent_try
            )
        );
    }, [functions, filterNonmatch, filterEquivalent]);

    const [tableData, handleSorting] = useSortableTable(filteredFunctions());

    return (<Container centered>
        <ErrorAlert error={error}></ErrorAlert>
        <h1 className="mt-4 mb-2">{
            titles[content]
        }</h1>

        {/*
        <p style={{ width: "100%", textAlign: "right" }}>
            <i className="fa fa-filter me-2" style={{ color: "#777" }} />
            <select className="form-select me-2 form-select-sm" style={{ width: "160px", display: "inline-block" }} value={filterNonmatch} onChange={(e) => setFilterNonmatch(e.target.value)}>
                <option value="none">Filter NONMATCH</option>
                <option value="nonmatch">Only NONMATCH</option>
                <option value="asm_func">Only ASM_FUNC</option>
            </select>

            <select className="form-select form-select-sm" style={{ width: "180px", display: "inline-block" }} value={filterEquivalent} onChange={(e) => setFilterEquivalent(e.target.value)}>
                <option value="none">Filter Equivalent</option>
                <option value="yes">Only Equivalent</option>
                <option value="no">Only Non-Equivalent</option>
            </select>
        </p>
         */}

        <table className="sortable">
            <TableHead columns={columns} handleSorting={handleSorting}></TableHead>
            <tbody>
                {isLoading
                    ? <tr><td colSpan={5}><LoadingIndicator /></td></tr>
                    :
                    tableData().filter((func: Func) => !hiddenFunctions.includes(func.id)).map((func: Func) => (
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
                            <td onContextMenu={(e) => { e.preventDefault(); hideFunction(func.id) }}>{func.best_fakeness_score}</td>
                            <td>
                                <Link className="btn btn-outline-primary btn-sm" to={"/functions/" + func.id}>
                                    Edit
                                </Link>
                                {currentUser != null && func.locked == null && func.lockedByName == null && !func.decomp_me_matched &&
                                    <button className="btn btn-outline-secondary btn-sm ms-2" onClick={() => lockFunction(func.id)}>
                                        Lock
                                    </button>
                                }
                                {currentUser != null && func.lockedByName === currentUser.username &&
                                    <button className="btn btn-outline-secondary btn-sm ms-2" onClick={() => unlockFunction(func.id)}>
                                        Unlock
                                    </button>
                                }
                            </td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
        {
            !isLoading && <div className="mt-3 mb-4 text-secondary">
                Found {filteredFunctions().length} Functions
            </div>
        }
    </Container>)
}