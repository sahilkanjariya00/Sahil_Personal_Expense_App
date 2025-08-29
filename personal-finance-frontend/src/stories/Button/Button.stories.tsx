import type { Meta, StoryObj } from "@storybook/react";
import AppButton from "./Button.component";

const meta: Meta<typeof AppButton> = {
  title: "UI/Button",
  component: AppButton,
};
export default meta;
type Story = StoryObj<typeof AppButton>;

export const Primary: Story = {
  args: { variant: "contained", children: "Primary Button" },
};

export const Outlined: Story = {
  args: { variant: "outlined", children: "Outlined Button" },
};
