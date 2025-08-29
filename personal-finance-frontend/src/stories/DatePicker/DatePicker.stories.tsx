import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import AppDatePicker from "./DatePicker.component";

const meta: Meta<typeof AppDatePicker> = {
  title: "UI/DatePicker",
  component: AppDatePicker,
};
export default meta;
type Story = StoryObj<typeof AppDatePicker>;

export const Basic: Story = {
  render: () => {
    const [val, setVal] = useState<string | null>("2025-08-29");
    return <AppDatePicker label="Select Date" value={val} onChange={setVal} />;
  },
};
