import type { Meta, StoryObj } from "@storybook/react";
import AppContainer from "./AppContainer.component";

const meta: Meta<typeof AppContainer> = {
  title: "UI/AppContainer",
  component: AppContainer,
};

export default meta;
type Story = StoryObj<typeof AppContainer>;

export const Default: Story = {
  args: {
    maxWidth: "sm",
    children: "This is an AppContainer with maxWidth=sm",
  },
};
