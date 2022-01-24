import debounce from "lodash.debounce";
import { useRef } from "react";
import { useCallback, useEffect, useState } from "react";
import { Prompt, RouteComponentProps, useHistory, useLocation } from "react-router";
import { Bar, Container, Section } from "react-simple-resizer";
import { get, post } from "../api";
import { CodeEditor } from "../components/CodeEditor"
import { DiffEditor } from "../components/DiffEditor";
import { ErrorAlert } from "../components/ErrorAlert";
import { ErrorLog } from "../components/ErrorLog";
import { FuncNameMenu } from "../components/FuncNameMenu";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { SubmitDialog } from "../components/SubmitDialog";
import { SuccessToast } from "../components/SuccessToast";
import { API_URL, CEXPLORE_URL, COMPILE_DEBOUNCE_TIME, PYCAT_URL } from "../constants";
import eventBus from "../eventBus";
import { getFunction } from "../repositories/function";
import { getCurrentUser } from "../repositories/user";
import { AsmLine, ErrorLine, Func } from "../types";
import { useLocalStorage } from "../utils";

import './EditorPage.css'

interface Params {
    function: string,
    submission: string,
}

// Store the id of the submission we just created to display the submission toast.
let justSubmitted = -1;

const EditorPage: React.FC<RouteComponentProps<Params>> = ({ match }) => {

    // State
    const [cCode, setCCode] = useState(
        '// Type your c code here...'
    )

    const [isCompiling, setIsCompiling] = useState(true);
    const [compiled, setCompiled] = useState<{
        asm: string,
        lines: AsmLine[],
        stderr: ErrorLine[],
        data: any // raw compile response, so we can pass it on when submitting
    }>(
        {
            asm: 'The compiled asm of your code will appear here...',
            lines: [],
            stderr: [],
            data: {}
        }

    )
    const [originalAsm, setOriginalAsm] = useState(
        'original asm'
    )

    const [func, setFunc] = useState<Func | null>(null)

    const [score, setScore] = useState(-1);

    const [error, setError] = useState<Error | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEquivalent, setIsEquivalent] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [hasUnsubmittedChanges, setHasUnsubmittedChanges] = useState(false);
    // Is custom code? No longer able to submit
    const [isCustom, setIsCustom] = useState(false);
    const [customCCode, setCustomCCode] = useLocalStorage('custom_c_code', '// Type your c code here...');
    const [customAsmCode, setCustomAsmCode] = useLocalStorage('custom_asm_code', '@ Paste the asm code here...');
    // TODO allow to enter custom asm code

    // https://stackoverflow.com/a/60643670
    const cCodeRef = useRef<string>();
    cCodeRef.current = cCode;

    const location = useLocation();


    const debouncedCompile =
    // eslint-disable-next-line
        useCallback(
            debounce(nextValue => compile(nextValue), COMPILE_DEBOUNCE_TIME), []);

    const onCodeChange = (newValue: any) => {
        setHasUnsubmittedChanges(true);
        setCCode(newValue)
        debouncedCompile(newValue);
    }

    const onScoreChange = (score: number) => {
        setScore(score);
    };

    const parseCompileData = (data: any) => {
        const code = data.asm.map((line: any) => line.text).join('\n')
        setIsCompiling(false);
        setCompiled({
            asm: code,
            lines: data.asm,
            stderr: data.stderr,//data.stderr.map((line: any) => line.text).join('\n')
            data: data
        })
    }
    const compile = async (nextValue: any) => {
        if (isCustom) {
            // save the c code in local storage
            setCustomCCode(cCode);
        }

        setIsCompiling(true);
        //        console.log('compiling', nextValue);
        try {
            const res = await fetch(CEXPLORE_URL, {
                "headers": {
                    "accept": "application/json, text/javascript, */*; q=0.01",
                    //"accept-language": "en-US,en;q=0.9",
                    "content-type": "application/json",
                    //"x-requested-with": "XMLHttpRequest"
                },
                //      "referrer": "http://cexplore.henny022.de/",
                //"referrerPolicy": "strict-origin-when-cross-origin",
                "body":
                    JSON.stringify({
                        source: nextValue,
                        compiler: "tmc_agbcc",
                        options: {
                            userArguments: '-O2', // TODO allow the user to specify this?
                            compilerOptions: {
                                produceGccDump: {},
                                produceCfg: false
                            },
                            filters: {
                                labels: true,
                                binary: false,
                                commentOnly: true,
                                demangle: true,
                                directives: true,
                                execute: false,
                                intel: true,
                                libraryCode: false,
                                trim: false
                            },
                            tools: [],
                            libraries: []
                        },
                        lang: "c",
                        allowStoreCodeDebug: true
                    }),

                "method": "POST",
                //"mode": "cors",
                //"credentials": "omit"
            });

            const data = await res.json();
            //        console.log(data);

            parseCompileData(data);

        } catch (e: any) {
            setIsCompiling(false);
            setCompiled({
                asm: '',
                lines: [],
                stderr: [{ text: 'ERROR: ' + e.message }],
                data: {}
            })
        }
    }

    const copyLink = () => {
        // replace /functions/<>/submissions/<> with /z/<>/<>
        let url = window.location.href;
        url = url.replace('/functions/', '/z/');
        url = url.replace('/submissions/', '/');
        navigator.clipboard.writeText(url);
    };

        useEffect(() => {
        getCurrentUser().then((user) => {
            setIsLoggedIn(true);
            setUsername(user?.username ?? '');
            setEmail(user?.email ?? '');
        });
        const loadFunction = async (func: string, submission: string) => {
            const funcId = parseInt(func);
            // Fetch asm code from function
            getFunction(funcId).then((data) => {
                eventBus.dispatch('current-function', data.name);
                setFunc(data);
                if (data.asm !== undefined) {
                    setOriginalAsm(data.asm)
                }

                if (parseInt(submission) === 0) {
                    setIsEquivalent(false);
                    setIsCompiling(false);
                } else {
                    get(API_URL + '/submissions/' + submission).then((data) => {

                        // Check that submission belongs to function
                        if (data.function !== funcId) {
                            setError(new Error('Submission does not belong to function.'));
                            return;
                        }

                        // Fetch c code from submission
                        if (data.code !== undefined) {
                            setCCode(data.code)
                            // use the precompiled compile data
                            if (data.compiled) {
                                parseCompileData(JSON.parse(data.compiled))
                            } // TODO else debouncecompile?
                        }
                        setIsEquivalent(data.is_equivalent);

                        // If this was just submitted, show the success toast
                        if (justSubmitted === parseInt(submission)) {
                            justSubmitted = -1;
                            new (window as any).bootstrap.Toast(document.getElementById('successToast')).show();

                        }
                    }, setError);
                }
            }, setError);

        }

        if (location.pathname === '/custom') {
            // Load the custom code?
            setIsCustom(true);
            setOriginalAsm(customAsmCode);
            setCCode(customCCode);
            debouncedCompile(customCCode);
            //setIsCompiling(false);
        } else {
            // Load the submission defined via the URL
            loadFunction(match.params.function, match.params.submission);
        }

        const onCCode = (data: string) => {
            setCCode(data);
            debouncedCompile(data);
        };
        const onAsmCode = (data: string) => {
            // TODO change url to /custom if it is no longer the same function?
            // send through pycat
            fetch(PYCAT_URL, {
                "method": "POST",
                "body": data
            }).then(data=>data.text()).then((data) => {
                setIsCustom(true);
                eventBus.dispatch('on_editor_page', false);
                setOriginalAsm(data.trim());
                setCustomAsmCode(data.trim());
            }, setError);
        };
        const onAddCCode = (data: string) => {
            const code = cCodeRef.current + data;
            setCCode(code);
            debouncedCompile(code);
        };
        const onRequestCCode = () => {
            console.log('request');
            eventBus.dispatch('send_c_code', cCodeRef.current);
        };
        const onExtractedData = () => {
            console.warn('Not implemented');
        };

        // Subscriptions
        if (!isCustom) {
            eventBus.dispatch('on_editor_page', true);
        }
        eventBus.on('c_code', onCCode);
        eventBus.on('asm_code', onAsmCode);
        eventBus.on('add_c_code', onAddCCode);
        eventBus.on('request_c_code', onRequestCCode);
        eventBus.on('extracted_data', onExtractedData);
        return () => {
            eventBus.dispatch('on_editor_page', false);
            eventBus.remove('c_code', onCCode);
            eventBus.remove('asm_code', onAsmCode);
            eventBus.remove('add_c_code', onAddCCode);
            eventBus.remove('request_c_code', onRequestCCode);
            eventBus.remove('extracted_data', onExtractedData);
        };

    // eslint-disable-next-line
    }, [match.params.function, match.params.submission, debouncedCompile, location.pathname]) // TODO why does it want me to add loadFunction as a dependency here?

    const history = useHistory();

    const showSubmitDialog = () => {
        let modal = new (window as any).bootstrap.Modal(document.getElementById('submitDialog'));
        modal.show();
    };

    const submit = async () => {
        setIsSubmitting(true);
        post(API_URL + '/functions/' + match.params.function + '/submissions', {
            code: cCode,
            score: score,
            is_equivalent: isEquivalent,
            parent: match.params.submission,
            compiled: JSON.stringify(compiled.data),
            username: username,
            email: email
        }).then(
            (data) => {
                setIsSubmitting(false);
                setHasUnsubmittedChanges(false);
                justSubmitted = data.id; // Show the toast on page reload
                history.replace('/functions/' + match.params.function + '/submissions/' + data.id);
            },
            (error) => {
                setIsSubmitting(false);
                setError(error);
                console.error('Submission failed', error)
            }
        )
    };

    const showOneColumn = () => {
        return window.innerWidth < 800;
    };

    const common = (
        <>
            <ErrorAlert error={error}></ErrorAlert>
            <SubmitDialog
                score={score}
                setIsEquivalent={setIsEquivalent}
                isEquivalent={isEquivalent}
                submit={submit}
                isLoggedIn={isLoggedIn}
                username={username}
                setUsername={setUsername}
                email={email}
                setEmail={setEmail}
            ></SubmitDialog>
            <SuccessToast score={score} isLoggedIn={isLoggedIn} copyLink={copyLink}></SuccessToast>
            <Prompt when={hasUnsubmittedChanges} message="You have unsubmitted changes, are you sure you want to leave?"></Prompt>
        </>
    );

    if (showOneColumn()) {
        // One column with tabs
        // TODO also add a textarea version of the editor to be able to copy and paste code?
        return (
            <>
                {common}
                <div className="tab-content" id="myTabContent" style={{ flex: 1, display: "flex" }}>
                    <div className="tab-pane fade show active" id="code" role="tabpanel" aria-labelledby="code-tab" style={{ flex: 1, overflow: "hidden" }}>
                        <CodeEditor
                            code={cCode}
                            stderr={compiled.stderr}
                            onCodeChange={onCodeChange}

                        />
                    </div>
                    <div className="tab-pane fade" id="stderr" role="tabpanel" aria-labelledby="stderr-tab" style={{ flex: 1, overflow: "hidden" }}>
                        <ErrorLog stderr={compiled.stderr} isCompiling={isCompiling}></ErrorLog> </div>
                    <div className="tab-pane fade" id="diff" role="tabpanel" aria-labelledby="diff-tab" style={{ flex: 1, overflow: "hidden" }}>
                        <DiffEditor
                            compiledAsm={compiled.asm}
                            originalAsm={originalAsm}
                            lines={compiled.lines}
                            onScoreChange={onScoreChange}
                        /></div>
                </div>
                <div style={{ borderTop: "1px solid #eee", backgroundColor: "#f8f9fa", fontSize: "14px", whiteSpace:"nowrap", overflowX:"auto", overflowY:"revert", flexShrink:0}}>
                    <div className="container" style={{ display: "flex", alignItems: "center" }}>
                        <ul className="nav nav-pills" id="myTab" role="tablist" style={{flexShrink:0}}>
                            <li className="nav-item" role="presentation">
                                <button className="nav-link active" id="code-tab" data-bs-toggle="tab" data-bs-target="#code" type="button" role="tab" aria-controls="code" aria-selected="true">Code</button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button className={"nav-link" + (compiled.stderr.length > 0 ? " tab-error" : "")} id="stderr-tab" data-bs-toggle="tab" data-bs-target="#stderr" type="button" role="tab" aria-controls="stderr" aria-selected="false">Stderr</button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button className="nav-link" id="diff-tab" data-bs-toggle="tab" data-bs-target="#diff" type="button" role="tab" aria-controls="diff" aria-selected="false">Diff</button>
                            </li>
                        </ul>
                        {isCustom ? <span className="btn btn-sm">custom code</span> : <FuncNameMenu copyLink={copyLink} name={func?.name}></FuncNameMenu>}
                        <span style={{ flex: 1 }}></span>
                        <span style={{ padding: "0 8px" }}>
                            Diff Score: {score}
                        </span>
                        {
                            !isCustom && (
                            isCompiling || isSubmitting
                                ? <LoadingIndicator small />
                                : <button className={
                                    "btn btn-sm" + (score === 0
                                        ? " btn-success"
                                        : " btn-outline-success")
                                } onClick={showSubmitDialog}>Submit</button>
                            )
                        }
                    </div>
                </div>
            </>
        );

    } else {
        // Two columns
        return (
            <>
                {common}
                <Container style={{ overflow: "hidden", flex: 1 }}>
                    <Section minSize={100}>
                        <CodeEditor
                            code={cCode}
                            stderr={compiled.stderr}
                            onCodeChange={onCodeChange}
                        />
                    </Section>
                    <Bar size={1} style={{ background: '#eee', cursor: 'col-resize' }}
                        expandInteractiveArea={{ left: 2, right: 2 }} />
                    <Section minSize={100} style={{ display: "flex" }}>
                        <Container vertical style={{ overflow: "hidden", flex: 1, display: "flex" }}>
                            <Section minSize={100}>
                                <DiffEditor
                                    compiledAsm={compiled.asm}
                                    originalAsm={originalAsm}
                                    lines={compiled.lines}
                                    onScoreChange={onScoreChange}
                                />
                            </Section>
                            <Bar size={1} style={{ background: '#eee', cursor: 'col-resize' }}
                                expandInteractiveArea={{ top: 2, bottom: 2 }} />
                            <Section minSize={100} defaultSize={200} style={{ display: "flex" }}>
                                <ErrorLog stderr={compiled.stderr} isCompiling={isCompiling}></ErrorLog>
                            </Section>
                        </Container>
                    </Section>
                </Container>
                <div style={{ borderTop: "1px solid #eee", backgroundColor: "#f8f9fa", fontSize: "14px" }}>
                    <div className="container" style={{ display: "flex", padding: "4px", alignItems: "center" }}>
                        {isCustom ? <span className="btn btn-sm">custom code</span> : <FuncNameMenu copyLink={copyLink} name={func?.name}></FuncNameMenu>}
                        <span style={{ flex: 1 }}></span>
                        <span style={{ padding: "0 8px" }}>
                            Diff Score: {score}
                        </span>
                        {
                            !isCustom && (
                            isCompiling || isSubmitting
                                ? <button className="btn btn-secondary btn-sm" disabled>Submit</button>
                                : <button className={
                                    "btn btn-sm" + (score === 0
                                        ? " btn-success"
                                        : " btn-outline-success")}
                                    onClick={showSubmitDialog}>Submit</button>
                            )
                        }
                    </div>
                </div>
            </>
        )
    }

}

export default EditorPage;