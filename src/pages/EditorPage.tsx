import debounce from "lodash.debounce";
import { useRef } from "react";
import { useCallback, useEffect, useState } from "react";
import { Prompt, RouteComponentProps, useHistory, useLocation } from "react-router";
import { Bar, Container, Section } from "react-simple-resizer";
import { get, post } from "../api";
import { generateCExploreURL } from "../cexplore";
import { CodeEditor } from "../components/CodeEditor"
import { DiffEditor } from "../components/DiffEditor";
import { ErrorAlert } from "../components/ErrorAlert";
import { ErrorLog } from "../components/ErrorLog";
import { FuncNameMenu } from "../components/FuncNameMenu";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { SubmitDialog } from "../components/SubmitDialog";
import { SuccessToast } from "../components/SuccessToast";
import { API_URL, COMPILE_DEBOUNCE_TIME, DECOMP_ME_FRONTEND} from "../constants";
import { generateDecompMeURL } from "../decompme";
import eventBus from "../eventBus";
import { getFunction } from "../repositories/function";
import { getCurrentUser } from "../repositories/user";
import { AsmLine, Comment, ErrorLine, Func, Submission } from "../types";
import { getCompileURL, getCatURL, openInNewTab, useLocalStorage, useTitle } from "../utils";

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
    const [hasUnsubmittedChanges, setHasUnsubmittedChanges] = useState(false);
    // Is custom code? No longer able to submit
    const [isCustom, setIsCustom] = useState(false);
    const [customCCode, setCustomCCode] = useLocalStorage('custom_c_code', '// Type your c code here...');
    const [customAsmCode, setCustomAsmCode] = useLocalStorage('custom_asm_code', '@ Paste the asm code here...'); // TODO allow to enter custom asm code
    const [usesTextarea, setUseTextarea] = useLocalStorage('use_textarea', false);

    // https://stackoverflow.com/a/60643670
    const cCodeRef = useRef<string>();
    cCodeRef.current = cCode;

    const funcRef = useRef<Func | null>();
    funcRef.current = func;

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
            setCustomCCode(cCodeRef.current);
        }

        setIsCompiling(true);
        //        console.log('compiling', nextValue);
        try {
            let compileFlags = '-O2';
            if (funcRef.current?.compile_flags) {
                compileFlags += ' ' + funcRef.current?.compile_flags;
            }

            console.log(compileFlags, funcRef.current?.compile_flags)

            const res = await fetch(getCompileURL(), {
                'headers': {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'content-type': 'application/json',
                },
                'body':
                    JSON.stringify({
                        source: nextValue,
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
                post(API_URL + '/functions/' + func.id + '/decompMe', {'slug': slug});
            }
            openInNewTab(DECOMP_ME_FRONTEND + '/scratch/' +slug);
        }, setError);
    }

    const enterAsm = () => {
        const asm = window.prompt('Enter asm code');
        eventBus.dispatch('asm_code', asm);
    };

    useTitle(isCustom ? 'CUSTOM editor' : func?.name ?? '');

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
                    get(API_URL+'/functions/' + func + '/headers').then((data) => {
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

                        if (data.comments !== null) {
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
            {func && func.best_score === 0 && submission && submission.score !== 0 && <div style={{backgroundColor: '#bbed9c', padding:8, display:'flex', alignItems:'center', justifyContent:'center', gap:'20px'}}>This function has already been matched. <a href={'/functions/' + func.id} className='btn btn-success ml-8'>Go to submissions for this function</a></div>}
            {func && func.best_score !== 0 && func.decomp_me_matched && <div style={{backgroundColor: '#951fd9', color:'white', padding:8, display:'flex', alignItems:'center', justifyContent:'center', gap:'20px'}}>This function has been matched over on decomp.me. <a href={DECOMP_ME_FRONTEND + '/scratch/' + func.decomp_me_scratch} className='btn btn-outline-light ml-8'>Go to decomp.me</a></div>}
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
                            ? <textarea onChange={(e) => {onCodeChange(e.target.value)}} value={cCode} style={
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
                        <FuncNameMenu copyLink={copyLink} name={func?.name} isCustom={isCustom} exportCExplore={exportCExplore} exportDecompMe={exportDecompMe} showOneColumn={true} usesTextarea={usesTextarea} setUseTextarea={setUseTextarea} enterAsm={enterAsm}></FuncNameMenu>
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
                    </Section>
                </Container>
                <div style={{ borderTop: "1px solid #eee", backgroundColor: score === 0 ? "#bbed9c" : "#f8f9fa", fontSize: "14px" }}>
                    <div className="container" style={{ display: "flex", padding: "4px", alignItems: "center" }}>
                        <FuncNameMenu copyLink={copyLink} name={func?.name} isCustom={isCustom} exportCExplore={exportCExplore} exportDecompMe={exportDecompMe} showOneColumn={false} usesTextarea={usesTextarea} setUseTextarea={setUseTextarea} enterAsm={enterAsm}></FuncNameMenu>
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