CREATE DATABASE IF NOT EXISTS `surfboard`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `surfboard`;

CREATE TABLE IF NOT EXISTS `Vendor` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `normalizedName` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Vendor_normalizedName_key` (`normalizedName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Category` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `normalizedName` VARCHAR(191) NOT NULL,
  `groupOrderIndex` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_normalizedName_key` (`normalizedName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Platform` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `normalizedName` VARCHAR(191) NOT NULL,
  `vendorId` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Platform_normalizedName_key` (`normalizedName`),
  KEY `Platform_vendorId_idx` (`vendorId`),
  CONSTRAINT `Platform_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `HostType` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `normalizedName` VARCHAR(191) NOT NULL,
  `categoryId` INT NOT NULL,
  `groupOrderIndex` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `HostType_normalizedName_key` (`normalizedName`),
  KEY `HostType_categoryId_idx` (`categoryId`),
  CONSTRAINT `HostType_categoryId_fkey`
    FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `HostTypePlatform` (
  `hostTypeId` INT NOT NULL,
  `platformId` INT NOT NULL,
  PRIMARY KEY (`hostTypeId`, `platformId`),
  KEY `HostTypePlatform_platformId_idx` (`platformId`),
  CONSTRAINT `HostTypePlatform_hostTypeId_fkey`
    FOREIGN KEY (`hostTypeId`) REFERENCES `HostType`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `HostTypePlatform_platformId_fkey`
    FOREIGN KEY (`platformId`) REFERENCES `Platform`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Tag` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `normalizedName` VARCHAR(191) NOT NULL,
  `kind` VARCHAR(16) NOT NULL DEFAULT 'COMMAND',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Tag_normalizedName_kind_key` (`normalizedName`, `kind`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Command` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `commandText` TEXT NOT NULL,
  `hostTypeId` INT NOT NULL,
  `platformId` INT NULL,
  `vendorId` INT NULL,
  `visibility` VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
  `ownerUserId` VARCHAR(191) NULL,
  `deviceBindingMode` VARCHAR(32) NOT NULL DEFAULT 'INCLUDE_IN_DEVICE',
  `danger` BOOLEAN NOT NULL DEFAULT FALSE,
  `orderIndex` INT NOT NULL DEFAULT 0,
  `createdBy` VARCHAR(191) NOT NULL,
  `updatedBy` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `Command_hostTypeId_platformId_vendorId_orderIndex_idx` (`hostTypeId`, `platformId`, `vendorId`, `orderIndex`),
  KEY `Command_visibility_ownerUserId_idx` (`visibility`, `ownerUserId`),
  KEY `Command_platformId_idx` (`platformId`),
  KEY `Command_vendorId_idx` (`vendorId`),
  CONSTRAINT `Command_hostTypeId_fkey`
    FOREIGN KEY (`hostTypeId`) REFERENCES `HostType`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Command_platformId_fkey`
    FOREIGN KEY (`platformId`) REFERENCES `Platform`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Command_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `PlatformLink` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `urlTemplate` TEXT NOT NULL,
  `commentTemplate` TEXT NULL,
  `platformId` INT NULL,
  `vendorId` INT NULL,
  `hostTypeId` INT NOT NULL,
  `visibility` VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
  `ownerUserId` VARCHAR(191) NULL,
  `deviceBindingMode` VARCHAR(32) NOT NULL DEFAULT 'INCLUDE_IN_DEVICE',
  `orderIndex` INT NOT NULL DEFAULT 0,
  `createdBy` VARCHAR(191) NOT NULL,
  `updatedBy` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `PlatformLink_platformId_vendorId_hostTypeId_orderIndex_idx` (`platformId`, `vendorId`, `hostTypeId`, `orderIndex`),
  KEY `PlatformLink_visibility_ownerUserId_idx` (`visibility`, `ownerUserId`),
  CONSTRAINT `PlatformLink_platformId_fkey`
    FOREIGN KEY (`platformId`) REFERENCES `Platform`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PlatformLink_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PlatformLink_hostTypeId_fkey`
    FOREIGN KEY (`hostTypeId`) REFERENCES `HostType`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `CommandVariable` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `commandId` INT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `required` BOOLEAN NOT NULL DEFAULT FALSE,
  `defaultValue` VARCHAR(191) NULL,
  `placeholder` VARCHAR(191) NULL,
  `regex` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  KEY `CommandVariable_commandId_idx` (`commandId`),
  CONSTRAINT `CommandVariable_commandId_fkey`
    FOREIGN KEY (`commandId`) REFERENCES `Command`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `CommandTag` (
  `commandId` INT NOT NULL,
  `tagId` INT NOT NULL,
  PRIMARY KEY (`commandId`, `tagId`),
  KEY `CommandTag_tagId_idx` (`tagId`),
  CONSTRAINT `CommandTag_commandId_fkey`
    FOREIGN KEY (`commandId`) REFERENCES `Command`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CommandTag_tagId_fkey`
    FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `PlatformLinkTag` (
  `platformLinkId` INT NOT NULL,
  `tagId` INT NOT NULL,
  PRIMARY KEY (`platformLinkId`, `tagId`),
  KEY `PlatformLinkTag_tagId_idx` (`tagId`),
  CONSTRAINT `PlatformLinkTag_platformLinkId_fkey`
    FOREIGN KEY (`platformLinkId`) REFERENCES `PlatformLink`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PlatformLinkTag_tagId_fkey`
    FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
