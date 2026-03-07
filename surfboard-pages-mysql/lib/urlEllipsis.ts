import type { CSSProperties } from "react";

export const urlEllipsisStyle: CSSProperties = {
  display: "block",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};
