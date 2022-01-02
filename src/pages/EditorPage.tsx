import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef, useState } from "react";
import { RouteComponentProps, useHistory } from "react-router";
import { Link } from "react-router-dom";
import { Bar, Container, Section } from "react-simple-resizer";
import { get, post } from "../api";
import { CodeEditor } from "../components/CodeEditor"
import { DiffEditor } from "../components/DiffEditor";
import { ErrorLog } from "../components/ErrorLog";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { API_URL, CEXPLORE_URL, COMPILE_DEBOUNCE_TIME } from "../constants";
import { getFunction } from "../repositories/function";
import { AsmLine, ErrorLine, Func } from "../types";

interface Params {
    function: string,
    submission: string,
}
const EditorPage: React.FC<RouteComponentProps<Params>> = ({ match }) => {

    // State
    const [cCode, setCCode] = useState(
        '// Type your c code here...'
    )

    const [isCompiling, setIsCompiling] = useState(true);
    const [compiled, setCompiled] = useState<{
        asm: string,
        lines: AsmLine[],
        stderr: ErrorLine[]}>(
        {
            asm: 'The compiled asm of your code will appear here...',
            lines: [],
            stderr: []
        }

    )
    const [originalAsm, setOriginalAsm] = useState(
        'original asm'
    )

    const [func, setFunc] = useState<Func |null>(null)

    const [score, setScore] = useState(-1);



    const debouncedCompile =
        useCallback(
            debounce(nextValue => compile(nextValue), COMPILE_DEBOUNCE_TIME), []);

    const onCodeChange = (newValue: any) => {
        setCCode(newValue)
        debouncedCompile(newValue);
    }

    const onScoreChange = (score: number) => {
        setScore(score);
    };
    const compile = async (nextValue: any) => {
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

        const code = data.asm.map((line: any) => line.text).join('\n')

        setIsCompiling(false);
        setCompiled({
            asm: code,
            lines: data.asm,
            stderr: data.stderr//data.stderr.map((line: any) => line.text).join('\n')
        })
    } catch(e:any) {
        setIsCompiling(false);
        setCompiled({
            asm: '',
            lines: [],
            stderr: [{text: 'ERROR: ' + e.message}]
        })
    }
    }

    const loadFunction = async (func: string, submission: string) => {
        // Fetch asm code from function
        let data = await getFunction(parseInt(func))
        setFunc(data)
        if (data.asm !== undefined) {
            setOriginalAsm(data.asm)
        }

        if (parseInt(submission) === 0) {
            setIsCompiling(false);
        } else {
            data = await get(API_URL+'submissions/'+submission)
            // Fetch c code from submission
            if (data.code !== undefined) {
                setCCode(data.code)
                debouncedCompile(data.code);
            }
        }

      
    }

    useEffect(() => {
        loadFunction(match.params.function, match.params.submission)
    }, [match.params.function, match.params.submission]) // TODO why does it want me to add loadFunction as a dependency here?

    const history = useHistory();
    const submit = async () => {
        let modal = new (window as any).bootstrap.Modal(document.getElementById('modalTest'));
        modal.show();
        // TODO ask if submitted while not logged in?
        return;
        let data = await post(API_URL+'functions/'+match.params.function+'/submissions', {
            code: cCode,
            score: score,
            is_equivalent: false, // TODO
            parent: match.params.submission
        })
//        console.log(data)
        history.push('/functions/' + match.params.function + '/submissions/' + data.id);
        // TODO show message that the submission was saved with a button to copy the link
    };

    const showOneColumn = () => {
        return window.innerWidth < 800;
    };

