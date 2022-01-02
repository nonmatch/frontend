import eventBus from "../eventBus";
import { ErrorLine } from "../types";
import { LoadingIndicator } from "./LoadingIndicator";

interface ErrorLogProps {
    stderr: ErrorLine[],
    isCompiling: boolean
};
export const ErrorLog: React.FC<ErrorLogProps> = ({stderr, isCompiling}) => {

    const getLineClass = (line:ErrorLine) => {
        let className = ''
        if (line.text.match(/warning/i)) {
            className += 'text-warning';
        } else if (line.text.match(/note/i)){
        } else {
            className += 'text-danger';
        }
        if (line.tag) {
            className +=' error-line';
        }
        return className;
    };
    

    return (
        <div style={{
            fontFamily:"monospace",
            fontSize:"14px",
            padding:"8px",
            flex:1,
            display:"flex",
            flexDirection:"column"
        }}>
            {
                isCompiling ?
                <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>Compiling... <LoadingIndicator/></div>
                :(
                stderr.length === 0 ? 
                <div className="text-success">Compiled successfully</div>
                :
                stderr.map((line, index) => {
                    return line.tag ?                     <div key={index} className={getLineClass(line)}
                    onMouseEnter={() => {
                        eventBus.dispatch('lineLink', {
                            line: line.tag?.line,
                            column:line.tag?.column,
                            reveal: false
                        });
                    }}
                    onClick={() => {
                        eventBus.dispatch('lineLink', {
                            line: line.tag?.line,
                            column:line.tag?.column,
                            reveal: true
                        });
                    }}>
                        {line.text}
                    </div>
                    :<div key={index} className={getLineClass(line)}>{line.text}
                    </div>
}))
            }
        </div>
    );
}