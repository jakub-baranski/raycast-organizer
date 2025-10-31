import { Action, ActionPanel, Form, showToast, Toast, popToRoot } from "@raycast/api";
import React, { useState } from "react";
import { ApiClient } from "./services/api";
import { CreateRequestData, REQUEST_TYPE } from "./types";
import { ERROR_MESSAGES } from "./constants";
import dayjs from "dayjs";

const REQUEST_TYPES = [
  { value: REQUEST_TYPE.REMOTE_WORK, title: "Remote Work" },
  { value: REQUEST_TYPE.VACATION, title: "Vacation" },
  { value: REQUEST_TYPE.BUSINESS, title: "Business" },
  { value: REQUEST_TYPE.VACATION_ON_DEMAND, title: "Vacation on Demand" },
  { value: REQUEST_TYPE.CUSTOM_TIME, title: "Custom Time" },
];

export default function CreateRequestCommand() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: {
    requestType: string;
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
    note?: string;
  }) {
    setIsLoading(true);

    try {
      const apiClient = new ApiClient();

      const startDate = dayjs(values.startDate).format("YYYY-MM-DD");
      const endDate = dayjs(values.endDate).format("YYYY-MM-DD");

      const requestData: CreateRequestData = {
        requestType: values.requestType,
        startDate,
        endDate,
        startTime: values.startTime ? `${startDate}T${values.startTime}Z` : null,
        endTime: values.endTime ? `${endDate}T${values.endTime}Z` : null,
      };

      if (values.breakStart && values.breakEnd) {
        requestData.breaks = [
          {
            start: `${startDate}T${values.breakStart}Z`,
            end: `${startDate}T${values.breakEnd}Z`,
          },
        ];
      }

      if (values.note) {
        requestData.note = values.note;
      }

      const response = await apiClient.createRequest(requestData);

      await showToast({
        style: Toast.Style.Success,
        title: "Request Created",
        message: `Request #${response.id} created successfully`,
      });

      await popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Create Request",
        message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Request" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="requestType" title="Request Type" defaultValue={REQUEST_TYPE.REMOTE_WORK}>
        {REQUEST_TYPES.map((type) => (
          <Form.Dropdown.Item key={type.value} value={type.value} title={type.title} />
        ))}
      </Form.Dropdown>

      <Form.DatePicker id="startDate" title="Start Date" defaultValue={new Date()} />
      <Form.DatePicker id="endDate" title="End Date" defaultValue={new Date()} />

      <Form.TextField
        id="startTime"
        title="Start Time"
        placeholder="HH:MM (e.g., 06:00)"
        info="Time in 24-hour format"
      />
      <Form.TextField id="endTime" title="End Time" placeholder="HH:MM (e.g., 15:00)" info="Time in 24-hour format" />

      <Form.Separator />

      <Form.TextField
        id="breakStart"
        title="Break Start Time"
        placeholder="HH:MM (e.g., 07:00)"
        info="Optional - Time in 24-hour format"
      />
      <Form.TextField
        id="breakEnd"
        title="Break End Time"
        placeholder="HH:MM (e.g., 08:00)"
        info="Optional - Time in 24-hour format"
      />

      <Form.Separator />

      <Form.TextArea id="note" title="Note" placeholder="Add a note (optional)" />
    </Form>
  );
}
