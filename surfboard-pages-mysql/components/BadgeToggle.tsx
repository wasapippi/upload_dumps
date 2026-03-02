import React from "react";

type Item = { id: string; label: string };

export const BadgeToggle = ({
  items,
  value,
  onChange,
  multi = false
}: {
  items: Item[];
  value: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
}) => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {items.map((item) => {
      const selected = value.includes(item.id);
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            if (multi) {
              onChange(selected ? value.filter((x) => x !== item.id) : [...value, item.id]);
            } else {
              onChange(selected ? [] : [item.id]);
            }
          }}
          style={{
            borderRadius: 999,
            border: "1px solid #999",
            background: selected ? "#1c7ed6" : "#f5f5f5",
            color: selected ? "white" : "#333",
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 12
          }}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);
