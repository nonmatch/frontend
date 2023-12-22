import { Link } from "react-router-dom";

interface SubmitDialogProps {
    score: number,
    isEquivalent: boolean,
    setIsEquivalent: (isEquivalent: boolean) => void,
    submit: () => void,
    isLoggedIn: boolean,
    username: string,
    setUsername: (value: string) => void,
    email: string,
    setEmail: (value: string) => void,
    fakenessScore: number
}
export const SubmitDialog: React.FC<SubmitDialogProps> = ({ score, isEquivalent, setIsEquivalent, submit, isLoggedIn, username, setUsername, email, setEmail, fakenessScore }) => {
    return (
        <div className="modal fade" id="submitDialog" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Do you want to submit?</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true"></span>
                        </button>
                    </div>
                    <div className="modal-body">
                        {
                            score === 0 && fakenessScore === 0
                                ? <div>
                                    {
                                        (!isLoggedIn) && <div>
                                            <div>Login to claim or add yourself as the author of this commit?<br /><small>(Make sure to copy your code as you will be redirected and the code will not be saved)</small></div>
                                            <Link className="btn btn-secondary btn-sm mb-4 mt-2" to="/login" onClick={() => { window.location.href = "/login" }} data-bs-dismiss="modal">
                                                <i className="fa fa-github fa-fw"></i>
                                                <span>Login with GitHub</span>
                                            </Link>
                                        </div>
                                    }
                                    <label className="mb-2">Username and E-Mail for the git commit:</label>
                                    <input type="text" className="form-control" placeholder="Username"
                                        value={username}
                                        onChange={(e) => { setUsername(e.target.value) }}
                                    />
                                    <input type="text" className="form-control mt-2" placeholder="E-Mail"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value) }}
                                    />
                                </div>
                                : 
                                score === 0 ? 
                                <div><p>This submission matches, but some fakeness still remains.</p></div>
                                :
                                <div>
                                    <p>While this code is not yet matching, is it at least functionally equivalent?</p>
                                    <input type="checkbox" checked={isEquivalent} onChange={(event) => { setIsEquivalent(event.target.checked) }} /> Is functionally equivalent
                                </div>
                        }
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={submit}>Submit</button>
                    </div>
                </div>
            </div>
        </div>
    );
}