import Link from "next/link";
import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { IconDeviceDesktop } from "@tabler/icons-react";
import { HostTypeFixedPreviewAction } from "@/components/commands/HostTypeFixedPreviewAction";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Surfboard Pages + MySQL</h1>
      <ul>
        <li><Link href="/platforms">Platforms</Link></li>
        <li><Link href="/commands">Commands</Link></li>
        <li><Link href="/links">Links</Link></li>
      </ul>
      <Group gap="xs" mt="md">
        <Text size="sm">機種別Modalアイコンサンプル(固定表示):</Text>
        <Tooltip label="サンプル表示のみ">
          <ActionIcon variant="subtle" color="green" size="sm">
            <IconDeviceDesktop size="1.0rem" />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Group gap="xs" mt="xs">
        <Text size="sm">機種別Modalアイコンサンプル(実コンポーネント):</Text>
        <HostTypeFixedPreviewAction hostName="sample-host01" hostTypeId={1} />
      </Group>
    </main>
  );
}
