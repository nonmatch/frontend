import React, { useEffect } from "react";
import { monaco, MonacoDiffEditor } from "react-monaco-editor";
import eventBus from "../eventBus";
import { AsmLine } from "../types";
import { throttle } from "lodash";


interface DiffEditorProps {
    compiledAsm: string,
    originalAsm: string,
    lines: AsmLine[],
    onScoreChange: (score: number) => void
}

let editor:any;
let prevDecorations:any = [];
let fadeTimeoutId: any = -1;
let gLines: AsmLine[] = []; // get the up to date value of the lines prop in the event listener

export const DiffEditor: React.FC<DiffEditorProps> = ({ compiledAsm, originalAsm, lines, onScoreChange }) => {
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
           const onMouseMove = (e:any) => {
            if (e !== null && e.target !== null && e.target.position !== null) {
              console.log('HOVER', e.target.position.lineNumber);
              
              if (e.target.position.lineNumber -1 >= gLines.length) {
                  return;
              }
            const hoverAsm = gLines[e.target.position.lineNumber - 1];
            if (hoverAsm.source) {
                eventBus.dispatch('panesLinkLine', {
                    line: hoverAsm.source.line
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
            if (lineChanges != null) {
                for (const change of lineChanges) {
                    score += Math.max(change.originalEndLineNumber-change.originalStartLineNumber+1,
                        change.modifiedEndLineNumber-change.modifiedStartLineNumber+1);
                }
            }
            onScoreChange(score);
            console.log(score);
            console.log("update diff");
        });
        editor.getOriginalEditor().onMouseMove((e: any) => {
            mouseMoveThrottledFunction(e);
          });
    }
    



    const onPanesLinkLine = (data: any) => {
        if (!editor) {return};
        let lineNums: number[] = [];
        // Find all corresponding asm lines
        gLines.forEach((line, index) => {
            if (line.source && line.source.line === data.line) {
                lineNums.push(index+1);
        }
        });

        if (lineNums.length > 0) {
            // Also link the corresponding line in the editor
            const hoverAsm = gLines[lineNums[0]- 1];
            eventBus.dispatch('lineLink', {
                line: hoverAsm.source?.line
              });     
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
                    fadeTimeoutId = setTimeout(() =>{
                        clearLinkedLine();
                        fadeTimeoutId = -1;
                    }, 3000);
                    };
            
                    const clearLinkedLine = () => {
                      prevDecorations = editor.getOriginalEditor().deltaDecorations(prevDecorations, []);
                    };

    useEffect(() => {
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
