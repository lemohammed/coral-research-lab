import LabConsole from "./console/lab-console";
import { getChatGPTUser } from "./chatgpt-auth";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await getChatGPTUser();
  return <LabConsole displayName={user?.displayName ?? "Local researcher"} />;
}
