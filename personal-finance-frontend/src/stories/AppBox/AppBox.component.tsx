import { Box, type BoxProps } from "@mui/material";

const AppBox = (props: BoxProps) => {
    return <Box {...props}>{props.children}</Box>;
};

export default AppBox;
