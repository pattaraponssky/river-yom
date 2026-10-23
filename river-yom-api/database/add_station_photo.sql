ALTER TABLE `rain_info` ADD COLUMN `photo` VARCHAR(255) NULL DEFAULT NULL COMMENT 'รูปภาพสถานี';
ALTER TABLE `flow_info` ADD COLUMN `photo` VARCHAR(255) NULL DEFAULT NULL COMMENT 'รูปภาพสถานี';
ALTER TABLE `gate_info` ADD COLUMN `photo` VARCHAR(255) NULL DEFAULT NULL COMMENT 'รูปภาพสถานี';
ALTER TABLE `tele_info` ADD COLUMN `photo` VARCHAR(255) NULL DEFAULT NULL COMMENT 'รูปภาพสถานี';
ALTER TABLE `reservoir_info` ADD COLUMN `photo` VARCHAR(255) NULL DEFAULT NULL COMMENT 'รูปภาพสถานี';

-- ถ้ามีตาราง sea_info ในฐานข้อมูล ให้เปิดใช้งานบรรทัดนี้
-- ALTER TABLE `sea_info` ADD COLUMN `photo` VARCHAR(255) NULL DEFAULT NULL COMMENT 'รูปภาพสถานี';
