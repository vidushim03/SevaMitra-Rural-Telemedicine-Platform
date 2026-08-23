/**
 * AI Symptom Analysis Service
 * Provides specialist recommendations and urgency assessments based on symptoms.
 */

const SYMPTOM_SPECIALIST_MAP = {
  cardio: {
    specialist: "Cardiologist",
    specialtyCode: "cardiology",
    keywords: [
      "chest pain",
      "heart",
      "palpitations",
      "shortness of breath",
      "सीने में दर्द",
      "दिल",
      "धड़कन",
    ],
  },
  pediatric: {
    specialist: "Pediatrician",
    specialtyCode: "pediatrics",
    keywords: ["child", "infant", "baby", "vaccination", "बच्चा", "शिशु"],
  },
  neuro: {
    specialist: "Neurologist",
    specialtyCode: "neurology",
    keywords: [
      "headache",
      "dizziness",
      "seizure",
      "numbness",
      "सिरदर्द",
      "चक्कर",
    ],
  },
  ortho: {
    specialist: "Orthopedic Surgeon",
    specialtyCode: "orthopedics",
    keywords: ["bone", "fracture", "joint pain", "back pain", "हड्डी", "दर्द"],
  },
  dermo: {
    specialist: "Dermatologist",
    specialtyCode: "dermatology",
    keywords: ["skin", "rash", "itch", "acne", "त्वचा", "खुजली"],
  },
  ent: {
    specialist: "ENT Specialist",
    specialtyCode: "ent",
    keywords: ["ear", "nose", "throat", "sinus", "कान", "नाक", "गला"],
  },
  psych: {
    specialist: "Psychiatrist",
    specialtyCode: "psychiatry",
    keywords: ["anxiety", "depression", "sleep", "stress", "चिंता", "तनाव"],
  },
};

export const analyzeSymptoms = async (symptoms) => {
  try {
    const response = await fetch("http://localhost:4001/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms }),
    });
    if (!response.ok) {
      throw new Error(`Triage API failed: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("AI Triage Error:", error);
    // Fallback on error
    return {
      specialist: "General Physician",
      specialtyCode: "general",
      urgency: "medium",
      likelihood: 0.5,
      reasoning:
        "An error occurred during AI analysis. Please consult a general physician.",
    };
  }
};
