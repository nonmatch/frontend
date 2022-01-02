import { throttle } from "lodash";
import { useEffect } from "react";
import MonacoEditor from "react-monaco-editor";
import eventBus from "../eventBus";
import { ErrorLine } from "../types";

interface CodeEditorProps {
    code: string,
    stderr: ErrorLine[],
    onCodeChange: (text: string) => void
}
let monaco:any;
let editor:any;
let prevDecorations:any = [];
let fadeTimeoutId: any = -1;

export const CodeEditor: React.FC<CodeEditorProps> = ({code, stderr, onCodeChange}) => {
    const options = {
        automaticLayout: true,
        minimap: {
          enabled: false
        }
      };


       // Mouse move
       const onMouseMove = (e:any) => {
        if (e !== null && e.target !== null && e.target.position !== null) {
          eventBus.dispatch('panesLinkLine', {
            line: e.target.position.lineNumber
          });
//          tryPanesLinkLine(e.target.position.lineNumber, false);
      }
      };

      const mouseMoveThrottledFunction = throttle(onMouseMove, 50);


      // Focus this editor at the beginning
      const editorDidMount = (_editor: any, _monaco: any) => {
        monaco = _monaco;
        editor = _editor;
        editor.focus();
        editor.onMouseMove((e: any) => {
          mouseMoveThrottledFunction(e);
        });

      }



      // Draw squiggly lines
        useEffect(() => {
          if (!monaco) {return;}
          
        var widgets = stderr.flatMap(function (obj) {
          if (!obj.tag) return []; // Nothing
          var severity = 8; // error
          if (obj.tag.text.match(/^warning/)) severity = 4;
          if (obj.tag.text.match(/^note/)) severity = 1;
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

     

      // Line link

        const onPanesLinkLine = (data: any) => {
          data.reveal = false;
          onLineLink(data);
        };

        const onLineLink = (data: any) => {
          if (!monaco) {return;}

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
        fadeTimeoutId = setTimeout(() =>{
            clearLinkedLine();
            fadeTimeoutId = -1;
        }, 3000);
        };

        const clearLinkedLine = () => {
          prevDecorations = editor.deltaDecorations(prevDecorations, []);
        };

        useEffect(() => {
          eventBus.on('lineLink', onLineLink);
//          eventBus.on('panesLinkLine', onPanesLinkLine);
            return () => {
              // Cleanup
              eventBus.remove('lineLink', onLineLink);
  //            eventBus.remove('panesLinkLine', onPanesLinkLine);

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