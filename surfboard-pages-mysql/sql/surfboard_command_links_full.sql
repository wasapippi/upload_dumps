
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `Category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `normalizedName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `groupOrderIndex` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_normalizedName_key` (`normalizedName`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `Category` DISABLE KEYS */;
INSERT INTO `Category` VALUES (10,'加入装置','加入装置',1,'2026-02-26 13:23:56.149','2026-02-26 14:19:32.488'),(11,'中継装置','中継装置',2,'2026-02-26 13:23:56.149','2026-02-26 14:19:47.475'),(12,'NTE装置','nte装置',3,'2026-02-26 13:23:56.149','2026-02-26 14:19:55.254'),(13,'既フレ装置','既フレ装置',4,'2026-02-26 14:20:08.728','2026-02-26 14:20:08.728'),(14,'D-NET','d-net',5,'2026-02-26 14:20:24.631','2026-02-26 14:20:24.631'),(15,'保守装置','保守装置',6,'2026-02-26 14:20:40.326','2026-02-26 14:20:40.326'),(16,'アクセス装置','アクセス装置',7,'2026-02-26 14:20:49.955','2026-02-26 14:20:49.955'),(17,'社内網装置','社内網装置',8,'2026-02-26 14:21:07.761','2026-02-26 14:21:07.761'),(18,'その他','その他',9,'2026-02-26 14:21:15.458','2026-02-26 14:21:15.458'),(20,'共通','共通',0,'2026-02-26 15:45:20.439','2026-03-01 07:13:57.497');
/*!40000 ALTER TABLE `Category` ENABLE KEYS */;
DROP TABLE IF EXISTS `HostType`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `HostType` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `normalizedName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` int NOT NULL,
  `groupOrderIndex` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `HostType_normalizedName_key` (`normalizedName`),
  KEY `HostType_categoryId_fkey` (`categoryId`),
  CONSTRAINT `HostType_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `HostType` DISABLE KEYS */;
