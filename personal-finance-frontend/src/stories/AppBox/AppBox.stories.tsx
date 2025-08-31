import type { Meta, StoryObj } from "@storybook/react";
import AppBox from "./AppBox.component";

const meta: Meta<typeof AppBox> = {
    title: "UI/AppBox",
    component: AppBox,
};

export default meta;
type Story = StoryObj<typeof AppBox>;

export const Default: Story = {
    args: {
        p: 2,
        bgcolor: "primary.main",
        color: "white",
        children: "This is an AppBox",
    },
};
