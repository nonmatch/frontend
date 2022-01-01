import { useEffect, useState } from "react"
import { Link } from "react-router-dom";
import { get } from "../api";
import { Container } from "../components/Container"
import { API_URL } from "../constants";
import { Func } from "../types"

export const FunctionsPage: React.FC = () => {
    const [functions, setFunctions] = useState<Func[]>([]);

    const fetchFunctions = async() => {
        get(API_URL+'functions').then(
            (data) => {
                setFunctions(data);
                // Make table sortable
                (window as any).Sortable.init();
            },
            (error) => {
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
            functions.map((func) => (
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