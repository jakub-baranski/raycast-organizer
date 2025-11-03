import { Action, ActionPanel, Form, popToRoot, showToast, Toast } from "@raycast/api";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { TimeLogEntry, Project } from "./types";
import { ApiClient } from "./services/api";
import dayjs from "dayjs";
import { ERROR_MESSAGES } from "./constants";
import { useLastTimeLogValues } from "./utils/useLastLogValues";
import { useForm } from "@raycast/utils";

interface LogTimeFormValues {
  project: string;
  date: Date;
  startAt: string;
  finishAt: string;
  isOvertime: boolean;
  description: string;
}

export default function LogTimeCommand() {

  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]); 
  const formInitialized = useRef(false);

  const { getLastTimeLogValues, updateLastTimeLogValues } = useLastTimeLogValues();

  const { handleSubmit, itemProps, values, setValue } = useForm<LogTimeFormValues>({
    initialValues: {
      project: "",
      date: new Date(),
      startAt: "",
      finishAt: "",
      isOvertime: false,
      description: "",
    },
    onSubmit: async (values) => {
      const apiClient = new ApiClient();

    try {
      const startAtDate = `${dayjs(values.date).format('YYYY-MM-DD')}T${values.startAt}` 
      const finishAtDate = `${dayjs(values.date).format('YYYY-MM-DD')}T${values.finishAt}`

      const requestData: TimeLogEntry = {
        project: parseInt(values.project),
        startAt: startAtDate,
        finishAt: finishAtDate,
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
      
      if (response.results.length > 0 && !formInitialized.current) {
        const firstProject = response.results[0];
        const lastValues = await getLastTimeLogValues(firstProject.id);
        
        if (lastValues) {
          setValue("project", firstProject.id.toString());
          setValue("date", new Date(lastValues.startAt.split('T')[0]));
          setValue("startAt", lastValues.startAt.split('T')[1]);
          setValue("finishAt", lastValues.finishAt.split('T')[1]);
          setValue("isOvertime", lastValues.isOvertime);
        }
        
        formInitialized.current = true;
      }
      setIsLoading(false);
    };
    fetchProjects();
  }, []);

  const handleProjectChange = async (projectId: string) => {
    setValue("project", projectId);
    
    const hasUserEnteredData = 
      values.startAt || 
      values.finishAt || 
      values.description;
    
    if (!hasUserEnteredData) {
      const lastValues = await getLastTimeLogValues(parseInt(projectId));
      
      if (lastValues) {
        setValue("date", new Date(lastValues.startAt.split('T')[0]));
        setValue("startAt", lastValues.startAt.split('T')[1]);
        setValue("finishAt", lastValues.finishAt.split('T')[1]);
        setValue("isOvertime", lastValues.isOvertime);
      }
    }
  };

  // TODO: Raycast does not export the type and I won't be bothered...
  function hourOnBlur(e: any , field: "startAt" | "finishAt") {
    console.log('target' ,e)
    const val = e.target.value?.replace(/\D/g, "");
    if (val && val.length === 4) {
      const hour = parseInt(val.slice(0, 2));
      const minute = parseInt(val.slice(2));
      if (hour > 23 || minute > 59) {
        setValue(field, "");
        return;
      }
      setValue(field, `${val.slice(0, 2)}:${val.slice(2)}`);
    } else if (val && val.length === 3) {
      const hour = parseInt(val.slice(0, 1));
      const minute = parseInt(val.slice(1));
      if (hour > 23 || minute > 59) {
        setValue(field, "");
        return;
      }
      setValue(field, `0${val.slice(0, 1)}:${val.slice(1)}`);
    }
  }


  return (
    <Form
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
