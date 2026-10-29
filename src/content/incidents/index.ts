import type { IncidentSpec } from "@/features/incidents/types";
import { cssIncidents } from "./css";
import { jsIncidents } from "./javascript";
import { a11yIncidents } from "./a11y";
import { securityIncidents } from "./security";

export const INCIDENTS: IncidentSpec[] = [...cssIncidents, ...jsIncidents, ...a11yIncidents, ...securityIncidents];

export const getIncident = (id: string) => INCIDENTS.find((i) => i.id === id);
