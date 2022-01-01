export const ErrorLog: React.FC = () => {
const stderr = [
		{
			"text": "<source>: In function `sub_0803C400':"
		},
		{
			"text": "<source>:51: syntax error before `ile'",
			"tag": {
				"line": 51,
				"column": 0,
				"text": "syntax error before `ile'"
			}
		},
		{
			"text": "<source>:55: `projectile' undeclared (first use in this function)",
			"tag": {
				"line": 55,
				"column": 0,
				"text": "`projectile' undeclared (first use in this function)"
			}
		},
		{
			"text": "<source>:55: (Each undeclared identifier is reported only once",
			"tag": {
				"line": 55,
				"column": 0,
				"text": "(Each undeclared identifier is reported only once"
			}
		},
		{
			"text": "<source>:55: for each function it appears in.)",
			"tag": {
				"line": 55,
				"column": 0,
				"text": "for each function it appears in.)"
			}
		}
	];

    const getLineClass = (line:string) => {
        if (line.includes('error')) {
            return 'text-danger';
        } else if (line.includes('warning')){
            return 'text-warning';
        }
    };

    return (
        <div style={{
            fontFamily:"monospace",
            fontSize:"14px",
            padding:"8px"
        }}>
            {
                stderr.map((line, index) => (
                    <div key={index} className={getLineClass(line.text)}>
                        {line.text}
                    </div>
                ))
            }
        </div>
    );
}