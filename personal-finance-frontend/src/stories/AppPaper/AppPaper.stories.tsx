import type { Meta, StoryObj } from "@storybook/react";
import AppPaper from "./AppPaper.component";

const meta: Meta<typeof AppPaper> = {
    title: "UI/AppPaper",
    component: AppPaper,
};

export default meta;
type Story = StoryObj<typeof AppPaper>;

export const Default: Story = {
    args: {
        elevation: 3,
        sx: { p: 2 },
        children: "This is an AppPaper with elevation",
    },
};
