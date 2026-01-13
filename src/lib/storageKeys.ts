// Sprint 8C | Chaves centralizadas de LocalStorage
export const PDF_VARIANT_KEY = "mindsetfit:pdfVariant" as const;

// Sprint 9B.1 | Multi-paciente (namespace por cliente/paciente)
export const REPORT_HISTORY_BASE_KEY = "mindsetfit:reportHistory:v1" as const;
export const CURRENT_PATIENT_KEY = "mindsetfit:currentPatient:v1" as const;
export const reportHistoryKey = (patientId: string) => `${REPORT_HISTORY_BASE_KEY}:${(patientId || "default").trim() || "default"}`;

// Compat (legado): mantém nome antigo caso algum import antigo exista
export const REPORT_HISTORY_KEY = REPORT_HISTORY_BASE_KEY as unknown as typeof REPORT_HISTORY_BASE_KEY;

// Sprint 9B.2 | Lista de pacientes (local, sem login)
export const PATIENTS_KEY = "mindsetfit:patients:v1" as const;
