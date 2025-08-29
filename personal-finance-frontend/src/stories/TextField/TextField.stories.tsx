import type { Meta, StoryObj } from "@storybook/react";
import AppTextField from "./TextField.component";

const meta: Meta<typeof AppTextField> = {
  title: "UI/TextField",
  component: AppTextField,
};
export default meta;
type Story = StoryObj<typeof AppTextField>;

export const Basic: Story = {
  args: { label: "Description", placeholder: "Enter description" },
};
