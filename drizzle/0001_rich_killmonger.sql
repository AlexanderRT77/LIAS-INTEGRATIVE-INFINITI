CREATE TABLE `logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`modelo` varchar(64) NOT NULL,
	`categoria` varchar(64) NOT NULL,
	`prompt` text NOT NULL,
	`resposta` text NOT NULL,
	`latencia` int NOT NULL,
	`tokens` int NOT NULL,
	`custo` varchar(32) NOT NULL,
	`status` enum('sucesso','erro','timeout') NOT NULL DEFAULT 'sucesso',
	`confianca` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logs_id` PRIMARY KEY(`id`)
);
