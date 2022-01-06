import { Link } from "react-router-dom";

interface SubmitDialogProps {

}
export const SubmitDialog: React.FC<SubmitDialogProps> = () => {
    return (
        <div className="modal fade" id="modalTest" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Submit Function</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true"></span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <div>
                            <input type="checkbox" /> Is functionally equivalent
                        </div>
                        <hr />
                        <div>
                            <p>Login to claim or add yourself as the author of this commit?</p>
                            <Link className="btn btn-secondary btn-sm" to="/login">
                                <i className="fa fa-github fa-fw"></i>
                                <span>Login with GitHub</span>
                            </Link>

                            <hr />
                            <input type="text" placeholder="Username" />
                            <input type="text" placeholder="E-Mail" />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" className="btn btn-primary">Save changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
}