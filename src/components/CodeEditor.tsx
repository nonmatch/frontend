import { throttle } from "lodash";
import { useEffect } from "react";
import MonacoEditor, { monaco } from "react-monaco-editor";
import eventBus from "../eventBus";
import { ErrorLine } from "../types";

interface CodeEditorProps {
    code: string,
    stderr: ErrorLine[],
    onCodeChange: (text: string) => void,
    formatDocument: () => void,
}
let editor: any;
let prevDecorations: any = [];
let fadeTimeoutId: any = -1;

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, stderr, onCodeChange, formatDocument }) => {
    const options = {
        automaticLayout: true,
        minimap: {
            enabled: false
        }
    };


    // Mouse move
    const onMouseMove = (e: any) => {
        if (e !== null && e.target !== null && e.target.position !== null) {
            eventBus.dispatch('panesLinkLine', {
                line: e.target.position.lineNumber,
                reveal: e.event.ctrlKey
            });
            //          tryPanesLinkLine(e.target.position.lineNumber, false);
        }
    };

    const mouseMoveThrottledFunction = throttle(onMouseMove, 50);


    // Focus this editor at the beginning
    const editorDidMount = (_editor: any, _monaco: any) => {
        editor = _editor;
        editor.focus();
        editor.onMouseMove((e: any) => {
            mouseMoveThrottledFunction(e);
        });

        editor.addAction({
            id: 'format-document-action',
            label: 'Format Document',
            keybindings: [
                monaco.KeyMod.chord(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_K,
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_F
                )
            ],

            run() {
                formatDocument();
            }
        });
    }



    // Draw squiggly lines
    useEffect(() => {
        if (!monaco) { return; }

        var widgets = stderr.flatMap(function (obj) {
            if (!obj.tag) return []; // Nothing
            var severity = 8; // error
            if (obj.tag.text.match(/^warning/i)) severity = 4;
            if (obj.tag.text.match(/^note/i)) severity = 1;
            return {
                severity: severity,
                message: obj.tag.text,
                //                source: compiler.name + ' #' + compilerId,
                startLineNumber: obj.tag.line,
                startColumn: obj.tag.column || 0,
                endLineNumber: obj.tag.line,
                endColumn: obj.tag.column ? -1 : Infinity,
            };
        });
        monaco.editor.setModelMarkers(editor.getModel(), 'stderr', widgets);
    }, [stderr]);

    const clearLinkedLine = () => {
        prevDecorations = editor.deltaDecorations(prevDecorations, []);
    };

    useEffect(() => {
        // Line link
        const onLineLink = (data: any) => {
            if (!monaco) { return; }

            if (data.reveal && data.line) {
                editor.revealLineInCenter(data.line);
            }
            let decorations = [{
                range: new monaco.Range(data.line, 1, data.line, 1),
                options: {
                    isWholeLine: true,
                    linesDecorationsClassName: 'linked-code-decoration-margin',
                    className: 'linked-code-decoration-line',
                },
            }];

            prevDecorations = editor.deltaDecorations(prevDecorations, decorations);


            if (fadeTimeoutId !== -1) {
                clearTimeout(fadeTimeoutId);
            }
            fadeTimeoutId = setTimeout(() => {
                clearLinkedLine();
                fadeTimeoutId = -1;
            }, 3000);
        };
        eventBus.on('lineLink', onLineLink);
        return () => {
            // Cleanup
            eventBus.remove('lineLink', onLineLink);
        };
    }, []);


    return (
        <MonacoEditor
            width="100%"
            height="100%"
            language="cpp"
            theme="customTheme"
            value={code}

            options={options}
            onChange={onCodeChange}
            editorDidMount={editorDidMount}
        />
    );
}