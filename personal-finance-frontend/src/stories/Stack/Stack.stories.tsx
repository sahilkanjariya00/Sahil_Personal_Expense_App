import type { Meta, StoryObj } from "@storybook/react";
import AppButton from "../Button";
import AppStack from "./Stack.component";


const meta: Meta<typeof AppStack> = {
  title: "UI/Stack",
  component: AppStack,
};
export default meta;
type Story = StoryObj<typeof AppStack>;

export const RowStack: Story = {
  args: {
    direction: "row",
    spacing: 2,
    children: (
      <>
        <AppButton variant="contained">One</AppButton>
        <AppButton variant="contained">Two</AppButton>
      </>
    ),
  },
};
