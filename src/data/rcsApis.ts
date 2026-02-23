import type { MessagingApi } from "./whatsappApis";

export type RcsApi = MessagingApi;

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const rawApis: Omit<RcsApi, "id" | "accessType" | "isEssential">[] = [
  // === Essential (rcsbusinessmessaging scope) ===
  { category: "Send Agent Message", endpoint: "/v1/{parent=phones/*}/agentMessages", method: "POST", requiredId: "Phone ID", purpose: "Send RCS message to user", scope: "rcsbusinessmessaging", classification: "Essential", layer: "Messaging" },
  { category: "Revoke Agent Message", endpoint: "/v1/{name=phones/*/agentMessages/*}", method: "DELETE", requiredId: "Agent Message ID", purpose: "Revoke undelivered message", scope: "rcsbusinessmessaging", classification: "Essential", layer: "Messaging" },
  { category: "Send Agent Event", endpoint: "/v1/{parent=phones/*}/agentEvents", method: "POST", requiredId: "Phone ID", purpose: "Send typing indicators or events", scope: "rcsbusinessmessaging", classification: "Essential", layer: "Messaging" },
  { category: "Upload File", endpoint: "/v1/files", method: "POST", requiredId: "—", purpose: "Upload media for rich cards/messages", scope: "rcsbusinessmessaging", classification: "Essential", layer: "File" },
  { category: "Upload File (Resumable)", endpoint: "/upload/v1/files", method: "POST", requiredId: "—", purpose: "Upload large media files", scope: "rcsbusinessmessaging", classification: "Essential", layer: "File" },
  { category: "Get Capabilities", endpoint: "/v1/{name=phones/*}/capabilities", method: "GET", requiredId: "Phone ID", purpose: "Check if user supports RCS features", scope: "rcsbusinessmessaging", classification: "Essential", layer: "Phone" },
  { category: "Send Dialogflow Message", endpoint: "/v1/{parent=phones/*}/dialogflowMessages", method: "POST", requiredId: "Phone ID", purpose: "Trigger Dialogflow to respond", scope: "rcsbusinessmessaging", classification: "Essential", layer: "Dialogflow" },
  { category: "Invite Tester", endpoint: "/v1/{parent=phones/*}/testers", method: "POST", requiredId: "Phone ID", purpose: "Invite user to test agent", scope: "rcsbusinessmessaging", classification: "Essential", layer: "Tester" },
  { category: "Batch Get Users", endpoint: "/v1/users:batchGet", method: "POST", requiredId: "—", purpose: "Check RCS-enabled status for users", scope: "rcsbusinessmessaging", classification: "Essential", layer: "User" },

  // === Advanced (businesscommunications scope) ===
  { category: "Agent Performances", endpoint: "/v1/analytics/agentPerformances", method: "GET", requiredId: "—", purpose: "List agent performance metrics", scope: "businesscommunications", classification: "Advanced", layer: "Analytics" },
  { category: "Create Brand", endpoint: "/v1/brands", method: "POST", requiredId: "—", purpose: "Create a new brand", scope: "businesscommunications", classification: "Advanced", layer: "Brand" },
  { category: "Delete Brand", endpoint: "/v1/{name=brands/*}", method: "DELETE", requiredId: "Brand ID", purpose: "Delete brand", scope: "businesscommunications", classification: "Advanced", layer: "Brand" },
  { category: "Get Brand", endpoint: "/v1/{name=brands/*}", method: "GET", requiredId: "Brand ID", purpose: "Retrieve brand info", scope: "businesscommunications", classification: "Advanced", layer: "Brand" },
  { category: "List Brands", endpoint: "/v1/brands", method: "GET", requiredId: "—", purpose: "List accessible brands", scope: "businesscommunications", classification: "Advanced", layer: "Brand" },
  { category: "Update Brand", endpoint: "/v1/{brand.name=brands/*}", method: "PATCH", requiredId: "Brand ID", purpose: "Update brand details", scope: "businesscommunications", classification: "Advanced", layer: "Brand" },
  { category: "Create Agent", endpoint: "/v1/{parent=brands/*}/agents", method: "POST", requiredId: "Brand ID", purpose: "Create RCS agent", scope: "businesscommunications", classification: "Advanced", layer: "Agent" },
  { category: "Delete Agent", endpoint: "/v1/{name=brands/*/agents/*}", method: "DELETE", requiredId: "Agent ID", purpose: "Delete agent (deprecated)", scope: "businesscommunications", classification: "Advanced", layer: "Agent" },
  { category: "Get Agent", endpoint: "/v1/{name=brands/*/agents/*}", method: "GET", requiredId: "Agent ID", purpose: "Retrieve agent info", scope: "businesscommunications", classification: "Advanced", layer: "Agent" },
  { category: "Get Launch Info", endpoint: "/v1/{name=brands/*/agents/*/launch}", method: "GET", requiredId: "Agent ID", purpose: "Get launch configuration", scope: "businesscommunications", classification: "Advanced", layer: "Agent" },
  { category: "Get Verification", endpoint: "/v1/{name=brands/*/agents/*/verification}", method: "GET", requiredId: "Agent ID", purpose: "Get verification status", scope: "businesscommunications", classification: "Advanced", layer: "Agent" },
  { category: "List Agents", endpoint: "/v1/{parent=brands/*}/agents", method: "GET", requiredId: "Brand ID", purpose: "List agents under brand", scope: "businesscommunications", classification: "Advanced", layer: "Agent" },
  { category: "Update Agent", endpoint: "/v1/{agent.name=brands/*/agents/*}", method: "PATCH", requiredId: "Agent ID", purpose: "Update agent details", scope: "businesscommunications", classification: "Advanced", layer: "Agent" },
  { category: "Request Launch", endpoint: "/v1/{name=brands/*/agents/*}:requestLaunch", method: "POST", requiredId: "Agent ID", purpose: "Initiate launch process", scope: "businesscommunications", classification: "Advanced", layer: "Agent" },
  { category: "Request Verification", endpoint: "/v1/{name=brands/*/agents/*}:requestVerification", method: "POST", requiredId: "Agent ID", purpose: "Submit verification request", scope: "businesscommunications", classification: "Advanced", layer: "Agent" },
  { category: "Update Launch", endpoint: "/v1/{agentLaunch.name=brands/*/agents/*/launch}", method: "PATCH", requiredId: "Agent ID", purpose: "Update launch details", scope: "businesscommunications", classification: "Advanced", layer: "Agent" },
  { category: "Update Verification", endpoint: "/v1/{agentVerification.name=brands/*/agents/*/verification}", method: "PATCH", requiredId: "Agent ID", purpose: "Update verification state", scope: "businesscommunications", classification: "Advanced", layer: "Agent" },
  { category: "Create Integration", endpoint: "/v1/{parent=brands/*/agents/*}/integrations", method: "POST", requiredId: "Agent ID", purpose: "Create integration", scope: "businesscommunications", classification: "Advanced", layer: "Integration" },
  { category: "Delete Integration", endpoint: "/v1/{name=brands/*/agents/*/integrations/*}", method: "DELETE", requiredId: "Integration ID", purpose: "Delete integration", scope: "businesscommunications", classification: "Advanced", layer: "Integration" },
  { category: "Get Integration", endpoint: "/v1/{name=brands/*/agents/*/integrations/*}", method: "GET", requiredId: "Integration ID", purpose: "Retrieve integration", scope: "businesscommunications", classification: "Advanced", layer: "Integration" },
  { category: "List Integrations", endpoint: "/v1/{parent=brands/*/agents/*}/integrations", method: "GET", requiredId: "Agent ID", purpose: "List integrations", scope: "businesscommunications", classification: "Advanced", layer: "Integration" },
  { category: "Update Integration", endpoint: "/v1/{integration.name=brands/*/agents/*/integrations/*}", method: "PATCH", requiredId: "Integration ID", purpose: "Update integration", scope: "businesscommunications", classification: "Advanced", layer: "Integration" },
  { category: "Get Partner", endpoint: "/v1/{name=partners/*}", method: "GET", requiredId: "Partner ID", purpose: "Retrieve partner info", scope: "businesscommunications", classification: "Advanced", layer: "Partner" },
  { category: "Update Partner", endpoint: "/v1/{partner.name=partners/*}", method: "PATCH", requiredId: "Partner ID", purpose: "Update partner configuration", scope: "businesscommunications", classification: "Advanced", layer: "Partner" },
  { category: "List Regions", endpoint: "/v1/regions", method: "GET", requiredId: "—", purpose: "List supported RCS regions", scope: "businesscommunications", classification: "Advanced", layer: "Region" },
  { category: "Create Tester", endpoint: "/v1/testers", method: "POST", requiredId: "—", purpose: "Invite tester device", scope: "businesscommunications", classification: "Advanced", layer: "Tester" },
  { category: "Delete Tester", endpoint: "/v1/{name=testers/*}", method: "DELETE", requiredId: "Tester ID", purpose: "Remove tester device", scope: "businesscommunications", classification: "Advanced", layer: "Tester" },
  { category: "Get Tester", endpoint: "/v1/{name=testers/*}", method: "GET", requiredId: "Tester ID", purpose: "Check tester invite status", scope: "businesscommunications", classification: "Advanced", layer: "Tester" },
  { category: "List Testers", endpoint: "/v1/testers", method: "GET", requiredId: "—", purpose: "List tester devices", scope: "businesscommunications", classification: "Advanced", layer: "Tester" },
];

export const rcsApis: RcsApi[] = rawApis.map((api, index) => {
  const id = `rcs_${api.category.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "")}`;
  const isEssential = api.classification === "Essential";
  const accessType: "toggle" | "request" = isEssential ? "toggle" : (seededRandom(index + 42) > 0.3 ? "request" : "toggle");

  return { ...api, id, accessType, isEssential };
});
