import {
  formatDate,
  getStatusColor,
  getStatusLabel,
  getRequestTypeLabel,
  getRequestTypeIcon,
  formatRequestTitle,
  getRequestSubtitle,
} from "../../utils/formatting";
import { REQUEST_STATUS } from "../../types";
import type { EmployeeRequest } from "../../types";

describe("Formatting Utils", () => {
  describe("formatDate", () => {
    it("should format date string correctly", () => {
      const date = "2024-01-15T10:30:00Z";
      const formatted = formatDate(date);

      expect(formatted).toMatch(/Jan.*15.*2024/);
    });

    it("should handle different date formats", () => {
      const date = "2024-12-31";
      const formatted = formatDate(date);

      expect(formatted).toMatch(/Dec.*31.*2024/);
    });
  });

  describe("getStatusColor", () => {
    it("should return correct color for accepted status", () => {
      expect(getStatusColor(REQUEST_STATUS.ACCEPTED)).toBe("#00FF00");
    });

    it("should return correct color for pending status", () => {
      expect(getStatusColor(REQUEST_STATUS.PENDING)).toBe("#FFA500");
    });

    it("should return correct color for rejected status", () => {
      expect(getStatusColor(REQUEST_STATUS.REJECTED)).toBe("#FF0000");
    });

    it("should return correct color for cancelled status", () => {
      expect(getStatusColor(REQUEST_STATUS.CANCELLED)).toBe("#808080");
    });

    it("should return default color for unknown status", () => {
      expect(getStatusColor("UNKNOWN")).toBe("#000000");
    });
  });

  describe("getStatusLabel", () => {
    it("should return correct label for accepted status", () => {
      expect(getStatusLabel(REQUEST_STATUS.ACCEPTED)).toBe("Accepted");
    });

    it("should return correct label for pending status", () => {
      expect(getStatusLabel(REQUEST_STATUS.PENDING)).toBe("Pending");
    });

    it("should return correct label for rejected status", () => {
      expect(getStatusLabel(REQUEST_STATUS.REJECTED)).toBe("Rejected");
    });

    it("should return correct label for cancelled status", () => {
      expect(getStatusLabel(REQUEST_STATUS.CANCELLED)).toBe("Cancelled");
    });

    it("should return status as-is for unknown status", () => {
      expect(getStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    });
  });

  describe("getRequestTypeLabel", () => {
    it("should return correct label for vacation", () => {
      expect(getRequestTypeLabel("VC")).toBe("Vacation");
    });

    it("should return correct label for day off", () => {
      expect(getRequestTypeLabel("DY")).toBe("Day Off");
    });

    it("should return correct label for remote work", () => {
      expect(getRequestTypeLabel("RW")).toBe("Remote Work");
    });

    it("should return correct label for sick leave", () => {
      expect(getRequestTypeLabel("SL")).toBe("Sick Leave");
    });

    it("should return type as-is for unknown type", () => {
      expect(getRequestTypeLabel("UNKNOWN")).toBe("UNKNOWN");
    });
  });

  describe("getRequestTypeIcon", () => {
    it("should return correct icon for vacation", () => {
      expect(getRequestTypeIcon("VC")).toBe("✈️");
    });

    it("should return correct icon for day off", () => {
      expect(getRequestTypeIcon("DY")).toBe("🏖️");
    });

    it("should return correct icon for remote work", () => {
      expect(getRequestTypeIcon("RW")).toBe("🏠");
    });

    it("should return correct icon for sick leave", () => {
      expect(getRequestTypeIcon("SL")).toBe("🤒");
    });

    it("should return default icon for unknown type", () => {
      expect(getRequestTypeIcon("UNKNOWN")).toBe("📝");
    });
  });

  describe("formatRequestTitle", () => {
    it("should format request title correctly", () => {
      const request: EmployeeRequest = {
        id: 1,
        requestType: "VC",
        startDate: "2024-01-01",
        endDate: "2024-01-05",
        status: "PD",
        note: null,
        checkBy: null,
        adminNote: null,
        startTime: null,
        endTime: null,
        employee: { id: 1, firstName: "John", lastName: "Doe", picture: "" },
        breaks: [],
        created: "2024-01-01",
        projects: [],
        warnings: [],
      };

      const title = formatRequestTitle(request);

      expect(title).toContain("✈️");
      expect(title).toContain("Vacation");
      expect(title).toMatch(/Jan.*1.*2024/);
      expect(title).toMatch(/Jan.*5.*2024/);
    });
  });

  describe("getRequestSubtitle", () => {
    it("should format subtitle with status and projects", () => {
      const request: EmployeeRequest = {
        id: 1,
        requestType: "VC",
        startDate: "2024-01-01",
        endDate: "2024-01-05",
        status: REQUEST_STATUS.PENDING,
        note: null,
        checkBy: null,
        adminNote: null,
        startTime: null,
        endTime: null,
        employee: { id: 1, firstName: "John", lastName: "Doe", picture: "" },
        breaks: [],
        created: "2024-01-01",
        projects: [
          { name: "Project A", color: "#FF0000" },
          { name: "Project B", color: "#00FF00" },
        ],
        warnings: [],
      };

      const subtitle = getRequestSubtitle(request);

      expect(subtitle).toBe("Status: Pending | Projects: Project A, Project B");
    });

    it("should format subtitle without projects", () => {
      const request: EmployeeRequest = {
        id: 1,
        requestType: "VC",
        startDate: "2024-01-01",
        endDate: "2024-01-05",
        status: REQUEST_STATUS.ACCEPTED,
        note: null,
        checkBy: null,
        adminNote: null,
        startTime: null,
        endTime: null,
        employee: { id: 1, firstName: "John", lastName: "Doe", picture: "" },
        breaks: [],
        created: "2024-01-01",
        projects: [],
        warnings: [],
      };

      const subtitle = getRequestSubtitle(request);

      expect(subtitle).toBe("Status: Accepted");
    });
  });
});
