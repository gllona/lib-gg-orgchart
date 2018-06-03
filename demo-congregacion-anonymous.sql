DROP TABLE IF EXISTS `orgchart_box`;

CREATE TABLE `orgchart_box` (
  `id` INT(11) NOT NULL PRIMARY KEY,
  `title` VARCHAR(64) NOT NULL,
  `subtitle` VARCHAR(64) DEFAULT NULL,
  `parent_id` INT(11) DEFAULT NULL,
  `type` ENUM('staff','collateral','subordinate','staffleft','stafftop') NOT NULL DEFAULT 'subordinate',
  `order` TINYINT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `orgchart_box` (`id`, `title`, `subtitle`, `parent_id`, `type`, `order`) VALUES
  (1, 'Father John Anderson', 'District Superior', NULL, 'subordinate', 1),
  (2, 'Father Onius Chilhood', 'Second Assistant', 1, 'staff', 1),
  (3, 'Father Andy Meller', 'Second Assistant', 1, 'staff', 2),
  (4, 'Father Nexius Thomas', 'District Secretary', 1, 'staff', 3),
  (5, 'Father Olaf Svergsson', 'Communications Officer', 1, 'staff', 4),
  (6, 'Father Tom Gallahan', 'District Bursar', 1, 'subordinate', 5),
  (7, 'Nilsen Ducatti', 'IT Chief', 1, 'subordinate', 6),
  (8, 'Linda Gladnner', 'Designer/Writer', 5, 'subordinate', 1),
  (9, 'Jeff Blackwood', 'Website Manager', 5, 'subordinate', 2),
  (10, 'Arnold Swysse', 'District Accountant', 6, 'staff', 1),
  (11, 'Elba Thomasson', 'Accounting Assistant', 6, 'staff', 2),
  (12, 'Scott Inner', 'Fundraising', 6, 'staff', 3),
  (13, 'La Tse Wang', 'Bookkeeper', 6, 'staff', 4),
  (14, 'Brother Angelus Thressard', 'IT Administrator', 7, 'subordinate', 1),
  (15, 'Bee Antflower', 'IT Assistant', 14, 'subordinate', 1);