INSERT INTO `HostType` VALUES (17,'icte','icte',10,4,'2026-02-26 13:23:56.152','2026-02-26 14:34:44.625'),(18,'ssen','ssen',10,2,'2026-02-26 13:23:56.152','2026-02-26 14:28:42.803'),(19,'ssev','ssev',10,3,'2026-02-26 13:23:56.152','2026-02-26 14:28:54.447'),(20,'ssei','ssei',10,1,'2026-02-26 13:23:56.152','2026-02-26 14:28:34.120'),(21,'smdc','smdc',10,5,'2026-02-26 13:23:56.152','2026-02-26 14:34:59.472'),(22,'sseu','sseu',10,1,'2026-02-26 14:21:42.195','2026-03-01 04:52:49.040'),(23,'smgp','smgp',10,6,'2026-02-26 14:35:10.101','2026-02-26 14:35:10.101'),(24,'blan','blan',10,7,'2026-02-26 14:35:20.437','2026-02-26 14:35:20.437'),(25,'blancf','blancf',10,8,'2026-02-26 14:35:28.814','2026-02-26 14:35:28.814'),(26,'gols','gols',10,9,'2026-02-26 14:38:32.787','2026-02-26 14:38:32.787'),(27,'smde','smde',10,10,'2026-02-26 14:38:50.094','2026-02-26 14:38:50.094'),(29,'共通','共通',20,0,'2026-02-26 15:45:20.443','2026-03-01 07:14:05.853'),(30,'aer','aer',11,12,'2026-02-26 16:49:46.213','2026-02-26 16:49:46.213'),(31,'bcr','bcr',11,13,'2026-02-26 16:49:52.463','2026-02-26 16:49:52.463'),(32,'sbcr','sbcr',11,14,'2026-02-26 16:49:58.829','2026-02-26 16:49:58.829'),(33,'ibcr','ibcr',11,15,'2026-02-26 16:50:05.026','2026-02-26 16:50:05.026'),(34,'gwr','gwr',11,16,'2026-02-26 16:50:31.683','2026-02-26 16:50:31.683'),(35,'bgwr','bgwr',11,17,'2026-02-26 16:50:40.428','2026-02-26 16:50:40.428'),(36,'nrr','nrr',11,18,'2026-03-01 05:08:13.371','2026-03-01 05:08:33.394');
/*!40000 ALTER TABLE `HostType` ENABLE KEYS */;
DROP TABLE IF EXISTS `Vendor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Vendor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `normalizedName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Vendor_normalizedName_key` (`normalizedName`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `Vendor` DISABLE KEYS */;
INSERT INTO `Vendor` VALUES (10,'Juniper','juniper','2026-02-26 13:23:56.134','2026-02-26 13:23:56.134'),(11,'Cisco/IOS','ciscoios','2026-02-26 13:23:56.134','2026-03-01 05:04:04.075'),(12,'Nokia','nokia','2026-02-26 13:23:56.134','2026-02-26 13:23:56.134'),(13,'AlaxalA','alaxala','2026-02-26 14:55:46.771','2026-02-26 14:55:46.771'),(14,'Cisco/Nexus','cisconexus','2026-02-26 15:00:29.088','2026-03-01 05:03:58.288'),(15,'Apresia','apresia','2026-02-26 16:30:16.103','2026-02-26 16:30:16.103'),(16,'Fujitsu','fujitsu','2026-02-26 16:30:58.702','2026-02-26 16:30:58.702'),(17,'NEC','nec','2026-02-26 16:31:09.000','2026-02-26 16:31:09.000'),(18,'SUMITOMO','sumitomo','2026-02-26 16:31:18.158','2026-02-26 16:32:28.762'),(19,'MITSUBISHI','mitsubishi','2026-02-26 16:32:07.130','2026-02-26 16:32:07.130'),(20,'Cisco/CRS','ciscocrs','2026-03-01 05:03:51.641','2026-03-01 05:03:51.641');
/*!40000 ALTER TABLE `Vendor` ENABLE KEYS */;
DROP TABLE IF EXISTS `Platform`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Platform` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `normalizedName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendorId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Platform_normalizedName_key` (`normalizedName`),
  KEY `Platform_vendorId_fkey` (`vendorId`),
  CONSTRAINT `Platform_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `Platform` DISABLE KEYS */;
INSERT INTO `Platform` VALUES (25,'Cisco ASR1006','cisco-asr1006',11,'2026-02-26 14:40:21.398','2026-02-26 14:40:21.398'),(26,'MX2020','mx2020',10,'2026-02-26 16:26:10.155','2026-02-26 16:26:10.155'),(27,'AlaxalA NN7816R','alaxala-nn7816r',13,'2026-02-26 16:26:44.328','2026-02-26 16:26:44.328'),(28,'AlaxalA NN7816R-DCA','alaxala-nn7816r-dca',13,'2026-02-26 16:26:59.404','2026-02-26 16:26:59.404'),(29,'Cisco ASR1006(RP2)','cisco-asr1006rp2',11,'2026-02-26 16:27:24.183','2026-02-26 16:27:24.183'),(30,'Cisco ASR1009-X','cisco-asr1009-x',11,'2026-02-26 16:27:41.355','2026-02-26 16:27:41.355'),(31,'Apresia CA120-48X','apresia-ca120-48x',15,'2026-02-26 16:30:35.264','2026-02-26 16:30:35.264'),(32,'SMD-C(F)','smd-cf',16,'2026-02-26 16:39:41.279','2026-02-26 16:39:41.279'),(33,'SMD-C(N)','smd-cn',17,'2026-02-26 16:45:32.826','2026-02-26 16:45:32.826'),(34,'Cisco Catalyst 4006','cisco-catalyst-4006',11,'2026-02-26 16:47:14.013','2026-02-26 16:47:14.013'),(35,'Cisco Catalyst 4506','cisco-catalyst-4506',11,'2026-02-26 16:47:43.038','2026-02-26 16:47:43.038'),(36,'Cisco Catalyst 3560G-24TS','cisco-catalyst-3560g-24ts',11,'2026-02-26 16:48:08.951','2026-02-26 16:48:08.951'),(37,'Cisco Catalyst 3560X-24T','cisco-catalyst-3560x-24t',11,'2026-02-26 16:48:30.082','2026-02-26 16:48:30.082'),(38,'Cisco Catalyst 4948E','cisco-catalyst-4948e',11,'2026-02-26 16:48:54.861','2026-02-26 16:48:54.861'),(39,'Apresia 13200-48X-PSR','apresia-13200-48x-psr',15,'2026-02-26 16:49:16.109','2026-02-26 16:49:16.109'),(40,'SMGP(S)','smgps',18,'2026-02-26 16:52:17.808','2026-02-26 16:52:17.808'),(41,'SMGP(M)','smgpm',19,'2026-02-26 16:52:35.007','2026-02-26 16:52:35.007'),(42,'MX2010','mx2010',10,'2026-02-26 16:54:03.469','2026-02-26 16:54:03.469'),(43,'MX240','mx240',10,'2026-02-26 16:54:12.760','2026-02-26 16:54:12.760'),(44,'PTX10016','ptx10016',10,'2026-02-26 16:54:22.002','2026-02-26 16:54:22.002'),(45,'T640','t640',10,'2026-02-26 16:54:35.513','2026-02-26 16:54:35.513'),(46,'T1600','t1600',10,'2026-02-26 16:54:56.042','2026-02-26 16:54:56.042');
/*!40000 ALTER TABLE `Platform` ENABLE KEYS */;
DROP TABLE IF EXISTS `HostTypePlatform`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `HostTypePlatform` (
  `hostTypeId` int NOT NULL,
  `platformId` int NOT NULL,
  PRIMARY KEY (`hostTypeId`,`platformId`),
  KEY `HostTypePlatform_platformId_fkey` (`platformId`),
  CONSTRAINT `HostTypePlatform_hostTypeId_fkey` FOREIGN KEY (`hostTypeId`) REFERENCES `HostType` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `HostTypePlatform_platformId_fkey` FOREIGN KEY (`platformId`) REFERENCES `Platform` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `HostTypePlatform` DISABLE KEYS */;
INSERT INTO `HostTypePlatform` VALUES (22,25),(30,26),(32,26),(33,26),(34,26),(35,26),(22,27),(22,28),(22,29),(18,30),(19,30),(20,30),(17,31),(21,32),(25,32),(21,33),(24,34),(24,35),(26,36),(26,37),(27,38),(27,39),(23,40),(23,41),(35,44),(31,45),(32,45),(31,46);
/*!40000 ALTER TABLE `HostTypePlatform` ENABLE KEYS */;
DROP TABLE IF EXISTS `Tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Tag` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `normalizedName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMMAND',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Tag_normalizedName_kind_key` (`normalizedName`,`kind`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `Tag` DISABLE KEYS */;
INSERT INTO `Tag` VALUES (22,'optics','optics','COMMAND','2026-02-26 13:23:56.158','2026-02-26 13:23:56.158'),(23,'bgp','bgp','COMMAND','2026-02-26 13:23:56.157','2026-02-26 13:23:56.157'),(24,'ospf','ospf','COMMAND','2026-02-26 13:23:56.157','2026-02-26 13:23:56.157'),(25,'logs','logs','COMMAND','2026-02-26 13:23:56.158','2026-02-26 13:23:56.158'),(26,'security','security','COMMAND','2026-02-26 13:23:56.158','2026-02-26 13:23:56.158'),(27,'isis','isis','COMMAND','2026-02-26 13:23:56.158','2026-02-26 13:23:56.158'),(28,'mpls','mpls','COMMAND','2026-02-26 13:23:56.158','2026-02-26 13:23:56.158'),(29,'正常性確認','正常性確認','COMMAND','2026-02-26 15:22:05.413','2026-02-26 15:22:05.413'),(30,'ログ','ログ','COMMAND','2026-02-26 17:03:39.489','2026-02-26 17:03:39.489'),(31,'aaa','aaa','COMMAND','2026-02-26 23:06:43.396','2026-02-26 23:06:43.396'),(32,'bbb','bbb','COMMAND','2026-02-26 23:06:43.396','2026-02-26 23:06:43.396'),(33,'ccc','ccc','COMMAND','2026-02-26 23:06:50.651','2026-02-26 23:06:50.651'),(34,'ccc','ccc','LINK','2026-03-01 00:58:05.854','2026-03-01 00:58:05.854'),(35,'あああ','あああ','COMMAND','2026-03-01 01:00:43.649','2026-03-01 01:00:43.649'),(36,'セッション','セッション','LINK','2026-03-01 06:19:57.725','2026-03-01 06:19:57.725'),(37,'正常性確認','正常性確認','LINK','2026-03-01 06:19:57.725','2026-03-01 06:19:57.725'),(38,'手配時','手配時','COMMAND','2026-03-01 07:10:11.347','2026-03-01 07:10:11.347');
/*!40000 ALTER TABLE `Tag` ENABLE KEYS */;
DROP TABLE IF EXISTS `Command`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Command` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commandText` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hostTypeId` int NOT NULL,
  `platformId` int DEFAULT NULL,
  `vendorId` int DEFAULT NULL,
  `danger` tinyint(1) NOT NULL DEFAULT '0',
  `orderIndex` int NOT NULL DEFAULT '0',
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `deviceBindingMode` enum('INCLUDE_IN_DEVICE','EXCLUDE_FROM_DEVICE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INCLUDE_IN_DEVICE',
  `ownerUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visibility` enum('PUBLIC','PRIVATE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PUBLIC',
  PRIMARY KEY (`id`),
  KEY `Command_platformId_fkey` (`platformId`),
  KEY `Command_visibility_ownerUserId_idx` (`visibility`,`ownerUserId`),
  KEY `Command_hostTypeId_idx` (`hostTypeId`),
  KEY `Command_vendorId_idx` (`vendorId`),
  KEY `Command_hostTypeId_platformId_vendorId_orderIndex_idx` (`hostTypeId`,`platformId`,`vendorId`,`orderIndex`),
  CONSTRAINT `Command_hostTypeId_fkey` FOREIGN KEY (`hostTypeId`) REFERENCES `HostType` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Command_platformId_fkey` FOREIGN KEY (`platformId`) REFERENCES `Platform` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Command_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `Command` DISABLE KEYS */;
