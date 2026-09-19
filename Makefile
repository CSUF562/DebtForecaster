.PHONY: dev-up dev-down migrate ingest logs

dev-up:
	docker compose up -d db app

dev-down:
	docker compose down

migrate:
	docker compose --profile tools run --rm migrate

ingest:
	docker compose --profile tools run --rm ingest

logs:
	docker compose logs -f app
