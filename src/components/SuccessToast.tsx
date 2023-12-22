import { Link } from "react-router-dom";

interface SuccessToastProps {
    score: number;
    isLoggedIn: boolean,
    copyLink: () => void,
    fakenessScore: number
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ copyLink }) => {


    return (
        <div className="toast-container position-absolute p-3 bottom-0 end-0" id="toastPlacement" style={{ zIndex: 1000 }}>
            <div className="toast bg-success text-white" id="successToast">
                <div className="d-flex align-items-center">
                    <div className="toast-body">Successfully submitted code
                    </div>
                    <button className="btn btn-outline-light btn-sm me-2 m-auto" onClick={copyLink}>Copy Link</button>
                    <button type="button" className="btn-close btn-close-white me-2" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        </div>

    )
};