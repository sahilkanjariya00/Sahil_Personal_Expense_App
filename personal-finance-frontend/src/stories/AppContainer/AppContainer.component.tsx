import { Container, type ContainerProps } from "@mui/material";

const AppContainer = (props: ContainerProps) => {
  return <Container {...props}>{props.children}</Container>;
};

export default AppContainer;
