import debounce from "lodash.debounce";
import { useContext, useMemo, useRef } from "react";
import { useCallback, useEffect, useState } from "react";
import { Prompt, RouteComponentProps, useHistory, useLocation } from "react-router";
import { Bar, Container, Section } from "react-simple-resizer";
import { get, post, sendDelete } from "../api";
import { generateCExploreURL } from "../cexplore";
import { CodeEditor } from "../components/CodeEditor"
import { DiffEditor } from "../components/DiffEditor";
import { ErrorAlert } from "../components/ErrorAlert";
import { ErrorLog } from "../components/ErrorLog";
import { FuncNameMenu } from "../components/FuncNameMenu";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { SubmitDialog } from "../components/SubmitDialog";
import { SuccessToast } from "../components/SuccessToast";
import { API_URL, COMPILE_DEBOUNCE_TIME, DECOMP_ME_FRONTEND } from "../constants";
import { generateDecompMeURL } from "../decompme";
import eventBus from "../eventBus";
import { getFunction } from "../repositories/function";
import { getCurrentUser } from "../repositories/user";
import { AsmLine, Comment, ErrorLine, Func, Stage, Submission } from "../types";
import { getCompileURL, getCatURL, openInNewTab, useLocalStorage, useTitle, getFormatterURL, setDescription, getLinkerURL } from "../utils";
import { useBeforeunload } from "react-beforeunload";

