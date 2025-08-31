import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import dayjs, { Dayjs } from "dayjs";
import AppDatePicker from "./DatePicker.component";
import { DATE_FORMATE } from "../../Util/constants";

const meta: Meta<typeof AppDatePicker> = {
  title: "UI/DatePicker",
  component: AppDatePicker,
};
export default meta;
type Story = StoryObj<typeof AppDatePicker>;

export const Basic: Story = {
  render: () => {
    const [val, setVal] = useState<string>("2025-08-29");
    return <AppDatePicker label="Select Date" value={dayjs(val)} onChange={(val) => setVal(val ? (val as Dayjs).format(DATE_FORMATE) : "")} />;
  },
};
