import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { get, post } from "../api";
import { Container } from "../components/Container";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { Column, TableHead } from "../components/TableHead";
import { API_URL } from "../constants";
import { isFileLocked } from "../repositories/trello";
import { getUser } from "../repositories/user";
import { TrelloUser } from "../types";
import { showTooltips, useTitle } from "../utils";
import { useSortableTable } from "../utils/sortableTable";


export const PullRequestPage: React.FC = () => {

    // TODO check that the user is logged in
    interface Match {
        name: string,
        size: number,
        owner: number,
        ownerName: string,
        time_created: string
        submission: number,
        function: number,
        file: string,
        locked?: TrelloUser
    }

    const [isLoading, setIsLoading] = useState(false);
    const [isSecondPage, setIsSecondPage] = useState(false);
    const [matches, setMatches] = useState<Match[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [error, setError] = useState<Error | null>(null);

    const history = useHistory();

    useTitle('Create Pull Request');

    useEffect(() => {
        const fetchMatches = () => {
            get(API_URL + '/matches').then(
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
                        for (let i = 0; i < data.length; i++) {
                            data[i].locked = await isFileLocked(data[i].file);
                        }
                    }
                    setIsLoading(false);
                    setMatches(data);
                    // Show tooltips
                    showTooltips();
                },
                (error) => {
                    setIsLoading(false);
                    console.error(error)
                });
            setIsLoading(true);
        };
        fetchMatches();
    }, []);

    const goSecondPage = () => {
        if (selected.length === 1) {
            setTitle('Match ' + matches[matches.findIndex((m) => m.submission === selected[0])].name);
            setText('');
        } else {
            setTitle('Match Functions');
            let text = '';
            let functions = new Set();
            for (let index = 0; index < selected.length; index++) {
                let match = matches[matches.findIndex((m) => m.submission === selected[index])];
                if (functions.has(match.function)) {
                    setError(Error('Please select only one submission for function ' + match.name + '.'));
                    return;
                }
                functions.add(match.function);

                text += (index !== 0 ? '\n\n' : '') + '* Match ' + match.name;
            }
            setText(text);
        }
        setIsSecondPage(true);
    };



    const createPr = () => {
        setIsLoading(true);
        setError(null);


        post(API_URL + '/pr', {
            title: title,
            text: text,
            selected: selected
        }).then(
            (data) => {
                setIsLoading(false);
                history.push('/pr/' + data['id']);
            },
            (error) => {
                setIsLoading(false);
                console.error(error)
                setError(error);
            }
        )
    }


    const columns: Column[] = [
        { label: '', accessor: '_1', sortable: false },
        { label: 'File', accessor: 'file', sortable: true },
        { label: 'Function', accessor: 'name', sortable: true },
        { label: 'Size', accessor: 'size', sortable: true },
        { label: 'Owner', accessor: 'ownerName', sortable: true },
        { label: 'Created', accessor: 'time_created', sortable: true },
        { label: '', accessor: '_2', sortable: false }
    ];

    const [tableData, handleSorting] = useSortableTable(matches);

    return (
        <Container>
            <h1 className="mt-4">Create Pull Request</h1>
            <ErrorAlert error={error}></ErrorAlert>
            {!isSecondPage
                ?
                <>
                    <p className="mt-4">Select Matching Functions for Pull Request.</p>
                    <table className="sortable">
                        <TableHead columns={columns} handleSorting={handleSorting}></TableHead>
                        <tbody>
                            {
                                isLoading
                                    ? <tr><td colSpan={7}><LoadingIndicator /></td></tr>
                                    : matches.length === 0
                                        ? <tr><td colSpan={7}>No matching functions yet</td></tr>
                                        : tableData().map((match: Match) => (
                                            <tr key={match.submission}>
                                                <td>
                                                    <input type="checkbox" defaultChecked={selected.includes(match.submission)}
                                                        onChange={
                                                            (evt) => {
                                                                if (evt.target.checked) {
                                                                    setSelected([...selected, match.submission]);
                                                                } else {
                                                                    setSelected(selected.filter((x) => x !== match.submission));
                                                                }
                                                            }
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    {match.locked
                                                        ?
                                                        match.locked.username === 'wip'
                                                            ? <span data-bs-toggle="tooltip" data-bs-placement="right" title={'This file is marked as WIP in Trello.'} style={{ cursor: 'text' }}><i className="fa fa-pencil fa-fw"></i>{match.file}</span>
                                                            : <span data-bs-toggle="tooltip" data-bs-placement="right" title={match.locked.username + ' is currently working on this file.'} style={{ cursor: 'not-allowed' }}><i className="fa fa-lock fa-lg fa-fw"></i>{match.file}</span>
                                                        : match.file
                                                    }
                                                </td>
                                                <td>
                                                    {match.name}
                                                </td>
                                                <td>
                                                    {match.size}
                                                </td>
                                                <td>
                                                    {match.ownerName}
                                                </td>
                                                <td>
                                                    {match.time_created}
                                                </td>
                                                <td>
                                                    <Link className="btn btn-outline-primary btn-sm" to={"/functions/" + match.function + "/submissions/" + match.submission}>View</Link>
                                                </td>

                                            </tr>
                                        ))
                            }
                        </tbody>
                    </table>
                    {
                        selected.length > 0
                            ? <button className="btn btn-primary mt-3" onClick={goSecondPage}>Create Pull Request</button>
                            : <button className="btn btn-secondary mt-3" disabled>Create Pull Request</button>
                    }
                </>
                :
                    <>

                        <div>
                            <p className="mt-3">Enter Title and Text for the Pull Request</p>

                            <input type="text" placeholder="Title" className="form-control mt-3"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <textarea placeholder="Text" className="form-control mt-2"
                                rows={10}
                                value={text}
                                onChange={(e) => setText(e.target.value)} />
                            <button className="btn btn-primary mt-3" onClick={createPr}>Create Pull Request</button>
                        </div>
                    </>
                /*
                First select all matching or equivalent submissions that you want to add to the pr

                Then generate a title and text and let the user change it before submitting

                TODO username does not have to be unique as there could be different username/email combos for not-logged-in submissions
                */
            }




        </Container>
    );
};