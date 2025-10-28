-- CreateTable
CREATE TABLE `Users` (
    `user_id` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NULL,
    `password` VARCHAR(255) NULL,
    `user_name` VARCHAR(255) NULL,
    `dp_name` VARCHAR(255) NOT NULL DEFAULT 'annonymous',
    `gender` ENUM('Male', 'Female', 'NotSpecified') NOT NULL,
    `img` VARCHAR(255) NOT NULL DEFAULT 'pfp',

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Blog` (
    `blog_id` INTEGER NOT NULL AUTO_INCREMENT,
    `blog_title` VARCHAR(60) NULL,
    `message` VARCHAR(120) NULL,
    `blog_up` INTEGER NULL,
    `blog_down` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `user_id` VARCHAR(191) NULL,

    PRIMARY KEY (`blog_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Note` (
    `note_id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(60) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`note_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `comment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `blog_id` INTEGER NULL,
    `note_id` INTEGER NULL,
    `parent_comment_id` INTEGER NULL,

    PRIMARY KEY (`comment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notifications` (
    `notification_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('comment', 'reply') NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `recipient_id` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NOT NULL,
    `note_id` INTEGER NULL,
    `blog_id` INTEGER NULL,
    `comment_id` INTEGER NOT NULL,
    `parent_comment_id` INTEGER NULL,

    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Blog` ADD CONSTRAINT `Blog_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_blog_id_fkey` FOREIGN KEY (`blog_id`) REFERENCES `Blog`(`blog_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_note_id_fkey` FOREIGN KEY (`note_id`) REFERENCES `Note`(`note_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_parent_comment_id_fkey` FOREIGN KEY (`parent_comment_id`) REFERENCES `Comment`(`comment_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notifications` ADD CONSTRAINT `Notifications_recipient_id_fkey` FOREIGN KEY (`recipient_id`) REFERENCES `Users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notifications` ADD CONSTRAINT `Notifications_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `Users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notifications` ADD CONSTRAINT `Notifications_note_id_fkey` FOREIGN KEY (`note_id`) REFERENCES `Note`(`note_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notifications` ADD CONSTRAINT `Notifications_blog_id_fkey` FOREIGN KEY (`blog_id`) REFERENCES `Blog`(`blog_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notifications` ADD CONSTRAINT `Notifications_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `Comment`(`comment_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notifications` ADD CONSTRAINT `Notifications_parent_comment_id_fkey` FOREIGN KEY (`parent_comment_id`) REFERENCES `Comment`(`comment_id`) ON DELETE SET NULL ON UPDATE CASCADE;
