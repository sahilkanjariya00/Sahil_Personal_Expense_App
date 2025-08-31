import type { Meta, StoryObj } from "@storybook/react";
import { Paper} from "@mui/material";
import AppGrid from "./AppGrid.component";
import AppTypography from "../Typography";

const meta: Meta<typeof AppGrid> = {
  title: "UI/AppGrid",
  component: AppGrid,
};

export default meta;
type Story = StoryObj<typeof AppGrid>;

export const Default: Story = {
  render: () => (
    <AppGrid container spacing={2}>
      <AppGrid item xs={6}>
        <Paper sx={{ p: 2 }}>
          <AppTypography>Left</AppTypography>
        </Paper>
      </AppGrid>
      <AppGrid item xs={6}>
        <Paper sx={{ p: 2 }}>
          <AppTypography>Right</AppTypography>
        </Paper>
      </AppGrid>
    </AppGrid>
  ),
};
