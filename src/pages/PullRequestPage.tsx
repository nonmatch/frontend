import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, post } from "../api";
import { Container } from "../components/Container";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { API_URL } from "../constants";
import { getUser } from "../repositories/user";

export const PullRequestPage: React.FC = () => {

    interface Match {
        name: string,
        size: number,
        owner: number,
        ownerName: string,
        time_created: string
        submission: number,
        function: number
    }

    const [isLoading, setIsLoading] = useState(false);
    const [isSecondPage, setIsSecondPage] = useState(false);
    const [matches, setMatches] = useState<Match[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');

    useEffect(() => {
        const fetchMatches = () => {
            get(API_URL + 'matches').then(
                async (data) => {
                    // Load all owners
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].owner === null || data[i].owner === 0) {
                            data[i].ownerName = 'anonymous';
                        } else {
                            console.log(data[i].owner);
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
                    setIsLoading(false);
                    setMatches(data);
                    // Make table sortable
                    (window as any).Sortable.init();
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
            setTitle('Match ' + matches[matches.findIndex((m) => m.submission = selected[0])].name);
            setText('');
        } else {
            setTitle('Match Functions');
            let text = '';
            for (let index = 0; index < selected.length; index++) {
                text += (index != 0 ? '\n' : '') + '* Match ' + matches[matches.findIndex((m) => m.submission = selected[index])].name;
            }
            setText(text);
        }
        setIsSecondPage(true);
    };

    const createPr = () => {
        setIsLoading(true);

        post(API_URL+'pr', {
            title: title,
            text: text,
            selected: selected
        }).then(
            (data) => {
                console.log(data)
                // TODO show link to pull request
            },
            (error) => {
                console.error(error)
            }
        )
    }

    return (
        <Container>
            <h1 className="mt-4">Create Pull Request</h1>

            {!isSecondPage
                ?
                <>
                    <p className="mt-4">Select Matching Functions for Pull Request</p>
                    <table className="sortable-theme-slick" data-sortable>
                        <thead>
                            <tr><th data-sortable="false"></th><th>Function</th><th>Size</th><th>Owner</th><th>Created</th><th data-sortable="false"></th></tr>
                        </thead>
                        <tbody>
                            {
                                isLoading
                                    ? <tr><td colSpan={6}><LoadingIndicator /></td></tr>
                                    : matches.map((match) => (
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
                isLoading ? <LoadingIndicator></LoadingIndicator>
                    : <>
                        <p className="mt-3">Enter Title and Text for the Pull Request</p>

                        <input type="text" placeholder="Title" className="form-control mt-3"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <textarea placeholder="Text" className="form-control mt-2"
                            value={text}
                            onChange={(e) => setText(e.target.value)} />
                        <button className="btn btn-primary mt-3" onClick={createPr}>Create Pull Request</button>
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