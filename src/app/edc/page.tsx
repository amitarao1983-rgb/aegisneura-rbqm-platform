import { EdcConnectorsPanel } from "@/components/EdcConnectorsPanel";
import { readPlatform } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EdcPage() {
  const data = await readPlatform();
  return <EdcConnectorsPanel connectors={data.connectors} />;
}