import './EditorPage.css'
import { DiffScore } from "../components/DiffScore";
import { CompilerDump } from "../components/CompilerDump";
import { SettingsContext } from "../utils/settingsContext";

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
    const [isDirty, setIsDirty] = useState(false);
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
    const [comments, setComments] = useState<Comment[]>(
        []
    );

    const [func, setFunc] = useState<Func | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);

    const [score, setScore] = useState(-1);

    const [error, setError] = useState<Error | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEquivalent, setIsEquivalent] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState(-1);
    const [hasUnsubmittedChanges, setHasUnsubmittedChanges] = useState(false);
    // Is custom code? No longer able to submit
    const [isCustom, setIsCustom] = useState(false);
    const [customCCode, setCustomCCode] = useLocalStorage('custom_c_code', '// Type your c code here...');
    const [customAsmCode, setCustomAsmCode] = useLocalStorage('custom_asm_code', '@ Paste the asm code here...'); // TODO allow to enter custom asm code
    const [usesTextarea, setUseTextarea] = useLocalStorage('use_textarea', false);

    const isOwnedByUser = userId === (submission?.owner ?? -2);

    // https://stackoverflow.com/a/60643670
    const cCodeRef = useRef<string>();
    cCodeRef.current = cCode;

    const funcRef = useRef<Func | null>();
    funcRef.current = func;

    const isDirtyRef = useRef<boolean>();
    isDirtyRef.current = isDirty;

    const isCustomRef = useRef<boolean>();
    isCustomRef.current = isCustom;


    const location = useLocation();



    // Compiler Dumps
    const [stages, setStages] = useState<Stage[]>([]);

    const [showCode, setShowCode] = useState(true);
    const [showDumps, setShowDumps] = useState(false);
    const [showAsm, setShowAsm] = useState(true);
    const settings = useContext(SettingsContext);


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
    const compile = async () => {
        if (!isDirtyRef.current) {
            return;
        }
        setIsDirty(false);
        if (isCustomRef.current) {
            // save the c code in local storage
            setCustomCCode(cCodeRef.current);
        }

        if (settings.compileDumps) {
            dumpCompile();
        }

        setIsCompiling(true);
        try {
            let compileFlags = '-O2';
            if (funcRef.current?.compile_flags) {
                compileFlags += ' ' + funcRef.current?.compile_flags;
            }

            const startTime = performance.now();

            const res = await fetch(getCompileURL(), {
                'headers': {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'content-type': 'application/json',
                },
                'body':
                    JSON.stringify({
                        source: cCodeRef.current,
                        compiler: 'agbcc',
                        options: {
                            userArguments: compileFlags, // TODO allow the user to specify this?
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
                            libraries: [
                                {
                                    id: 'tmc',
                                    version: 'master'
                                }
                            ]
                        },
                        lang: "c",
                        allowStoreCodeDebug: true
                    }),

                "method": "POST",
            });

            const data = await res.json();

            const compileTime = performance.now() - startTime;
            console.log('Compiling took ' + compileTime.toFixed(2) + ' ms.');

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

    const dumpCompile = async () => {
        try {
            const res = await fetch(getLinkerURL(), {
                'method': 'POST',
                'body': cCodeRef.current
            });

            const data = await res.json();
            setStages(data.dumps);
        } catch (e: any) {
            console.error(e)
        }
    }


    const debouncedCompile =
        // eslint-disable-next-line
        useMemo(() => debounce(compile, COMPILE_DEBOUNCE_TIME), []);

    const onCodeChange = (newValue: any) => {
        setHasUnsubmittedChanges(true);
        setCCode(newValue)
        setIsDirty(true);
        debouncedCompile();
    }

    const copyLink = () => {
        // replace /functions/<>/submissions/<> with /z/<>/<>
        let url = window.location.href;
        url = url.replace('/functions/', '/z/');
        url = url.replace('/submissions/', '/');
        navigator.clipboard.writeText(url);
    };

    const exportCExplore = () => {
        openInNewTab(generateCExploreURL(cCode, originalAsm));
    };

    const exportDecompMe = () => {
        if (func != null) {
            if (func.decomp_me_scratch) {
                // Function has already been added to decomp.me
                openInNewTab(DECOMP_ME_FRONTEND + '/scratch/' + func.decomp_me_scratch);
                return;
            }
        }
        generateDecompMeURL(func?.name ?? 'Untitled', cCode, originalAsm).then((slug) => {
            if (func != null) {
                // Save slug to database
                post(API_URL + '/functions/' + func.id + '/decompMe', { 'slug': slug });
            }
            openInNewTab(DECOMP_ME_FRONTEND + '/scratch/' + slug);
        }, setError);
    }

    const enterAsm = () => {
        const asm = window.prompt('Enter asm code');
        eventBus.dispatch('asm_code', asm);
    };

    const viewSubmissions = () => {
        if (func) {
            history.push('/functions/' + func.id);
        }
    };

    const toggleEquivalent = () => {
        if (submission) {
            if (window.confirm(isEquivalent
                ? 'Do you really want to mark this submission as non-equivalent? This means that the C code does not produce code that behaves the same as the original asm code.'
                : 'Do you really want to mark this submission as equivalent? This means that the C code behaves the same as the original asm code.'
            )) {
                const equiv = !isEquivalent
                setIsEquivalent(equiv);
                post(API_URL + '/submissions/' + submission.id + '/equivalent', { 'is_equivalent': equiv ? 'true' : 'false' });
            }
        }
    };

    const deleteSubmission = () => {
        if (submission) {
            if (window.confirm('Do you really want to delete this submission?')) {
                sendDelete(API_URL + '/submissions/' + submission.id, {});
                history.goBack();
            }
        }
    };

    useTitle(isCustom ? 'CUSTOM editor' : func?.name ?? '');

    useEffect(() => {
        getCurrentUser().then((user) => {
            if (user) {
                setIsLoggedIn(true);
                setUsername(user?.username ?? '');
                setEmail(user?.email ?? '');
                setUserId(user?.id ?? -1);
            } else {
                setIsLoggedIn(false);
            }
        }, (error) => { });
        const loadFunction = async (func: string, submission: string) => {
            const funcId = parseInt(func);
            // Fetch asm code from function
            getFunction(funcId).then((data) => {
                eventBus.dispatch('current-function', data.name);
                setFunc(data);
                let asmCode = '';
                if (data.asm !== undefined) {
                    asmCode = data.asm;
                    setOriginalAsm(data.asm)
                }

                if (parseInt(submission) === 0) {
                    get(API_URL + '/functions/' + func + '/headers').then((data) => {
                        setCCode(data.code);
                    }, setError);
                    setIsEquivalent(false);
                    setIsCompiling(false);
                } else {
                    get(API_URL + '/submissions/' + submission).then((data) => {

                        // Check that submission belongs to function
                        if (data.function !== funcId) {
                            setError(new Error('Submission does not belong to function.'));
                            return;
                        }

                        const lines = (asmCode.match(/\n/g) || '').length + 1;
                        const percent = 1 - (data.score / lines);
                        setDescription('Score: ' + data.score + ' (' + percent.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 1 }) + ')');

                        setSubmission(data);
                        // Fetch c code from submission
                        if (data.code !== undefined) {
                            setCCode(data.code)
                            // use the precompiled compile data
                            if (data.compiled) {
                                parseCompileData(JSON.parse(data.compiled))
                            } // TODO else debouncecompile?
                        }
                        setIsEquivalent(data.is_equivalent);

                        if (data.comments !== null && data.comments !== '') {
                            setComments(JSON.parse(data.comments));
                        }

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
            setIsDirty(true);
            debouncedCompile();
            //setIsCompiling(false);
        } else {
            // Load the submission defined via the URL
            loadFunction(match.params.function, match.params.submission);
        }

        const onCCode = (data: string) => {
            setCCode(data);
            setIsDirty(true);
            debouncedCompile();
        };
        const onAsmCode = (data: string) => {
            // TODO change url to /custom if it is no longer the same function?
            // send through pycat
            fetch(getCatURL(), {
                "method": "POST",
                "body": data
            }).then(data => data.text()).then((data) => {
                setIsCustom(true);
                eventBus.dispatch('on_editor_page', false);
                setOriginalAsm(data.trim());
                setCustomAsmCode(data.trim());
            }, setError);
        };
        const onAddCCode = (data: string) => {
            const code = cCodeRef.current + data;
            setCCode(code);
            setIsDirty(true);
            debouncedCompile();
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
            is_equivalent: isEquivalent || score === 0,
            parent: match.params.submission,
            compiled: JSON.stringify(compiled.data),
            username: username,
            email: email,
            comments: JSON.stringify(comments)
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

    const formatDocument = () => {
        setIsCompiling(true);
        fetch(getFormatterURL(), {
            "method": "POST",
            "body": cCodeRef.current
        }).then(data => data.text()).then((data) => {
            setCCode(data);
            setIsCompiling(false);
        }, setError);
    };

    useBeforeunload((event) => {
        if (hasUnsubmittedChanges) {
            event.preventDefault();
            return 'You have unsubmitted changes, are you sure you want to leave?';
        }
    });

    // Debounce on every keypress.
    const handleUserKeyPress = useCallback(event => {
        debouncedCompile();
    }, [debouncedCompile]);
    useEffect(() => {
        window.addEventListener("keydown", handleUserKeyPress, true);
        return () => {
            window.removeEventListener("keydown", handleUserKeyPress, true);
        };
    }, [handleUserKeyPress]);
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
            {func && func.best_score === 0 && submission && submission.score !== 0 && <div style={{ backgroundColor: '#bbed9c', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>This function has already been matched. <a href={'/functions/' + func.id} className='btn btn-success ml-8'>Go to submissions for this function</a></div>}
            {func && func.best_score !== 0 && func.decomp_me_matched && <div style={{ backgroundColor: '#951fd9', color: 'white', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>This function has been matched over on decomp.me. <a href={DECOMP_ME_FRONTEND + '/scratch/' + func.decomp_me_scratch} className='btn btn-outline-light ml-8'>Go to decomp.me</a></div>}
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
                        {usesTextarea
                            ? <textarea onChange={(e) => { onCodeChange(e.target.value) }} value={cCode} style={
                                {
                                    border: 'none',
                                    width: '100%',
                                    height: '100%',
                                    padding: '8px',
                                    fontFamily: 'monospace',
                                    fontSize: '14px',
                                    outline: 'none'
                                }
                            }></textarea>
                            : <CodeEditor
                                code={cCode}
                                stderr={compiled.stderr}
                                onCodeChange={onCodeChange}
                                formatDocument={formatDocument}
                            />
                        }
                    </div>
                    <div className="tab-pane fade" id="stderr" role="tabpanel" aria-labelledby="stderr-tab" style={{ flex: 1, overflow: "hidden" }}>
                        <ErrorLog stderr={compiled.stderr} isCompiling={isCompiling}></ErrorLog> </div>
                    <div className="tab-pane fade" id="diff" role="tabpanel" aria-labelledby="diff-tab" style={{ flex: 1, overflow: "hidden" }}>
                        <DiffEditor
                            compiledAsm={compiled.asm}
                            originalAsm={originalAsm}
                            lines={compiled.lines}
                            comments={comments}
                            setComments={setComments}
                            onScoreChange={onScoreChange}
                        /></div>
                </div>
                <div style={{ borderTop: "1px solid #eee", backgroundColor: "#f8f9fa", fontSize: "14px", whiteSpace: "nowrap", overflowX: "auto", overflowY: "revert", flexShrink: 0 }}>
                    <div className="container" style={{ display: "flex", alignItems: "center" }}>
                        <ul className="nav nav-pills" id="myTab" role="tablist" style={{ flexShrink: 0 }}>
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
                        <FuncNameMenu copyLink={copyLink} name={func?.name} isCustom={isCustom} exportCExplore={exportCExplore} exportDecompMe={exportDecompMe} showOneColumn={true} usesTextarea={usesTextarea} setUseTextarea={setUseTextarea} enterAsm={enterAsm} viewSubmissions={viewSubmissions} isLoggedIn={isLoggedIn} isEquivalent={isEquivalent} toggleEquivalent={toggleEquivalent} hasUnsubmittedChanged={hasUnsubmittedChanges} isOwnedByUser={isOwnedByUser} deleteSubmission={deleteSubmission}></FuncNameMenu>
                        <span style={{ flex: 1 }}></span>
                        <DiffScore score={score}></DiffScore>
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

                {settings.compileDumps && <div style={{ position: "absolute", bottom: "8px", left:"0px", right:"0px", display: "flex",margin: "auto", gap: "16px", width:"224px" }}>
                    <div className="form-check">
                        <input type="checkbox" id="showCode" className="form-check-input" checked={showCode} onChange={e => setShowCode(e.target.checked)} />
                        <label className="form-check-label" htmlFor="showCode">Code</label>
                    </div>
                    <div className="form-check">
                        <input type="checkbox" id="showDumps" className="form-check-input" checked={showDumps} onChange={e => setShowDumps(e.target.checked)} />
                        <label className="form-check-label" htmlFor="showDumps">Dumps</label>
                    </div>
                    <div className="form-check">
                        <input type="checkbox" id="showAsm" className="form-check-input" checked={showAsm} onChange={e => setShowAsm(e.target.checked)} />
                        <label className="form-check-label" htmlFor="showAsm">Asm</label>
                    </div>
                </div>}

                <Container style={{ overflow: "hidden", flex: 1 }}>
                    {showCode && <Section>
                        <CodeEditor
                            code={cCode}
                            stderr={compiled.stderr}
                            onCodeChange={onCodeChange}
                            formatDocument={formatDocument}
                        />
                    </Section>}
                    {showCode && <Bar size={1} style={{ background: '#eee', cursor: 'col-resize' }}
                        expandInteractiveArea={{ left: 2, right: 2 }} />}
                    {showDumps && <Section style={{ display: "flex" }}>
                        <CompilerDump stages={stages}></CompilerDump>
                    </Section>}
                    {showDumps && <Bar size={1} style={{ background: '#eee', cursor: 'col-resize' }}
                        expandInteractiveArea={{ left: 2, right: 2 }} />}
                    {showAsm && <Section style={{ display: "flex" }}>
                        <Container vertical style={{ overflow: "hidden", flex: 1, display: "flex" }}>
                            <Section minSize={100}>
                                <DiffEditor
                                    compiledAsm={compiled.asm}
                                    originalAsm={originalAsm}
                                    lines={compiled.lines}
                                    comments={comments}
                                    setComments={setComments}
                                    onScoreChange={onScoreChange}
                                />
                            </Section>
                            <Bar size={1} style={{ background: '#eee', cursor: 'col-resize' }}
                                expandInteractiveArea={{ top: 2, bottom: 2 }} />
                            <Section minSize={100} defaultSize={200} style={{ display: "flex" }}>
                                <ErrorLog stderr={compiled.stderr} isCompiling={isCompiling}></ErrorLog>
                            </Section>
                        </Container>
                    </Section>}
                </Container>
                <div style={{ borderTop: "1px solid #eee", backgroundColor: score === 0 ? "#bbed9c" : "#f8f9fa", fontSize: "14px" }}>
                    <div className="container" style={{ display: "flex", padding: "4px", alignItems: "center" }}>
                        <FuncNameMenu copyLink={copyLink} name={func?.name} isCustom={isCustom} exportCExplore={exportCExplore} exportDecompMe={exportDecompMe} showOneColumn={false} usesTextarea={usesTextarea} setUseTextarea={setUseTextarea} enterAsm={enterAsm} viewSubmissions={viewSubmissions} isLoggedIn={isLoggedIn} isEquivalent={isEquivalent} toggleEquivalent={toggleEquivalent} hasUnsubmittedChanged={hasUnsubmittedChanges} isOwnedByUser={isOwnedByUser} deleteSubmission={deleteSubmission}></FuncNameMenu>
                        <span style={{ flex: 1 }}></span>
                        <DiffScore score={score}></DiffScore>
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