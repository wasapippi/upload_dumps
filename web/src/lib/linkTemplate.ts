type LinkContext = {
  hostName?: string | null;
  platformName?: string | null;
  hostTypeName?: string | null;
};

export const applyLinkTemplate = (template: string, context: LinkContext) => {
  const replacements: Record<string, string> = {
    HOST_NAME: context.hostName?.trim() || "",
    PLATFORM_NAME: context.platformName?.trim() || "",
    HOST_TYPE_NAME: context.hostTypeName?.trim() || ""
  };

  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, token: string) => {
    return replacements[token] ?? `{{${token}}}`;
  });
};