if (showOneColumn()) {
    // One column with tabs
    // TODO also add a textarea version of the editor to be able to copy and paste code?
    // TODO indicate a compiler error in one column mode by turning the stderr tab red
    return (
        <>    

<div className="tab-content" id="myTabContent" style={{flex:1, display:"flex"}}>
  <div className="tab-pane fade show active" id="code" role="tabpanel" aria-labelledby="code-tab" style={{flex:1, overflow:"hidden"}}>
  <CodeEditor
                            code={cCode}
                            stderr={compiled.stderr}
                            onCodeChange={onCodeChange}
                            
                        />
      </div>
  <div className="tab-pane fade" id="stderr" role="tabpanel" aria-labelledby="stderr-tab" style={{flex:1, overflow:"hidden"}}>            <ErrorLog stderr={compiled.stderr} isCompiling={isCompiling}></ErrorLog> </div>
  <div className="tab-pane fade" id="diff" role="tabpanel" aria-labelledby="diff-tab" style={{flex:1, overflow:"hidden"}}><DiffEditor
            compiledAsm={compiled.asm}
            originalAsm={originalAsm}
            lines={compiled.lines}
            onScoreChange={onScoreChange}
        /></div>
</div>
<div style={{ borderTop:"1px solid #eee", backgroundColor:"#f8f9fa", fontSize:"14px"}}>
        <div className="container" style={{display:"flex", alignItems:"center"}}>
            <ul className="nav nav-pills" id="myTab" role="tablist">
  <li className="nav-item" role="presentation">
    <button className="nav-link active" id="code-tab" data-bs-toggle="tab" data-bs-target="#code" type="button" role="tab" aria-controls="code" aria-selected="true">Code</button>
  </li>
  <li className="nav-item" role="presentation">
    <button className="nav-link text-danger" id="stderr-tab" data-bs-toggle="tab" data-bs-target="#stderr" type="button" role="tab" aria-controls="stderr" aria-selected="false">Stderr</button>
  </li>
  <li className="nav-item" role="presentation">
    <button className="nav-link" id="diff-tab" data-bs-toggle="tab" data-bs-target="#diff" type="button" role="tab" aria-controls="diff" aria-selected="false">Diff</button>
  </li>
</ul>
      <span style={{flex:1, overflowX:"auto", paddingLeft:"8px"}}>{func?.name}</span>
            <span style={{padding: "0 8px"}}>
                            Diff Score: {score}
                    </span>
                    {
                        isCompiling
                        ? /*<button className="btn btn-secondary btn-sm" disabled>Submit</button>*/
                        <LoadingIndicator small/>
                        : <button className={
                            "btn btn-sm" + (score === 0 ? 
                            " btn-success"
                            : " btn-outline-success")
                         } onClick={submit}>Submit</button>
                    }
        </div>
        </div>
</>

);

} else {
    // Two columns
    return (
        <>
        {
    // modal dialog
}
<div className="modal fade" id="modalTest" tabIndex={-1} role="dialog">
    <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
            <div className="modal-header">
                <h5 className="modal-title">Submit Function</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true"></span>
                </button>
            </div>
            <div className="modal-body">

                <div>
                <input type="checkbox" /> Is functionally equivalent
                </div>
<hr />
<div>
    <p>Login to claim or add yourself as the author of this commit?</p>
                <Link className="btn btn-secondary btn-sm" to="/login">
                <i className="fa fa-github fa-fw"></i>
                <span>Login with GitHub</span>
            </Link>

            <hr />
            <input type="text" placeholder="Username" />
            <input type="text" placeholder="E-Mail" />
            </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" className="btn btn-primary">Save changes</button>
            </div>
        </div>
    </div>
</div>

            <Container style={{ overflow:"hidden",flex:1 }}>
    <Section minSize={100}>
    <CodeEditor
                            code={cCode}
                            stderr={compiled.stderr}
                            onCodeChange={onCodeChange}
                        />
                                </Section>
    <Bar size={1} style={{ background: '#eee', cursor: 'col-resize' }}
                expandInteractiveArea={{ left: 2, right: 2 }} />
    <Section minSize={100} style={{display:"flex"}}>
        <Container vertical  style={{ overflow:"hidden",flex:1,display:"flex" }}>
            <Section  minSize={100}>
            <DiffEditor
            compiledAsm={compiled.asm}
            originalAsm={originalAsm}
            lines={compiled.lines}
            onScoreChange={onScoreChange}
        />
            </Section>
            <Bar size={1} style={{ background: '#eee', cursor: 'col-resize' }} 
                expandInteractiveArea={{ top: 2, bottom: 2 }}/>
            <Section minSize={100} defaultSize={200} style={{display:"flex"}}>
            <ErrorLog stderr={compiled.stderr} isCompiling={isCompiling}></ErrorLog> 
            </Section>
        </Container>

        </Section>
  </Container>
  <div style={{ borderTop:"1px solid #eee", backgroundColor:"#f8f9fa", fontSize:"14px"}}>
        <div className="container" style={{display:"flex", padding:"4px", alignItems:"center"}}>
            <span>{func?.name}</span>
            <span style={{flex:1}}></span>
            <span style={{padding: "0 8px"}}>
                            Diff Score: {score}
                    </span>
                    {
                        isCompiling
                        ? <button className="btn btn-secondary btn-sm" disabled>Submit</button>
                        : <button  className={
                            "btn btn-sm" + (score === 0 ? 
                            " btn-success"
                            : " btn-outline-success")} onClick={submit}>Submit</button>
                    }
                    </div>

        </div>
{/*
            <div style={{
                flexDirection: 'row',
                flex: '1',
                display: 'flex',
                flexGrow: 1,
                padding: '0px',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
            >

                <div style={{
                    flex: 1,
                    flexDirection: 'column',
                    display: 'flex'
                }}>

                    <div style={{
                        flexGrow: 1,
                        maxHeight: '70%'
                    }}>



                    </div>
                    <div style={{
                        flexGrow: 1,
                        flexBasis: 'auto',
                        paddingTop: '20px'
                    }}>
                        <div style={{
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                            padding: '20px',
                            height: '100%',
                            whiteSpace: 'pre'
                        }}>

                            {compiled.stderr}
                        </div>
                    </div>

                </div>
                <div className="spacer" style={{ width: "8px" }} />
                <div style={{
                    width: "50%",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    <div style={{
                        flexGrow: 1
                    }}>
                        <DiffEditor
                            compiledAsm={compiled.asm}
                            originalAsm={originalAsm}
                            onScoreChange={onScoreChange}
                        />
                    </div>
                    <div style={{
                        marginTop: "20px",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center"
                    }}>
                        <span>
                            Diff Score: {score}
                    </span>
                        <button className="success" style={{
                            color: '#fff',
                            border: "none",
                            padding: "10px 30px",
                            borderRadius: "4px",
                            marginLeft: "20px",
                            cursor: "pointer",
                            display: "inline-block"
                        }}
                        onClick={submit}>Submit</button>
                    </div>
                </div>
            </div>
                    */}
        </>
    )
}

}

export default EditorPage;