import { useEffect, useState } from "react"
import { Link } from "react-router-dom";
import { get } from "../api";
import { Container } from "../components/Container"
import { LoadingIndicator } from "../components/LoadingIndicator";
import { API_URL } from "../constants";
import { Func } from "../types"

export const FunctionsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [functions, setFunctions] = useState<Func[]>([]);

    const fetchFunctions = async() => {
        setIsLoading(true);
        get(API_URL+'functions').then(
            (data) => {
                setIsLoading(false);
                setFunctions(data);
                // Make table sortable
                (window as any).Sortable.init();
            },
            (error) => {
                setIsLoading(false);
                console.error(error)
            }
        )
    }

    useEffect(() => {
        fetchFunctions()
    }, []);
    return (<Container centered>
        <h1 style={{paddingTop:"20px"}}>NONMATCH Functions</h1>
            <table className="sortable-theme-slick" data-sortable>
            <thead>
                <tr><th>File</th><th>Function</th><th>Size</th><th data-sortable="false"></th></tr>
                </thead>
                <tbody>
            {
                isLoading
                ? <tr><td colSpan={4}><LoadingIndicator /></td></tr>
                : functions.map((func) => (
                    <tr key={func.id}><td>{func.file}</td><td>{func.name}</td><td>{func.size}</td>
                    <td>
                        <Link to={"/functions/"+func.id}>
                            Edit
                        </Link>
                    </td>
                    </tr>
                ))
            }
            </tbody>
            </table>
        
    </Container>)
}