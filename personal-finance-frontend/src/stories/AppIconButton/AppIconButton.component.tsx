import { IconButton, type IconButtonProps } from "@mui/material";

const AppIconButton = (props: IconButtonProps) => {
    return <IconButton {...props}>{props.children}</IconButton>;
};

export default AppIconButton;
