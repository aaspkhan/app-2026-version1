import { GoogleGenAI, Type } from "@google/genai";
import { HealthMetrics, RiskAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeDiabetesRisk(metrics: HealthMetrics, age: number, weight: number): Promise<RiskAnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following health metrics for a person (Age: ${age}, Weight: ${weight}kg) to estimate the risk of developing Type 2 Diabetes and general cardiovascular health.
    
    Current Metrics:
    - Resting Heart Rate: ${metrics.heartRate} bpm
    - Blood Pressure: ${metrics.systolicBP}/${metrics.diastolicBP} mmHg
    - Daily Average Steps: ${metrics.steps}

    Provide a risk assessment based on general medical guidelines (e.g., ADA, AHA). 
    Note: This is for informational purposes only, not a medical diagnosis.

    Return the response in strictly valid JSON format conforming to the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: {
              type: Type.STRING,
              enum: ["Low", "Moderate", "High", "Critical"],
              description: "The estimated risk level based on the inputs."
            },
            score: {
              type: Type.NUMBER,
              description: "A risk score from 0 (lowest risk) to 100 (highest risk)."
            },
            summary: {
              type: Type.STRING,
              description: "A concise summary of the analysis (max 2 sentences)."
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3 actionable health recommendations."
            }
          },
          required: ["riskLevel", "score", "summary", "recommendations"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text) as RiskAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback in case of error
    return {
      riskLevel: "Moderate",
      score: 50,
      summary: "Unable to perform detailed analysis at this moment. Please check your connection.",
      recommendations: ["Consult a doctor", "Maintain a healthy diet", "Exercise regularly"]
    };
  }
}