#!/bin/bash

echo "🧪 PRUEBA RÁPIDA DE DOCKER"
echo "=========================="

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

echo "✅ Docker está instalado"

# Verificar si el daemon de Docker está corriendo
if ! docker info &> /dev/null; then
    echo "❌ El daemon de Docker no está corriendo"
    echo "🔄 Intentando iniciar Docker..."
    sudo systemctl start docker
    sleep 3
    
    if ! docker info &> /dev/null; then
        echo "❌ No se pudo iniciar Docker"
        exit 1
    fi
fi

echo "✅ El daemon de Docker está corriendo"

# Verificar permisos
if docker ps &> /dev/null; then
    echo "✅ Permisos de Docker correctos"
else
    echo "⚠️  Problemas de permisos, usando sudo..."
    if sudo docker ps &> /dev/null; then
        echo "✅ Docker funciona con sudo"
    else
        echo "❌ Docker no funciona ni con sudo"
        exit 1
    fi
fi

# Verificar Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose está instalado"
    docker-compose --version
else
    echo "❌ Docker Compose no está instalado"
fi

echo ""
echo "🎉 Docker está funcionando correctamente!" 
