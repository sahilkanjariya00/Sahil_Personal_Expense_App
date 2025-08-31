import { Paper, type PaperProps } from "@mui/material";

const AppPaper = (props: PaperProps) => {
    return <Paper {...props}>{props.children}</Paper>;
};

export default AppPaper;
