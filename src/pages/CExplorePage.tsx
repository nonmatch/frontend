import { useState } from "react";
import { useHistory } from "react-router-dom";
import { Container } from "../components/Container";
import { ErrorAlert } from "../components/ErrorAlert";
import { LINK_RESOLVE_URL } from "../constants";
import { getCatURL, useLocalStorage } from "../utils";

export const CExplorePage: React.FC = () => {

    const [url, setUrl] = useState('');
    const [error, setError] = useState<Error | null>(null);
    const [, setCustomCCode] = useLocalStorage('custom_c_code', '// Type your c code here...');
    const [, setCustomAsmCode] = useLocalStorage('custom_asm_code', '@ Paste the asm code here...');
    const history = useHistory();

    const load = () => {
        setError(null);
        const parts = url.split('/');
        if (parts[parts.length - 2] !== 'z') {
            setError(Error('Not a valid CExplore short link.'));
            return;
        }
        fetch(LINK_RESOLVE_URL + '/' + parts[parts.length - 1]).then(
            data => data.json()
        ).then(
            (data) => {
                if (!data.sessions) {
                    setError(Error('Invalid format of API response.'));
                    return;
                }
                if (data.sessions.length !== 2) {
                    setError(Error('Expected two editors in CExplore link.'));
                    return;
                }
                if (data.sessions[0].language !== 'c' || data.sessions[1].language !== 'assembly') {
                    setError(Error('Expected the C editor to the left and the asm editor to the right in CExplore link.'));
                    return;
                }

                const cCode = data.sessions[0].source;

                fetch(getCatURL(), {
                    "method": "POST",
                    "body": data.sessions[1].source
                }).then(data=>data.text()).then((asmCode) => {
                    setCustomCCode(cCode);
                    setCustomAsmCode(asmCode.trim());
                    history.push('/custom');
                }, setError);


            },
            setError);
    };
    return (
        <Container>
            <ErrorAlert error={error}></ErrorAlert>
            <h1 className="mt-4 mb-2">Load from CExplore</h1>
            <div className="mb-3 mt-3">
                {/*<label htmlFor="url">CExplore URL</label>*/}
                <input type="url" className="form-control" id="url" placeholder="Enter CExplore URL"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value) }}
                />
            </div>
            <button type="submit" className="btn btn-primary" onClick={load}>Load From URL</button>
        </Container>
    )
};