/**
 * AI Symptom Analysis Service
 * Provides specialist recommendations and urgency assessments based on symptoms.
 */

export interface SymptomAnalysis {
  specialist: string;
  specialtyCode: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  likelihood: number; // 0 to 1
  reasoning: string;
}

const SYMPTOM_SPECIALIST_MAP: Record<string, { specialist: string; specialtyCode: string; keywords: string[] }> = {
  cardio: {
    specialist: 'Cardiologist',
    specialtyCode: 'cardiology',
    keywords: ['chest pain', 'heart', 'palpitations', 'shortness of breath', 'सीने में दर्द', 'दिल', 'धड़कन'],
  },
  pediatric: {
    specialist: 'Pediatrician',
    specialtyCode: 'pediatrics',
    keywords: ['child', 'infant', 'baby', 'vaccination', 'बच्चा', 'शिशु'],
  },
  neuro: {
    specialist: 'Neurologist',
    specialtyCode: 'neurology',
    keywords: ['headache', 'dizziness', 'seizure', 'numbness', 'सिरदर्द', 'चक्कर'],
  },
  ortho: {
    specialist: 'Orthopedic Surgeon',
    specialtyCode: 'orthopedics',
    keywords: ['bone', 'fracture', 'joint pain', 'back pain', 'हड्डी', 'दर्द'],
  },
  dermo: {
    specialist: 'Dermatologist',
    specialtyCode: 'dermatology',
    keywords: ['skin', 'rash', 'itch', 'acne', 'त्वचा', 'खुजली'],
  },
  ent: {
    specialist: 'ENT Specialist',
    specialtyCode: 'ent',
    keywords: ['ear', 'nose', 'throat', 'sinus', 'कान', 'नाक', 'गला'],
  },
  psych: {
    specialist: 'Psychiatrist',
    specialtyCode: 'psychiatry',
    keywords: ['anxiety', 'depression', 'sleep', 'stress', 'चिंता', 'तनाव'],
  },
};

export const analyzeSymptoms = (symptoms: string): SymptomAnalysis => {
  const normalized = symptoms.toLowerCase();
  let bestMatch = { specialist: 'General Physician', specialtyCode: 'general', score: 0 };

  for (const [key, data] of Object.entries(SYMPTOM_SPECIALIST_MAP)) {
    let score = 0;
    data.keywords.forEach(keyword => {
      if (normalized.includes(keyword.toLowerCase())) {
        score += 1;
      }
    });

    if (score > bestMatch.score) {
      bestMatch = { ...data, score };
    }
  }

  // Determine urgency
  let urgency: 'low' | 'medium' | 'high' | 'emergency' = 'low';
  const emergencyKeywords = ['chest pain', 'breathing', 'unconscious', 'severe bleeding'];
  const highKeywords = ['fever', 'severe', 'acute', 'pain'];

  if (emergencyKeywords.some(kw => normalized.includes(kw))) {
    urgency = 'emergency';
  } else if (highKeywords.some(kw => normalized.includes(kw))) {
    urgency = 'high';
  } else if (normalized.length > 50) {
    urgency = 'medium';
  }

  return {
    specialist: bestMatch.specialist,
    specialtyCode: bestMatch.specialtyCode,
    urgency,
    likelihood: Math.min(0.95, 0.4 + bestMatch.score * 0.2),
    reasoning: `Based on your symptoms, we recommend consulting a ${bestMatch.specialist}.`,
  };
};
