-- ============================================================================
-- PayPulse Database System — Phase 1
-- Script 00: Database Creation & Environment Configuration
-- Target DBMS: MySQL 8.4 LTS (or compatible MySQL 8.0+ / MariaDB 10.5+)
-- Storage Engine: InnoDB
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ============================================================================

-- 1. Verify MySQL Engine Version and Environment Parameters
SELECT 
    VERSION() AS Server_Version,
    @@version_comment AS Version_Comment,
    @@version_compile_os AS Compile_OS;

-- 2. Verify InnoDB Engine Availability & Status
SELECT 
    ENGINE, 
    SUPPORT, 
    COMMENT, 
    TRANSACTIONS, 
    XA, 
    SAVEPOINTS
FROM information_schema.ENGINES
WHERE ENGINE = 'InnoDB';

-- 3. Verify Server Character Set and Collation Defaults
SELECT 
    @@character_set_server AS Server_Charset,
    @@collation_server AS Server_Collation;

-- 4. Verify Active SQL Mode Configuration
-- PayPulse strictly requires STRICT_TRANS_TABLES, NO_ZERO_DATE, ERROR_FOR_DIVISION_BY_ZERO
SELECT @@sql_mode AS Active_SQL_Mode;

-- 5. Verify Transaction Isolation Level
SELECT 
    @@transaction_isolation AS Transaction_Isolation_Level;

-- 6. Create Database with full 4-byte UTF-8 support (Bengali script & emojis)
CREATE DATABASE IF NOT EXISTS `paypulse_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 7. Switch session context to the PayPulse database
USE `paypulse_db`;

-- 8. Verify session schema context
SELECT 
    DATABASE() AS Current_Database,
    SCHEMA_NAME,
    DEFAULT_CHARACTER_SET_NAME,
    DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'paypulse_db';
