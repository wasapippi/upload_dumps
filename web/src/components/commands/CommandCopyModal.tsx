"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Group, Modal, Paper, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { Command } from "./types";
import {
  applyBracketTemplate,
  extractBracketVariables,
  isSafeValue
} from "@/lib/commandTemplate";

const variableKey = (name: string) => name.trim().toLowerCase();

const renderHighlighted = (source: string, focusedVariable: string | null) => {
  const parts = source.split(/(\[[^\[\]\s]+\])/g);
  return parts.map((part, index) => {
    const match = part.match(/^\[([^\[\]\s]+)\]$/);
    if (!match) return <span key={index}>{part}</span>;
    const variable = match[1];
    const highlighted = focusedVariable === variable;
    return (
      <span
        key={index}
        style={
          highlighted
            ? {
                backgroundColor: "rgba(250, 176, 5, 0.35)",
                borderRadius: 4,
                padding: "0 2px"
              }
            : undefined
        }
      >
        {part}
      </span>
    );
  });
};

export const CommandCopyModal = ({
  commands,
  opened,
  cachedValues,
  onCommitValues,
  onClearCachedValues,
  onCopied,
  onClose
}: {
  commands: Command[];
  opened: boolean;
  cachedValues?: Record<string, string>;
  onCommitValues?: (values: Record<string, string>) => void;
  onClearCachedValues?: () => void;
  onCopied?: () => void;
  onClose: () => void;
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [focusedVariable, setFocusedVariable] = useState<string | null>(null);

  const variables = useMemo(() => {
    const map = new Set<string>();
    for (const command of commands) {
      for (const variable of extractBracketVariables(command.commandText)) {
        map.add(variable);
      }
    }
    return Array.from(map);
  }, [commands]);

  useEffect(() => {
    const nextValues: Record<string, string> = {};
    for (const variable of variables) {
      nextValues[variable] = cachedValues?.[variableKey(variable)] ?? "";
    }
    setValues(nextValues);
    setError(null);
    setFocusedVariable(null);
  }, [cachedValues, variables, opened]);

  const originalPreview = useMemo(() => {
    return commands.map((command) => command.commandText).join("\n");
  }, [commands]);

  const preview = useMemo(() => {
    return commands
      .map((command) => applyBracketTemplate(command.commandText, values))
      .join("\n");
  }, [commands, values]);

  const validation = useMemo(() => {
    for (const variable of variables) {
      const value = (values[variable] ?? "").trim();
      if (!value) return { valid: false, message: `変数 [${variable}] を入力してください` };
      if (!isSafeValue(value)) return { valid: false, message: "改行/制御文字は使えません" };
    }
    return { valid: true, message: "" };
  }, [values, variables]);

  const handleCopy = async () => {
    setError(null);

    if (commands.some((command) => command.danger)) {
      const confirmed = window.confirm("danger コマンドを含みます。コピーして実行してよいですか？");
      if (!confirmed) return;
    }

    if (variables.length > 0 && !validation.valid) {
      setError(validation.message || "入力を確認してください");
      return;
    }

    await navigator.clipboard.writeText(preview);
    if (variables.length > 0) {
      const committed: Record<string, string> = {};
      for (const variable of variables) {
        const value = (values[variable] ?? "").trim();
        if (value) committed[variableKey(variable)] = value;
      }
      onCommitValues?.(committed);
    }
    onCopied?.();
    onClose();
  };

  const title =
    commands.length === 1
      ? `${commands[0].title} をコピー`
      : `表示中 ${commands.length} 件をまとめてコピー`;

  return (
    <Modal opened={opened} onClose={onClose} size="xl" title={title}>
      <Group align="flex-start" grow wrap="nowrap">
        <Stack gap="sm" style={{ flex: 1.5, minWidth: 0 }}>
          <Stack gap={4}>
            <Text size="sm" fw={600}>原文プレビュー</Text>
            <Paper withBorder p="sm" radius="sm" style={{ minHeight: 120 }}>
              <Text size="sm" ff="monospace" style={{ whiteSpace: "pre-wrap" }}>
                {renderHighlighted(originalPreview, focusedVariable)}
              </Text>
            </Paper>
          </Stack>

          <Textarea
            label="置換結果"
            value={preview}
            readOnly
            minRows={8}
            autosize
            styles={{ input: { fontFamily: "monospace" } }}
          />
        </Stack>

        <Stack gap="sm" style={{ width: 280, flexShrink: 0 }}>
          <Text size="sm" fw={600}>置換メニュー</Text>
          {variables.length === 0 ? (
            <Text size="sm" c="dimmed">このコマンド群に置換対象はありません。</Text>
          ) : (
            variables.map((variable) => (
              <TextInput
                key={variable}
                label={`[${variable}]`}
                description={`[${variable}] を置換`}
                placeholder={`例: ${variable}`}
                value={values[variable] ?? ""}
                onFocus={() => setFocusedVariable(variable)}
                onBlur={() => setFocusedVariable(null)}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setValues((prev) => ({ ...prev, [variable]: value }));
                }}
                required
              />
            ))
          )}

          {error ? <Text size="sm" c="red">{error}</Text> : null}

          <Group justify="space-between">
            <Button variant="subtle" color="gray" size="xs" onClick={onClearCachedValues}>
              保持値をクリア
            </Button>
            <Button onClick={handleCopy} disabled={variables.length > 0 && !validation.valid}>
              コピー
            </Button>
          </Group>
        </Stack>
      </Group>
    </Modal>
  );
};
