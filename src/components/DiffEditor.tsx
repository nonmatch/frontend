import React, { useEffect, useRef } from "react";
import { monaco, MonacoDiffEditor } from "react-monaco-editor";
import eventBus from "../eventBus";
import { AsmLine, Comment } from "../types";
import { throttle } from "lodash";


interface DiffEditorProps {
    compiledAsm: string,
    originalAsm: string,
    lines: AsmLine[],
    comments: Comment[],
    setComments: React.Dispatch<React.SetStateAction<Comment[]>>,
    onScoreChange: (score: number) => void
}

let editor: monaco.editor.IStandaloneDiffEditor;
let prevDecorations: any = [];
let fadeTimeoutId: any = -1;
let gLines: AsmLine[] = []; // get the up to date value of the lines prop in the event listener

let prevDecorationsModified: any = [];


export const DiffEditor: React.FC<DiffEditorProps> = ({ compiledAsm, originalAsm, lines, comments, setComments, onScoreChange }) => {

    const commentsRef = useRef<Comment[]>();
    commentsRef.current = comments;

    gLines = lines;
    const options = {
        automaticLayout: true,
        minimap: {
            enabled: false
        },
        readOnly: true,
        domReadOnly: true
    };

    // Mouse move
    const onMouseMove = (e: any) => {
        if (e !== null && e.target !== null && e.target.position !== null) {

            if (e.target.position.lineNumber - 1 >= gLines.length) {
                return;
            }
            const hoverAsm = gLines[e.target.position.lineNumber - 1];
            if (hoverAsm.source) {
                eventBus.dispatch('panesLinkLine', {
                    line: hoverAsm.source.line,
                    reveal: e.event.ctrlKey,
                    fromAsm: true
                });
            }
            //          tryPanesLinkLine(e.target.position.lineNumber, false);
        }
    };

    const mouseMoveThrottledFunction = throttle(onMouseMove, 50);


    const editorDidMount = (_editor: monaco.editor.IStandaloneDiffEditor, _monaco: any) => {
        editor = _editor;
        editor.onDidUpdateDiff(() => {
            let score = 0;
            const lineChanges = editor.getLineChanges();
            if (lineChanges !== null) {
                for (const change of lineChanges) {
                    score += Math.max(change.originalEndLineNumber - change.originalStartLineNumber + 1,
                        change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1);
                }
            }
            onScoreChange(score);

        });
        editor.getOriginalEditor().onMouseMove((e: any) => {
            mouseMoveThrottledFunction(e);
        });
        editor.getModifiedEditor().addCommand(monaco.KeyCode.KEY_C, () => {
            const line = editor.getModifiedEditor().getPosition()?.lineNumber ?? 0;
            let text = '';
            let found = false;
            for (const comment of commentsRef.current ?? []) {
                if (comment.line === line) {
                    text = comment.text;
                    found = true;
                    break;
                }
            }
            const newText = prompt(`Edit comment for line ${line}`, text);
            if (newText !== null) {
                if (found) {
                    if (newText !== '') {
                        setComments(comments => comments.map((comment) => comment.line === line ? {line, text: newText}: comment));
                    } else {
                        setComments(comments => comments.filter((comment) => comment.line !== line));
                    }
                } else {
                    if (newText !== '') {
                        setComments(comments => [...comments, {line, text: newText}]);
                    }
                }
            }
        });

        // Add some simpler shortcuts for some actions.
        editor.getModifiedEditor().addCommand(monaco.KeyCode.KEY_X, () => {
            //let actions = editor.getModifiedEditor().getSupportedActions().map((a) => a.label + ' => ' + a.id);
            //console.log(actions);
            editor.getModifiedEditor().getAction('editor.action.selectHighlights').run();
        });
        editor.getModifiedEditor().addCommand(monaco.KeyCode.KEY_V, () => {
            editor.getModifiedEditor().getAction('editor.action.previousSelectionMatchFindAction').run();
        });
        editor.getModifiedEditor().addCommand(monaco.KeyCode.KEY_B, () => {
            editor.getModifiedEditor().getAction('editor.action.nextSelectionMatchFindAction').run();
        });
    }


    useEffect(() => {
        const updateComments = () => {
            if (!editor) {return;}
            let decorations =
                comments.map((comment) => {
                    return {
                        range: new monaco.Range(comment.line, 1, comment.line, 1000),
                        options: {
                            isWholeLine: true,
                            after: {
                                content: '    ' + comment.text,
                                inlineClassName: 'diff-comment',
                            }
                        }
                    };
                });
            prevDecorationsModified = editor.getModifiedEditor().deltaDecorations(prevDecorationsModified, decorations);
        };
        updateComments();
    }, [comments, compiledAsm]);

    const clearLinkedLine = () => {
        prevDecorations = editor.getOriginalEditor().deltaDecorations(prevDecorations, []);
    };

    useEffect(() => {
        const onPanesLinkLine = (data: any) => {
            if (!editor) { return };
            let lineNums: number[] = [];
            // Find all corresponding asm lines
            gLines.forEach((line, index) => {
                if (line.source && line.source.line === data.line) {
                    lineNums.push(index + 1);
                }
            });

            if (lineNums.length > 0) {
                // Also link the corresponding line in the editor
                const hoverAsm = gLines[lineNums[0] - 1];
                eventBus.dispatch('lineLink', {
                    line: hoverAsm.source?.line,
                    reveal: data.reveal && data.fromAsm
                });
                if (data.reveal && !data.fromAsm) {
                    editor.getOriginalEditor().revealLineInCenter(lineNums[0]);
                }
            }

            let decorations = lineNums.map((line) => {
                return {
                    range: new monaco.Range(line, 1, line, 1),
                    options: {
                        isWholeLine: true,
                        linesDecorationsClassName: 'linked-code-decoration-margin',
                        className: 'linked-code-decoration-line',
                    },
                };
            });
            prevDecorations = editor.getOriginalEditor().deltaDecorations(prevDecorations, decorations);

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
    }, []);

    return (
        <MonacoDiffEditor
            language="asm"
            original={compiledAsm}
            value={originalAsm}
            options={options}
            theme="customTheme"
            editorDidMount={editorDidMount} />);
}
