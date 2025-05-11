# Variables
COMPOSE_FILE=docker-compose.yml
ENV_FILE=.env
NETWORK=soa_network
MONGO_DATA=./mongo_data

# Default target
.PHONY: all
all: build up

# Build all services
.PHONY: build
build:
	@echo "🔨 Building all services..."
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) build

# Start all services
.PHONY: up
up:
	@echo "🚀 Starting all services..."
	docker-compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up -d

# Stop all services
.PHONY: down
down:
	@echo "🛑 Stopping all services..."
	docker-compose -f $(COMPOSE_FILE) down

# View logs for all services
.PHONY: logs
logs:
	@echo "📋 Viewing logs..."
	docker-compose -f $(COMPOSE_FILE) logs -f

# Clean up containers, networks, and volumes
.PHONY: clean
clean: down
	@echo "🧹 Cleaning up..."
	docker-compose -f $(COMPOSE_FILE) down --volumes --remove-orphans
	docker network prune -f
	rm -rf $(MONGO_DATA)

# Rebuild and restart services
.PHONY: restart
restart:
	@echo "🔄 Restarting services..."
	docker-compose down && docker-compose up -d

# Check health of all services
.PHONY: health
health:
	@echo "🩺 Checking service health..."
	curl -s http://localhost:5000/health | jq .

# Show status of all services
.PHONY: ps
ps:
	@echo "🔍 Service status:"
	docker-compose -f $(COMPOSE_FILE) ps

# Run a shell inside a service
.PHONY: shell
shell:
	@echo "🖥️ Opening shell in $(SERVICE)..."
	docker-compose -f $(COMPOSE_FILE) exec $(SERVICE) sh

# Remove all stopped containers and networks
.PHONY: prune
prune:
	@echo "🗑️ Pruning unused containers and networks..."
	docker system prune -f
	docker volume prune -f

# Run tests (placeholder)
.PHONY: test
test:
	@echo "🧪 Running tests..."
	# Add your test scripts here

# Help message
.PHONY: help
help:
	@echo "📚 Makefile Commands:"
	@echo "  build       - Build all services"
	@echo "  up          - Start all services in detached mode"
	@echo "  down        - Stop all services"
	@echo "  logs        - View logs for all services"
	@echo "  clean       - Clean up containers, networks, and volumes"
	@echo "  restart     - Rebuild and restart all services"
	@echo "  health      - Check health of all services"
	@echo "  ps          - Show status of all services"
	@echo "  shell       - Run a shell inside a service (use 'make shell SERVICE=service_name')"
	@echo "  prune       - Remove all stopped containers and networks"
	@echo "  test        - Run tests"
