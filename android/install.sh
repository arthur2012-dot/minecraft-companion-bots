#!/data/data/com.termux/files/usr/bin/bash
# Instalador completo para Termux - Minecraft Companion Bots
# Roda 100% na memória do celular

set -e

echo "============================================"
echo "  Companheiros Minecraft - Instalação"
echo "  Rodando na memória do seu celular"
echo "============================================"
echo ""

# Atualizar e instalar Node
pkg update -y
pkg install -y nodejs git

# Criar pasta no armazenamento interno
cd /sdcard
mkdir -p minecraft-companion
cd minecraft-companion

# Se já tiver o projeto, só atualiza deps
if [ -f package.json ]; then
  echo "Projeto já existe. Atualizando dependências..."
else
  echo "Baixando projeto..."
  # O usuário pode clonar ou copiar os arquivos
  echo "Copie os arquivos do GitHub para /sdcard/minecraft-companion"
  echo "Ou rode: git clone https://github.com/arthur2012-dot/minecraft-companion-bots.git ."
fi

echo ""
echo "Instalando dependências Node (pode demorar na primeira vez)..."
npm install --no-optional

echo ""
echo "============================================"
echo "  Instalação concluída!"
echo "============================================"
echo ""
echo "Para iniciar:"
echo "  cd /sdcard/minecraft-companion"
echo "  node src/web-server.js"
echo ""
echo "Depois abra o Chrome e vá em:"
echo "  http://localhost:3000"
echo ""
echo "Configure o Host e a Porta do seu mundo LAN."
echo "Os bots usam a memória do celular."
echo ""
