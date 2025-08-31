import type { Meta, StoryObj } from "@storybook/react";
import AppTypography from "./Typography.component";

const meta: Meta<typeof AppTypography> = {
  title: "UI/Typography",
  component: AppTypography,
};
export default meta;
type Story = StoryObj<typeof AppTypography>;

export const Heading: Story = {
  args: { variant: "h4", children: "This is a Heading" },
};

export const Body: Story = {
  args: { variant: "body1", children: "This is body text" },
};
