import { useEffect } from "react";
import MonacoEditor from "react-monaco-editor";
import { ErrorLine } from "../types";

interface CodeEditorProps {
    code: string,
    stderr: ErrorLine[],
    onCodeChange: (text: string) => void
}
let monaco:any;
let editor:any;

export const CodeEditor: React.FC<CodeEditorProps> = ({code, stderr, onCodeChange}) => {
    const options = {
        automaticLayout: true,
        minimap: {
          enabled: false
        }
      };


      // Focus this editor at the beginning
      const editorDidMount = (_editor: any, _monaco: any) => {
        monaco = _monaco;
        editor = _editor;
        editor.focus();


      }



      // Draw squiggly lines
        useEffect(() => {
          console.log('test', monaco);
          if (!monaco) {return;}
          
        var widgets = stderr.flatMap(function (obj) {
          if (!obj.tag) return []; // Nothing
          var severity = 3; // error
          if (obj.tag.text.match(/^warning/)) severity = 2;
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
      console.log(widgets);
      monaco.editor.setModelMarkers(editor.getModel(), 'stderr', widgets);
        }, [stderr]);

    

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