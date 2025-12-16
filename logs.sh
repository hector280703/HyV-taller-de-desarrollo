#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "📝 ========================================"
echo "📝  LOGS DE HyV TALLER DE DESARROLLO"
echo "📝 ========================================"
echo -e "${NC}"

echo -e "${BLUE}📊 Estado de contenedores:${NC}"
docker-compose ps

echo ""
echo -e "${YELLOW}📝 Mostrando logs en tiempo real...${NC}"
echo -e "${BLUE}💡 Presiona Ctrl+C para salir${NC}"
echo ""

# Mostrar logs de todos los servicios con timestamps
docker-compose logs -f --tail=50 --timestamps
