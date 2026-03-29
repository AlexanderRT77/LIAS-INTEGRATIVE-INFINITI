CREATE TABLE `cache_artigos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`termo_busca` varchar(255) NOT NULL,
	`resultados` text NOT NULL,
	`data_busca` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cache_artigos_id` PRIMARY KEY(`id`),
	CONSTRAINT `cache_artigos_termo_busca_unique` UNIQUE(`termo_busca`)
);
--> statement-breakpoint
CREATE TABLE `cache_modelos_ia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome_modelo` varchar(255) NOT NULL,
	`acuracia` int NOT NULL,
	`velocidade` int NOT NULL,
	`custo` varchar(50) NOT NULL,
	`categoria` varchar(100) NOT NULL,
	`ranking` int NOT NULL,
	`dados` text NOT NULL,
	`data_atualizacao` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cache_modelos_ia_id` PRIMARY KEY(`id`),
	CONSTRAINT `cache_modelos_ia_nome_modelo_unique` UNIQUE(`nome_modelo`)
);
