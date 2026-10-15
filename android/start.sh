#!/data/data/com.termux/files/usr/bin/bash
# Inicia os companheiros na memória do celular

cd /sdcard/minecraft-companion || cd "$(dirname "$0")/.."

echo "Iniciando Companheiros Minecraft..."
echo "Interface web em http://localhost:3000"
echo "Pressione Ctrl+C para parar"
echo ""

node src/web-server.js
