import type { Meta, StoryObj } from "@storybook/react";
import AppSelect from "./Select.component";

const meta: Meta<typeof AppSelect> = {
  title: "UI/Select",
  component: AppSelect,
};
export default meta;
type Story = StoryObj<typeof AppSelect>;

export const Categories: Story = {
  args: {
    label: "Category",
    options: ["Food", "Transport", "Entertainment", "Utilities"],
    value: "Food",
  },
};
