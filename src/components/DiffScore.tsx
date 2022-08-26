//import { useEffect, useState } from "react";

import './DiffScore.css';

interface DiffScoreProps {
    score: number
}

export const DiffScore: React.FC<DiffScoreProps> = ({ score }) => {
/*
    const [scores, setScores] = useState<number[]>([]);

    useEffect(() => {
        if (score !== -1 && document.readyState === "complete") {
            setScores(s => [...s, score]);
        }
    }, [score]);

    const bestScore = Math.min(...scores);

    return (
        <span className="score">
            Diff Score: {score}
            <div className="score-history">
                Score History:
                <ul>
                    {scores.map(score => (
                        <li className={score===bestScore ? "best" : ""}>{score}</li>
                    ))}
                </ul>
            </div>
        </span>
    );
    */
   return (
    <span className="score">Diff Score: {score}</span>
   );
}