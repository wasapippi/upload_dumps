"use client";

import { Stack, TextInput } from "@mantine/core";
import { CommandVariable } from "./types";
import { CONTROL_CHAR_PATTERN } from "@/lib/commandTemplate";

export const VariableForm = ({
  variables,
  values,
  onChange
}: {
  variables: CommandVariable[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}) => {
  if (variables.length === 0) return null;

  return (
    <Stack gap="sm">
      {variables.map((variable) => {
        const value = values[variable.name] ?? variable.defaultValue ?? "";
        const regex = variable.regex ? new RegExp(variable.regex) : null;
        const hasControl = CONTROL_CHAR_PATTERN.test(value) || /[\r\n]/.test(value);
        const regexValid = regex ? regex.test(value) : true;
        const requiredMissing = variable.required && value.trim().length === 0;
        const error =
          requiredMissing
            ? "必須です"
            : !regexValid
              ? "形式が一致しません"
              : hasControl
                ? "改行/制御文字は使えません"
                : null;

        return (
          <TextInput
            key={variable.name}
            label={variable.label}
            placeholder={variable.placeholder ?? undefined}
            value={value}
            required={variable.required}
            onChange={(event) => onChange(variable.name, event.currentTarget.value)}
            error={error}
          />
        );
      })}
    </Stack>
  );
};
