build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

shell:
	docker-compose exec php sh

composer:
	docker-compose exec php composer $(filter-out $@,$(MAKECMDGOALS))

db-shell:
	docker-compose exec postgres psql -U symfony -d symfony_db

migrate:
	docker-compose exec php bin/console doctrine:migrations:migrate -n
