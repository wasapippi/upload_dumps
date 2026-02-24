const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const normalizeName = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

async function main() {
  await prisma.commandTag.deleteMany();
  await prisma.commandVariable.deleteMany();
  await prisma.command.deleteMany();
  await prisma.hostTypePlatform.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.hostType.deleteMany();
  await prisma.category.deleteMany();
  await prisma.platform.deleteMany();
  await prisma.vendor.deleteMany();

  const vendors = await Promise.all([
    prisma.vendor.create({ data: { name: "Cisco", normalizedName: normalizeName("Cisco") } }),
    prisma.vendor.create({ data: { name: "Juniper", normalizedName: normalizeName("Juniper") } }),
    prisma.vendor.create({ data: { name: "Nokia", normalizedName: normalizeName("Nokia") } })
  ]);

  const platforms = await Promise.all([
    prisma.platform.create({
      data: {
        name: "ASR-9000",
        normalizedName: normalizeName("ASR-9000"),
        vendorId: vendors[0].id
      }
    }),
    prisma.platform.create({
      data: {
        name: "NCS-5500",
        normalizedName: normalizeName("NCS-5500"),
        vendorId: vendors[0].id
      }
    }),
    prisma.platform.create({
      data: {
        name: "MX480",
        normalizedName: normalizeName("MX480"),
        vendorId: vendors[1].id
      }
    }),
    prisma.platform.create({
      data: {
        name: "PTX10008",
        normalizedName: normalizeName("PTX10008"),
        vendorId: vendors[1].id
      }
    }),
    prisma.platform.create({
      data: {
        name: "7750 SR",
        normalizedName: normalizeName("7750 SR"),
        vendorId: vendors[2].id
      }
    }),
    prisma.platform.create({
      data: {
        name: "7210 SAS",
        normalizedName: normalizeName("7210 SAS"),
        vendorId: vendors[2].id
      }
    })
  ]);

  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "DC", normalizedName: normalizeName("DC"), groupOrderIndex: 1 }
    }),
    prisma.category.create({
      data: { name: "Core", normalizedName: normalizeName("Core"), groupOrderIndex: 2 }
    }),
    prisma.category.create({
      data: { name: "Security", normalizedName: normalizeName("Security"), groupOrderIndex: 3 }
    })
  ]);

  const hostTypes = await Promise.all([
    prisma.hostType.create({
      data: {
        name: "DC-Leaf",
        normalizedName: normalizeName("DC-Leaf"),
        categoryId: categories[0].id,
        groupOrderIndex: 1
      }
    }),
    prisma.hostType.create({
      data: {
        name: "DC-Spine",
        normalizedName: normalizeName("DC-Spine"),
        categoryId: categories[0].id,
        groupOrderIndex: 2
      }
    }),
    prisma.hostType.create({
      data: {
        name: "Core-PE",
        normalizedName: normalizeName("Core-PE"),
        categoryId: categories[1].id,
        groupOrderIndex: 3
      }
    }),
    prisma.hostType.create({
      data: {
        name: "Core-RR",
        normalizedName: normalizeName("Core-RR"),
        categoryId: categories[1].id,
        groupOrderIndex: 4
      }
    }),
    prisma.hostType.create({
      data: {
        name: "FW-Edge",
        normalizedName: normalizeName("FW-Edge"),
        categoryId: categories[2].id,
        groupOrderIndex: 5
      }
    })
  ]);

  await prisma.hostTypePlatform.createMany({
    data: [
      { hostTypeId: hostTypes[0].id, platformId: platforms[0].id },
      { hostTypeId: hostTypes[0].id, platformId: platforms[1].id },
      { hostTypeId: hostTypes[1].id, platformId: platforms[1].id },
      { hostTypeId: hostTypes[2].id, platformId: platforms[2].id },
      { hostTypeId: hostTypes[2].id, platformId: platforms[3].id },
      { hostTypeId: hostTypes[3].id, platformId: platforms[4].id },
      { hostTypeId: hostTypes[4].id, platformId: platforms[5].id }
    ]
  });

  const tagNames = ["bgp", "ospf", "optics", "logs", "security", "isis", "mpls"];
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.create({ data: { name, normalizedName: normalizeName(name) } })
    )
  );

  const tagByName = new Map(tags.map((tag) => [tag.name, tag]));

  const commandSeed = [
    {
      title: "BGP Neighbor 状態確認",
      description: "VRF指定でBGPの概要を確認",
      commandText: "show bgp vrf [vrf] summary",
      hostTypeId: hostTypes[2].id,
      platformId: null,
      danger: false,
      orderIndex: 1,
      tags: ["bgp", "mpls"],
      variables: [
        { name: "vrf", label: "VRF", required: true, placeholder: "VRF名" }
      ]
    },
    {
      title: "BGP Neighbor 明細",
      description: "Peer詳細の確認",
      commandText: "show bgp vrf [vrf] neighbors [peer]",
      hostTypeId: hostTypes[2].id,
      platformId: platforms[2].id,
      danger: false,
      orderIndex: 2,
      tags: ["bgp"],
      variables: [
        { name: "vrf", label: "VRF", required: true },
        { name: "peer", label: "Peer IP", required: true, regex: "^[0-9.]+$" }
      ]
    },
    {
      title: "IF 状態確認",
      description: "インタフェース概要",
      commandText: "show interface [ifName]",
      hostTypeId: hostTypes[0].id,
      platformId: null,
      danger: false,
      orderIndex: 1,
      tags: ["logs"],
      variables: [
        { name: "ifName", label: "IF名", required: true, placeholder: "Ethernet1/1" }
      ]
    },
    {
      title: "光パワー確認",
      description: "DOM/光レベル確認",
      commandText: "show interfaces [ifName] transceiver details",
      hostTypeId: hostTypes[0].id,
      platformId: platforms[1].id,
      danger: false,
      orderIndex: 2,
      tags: ["optics"],
      variables: [
        { name: "ifName", label: "IF名", required: true }
      ]
    },
    {
      title: "OSPF 隣接確認",
      description: "Neighbor一覧",
      commandText: "show ospf neighbor vrf [vrf]",
      hostTypeId: hostTypes[1].id,
      platformId: null,
      danger: false,
      orderIndex: 1,
      tags: ["ospf"],
      variables: [
        { name: "vrf", label: "VRF", required: false, defaultValue: "default" }
      ]
    },
    {
      title: "ISIS DB 確認",
      description: "LSP一覧",
      commandText: "show isis database [level]",
      hostTypeId: hostTypes[3].id,
      platformId: platforms[4].id,
      danger: false,
      orderIndex: 1,
      tags: ["isis"],
      variables: [
        { name: "level", label: "Level", required: true, placeholder: "1 or 2" }
      ]
    },
    {
      title: "FW セッション確認",
      description: "FWセッション数の概要",
      commandText: "show session summary",
      hostTypeId: hostTypes[4].id,
      platformId: null,
      danger: false,
      orderIndex: 1,
      tags: ["security"],
      variables: []
    },
    {
      title: "FW ポリシー無効化",
      description: "緊急時の一時無効化",
      commandText: "configure terminal ; policy disable [policyName]",
      hostTypeId: hostTypes[4].id,
      platformId: platforms[5].id,
      danger: true,
      orderIndex: 2,
      tags: ["security"],
      variables: [
        { name: "policyName", label: "ポリシー名", required: true }
      ]
    },
    {
      title: "L2 VLAN 状態",
      description: "VLANの状態確認",
      commandText: "show vlan id [vlan]",
      hostTypeId: hostTypes[0].id,
      platformId: null,
      danger: false,
      orderIndex: 3,
      tags: ["logs"],
      variables: [
        { name: "vlan", label: "VLAN", required: true, regex: "^[0-9]{1,4}$" }
      ]
    },
    {
      title: "BGP ルート投入確認",
      description: "特定プレフィックスの経路",
      commandText: "show bgp vrf [vrf] route [prefix]",
      hostTypeId: hostTypes[2].id,
      platformId: null,
      danger: false,
      orderIndex: 3,
      tags: ["bgp"],
      variables: [
        { name: "vrf", label: "VRF", required: true },
        { name: "prefix", label: "Prefix", required: true, placeholder: "10.0.0.0/24" }
      ]
    }
  ];

  const extraCommandSeed = Array.from({ length: 45 }).map((_, index) => {
    const hostType = hostTypes[index % hostTypes.length];
    const platform = index % 3 === 0 ? null : platforms[index % platforms.length];
    const tagPool = ["bgp", "ospf", "optics", "logs", "security", "isis", "mpls"];
    const tag = tagPool[index % tagPool.length];
    const withVar = index % 2 === 0;
    return {
      title: `追加サンプルコマンド-${String(index + 1).padStart(2, "0")}`,
      description: "ページネーション確認用の追加データ",
      commandText: withVar
        ? `show interface [ifName] detail | match sample-${index + 1}`
        : `show logging | match sample-${index + 1}`,
      hostTypeId: hostType.id,
      platformId: platform ? platform.id : null,
      danger: false,
      orderIndex: 100 + index,
      tags: [tag],
      variables: withVar
        ? [{ name: "ifName", label: "IF名", required: true, placeholder: "xe-0/0/0" }]
        : []
    };
  });

  for (const seed of [...commandSeed, ...extraCommandSeed]) {
    const created = await prisma.command.create({
      data: {
        title: seed.title,
        description: seed.description,
        commandText: seed.commandText,
        hostTypeId: seed.hostTypeId,
        platformId: seed.platformId,
        danger: seed.danger,
        orderIndex: seed.orderIndex,
        createdBy: "demo-user",
        updatedBy: "demo-user",
        variables: {
          create: seed.variables.map((v) => ({
            name: v.name,
            label: v.label,
            required: Boolean(v.required),
            defaultValue: v.defaultValue ?? null,
            placeholder: v.placeholder ?? null,
            regex: v.regex ?? null
          }))
        }
      }
    });

    if (seed.tags.length > 0) {
      const tagLinks = seed.tags
        .map((name) => tagByName.get(name))
        .filter(Boolean)
        .map((tag) => ({ commandId: created.id, tagId: tag.id }));
      if (tagLinks.length > 0) {
        await prisma.commandTag.createMany({ data: tagLinks });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
