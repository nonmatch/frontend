interface ContainerProps {
    small?: boolean
    centered?: boolean
}

export const Container: React.FC<ContainerProps> = ({small = false, centered=false, children}) => {
        return (
            <div className="container">
                {children}
            </div>
        );
}