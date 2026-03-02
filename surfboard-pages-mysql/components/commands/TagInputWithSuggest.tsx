"use client";

import { ActionIcon, Group, TextInput, Badge } from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { Tag } from "./types";

const fetchSuggestions = async (query: string) => {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const response = await fetch(`/api/platforms/tags/suggest?${params.toString()}`);
  if (!response.ok) return [];
  return (await response.json()) as Tag[];
};

export const TagInputWithSuggest = ({
  value,
  onChange,
  label,
  placeholder
}: {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  placeholder?: string;
}) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const result = await fetchSuggestions(input.trim());
      if (active) setSuggestions(result);
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [input]);

  const normalized = useMemo(
    () => new Set(value.map((item) => item.toLowerCase())),
    [value]
  );

  const handleAdd = () => {
    const name = input.trim();
    if (!name) return;
    if (normalized.has(name.toLowerCase())) return;
    onChange([...value, name]);
    setInput("");
  };

  const handleRemove = (name: string) => {
    onChange(value.filter((item) => item !== name));
  };

  const datalistId = "tag-suggest-list";

  return (
    <Group align="flex-start" gap="xs" wrap="wrap">
      <TextInput
        label={label}
        placeholder={placeholder}
        value={input}
        onChange={(event) => setInput(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleAdd();
          }
        }}
        list={datalistId}
        style={{ flex: 1, minWidth: 240 }}
      />
      <ActionIcon
        aria-label="タグを追加"
        variant="light"
        onClick={handleAdd}
        style={{ marginTop: label ? 26 : 0 }}
      >
        <IconPlus size={16} />
      </ActionIcon>
      <datalist id={datalistId}>
        {suggestions.map((tag) => (
          <option key={tag.id} value={tag.name} />
        ))}
      </datalist>
      <Group gap="xs" wrap="wrap">
        {value.map((tag) => (
          <Badge key={tag} variant="light" color="teal" rightSection={
            <ActionIcon
              size="xs"
              variant="subtle"
              onClick={() => handleRemove(tag)}
            >
              <IconX size={10} />
            </ActionIcon>
          }>
            {tag}
          </Badge>
        ))}
      </Group>
    </Group>
  );
};
