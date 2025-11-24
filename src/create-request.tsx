import { Action, ActionPanel, Form, showToast, Toast, popToRoot } from "@raycast/api";
import React, { useState } from "react";
import { ApiClient } from "./services/api";
import { CreateRequestData, REQUEST_TYPE, RequestBreak } from "./types";
import { ERROR_MESSAGES } from "./constants";
import dayjs from "dayjs";
import { REQUEST_TYPES } from "./utils/formatting";
import { formatTimeInput } from "./utils/timeFormatting";
import { useForm } from "@raycast/utils";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

interface CreateRequestFormValues {
  requestType: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  startTime: string;
  endTime: string;
  breaks: (RequestBreak & { removeBreak?: boolean })[];
  note?: string;
}

export default function CreateRequestCommand() {
  const [isLoading, setIsLoading] = useState(false);

  const [breaks, setBreaks] = useState<RequestBreak[]>([]);

  const { handleSubmit, setValue, itemProps, focus } = useForm<CreateRequestFormValues>({
    initialValues: {
      requestType: REQUEST_TYPE.REMOTE_WORK,
      startDate: dayjs().add(1, "day").toDate(),
      endDate: dayjs().add(1, "day").toDate(),
      startTime: "",
      endTime: "",
      note: "",
    },
    onSubmit: async (values: CreateRequestFormValues) => {
      setIsLoading(true);

      try {
        const apiClient = new ApiClient();

        const startDate = dayjs(values.startDate).format("YYYY-MM-DD");
        const endDate = dayjs(values.endDate).format("YYYY-MM-DD");

        // times are in local time - we need to send in UTC
        const utc_startTime = values.startTime
          ? dayjs(`${startDate}T${values.startTime}`).utc().format("YYYY-MM-DDTHH:mm[Z]")
          : null;
        const utc_finishTime = values.endTime
          ? dayjs(`${endDate}T${values.endTime}`).utc().format("YYYY-MM-DDTHH:mm[Z]")
          : null;

        const requestData: CreateRequestData = {
          requestType: values.requestType,
          startDate,
          endDate,
          startTime: values.startTime ? `${utc_startTime}` : null,
          endTime: values.endTime ? `${utc_finishTime}` : null,
          note: values.note,
        };

        // breaks end up here under keys like breaks.0.start - we need to map them to an array
        for (const brk of breaks) {
          const brkStart = values[`breaks.${breaks.indexOf(brk)}.start` as keyof CreateRequestFormValues] as string;
          const brkEnd = values[`breaks.${breaks.indexOf(brk)}.end` as keyof CreateRequestFormValues] as string;

          if (brkStart && brkEnd) {
            if (!requestData.breaks) {
              requestData.breaks = [];
            }
            requestData.breaks.push({
              start: `${startDate}T${brkStart}Z`,
              end: `${startDate}T${brkEnd}Z`,
            });
          }
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
        (Toast.Style.Failure,
          await showToast({
            title: "Failed to Create Request",
            message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
          }));
      } finally {
        setIsLoading(false);
      }
    },
  });

  function hourOnBlur(e: any, field: keyof CreateRequestFormValues) {
    const formatted = formatTimeInput(e.target.value);
    setValue(field, formatted);
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Request" onSubmit={handleSubmit} />
          <Action
            title="Add Break"
            onAction={() => {
              setBreaks([...breaks, { start: "", end: "" }]);
              setTimeout(() => {
                focus(`breaks.${breaks.length}.start` as keyof CreateRequestFormValues);
              }, 100);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown {...itemProps.requestType} title="Request Type">
        {REQUEST_TYPES.filter((r) => r.canBeSelected).map((type) => (
          <Form.Dropdown.Item key={type.value} value={type.value} title={type.title} />
        ))}
      </Form.Dropdown>

      <Form.DatePicker title="Start Date" type="date" {...itemProps.startDate} />
      <Form.DatePicker title="End Date" type="date" {...itemProps.endDate} />

      <Form.TextField
        title="Start Time"
        {...itemProps.startTime}
        placeholder="HH:MM (e.g., 06:00)"
        info="Time in 24-hour format"
        onBlur={(e) => {
          hourOnBlur(e, "startTime");
        }}
      />
      <Form.TextField
        title="End Time"
        {...itemProps.endTime}
        placeholder="HH:MM (e.g., 15:00)"
        info="Time in 24-hour format"
        onBlur={(e) => {
          hourOnBlur(e, "endTime");
        }}
      />

      <Form.Separator />
      {breaks.map((brk, index) => (
        <React.Fragment key={index}>
          <Form.Description title={`Break ${index + 1}`} text={"Add start and end date for your break."} />
          <Form.TextField
            title={`Break Start`}
            {...itemProps[`breaks.${index}.start` as keyof CreateRequestFormValues]}
            placeholder="HH:MM (e.g., 12:00)"
            info="Time in 24-hour format"
            onBlur={(e) => {
              hourOnBlur(e, `breaks.${index}.start` as keyof CreateRequestFormValues);
            }}
          />
          <Form.TextField
            title={`Break End`}
            {...itemProps[`breaks.${index}.end` as keyof CreateRequestFormValues]}
            placeholder="HH:MM (e.g., 12:30)"
            info="Time in 24-hour format"
            onBlur={(e) => {
              hourOnBlur(e, `breaks.${index}.end` as keyof CreateRequestFormValues);
            }}
          />
          <Form.Checkbox
            label="Remove Break"
            id={`breaks.${index}.removeBreak`}
            onChange={() => {
              const newBreaks = breaks.filter((_, i) => i !== index);
              setBreaks(newBreaks);
              focus("endTime");
            }}
          />
          <Form.Separator />
        </React.Fragment>
      ))}

      <Form.TextArea id="note" title="Note" placeholder="Add a note (optional)" />
    </Form>
  );
}
