import { initialWorkspace, type Workspace } from "./lab";
import { workspaceSchema } from "./validation";

const KEY = "coral-browser-workspace-v1";
export function readBrowserWorkspace(): Workspace {
  const saved = localStorage.getItem(KEY);
  if (!saved) return initialWorkspace();
  const parsed = workspaceSchema.safeParse(JSON.parse(saved));
  if (!parsed.success) throw new Error("This browser workspace is invalid. Export it before resetting storage.");
  return parsed.data;
}
export function saveBrowserWorkspace(workspace: Workspace): void {
  localStorage.setItem(KEY, JSON.stringify(workspaceSchema.parse(workspace)));
}
