interface ContainerProps {
    small?: boolean
    centered?: boolean
}

export const Container: React.FC<ContainerProps> = ({small = false, centered=false, children}) => {
        return (
            <div className="container" style={{
                display: centered? "flex": "block",
                flexDirection:"column",
                alignItems:"center"
            }}>
                {children}
            </div>
        );
}