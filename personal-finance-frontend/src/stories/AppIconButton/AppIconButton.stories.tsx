import type { Meta, StoryObj } from "@storybook/react";
import DeleteIcon from "@mui/icons-material/Delete";
import AppIconButton from "./AppIconButton.component";

const meta: Meta<typeof AppIconButton> = {
    title: "UI/AppIconButton",
    component: AppIconButton,
};

export default meta;
type Story = StoryObj<typeof AppIconButton>;

export const Default: Story = {
    args: {
        color: "primary",
        children: <DeleteIcon />,
    },
};
