import { EmployeeRequest, REQUEST_STATUS } from "../types";

/**
 * Format date string for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get status color for Raycast UI
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    [REQUEST_STATUS.ACCEPTED]: "#00FF00",
    [REQUEST_STATUS.PENDING]: "#FFA500",
    [REQUEST_STATUS.REJECTED]: "#FF0000",
    [REQUEST_STATUS.CANCELLED]: "#808080",
  };
  return statusColors[status] || "#000000";
}

/**
 * Get status label
 */
export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    [REQUEST_STATUS.ACCEPTED]: "Accepted",
    [REQUEST_STATUS.PENDING]: "Pending",
    [REQUEST_STATUS.REJECTED]: "Rejected",
    [REQUEST_STATUS.CANCELLED]: "Cancelled",
  };
  return statusLabels[status] || status;
}

/**
 * Get request type label
 */
export function getRequestTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    VC: "Vacation",
    DY: "Day Off",
    RW: "Remote Work",
    SL: "Sick Leave",
  };
  return typeLabels[type] || type;
}

/**
 * Get icon for request type
 */
export function getRequestTypeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    VC: "✈️",
    DY: "🏖️",
    RW: "🏠",
    SL: "🤒",
  };
  return iconMap[type] || "📝";
}

/**
 * Format request for display
 */
export function formatRequestTitle(request: EmployeeRequest): string {
  const typeLabel = getRequestTypeLabel(request.requestType);
  return `${getRequestTypeIcon(request.requestType)} ${typeLabel} - ${formatDate(request.startDate)} to ${formatDate(request.endDate)}`;
}

/**
 * Get subtitle for request
 */
export function getRequestSubtitle(request: EmployeeRequest): string {
  const statusLabel = getStatusLabel(request.status);
  const projects = request.projects.map((p) => p.name).join(", ");
  return `Status: ${statusLabel}${projects ? ` | Projects: ${projects}` : ""}`;
}
