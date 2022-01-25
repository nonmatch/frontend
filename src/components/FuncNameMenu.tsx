interface FuncNameMenuProps {
  name?: string,
  isCustom: boolean,
  copyLink: () => void,
  exportCExplore: () => void,
}

export const FuncNameMenu: React.FC<FuncNameMenuProps> = ({ name, copyLink, isCustom, exportCExplore }) => {
  return (
    <div className="dropdown" style={{ position: "inherit" }}>
      <button className="btn btn-sm dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
        {isCustom? 'custom code':name}
      </button>
      <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
        <li><button className="dropdown-item" onClick={exportCExplore}>Export to CExplore</button></li>
        {!isCustom && <li><button className="dropdown-item" onClick={copyLink}>Copy Link</button></li>}
        {/* <li><a className="dropdown-item" href="#">Settings</a></li> */}
      </ul>
    </div>
  );
}