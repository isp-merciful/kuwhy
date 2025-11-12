-- CreateTable
CREATE TABLE `user` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` TEXT NULL,

    UNIQUE INDEX `account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` CHAR(36) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `session_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verificationtoken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `verificationtoken_token_key`(`token`),
    UNIQUE INDEX `verificationtoken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog` (
    `blog_id` INTEGER NOT NULL AUTO_INCREMENT,
    `blog_title` VARCHAR(60) NULL,
    `message` VARCHAR(120) NULL,
    `blog_up` INTEGER NULL,
    `blog_down` INTEGER NULL,
    `user_id` CHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`blog_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comment` (
    `comment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` CHAR(36) NOT NULL,
    `blog_id` INTEGER NULL,
    `note_id` INTEGER NULL,
    `parent_comment_id` INTEGER NULL,
    `message` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `blog_id`(`blog_id`),
    INDEX `note_id`(`note_id`),
    INDEX `parent_comment_id`(`parent_comment_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`comment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `note` (
    `note_id` INTEGER NOT NULL AUTO_INCREMENT,
    `max_party` INTEGER NOT NULL DEFAULT 0,
    `crr_party` INTEGER NOT NULL DEFAULT 0,
    `message` VARCHAR(60) NULL,
    `user_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`note_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notification_id` INTEGER NOT NULL AUTO_INCREMENT,
    `recipient_id` CHAR(36) NOT NULL,
    `sender_id` CHAR(36) NOT NULL,
    `note_id` INTEGER NULL,
    `blog_id` INTEGER NULL,
    `comment_id` INTEGER NOT NULL,
    `parent_comment_id` INTEGER NULL,
    `type` ENUM('comment', 'reply') NOT NULL,
    `is_read` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `blog_id`(`blog_id`),
    INDEX `comment_id`(`comment_id`),
    INDEX `note_id`(`note_id`),
    INDEX `parent_comment_id`(`parent_comment_id`),
    INDEX `sender_id`(`sender_id`),
    INDEX `recipient_id`(`recipient_id`),
    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `user_id` CHAR(36) NOT NULL,
    `user_name` VARCHAR(255) NOT NULL DEFAULT 'anonymous',
    `login_name` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(60) NOT NULL DEFAULT 'Not_provided',
    `location` VARCHAR(255) NOT NULL DEFAULT 'Not_provided',
    `phone` VARCHAR(12) NOT NULL,
    `web` VARCHAR(255) NOT NULL DEFAULT 'Not_provided',
    `bio` VARCHAR(300) NOT NULL DEFAULT 'Not_provided',
    `party_id` INTEGER NOT NULL DEFAULT 0,
    `gender` ENUM('Male', 'Female', 'Not Specified') NOT NULL DEFAULT 'Not Specified',
    `img` VARCHAR(255) NULL DEFAULT 'pfp',
    `role` ENUM('member', 'admin', 'anonymous') NOT NULL DEFAULT 'anonymous',
    `email` VARCHAR(255) NULL,
    `password` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `users_login_name_key`(`login_name`),
    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `party_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `note_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `party_members_note_id_user_id_key`(`note_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `party_messages` (
    `message_id` INTEGER NOT NULL AUTO_INCREMENT,
    `note_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_party_messages_note_time`(`note_id`, `created_at`),
    PRIMARY KEY (`message_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog` ADD CONSTRAINT `blog_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_ibfk_2` FOREIGN KEY (`blog_id`) REFERENCES `blog`(`blog_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_ibfk_3` FOREIGN KEY (`note_id`) REFERENCES `note`(`note_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_ibfk_4` FOREIGN KEY (`parent_comment_id`) REFERENCES `comment`(`comment_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `note` ADD CONSTRAINT `note_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `note`(`note_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`blog_id`) REFERENCES `blog`(`blog_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`comment_id`) REFERENCES `comment`(`comment_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_4` FOREIGN KEY (`parent_comment_id`) REFERENCES `comment`(`comment_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_5` FOREIGN KEY (`sender_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_6` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `party_messages` ADD CONSTRAINT `party_messages_note_id_fkey` FOREIGN KEY (`note_id`) REFERENCES `note`(`note_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `party_messages` ADD CONSTRAINT `party_messages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
