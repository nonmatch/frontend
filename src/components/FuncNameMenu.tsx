interface FuncNameMenuProps {
    name?: string,
    copyLink: () => void
}

export const FuncNameMenu: React.FC<FuncNameMenuProps> = ({name, copyLink}) => {
    return (
        <div className="dropdown" style={{position:"inherit"}}>
  <button className="btn btn-sm dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
    {name}
  </button>
  <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
    <li><a className="dropdown-item" href="#" onClick={copyLink}>Copy Link</a></li>
    {/* <li><a className="dropdown-item" href="#">Settings</a></li> */}
  </ul>
</div>
    );
}