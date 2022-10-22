import { throttle } from "lodash";
import { useEffect, useRef, useState } from "react";
import { monaco, MonacoDiffEditor } from "react-monaco-editor";
import { LINKER_URL } from "../constants";
import eventBus from "../eventBus";
import { Sources, Stage } from "../types";

interface CompilerDumpProps {
    stages: Stage[];
}

let editor: monaco.editor.IStandaloneDiffEditor;
let prevLeftDecorations: any = [];
let prevRightDecorations: any = [];
let fadeTimeoutId: any = -1;

export const CompilerDump: React.FC<CompilerDumpProps> = ({ stages }) => {

    interface LineHint {
        code: number; // Line number in the c code
        dump: number; // Line number in the dump
    }

    const [left, setLeft] = useState('');
    const [right, setRight] = useState('');
    const [leftLineNumbers, setLeftLineNumbers] = useState<LineHint[]>([]);
    const [rightLineNumbers, setRightLineNumbers] = useState<LineHint[]>([]);
    const leftRef = useRef<LineHint[]>(); leftRef.current = leftLineNumbers;
    const rightRef = useRef<LineHint[]>(); rightRef.current = rightLineNumbers;

    const [selectedIndex, setSelectedIndex] = useState(0);

    const options = {
        automaticLayout: true,
        minimap: {
            enabled: false
        },
        readOnly: true,
        domReadOnly: true
    };

    // Mouse move
    const onMouseMoveLeft = (e: any) => {
        const lineNumbers = leftRef.current;
        if (e !== null && e.target !== null && e.target.position !== null && lineNumbers != null) {
            for (let i = 0; i < lineNumbers.length - 1; i++) {
                if (e.target.position.lineNumber >= lineNumbers[i].dump && e.target.position.lineNumber < lineNumbers[i + 1].dump) {
                    eventBus.dispatch('panesLinkLine', {
                        line: lineNumbers[i].code,
                        reveal: e.event.ctrlKey,
                        source: Sources.FromDump,
                    });
                    break;
                }
            }
        }
    };
    const mouseMoveLeftThrottledFunction = throttle(onMouseMoveLeft, 50);

    const onMouseMoveRight = (e: any) => {
        const lineNumbers = rightRef.current;
        if (e !== null && e.target !== null && e.target.position !== null && lineNumbers != null) {
            for (let i = 0; i < lineNumbers.length - 1; i++) {
                if (e.target.position.lineNumber >= lineNumbers[i].dump && e.target.position.lineNumber < lineNumbers[i + 1].dump) {
                    eventBus.dispatch('panesLinkLine', {
                        line: lineNumbers[i].code,
                        reveal: e.event.ctrlKey,
                        source: Sources.FromDump,
                    });
                    break;
                }
            }
        }
    };
    const mouseMoveRightThrottledFunction = throttle(onMouseMoveRight, 50);

    const editorDidMount = (_editor: monaco.editor.IStandaloneDiffEditor, _monaco: any) => {
        editor = _editor;

        editor.getOriginalEditor().onMouseMove((e: any) => {
            mouseMoveLeftThrottledFunction(e);
        });
        editor.getModifiedEditor().onMouseMove((e: any) => {
            mouseMoveRightThrottledFunction(e);
        });
    };

    // Load the selected and the next stage dump.
    const loadStages = async (index: number) => {
        if (index > stages.length - 2) {
            index = stages.length - 2;
        }
        setSelectedIndex(index);
        try {
            loadStage(stages[index].path, false);
            loadStage(stages[index + 1].path, true);
        } catch (e: any) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (stages.length > 1) {
            loadStages(selectedIndex);
        }
        // eslint-disable-next-line
    }, [stages]);

    const loadStage = async (path: string, right: boolean) => {
        let res = await fetch(LINKER_URL + path);
        const code = await res.text()
        if (right) {
            setRight(code);
        } else {
            setLeft(code);
        }

        // parse lines
        const lines = code.split('\n');
        let asmLines: LineHint[] = [];
        for (let i = 0; i < lines.length; i++) {
            const text = lines[i];
            if (text.includes('/data/input.c')) {
                const parts = text.split(')');
                if (parts.length === 3) {
                    const line = parseInt(parts[1]);
                    asmLines.push({ 'code': line, 'dump': i + 1 });
                }
            }
        }
        if (right) {
            setRightLineNumbers(asmLines);
        } else {
            setLeftLineNumbers(asmLines);
        }
    }


    const getButtonClasses = (index: number) => {
        if (index === selectedIndex) {
            return 'btn btn-danger btn-sm'
        }
        if (index === selectedIndex + 1) {
            return 'btn btn-success btn-sm'
        }
        return 'btn btn-sm';
    }

    const clearLinkedLine = () => {
        prevLeftDecorations = editor.getOriginalEditor().deltaDecorations(prevLeftDecorations, []);
        prevRightDecorations = editor.getModifiedEditor().deltaDecorations(prevRightDecorations, []);
    };

    useEffect(() => {
        const onPanesLinkLine = (data: any) => {
            if (!editor) { return };
            let leftLineNums: number[] = [];
            let rightLineNums: number[] = [];

            for (let i = 0; i < leftLineNumbers.length - 1; i++) {
                if (leftLineNumbers[i].code === data.line) {
                    for (let j = leftLineNumbers[i].dump; j < leftLineNumbers[i + 1].dump; j++) {
                        leftLineNums.push(j);
                    }
                    break;
                }
            }

            for (let i = 0; i < rightLineNumbers.length - 1; i++) {
                if (rightLineNumbers[i].code === data.line) {
                    for (let j = rightLineNumbers[i].dump; j < rightLineNumbers[i + 1].dump; j++) {
                        rightLineNums.push(j);
                    }
                    break;
                }
            }

            if (leftLineNums.length > 0 || rightLineNums.length > 0) {
                // Also link the corresponding line in the editor
                eventBus.dispatch('lineLink', {
                    line: data.line,
                    reveal: data.reveal && data.source === Sources.FromDump
                });


                if (data.reveal && data.source !== Sources.FromDump) {
                    if (leftLineNums.length > 0) {
                        editor.getOriginalEditor().revealLineInCenter(leftLineNums[0]);
                    }
                    if (rightLineNums.length > 0) {
                        editor.getModifiedEditor().revealLineInCenter(rightLineNums[0]);
                    }
                }
            }

            let leftDecorations = leftLineNums.map((line) => {
                return {
                    range: new monaco.Range(line, 1, line, 1),
                    options: {
                        isWholeLine: true,
                        linesDecorationsClassName: 'linked-code-decoration-margin',
                        className: 'linked-code-decoration-line',
                    },
                };
            });
            prevLeftDecorations = editor.getOriginalEditor().deltaDecorations(prevLeftDecorations, leftDecorations);

            let rightDecorations = rightLineNums.map((line) => {
                return {
                    range: new monaco.Range(line, 1, line, 1),
                    options: {
                        isWholeLine: true,
                        linesDecorationsClassName: 'linked-code-decoration-margin',
                        className: 'linked-code-decoration-line',
                    },
                };
            });
            prevRightDecorations = editor.getModifiedEditor().deltaDecorations(prevRightDecorations, rightDecorations);

            if (fadeTimeoutId !== -1) {
                clearTimeout(fadeTimeoutId);
            }
            fadeTimeoutId = setTimeout(() => {
                clearLinkedLine();
                fadeTimeoutId = -1;
            }, 3000);
        };


        eventBus.on('panesLinkLine', onPanesLinkLine);
        return () => {
            // Remove listeners
            eventBus.remove('panesLinkLine', onPanesLinkLine)
        };
    }, [leftLineNumbers, rightLineNumbers]);

    return (
        <div style={{ width: "100%" }}>
            <ul>
                {stages.map((stage, index) => (
                    <li key={index} onClick={() => loadStages(index)} className={getButtonClasses(index)}>
                        {stage.name}
                    </li>
                ))}
            </ul>
            <MonacoDiffEditor
                language="asm"
                original={left}
                value={right}
                options={options}
                theme="customTheme"
                editorDidMount={editorDidMount} />
        </div>
    );
}