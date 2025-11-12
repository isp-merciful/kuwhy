/*
  Warnings:

  - Made the column `login_name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `login_name` VARCHAR(191) NOT NULL;
