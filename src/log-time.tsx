import { Action, ActionPanel, Form, getPreferenceValues, popToRoot, showToast, Toast } from "@raycast/api";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { TimeLogEntry, Project, Preferences } from "./types";
import { ApiClient } from "./services/api";
import dayjs from "dayjs";
import { ERROR_MESSAGES } from "./constants";
import { useLastTimeLogValues } from "./utils/useLastLogValues";
import { useForm } from "@raycast/utils";

import utc from 'dayjs/plugin/utc';
import { formatTimeInput } from "./utils/timeFormatting";
dayjs.extend(utc);

interface LogTimeFormValues {
  project: string;
  date: Date;
  startAt: string;
  finishAt: string;
  isOvertime: boolean;
  description: string;
}

interface LogTimeCommandProps {
  prefillEntry?: Partial<TimeLogEntry>;
}

export default function LogTimeCommand({ prefillEntry, draftValues }: LogTimeCommandProps) {

  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]); 
  const formInitialized = useRef(false);


  const preferences = getPreferenceValues<Preferences>();

  const { getLastTimeLogValues, updateLastTimeLogValues } = useLastTimeLogValues();

  const { handleSubmit, itemProps, values, setValue } = useForm<LogTimeFormValues>({
    initialValues: {
      project: draftValues?.project ? draftValues.project.toString() : "",
      date: new Date(),
      startAt: draftValues?.startAt || "",
      finishAt: draftValues?.finishAt || "",
      isOvertime: draftValues?.isOvertime || false,
      description: draftValues?.description || "",
    },
    onSubmit: async (values) => {
      const apiClient = new ApiClient();

    try {
      const startAtDate = `${dayjs(values.date).format('YYYY-MM-DD')}T${values.startAt}` 
      const finishAtDate = `${dayjs(values.date).format('YYYY-MM-DD')}T${values.finishAt}`;

      // times are in local time - we need to send in UTC
      const utc_startAtDate = dayjs(startAtDate).utc().format();
      const utc_finishAtDate = dayjs(finishAtDate).utc().format();

      const requestData: TimeLogEntry = {
        project: parseInt(values.project),
        startAt: utc_startAtDate,
        finishAt: utc_finishAtDate,
        isOvertime: values.isOvertime,
        description: values.description,
      };

      await apiClient.logTime(requestData);
      
      await updateLastTimeLogValues(requestData);
      
      await showToast({
        style: Toast.Style.Success,
        title: "Log Entry Created",
        message: 'Log entry created successfully'
      });

      await popToRoot();
    }
    catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Create Log Entry",
        message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      });
    } finally {
      setIsLoading(false);
    }
    },
  });

  useEffect(() => {
    // Get projects and set to state for dropdown.
    setIsLoading(true);
    const apiClient = new ApiClient();
    const fetchProjects = async () => {
      const response = await apiClient.getProjects();
      setProjects(response.results);
      setIsLoading(false);
      formInitialized.current = true;
    };
    fetchProjects();
  }, []);

  const handleProjectChange = async (projectId: string) => {
    setValue("project", projectId);
    
    if (!prefillEntry && formInitialized.current) {
      const lastValues = await getLastTimeLogValues(parseInt(projectId));

      
      if (lastValues) {
        // We send values in UTC, but we want to show in local time
        const localStartAt = dayjs(lastValues.startAt).local().format('HH:mm');
        const localFinishAt = dayjs(lastValues.finishAt).local().format('HH:mm');
        
        setValue("startAt", localStartAt);
        setValue("finishAt", localFinishAt);
        setValue("isOvertime", lastValues.isOvertime);
        setValue("description", lastValues.description || "" );
      }
    } else if (prefillEntry) {
      // If prefillEntry is provided, use its values to prefill the form.
      // It's used for copying an existing entry.
      //
      if (prefillEntry.project) {
        setValue("project", prefillEntry.project.toString());
      }
      if (prefillEntry.startAt) {
        const localStartAt = dayjs(prefillEntry.startAt).local().format('HH:mm');
        setValue("startAt", localStartAt);
      }
      if (prefillEntry.finishAt) {
        const localFinishAt = dayjs(prefillEntry.finishAt).local().format('HH:mm');
        setValue("finishAt", localFinishAt);
      }
      if (prefillEntry.isOvertime !== undefined) {
        setValue("isOvertime", prefillEntry.isOvertime);
      }
      if (prefillEntry.description) {
        setValue("description", prefillEntry.description);
      }
    }
  };

  

  function hourOnBlur(e: any, field: "startAt" | "finishAt") {
    const formatted = formatTimeInput(e.target.value);
    setValue(field, formatted);
  }

  return (
    <Form
      enableDrafts={ preferences.useDrafts }
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Entry" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown {...itemProps.project} title="Project" onChange={handleProjectChange}>
        {
          projects.map((project) => (
          <Form.Dropdown.Item key={project.id} value={project.id.toString()} title={project.name} />
        ))
        }
      </Form.Dropdown>

      <Form.TextArea {...itemProps.description} title="Description" placeholder="Describe your work..." />
      
      <Form.DatePicker 
        type={Form.DatePicker.Type.Date}
        id="date" 
        title="Date" 
        value={values.date}
        onChange={(newValue) => setValue("date", newValue || new Date())}
      />

      <Form.TextField {...itemProps.startAt} title="Start" 
        placeholder="e.g., 07:00 or 700"
        info="Time in 24-hour format,"
        onBlur={(e) => { hourOnBlur(e, "startAt") }}

      />
      <Form.TextField {...itemProps.finishAt} title="Finish" 
        placeholder="e.g., 07:00 or 700"
        info="Time in 24-hour format"
        onBlur={(e) => { hourOnBlur(e, "finishAt") }}
      />
      <Form.Checkbox {...itemProps.isOvertime} label="Is Overtime?" />
    </Form>
  );
}
