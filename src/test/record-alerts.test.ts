import { describe, expect, it } from "vitest";

import { flags, type Rec } from "@/routes/index";

const base: Rec = {
  id: "1", date: "2026-10-23", animal: "C-1042", temp: 38.6, steps: 3200,
  ir: "Normal", rumination: 480, discharge: "None", dung: 2, bcs: 3, notes: "",
};

const has = (patch: Partial<Rec>, label: string) =>
  flags({ ...base, ...patch }).includes(label);

describe("Dung score alerts", () => {
  it("flags loose dung at score 4", () => {
    expect(has({ dung: 4 }, "Scours / loose dung")).toBe(true);
  });

  it("flags watery dung at score 5", () => {
    expect(has({ dung: 5 }, "Scours / loose dung")).toBe(true);
  });

  it("flags dry dung at score 1", () => {
    expect(has({ dung: 1 }, "Dry dung")).toBe(true);
  });

  it("raises no dung alert for normal scores 2 and 3", () => {
    expect(has({ dung: 2 }, "Scours / loose dung")).toBe(false);
    expect(has({ dung: 2 }, "Dry dung")).toBe(false);
    expect(has({ dung: 3 }, "Scours / loose dung")).toBe(false);
    expect(has({ dung: 3 }, "Dry dung")).toBe(false);
  });
});

describe("Body condition alerts", () => {
  it("flags under-conditioned below 2.5", () => {
    expect(has({ bcs: 2 }, "Under-conditioned")).toBe(true);
    expect(has({ bcs: 2.5 }, "Under-conditioned")).toBe(false);
  });

  it("flags over-conditioned above 4.5", () => {
    expect(has({ bcs: 5 }, "Over-conditioned")).toBe(true);
    expect(has({ bcs: 4.5 }, "Over-conditioned")).toBe(false);
  });
});
