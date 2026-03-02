"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Group, Stack, Table, Text } from "@mantine/core";
import { CommandList } from "./CommandList";
import { Command, PlatformLink } from "./types";

export const TicketCommandLinkPanel = ({
  platformId,
  hostTypeId,
  hostName
}: {
  platformId: number;
  hostTypeId: number;
  hostName: string;
}) => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [links, setLinks] = useState<PlatformLink[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setError(null);
      const commandParams = new URLSearchParams({
        platformId: String(platformId),
        hostTypeId: String(hostTypeId),
        forDevice: "1"
      });
      const linkParams = new URLSearchParams({
        platformId: String(platformId),
        hostTypeId: String(hostTypeId),
        hostName,
        forDevice: "1"
      });

      const [commandRes, linkRes] = await Promise.all([
        fetch(`/api/commands?${commandParams.toString()}`),
        fetch(`/api/platform-links?${linkParams.toString()}`)
      ]);

      if (!active) return;
      if (!commandRes.ok || !linkRes.ok) {
        setError("コマンド/リンク情報の取得に失敗しました。");
        return;
      }

      const commandData = await commandRes.json();
      const linkData = await linkRes.json();
      if (!active) return;

      setCommands(Array.isArray(commandData) ? commandData : commandData.items ?? []);
      setLinks(Array.isArray(linkData) ? linkData : []);
    };

    run();
    return () => {
      active = false;
    };
  }, [hostName, hostTypeId, platformId]);

  const hasData = useMemo(() => commands.length > 0 || links.length > 0, [commands.length, links.length]);

  return (
    <Stack gap="sm">
      <Group gap="md">
        <Text size="sm" c="dimmed">platformId: {platformId}</Text>
        <Text size="sm" c="dimmed">hostTypeId: {hostTypeId}</Text>
        <Text size="sm" c="dimmed">hostName: {hostName}</Text>
      </Group>

      {error ? <Alert color="red">{error}</Alert> : null}

      <Stack gap="xs">
        <Text fw={600}>関連リンク（自動補完済み）</Text>
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>タイトル</Table.Th>
              <Table.Th>URL</Table.Th>
              <Table.Th>コメント</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {links.map((link) => (
              <Table.Tr key={link.id}>
                <Table.Td>{link.title}</Table.Td>
                <Table.Td>
                  <a href={link.resolvedUrl ?? link.urlTemplate} target="_blank" rel="noreferrer">
                    {link.resolvedUrl ?? link.urlTemplate}
                  </a>
                </Table.Td>
                <Table.Td>{link.resolvedComment ?? link.commentTemplate}</Table.Td>
              </Table.Tr>
            ))}
            {links.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text size="sm" c="dimmed">表示できるリンクはありません。</Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </Stack>

      <Stack gap="xs">
        <Text fw={600}>関連コマンド</Text>
        {commands.length > 0 ? (
          <CommandList commands={commands} />
        ) : (
          <Text size="sm" c="dimmed">表示できるコマンドはありません。</Text>
        )}
      </Stack>

      {!error && !hasData ? (
        <Text size="sm" c="dimmed">表示対象のデータがありません。</Text>
      ) : null}
    </Stack>
  );
};

