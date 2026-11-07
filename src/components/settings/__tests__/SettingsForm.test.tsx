import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ToastProvider from "@/components/ui/Toast";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/client-api", () => ({
  api: { get: mocks.get, post: mocks.post },
}));

import SettingsForm from "../SettingsForm";

const savedSettings = {
  theme: "dark" as const,
  units: "both" as const,
  base: { pg: 30, vg: 70 },
  strength: 6,
  amount: 30,
  zeroNicotineMode: false,
  nicotine: { strength: 100, base: { pg: 100, vg: 0 } },
  flavor: { percentage: 5, base: { pg: 100, vg: 0 } },
};

function renderForm() {
  return render(
    <ToastProvider>
      <SettingsForm />
    </ToastProvider>,
  );
}

describe("SettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.post.mockResolvedValue(savedSettings);
  });

  it("loads the grouped calculator defaults", async () => {
    mocks.get.mockResolvedValue(savedSettings);

    renderForm();

    expect(
      await screen.findByRole("heading", { name: "Calculator Defaults" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Mixing Units" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Batch" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nicotine" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Flavors" })).toBeInTheDocument();
    expect(screen.getByLabelText("Mixing units")).toHaveValue("both");
    expect(screen.getByTestId("settingsTargetAmountInput")).toHaveValue(30);
    expect(screen.getByTestId("settingsTargetNicStrengthInput")).toHaveValue(6);
    expect(screen.getByTestId("settingsNicStrengthInput")).toHaveValue(100);
    expect(screen.getByTestId("settingsFlavorPercentageInput")).toHaveValue(5);
  });

  it("saves the existing settings shape and reports success with a toast", async () => {
    mocks.get.mockResolvedValue(savedSettings);

    renderForm();

    await screen.findByTestId("settingsTargetAmountInput");
    fireEvent.change(screen.getByTestId("settingsTargetAmountInput"), {
      target: { value: "60" },
    });
    fireEvent.click(screen.getByRole("switch", { name: "Zero nicotine mode" }));
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(1));
    expect(mocks.post).toHaveBeenCalledWith("/api/settings", {
      theme: "dark",
      units: "both",
      base: { pg: 30, vg: 70 },
      strength: 6,
      amount: 60,
      zeroNicotineMode: true,
      nicotine: { strength: 100, base: { pg: 100, vg: 0 } },
      flavor: { percentage: 5, base: { pg: 100, vg: 0 } },
    });
    expect(
      await screen.findByText(
        "Settings saved. New batches will use these defaults.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a load error and retries without exposing the form", async () => {
    mocks.get
      .mockRejectedValueOnce(new Error("Settings are unavailable."))
      .mockResolvedValueOnce(savedSettings);

    renderForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Settings are unavailable.",
    );
    expect(screen.queryByTestId("settingsTargetAmountInput")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByTestId("settingsTargetAmountInput")).toHaveValue(30);
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  it("keeps save failures inline", async () => {
    mocks.get.mockResolvedValue(savedSettings);
    mocks.post.mockRejectedValue(new Error("Could not save your settings."));

    renderForm();

    await screen.findByTestId("settingsTargetAmountInput");
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save your settings.",
    );
  });
});
