import {
  AccessDeniedState,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingState,
  StatusBadge,
} from "@/components/ui";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

describe("UI Primitives", () => {
  describe("Button", () => {
    it("renders with default primary styles", () => {
      render(<Button>Click Me</Button>);
      const button = screen.getByRole("button", { name: "Click Me" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-brand-onyx");
    });

    it("triggers onClick when clicked", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Action</Button>);
      fireEvent.click(screen.getByRole("button", { name: "Action" }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("is disabled when disabled or loading", () => {
      const { rerender } = render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole("button")).toBeDisabled();

      rerender(<Button isLoading>Loading</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("Input", () => {
    it("renders label and handles typing", () => {
      const handleChange = vi.fn();
      render(<Input label="Test Input" onChange={handleChange} />);
      const input = screen.getByLabelText("Test Input");
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: "Hello" } });
      expect(handleChange).toHaveBeenCalled();
    });

    it("displays error message when provided", () => {
      render(<Input label="Field" error="Invalid value" />);
      expect(screen.getByText("Invalid value")).toBeInTheDocument();
    });
  });

  describe("StatusBadge", () => {
    it("renders with correct label and status styling", () => {
      render(<StatusBadge status="success" label="Confirmed" />);
      const badge = screen.getByText("Confirmed");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("text-state-success");
    });
  });

  describe("Card", () => {
    it("renders title, subtitle, and children", () => {
      render(
        <Card title="Card Title" subtitle="Card Subtitle">
          <p>Card Content</p>
        </Card>,
      );
      expect(screen.getByText("Card Title")).toBeInTheDocument();
      expect(screen.getByText("Card Subtitle")).toBeInTheDocument();
      expect(screen.getByText("Card Content")).toBeInTheDocument();
    });
  });

  describe("StateViews", () => {
    it("renders loading message", () => {
      render(<LoadingState message="Fetching data..." />);
      expect(screen.getByText("Fetching data...")).toBeInTheDocument();
    });

    it("renders empty state with action", () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No Items"
          description="None available"
          actionLabel="Create Item"
          onAction={handleAction}
        />,
      );
      expect(screen.getByText("No Items")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Create Item" }));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it("renders access denied state", () => {
      render(<AccessDeniedState title="Denied Access" description="Unauthorized role" />);
      expect(screen.getByText("Denied Access")).toBeInTheDocument();
      expect(screen.getByText("Unauthorized role")).toBeInTheDocument();
    });
  });
});
