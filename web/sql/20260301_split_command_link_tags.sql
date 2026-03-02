USE `surfboard`;

ALTER TABLE `Tag`
  ADD COLUMN `kind` VARCHAR(16) NOT NULL DEFAULT 'COMMAND' AFTER `normalizedName`;

ALTER TABLE `Tag`
  DROP INDEX `Tag_normalizedName_key`,
  ADD UNIQUE KEY `Tag_normalizedName_kind_key` (`normalizedName`, `kind`);

INSERT INTO `Tag` (`name`, `normalizedName`, `kind`, `createdAt`, `updatedAt`)
SELECT t.`name`, t.`normalizedName`, 'LINK', NOW(3), NOW(3)
FROM `Tag` t
JOIN `PlatformLinkTag` plt ON plt.`tagId` = t.`id`
LEFT JOIN `Tag` lt
  ON lt.`normalizedName` = t.`normalizedName`
 AND lt.`kind` = 'LINK'
WHERE lt.`id` IS NULL
GROUP BY t.`name`, t.`normalizedName`;

UPDATE `PlatformLinkTag` plt
JOIN `Tag` old_t ON old_t.`id` = plt.`tagId`
JOIN `Tag` link_t
  ON link_t.`normalizedName` = old_t.`normalizedName`
 AND link_t.`kind` = 'LINK'
SET plt.`tagId` = link_t.`id`
WHERE old_t.`kind` <> 'LINK';
