import { Action, ActionPanel, List, Icon, Color, confirmAlert, Alert, showToast, Toast, useNavigation } from "@raycast/api";
import React, { useEffect, useState } from "react";
import { ApiClient } from "./services/api";
import { TimeLogEntry, Project } from "./types";
import dayjs from "dayjs";
import { ERROR_MESSAGES } from "./constants";
import LogTimeCommand from "./log-time";

interface GroupedEntries {
  [date: string]: TimeLogEntry[];
}

export default function ViewTimeLogsCommand() {
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<TimeLogEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [startDate, setStartDate] = useState<Date>(dayjs().subtract(7, "days").toDate());
  const [endDate, setEndDate] = useState<Date>(new Date());


const { push } = useNavigation();

  const fetchData = async () => {
    setIsLoading(true);
    const apiClient = new ApiClient();

    try {
      const [entriesResponse, projectsResponse] = await Promise.all([
        apiClient.getTimeLogEntries(
          dayjs(startDate).format("YYYY-MM-DD"),
          dayjs(endDate).format("YYYY-MM-DD")
        ),
        apiClient.getProjects(),
      ]);

      setEntries(entriesResponse);
      setProjects(projectsResponse.results);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Load Time Logs",
        message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const groupEntriesByDate = (): GroupedEntries => {
    const grouped: GroupedEntries = {};

    entries.forEach((entry) => {
      const date = dayjs(entry.startAt).format("YYYY-MM-DD");
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });

    return grouped;
  };

  const getProject = (projectId: number): Project | undefined => {
    return projects.find((p) => p.id === projectId);
  };

  const calculateDuration = (startAt: string, finishAt: string): string => {
    const start = dayjs(startAt);
    const finish = dayjs(finishAt);
    const minutes = finish.diff(start, "minute");
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  };

  const handleDelete = async (entryId: number) => {
    const confirmed = await confirmAlert({
      title: "Delete Time Log Entry",
      message: "Are you sure you want to delete this time log entry? This action cannot be undone.",
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      const apiClient = new ApiClient();
      try {
        await apiClient.deleteTimeLogEntry(entryId);
        await showToast({
          style: Toast.Style.Success,
          title: "Entry Deleted",
          message: "Time log entry deleted successfully",
        });
        await fetchData();
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to Delete Entry",
          message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        });
      }
    }
  };

  const groupedEntries = groupEntriesByDate();
  const sortedDates = Object.keys(groupedEntries).sort().reverse();

  const getTotalHoursForDate = (date: string): string => {
    const dayEntries = groupedEntries[date];
    const totalMinutes = dayEntries.reduce((sum, entry) => {
      const start = dayjs(entry.startAt);
      const finish = dayjs(entry.finishAt);
      return sum + finish.diff(start, "minute");
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search time log entries..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Date Range"
          onChange={(value) => {
            const days = parseInt(value);
            setStartDate(dayjs().subtract(days, "days").toDate());
            setEndDate(new Date());
          }}
          defaultValue="7"
        >
          <List.Dropdown.Item title="Last 7 days" value="7" />
          <List.Dropdown.Item title="Last 14 days" value="14" />
          <List.Dropdown.Item title="Last 30 days" value="30" />
          <List.Dropdown.Item title="Last 60 days" value="60" />
          <List.Dropdown.Item title="Last 90 days" value="90" />
        </List.Dropdown>
      }
    >
      {sortedDates.length === 0 ? (
        <List.EmptyView
          icon={Icon.Calendar}
          title="No Time Logs Found"
          description="No time log entries found for the selected date range"
        />
      ) : (
        sortedDates.map((date) => {
          const dayOfWeek = dayjs(date).format("dddd");
          const formattedDate = dayjs(date).format("MMMM D, YYYY");
          const totalHours = getTotalHoursForDate(date);

          // If date is today or yesterday, show "Today" or "Yesterday" before the actual date
          
          const namedDate = dayjs(date).isSame(dayjs(), "day")
            ? "Today"
            : dayjs(date).isSame(dayjs().subtract(1, "day"), "day")
            ? "Yesterday"
            : ''  

          return (
            <List.Section
              key={date}
              title={`${dayOfWeek}, ${formattedDate} ${namedDate ? `(${namedDate})` : ''}`}
              subtitle={`Total: ${totalHours}`}
            >
              {groupedEntries[date].map((entry) => {
                const project = getProject(entry.project);
                const duration = calculateDuration(entry.startAt, entry.finishAt);
                const startTime = dayjs(entry.startAt).format("HH:mm");
                const endTime = dayjs(entry.finishAt).format("HH:mm");

                return (
                  <List.Item
                    key={entry.id}
                    title={project?.name || `Project ${entry.project}`}
                    subtitle={entry.description}
                    accessories={[
                      { text: `${startTime} - ${endTime}`, icon: Icon.Clock },
                      { text: duration, icon: Icon.Hourglass },
                      ...(entry.isOvertime ? [{ tag: { value: "Overtime", color: Color.Orange } }] : []),
                    ]}
                    icon={{
                      source: Icon.CircleFilled,
                      tintColor: project?.color || Color.Blue,
                    }}
                    actions={
                      <ActionPanel>
                        <Action.Push
                          title="View Details"
                          icon={Icon.Eye}
                          target={<TimeLogDetails entry={entry} project={project} />}
                        />
                        <Action
                          title="Copy Entry"
                          icon={Icon.Duplicate}
                          shortcut={{ modifiers: ["cmd"], key: "c" }}
                          onAction={async () => {
                            push(
                              <LogTimeCommand
                                prefillEntry={entry}

                              />
                            )
                          }}
                        />  
                        <Action
                          title="Delete Entry"
                          icon={Icon.Trash}
                          style={Action.Style.Destructive}
                          onAction={() => handleDelete(entry.id!)}
                          shortcut={{ modifiers: ["cmd"], key: "d" }}
                        />
                        <Action
                          title="Refresh"
                          icon={Icon.ArrowClockwise}
                          onAction={fetchData}
                          shortcut={{ modifiers: ["cmd"], key: "r" }}
                        />
                      </ActionPanel>
                    }
                  />
                );
              })}
            </List.Section>
          );
        })
      )}
    </List>
  );
}

function TimeLogDetails({ entry, project }: { entry: TimeLogEntry; project?: Project }) {
  const duration = dayjs(entry.finishAt).diff(dayjs(entry.startAt), "minute");
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;

  return (
    <List>
      <List.Section title="Time Log Details">
        <List.Item
          title="Project"
          accessories={[{ text: project?.name || `Project ${entry.project}` }]}
          icon={{ source: Icon.CircleFilled, tintColor: project?.color || Color.Blue }}
        />
        <List.Item
          title="Date"
          accessories={[{ text: dayjs(entry.startAt).format("MMMM D, YYYY (dddd)") }]}
          icon={Icon.Calendar}
        />
        <List.Item
          title="Time"
          accessories={[
            {
              text: `${dayjs(entry.startAt).format("HH:mm")} - ${dayjs(entry.finishAt).format("HH:mm")}`,
            },
          ]}
          icon={Icon.Clock}
        />
        <List.Item
          title="Duration"
          accessories={[{ text: `${hours}h ${mins}m` }]}
          icon={Icon.Hourglass}
        />
        <List.Item
          title="Overtime"
          accessories={[{ text: entry.isOvertime ? "Yes" : "No" }]}
          icon={entry.isOvertime ? Icon.ExclamationMark : Icon.CheckCircle}
        />
        {entry.customTaskTitle && (
          <List.Item title="Custom Task" accessories={[{ text: entry.customTaskTitle }]} icon={Icon.Pencil} />
        )}
      </List.Section>

      {entry.description && (
        <List.Section title="Description">
          <List.Item title={entry.description} icon={Icon.Text} />
        </List.Section>
      )}
    </List>
  );
}
