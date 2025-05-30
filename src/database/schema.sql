CREATE TABLE IF NOT EXISTS `channels`
(
    `id`      VARCHAR(20) PRIMARY KEY,
    `config`  TEXT NOT NULL,
    `guildid` VARCHAR(20),
    KEY `guildid` (`guildid`)
);

CREATE TABLE IF NOT EXISTS `guilds`
(
    `id`     VARCHAR(20) PRIMARY KEY,
    `config` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `users`
(
    `id`     VARCHAR(20) PRIMARY KEY,
    `config` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `responses`
(
    `id`           int PRIMARY KEY AUTO_INCREMENT,
    `guildid`      VARCHAR(20) NOT NULL,
    `trigger`      TEXT        NOT NULL,
    `response`     TEXT        NOT NULL,
    `global`       BOOLEAN     NOT NULL,
    `channels`     TEXT        NULL DEFAULT NULL,
    `enableVision` BOOLEAN          DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS `badWords`
(
    `id`           int PRIMARY KEY AUTO_INCREMENT,
    `guildid`      VARCHAR(20) NOT NULL,
    `trigger`      TEXT        NOT NULL,
    `punishment`   TEXT        NOT NULL,
    `response`     TEXT        NOT NULL,
    `global`       BOOLEAN     NOT NULL,
    `channels`     TEXT        NULL DEFAULT NULL,
    `priority`     int         NULL,
    `dm`           TEXT        NULL DEFAULT NULL,
    `enableVision` BOOLEAN          DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS `moderations`
(
    `id`         int PRIMARY KEY AUTO_INCREMENT,
    `guildid`    VARCHAR(20) NOT NULL,
    `userid`     VARCHAR(20) NOT NULL,
    `action`     VARCHAR(10) NOT NULL,
    `created`    bigint      NOT NULL,
    `value`      int              DEFAULT 0,
    `expireTime` bigint      NULL DEFAULT NULL,
    `reason`     TEXT,
    `comment`    TEXT        NULL DEFAULT NULL,
    `moderator`  VARCHAR(20) NULL DEFAULT NULL,
    `active`     BOOLEAN          DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS `confirmations`
(
    `id`      int PRIMARY KEY AUTO_INCREMENT,
    `data`    TEXT   NOT NULL,
    `expires` bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS `safeSearch`
(
    `hash` CHAR(64) PRIMARY KEY,
    `data` TEXT NOT NULL
);