INSERT INTO `Command` VALUES (124,'ログ取得','PPP関係のログを除いたログを表示する','show log | ex L2TP',22,25,NULL,0,1,'Guest','Guest','2026-02-26 15:45:20.447','2026-03-02 12:42:56.809',NULL,'INCLUDE_IN_DEVICE',NULL,'PUBLIC'),(125,'ログ確認','ログを表示する','show log messages',29,NULL,10,0,1,'Guest','Guest','2026-02-26 17:02:46.534','2026-03-01 04:51:18.827',NULL,'INCLUDE_IN_DEVICE',NULL,'PUBLIC'),(126,'指定したPKGのログを表示','','show platform software trace messagechassis-manager [PKG名]',22,25,NULL,0,1,'Guest','Guest','2026-03-01 04:45:53.024','2026-03-01 06:20:31.027',NULL,'INCLUDE_IN_DEVICE',NULL,'PUBLIC'),(127,'各PKGの状態表示','','show platform',22,25,NULL,0,2,'Guest','demo-user','2026-03-01 04:46:27.859','2026-03-02 11:48:03.534',NULL,'INCLUDE_IN_DEVICE',NULL,'PUBLIC'),(128,'シリアル確認','','show inventory',22,25,NULL,0,3,'Guest','demo-user','2026-03-01 07:10:11.352','2026-03-02 11:48:03.534',NULL,'INCLUDE_IN_DEVICE',NULL,'PUBLIC');
/*!40000 ALTER TABLE `Command` ENABLE KEYS */;
DROP TABLE IF EXISTS `CommandVariable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CommandVariable` (
  `id` int NOT NULL AUTO_INCREMENT,
  `commandId` int NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `required` tinyint(1) NOT NULL DEFAULT '0',
  `defaultValue` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `placeholder` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `regex` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CommandVariable_commandId_idx` (`commandId`),
  CONSTRAINT `CommandVariable_commandId_fkey` FOREIGN KEY (`commandId`) REFERENCES `Command` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `CommandVariable` DISABLE KEYS */;
/*!40000 ALTER TABLE `CommandVariable` ENABLE KEYS */;
DROP TABLE IF EXISTS `CommandTag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CommandTag` (
  `commandId` int NOT NULL,
  `tagId` int NOT NULL,
  PRIMARY KEY (`commandId`,`tagId`),
  KEY `CommandTag_tagId_fkey` (`tagId`),
  CONSTRAINT `CommandTag_commandId_fkey` FOREIGN KEY (`commandId`) REFERENCES `Command` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CommandTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `CommandTag` DISABLE KEYS */;
INSERT INTO `CommandTag` VALUES (124,29),(125,29),(126,29),(127,29),(124,30),(125,30),(126,30),(128,38);
/*!40000 ALTER TABLE `CommandTag` ENABLE KEYS */;
DROP TABLE IF EXISTS `PlatformLink`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PlatformLink` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `urlTemplate` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `commentTemplate` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `platformId` int DEFAULT NULL,
  `vendorId` int DEFAULT NULL,
  `hostTypeId` int NOT NULL,
  `visibility` enum('PUBLIC','PRIVATE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PUBLIC',
  `ownerUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deviceBindingMode` enum('INCLUDE_IN_DEVICE','EXCLUDE_FROM_DEVICE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INCLUDE_IN_DEVICE',
  `orderIndex` int NOT NULL DEFAULT '0',
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PlatformLink_visibility_ownerUserId_idx` (`visibility`,`ownerUserId`),
  KEY `PlatformLink_hostTypeId_fkey` (`hostTypeId`),
  KEY `PlatformLink_platformId_fkey` (`platformId`),
  KEY `PlatformLink_vendorId_idx` (`vendorId`),
  KEY `PlatformLink_platformId_vendorId_hostTypeId_orderIndex_idx` (`platformId`,`vendorId`,`hostTypeId`,`orderIndex`),
  CONSTRAINT `PlatformLink_hostTypeId_fkey` FOREIGN KEY (`hostTypeId`) REFERENCES `HostType` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PlatformLink_platformId_fkey` FOREIGN KEY (`platformId`) REFERENCES `Platform` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PlatformLink_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `PlatformLink` DISABLE KEYS */;
INSERT INTO `PlatformLink` VALUES (2,'加入者情報','https://telecom.is.ipnoc.net/hosts/{{HOST_NAME}}','加入者情報ページ',25,NULL,22,'PUBLIC',NULL,'INCLUDE_IN_DEVICE',3,'Guest','Guest','2026-02-26 19:48:00.357','2026-03-02 11:54:14.766',NULL),(7,'link1x','https://x2/{{HOST_NAME}}',NULL,30,NULL,20,'PUBLIC',NULL,'INCLUDE_IN_DEVICE',1,'Guest','Guest','2026-02-26 23:06:43.406','2026-03-02 10:01:30.210',NULL),(8,'セッション確認','https://hogehoge/{{HOST_NAME}}','tesagd',25,NULL,22,'PUBLIC',NULL,'INCLUDE_IN_DEVICE',2,'Guest','Guest','2026-02-26 23:08:16.565','2026-03-02 11:54:14.766',NULL),(9,'セッション確認','https://test.is.ipnoc.net/telecom/{{HOST_NAME}}',NULL,25,NULL,22,'PUBLIC',NULL,'INCLUDE_IN_DEVICE',4,'Guest','Guest','2026-03-01 00:27:27.798','2026-03-02 11:54:14.766',NULL),(10,'test','https://hogehoge/device/{{HOST_NAME}}','fdaewfa',25,NULL,22,'PUBLIC',NULL,'INCLUDE_IN_DEVICE',1,'Guest','Guest','2026-03-01 00:30:44.366','2026-03-02 11:54:14.766',NULL);
/*!40000 ALTER TABLE `PlatformLink` ENABLE KEYS */;
DROP TABLE IF EXISTS `PlatformLinkTag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PlatformLinkTag` (
  `platformLinkId` int NOT NULL,
  `tagId` int NOT NULL,
  PRIMARY KEY (`platformLinkId`,`tagId`),
  KEY `PlatformLinkTag_tagId_idx` (`tagId`),
  CONSTRAINT `PlatformLinkTag_platformLinkId_fkey` FOREIGN KEY (`platformLinkId`) REFERENCES `PlatformLink` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PlatformLinkTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `PlatformLinkTag` DISABLE KEYS */;
INSERT INTO `PlatformLinkTag` VALUES (8,36),(8,37);
/*!40000 ALTER TABLE `PlatformLinkTag` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
