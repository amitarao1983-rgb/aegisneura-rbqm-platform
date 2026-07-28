import { UploadPanel } from "@/components/UploadPanel";
import { readPlatform } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function UploadsPage() {
  const data = await readPlatform();
  return <UploadPanel trials={data.trials} uploads={data.uploads} />;
}
