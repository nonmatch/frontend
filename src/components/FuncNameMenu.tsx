interface FuncNameMenuProps {
    name?: string,
    isCustom: boolean,
    showOneColumn: boolean,
    copyLink: () => void,
    exportCExplore: () => void,
    exportDecompMe: () => void,
    usesTextarea: boolean,
    setUseTextarea: (value: boolean) => void,
    enterAsm: () => void,
    viewSubmissions: () => void,
    isLoggedIn: boolean,
    isEquivalent: boolean,
    toggleEquivalent: () => void,
    hasUnsubmittedChanged: boolean,
    isOwnedByUser: boolean,
    deleteSubmission: () => void
}

export const FuncNameMenu: React.FC<FuncNameMenuProps> = ({ name, copyLink, isCustom, exportCExplore, exportDecompMe, showOneColumn, usesTextarea, setUseTextarea, enterAsm, viewSubmissions, isLoggedIn, isEquivalent, toggleEquivalent, hasUnsubmittedChanged, isOwnedByUser, deleteSubmission }) => {
    return (
        <div className="dropdown" style={{ position: "inherit" }}>
            <button className="btn btn-sm dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                {isCustom ? 'custom code' : name}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                <li><button className="dropdown-item" onClick={exportCExplore}>Export to CExplore</button></li>
                <li><button className="dropdown-item" onClick={exportDecompMe}>Export to decomp.me</button></li>
                {!isCustom && <li><button className="dropdown-item" onClick={copyLink}>Copy Link</button></li>}
                {!isCustom && <li><button className="dropdown-item" onClick={viewSubmissions}>View Submissions</button></li>}
                {isCustom && <li><button className="dropdown-item" onClick={enterAsm}>Set asm code</button></li>}
                {!isCustom && isLoggedIn && !hasUnsubmittedChanged && <li><button className="dropdown-item" onClick={toggleEquivalent}>{isEquivalent ? "Mark non-equivalent" : "Mark equivalent"}</button></li>}
                {!isCustom && isLoggedIn && !hasUnsubmittedChanged && isOwnedByUser && <li><button className="dropdown-item" onClick={deleteSubmission}>Delete Submission</button></li>}


                {showOneColumn && <li><button className="dropdown-item" onClick={() => setUseTextarea(!usesTextarea)}>{usesTextarea ? 'Use Monaco Editor' : 'Use Plain Textarea'}</button></li>}
                {/* <li><a className="dropdown-item" href="#">Settings</a></li> */}
            </ul>
        </div>
    );
}