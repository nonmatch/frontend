import eventBus from "../eventBus";
import { ErrorLine } from "../types";

interface ErrorLogProps {
    stderr: ErrorLine[]
};
export const ErrorLog: React.FC<ErrorLogProps> = ({stderr}) => {

    const getLineClass = (line:ErrorLine) => {
        let className = ''
        if (line.text.includes('error')) {
            className += 'text-danger';
        } else if (line.text.includes('warning')){
            className += 'text-warning';
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
            padding:"8px"
        }}>
            {
                stderr.length === 0 ? 
                <div className="text-success">Compiled successfully</div>
                :
                stderr.map((line, index) => (
                    <>{line.tag ?                     <div key={index} className={getLineClass(line)}
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
                    :<div>{line.text}
                    </div>}
                    </>
                ))
            }
        </div>
    );
}