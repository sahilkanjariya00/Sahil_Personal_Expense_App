import type { Meta, StoryObj } from "@storybook/react";
import FileUpload from "./FileUpload.component";

const meta: Meta<typeof FileUpload> = {
  title: "UI/FileUpload",
  component: FileUpload,
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

export const Default: Story = {
  args: {
    label: "Upload Receipt",
    onFileSelected: (file) => alert(file ? file.name : "No file selected"),
  },
};
