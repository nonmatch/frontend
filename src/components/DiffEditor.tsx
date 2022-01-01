import React from "react";
import { monaco, MonacoDiffEditor } from "react-monaco-editor";

interface DiffEditorProps {
    compiledAsm: string,
    originalAsm: string,
    onScoreChange: (score: number) => void
}

export const DiffEditor: React.FC<DiffEditorProps> = ({ compiledAsm, originalAsm, onScoreChange }) => {
    const options = {
        automaticLayout: true,
        minimap: {
            enabled: false
        },
        readOnly: true,
        domReadOnly: true
    };

    const editorDidMount = (editor: monaco.editor.IStandaloneDiffEditor, monaco: any) => {
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
    }
    
    return (
        <MonacoDiffEditor
            language="asm"
            original={compiledAsm}
            value={originalAsm}
            options={options}
            theme="customTheme"
            editorDidMount={editorDidMount} />);
}