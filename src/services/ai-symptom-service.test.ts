import { describe, expect, it } from "vitest";
import { analyzeSymptoms } from "./ai-symptom-service";

describe("analyzeSymptoms", () => {
  it("routes chest pain to cardiology with emergency urgency", () => {
    const res = analyzeSymptoms("I have chest pain and shortness of breath");
    expect(res.specialtyCode).toBe("cardiology");
    expect(res.urgency).toBe("emergency");
    expect(res.specialist).toBe("Cardiologist");
  });

  it("routes headache to neurology", () => {
    const res = analyzeSymptoms("severe headache with dizziness");
    expect(res.specialtyCode).toBe("neurology");
    expect(res.urgency).toBe("high");
  });

  it("routes Hindi symptoms correctly", () => {
    const res = analyzeSymptoms("सीने में दर्द और सांस लेने में तकलीफ");
    expect(res.specialtyCode).toBe("cardiology");
  });

  it("routes skin symptoms to dermatology", () => {
    const res = analyzeSymptoms("skin rash with itching");
    expect(res.specialtyCode).toBe("dermatology");
  });

  it("falls back to general physician for unknown input", () => {
    const res = analyzeSymptoms("feeling a bit tired");
    expect(res.specialtyCode).toBe("general");
    expect(res.specialist).toBe("General Physician");
  });

  it("flags emergency keywords regardless of match", () => {
    const res = analyzeSymptoms("severe bleeding after an accident");
    expect(res.urgency).toBe("emergency");
  });

  it("caps likelihood at 0.95", () => {
    const res = analyzeSymptoms(
      "chest pain heart palpitations shortness of breath headache dizziness joint pain",
    );
    expect(res.likelihood).toBeLessThanOrEqual(0.95);
  });
});
