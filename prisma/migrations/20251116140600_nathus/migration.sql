-- AlterTable
ALTER TABLE `users` MODIFY `login_name` VARCHAR(191) NULL,
    MODIFY `img` VARCHAR(255) NULL DEFAULT '/images/pfp.png';
