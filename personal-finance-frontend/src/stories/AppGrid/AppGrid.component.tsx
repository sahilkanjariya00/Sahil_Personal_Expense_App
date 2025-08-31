import Grid, { type GridLegacyOwnProps } from '@mui/material/GridLegacy';

const AppGrid = (props: GridLegacyOwnProps) => {
    return <Grid {...props}>{props.children}</Grid>;
};

export default AppGrid;
