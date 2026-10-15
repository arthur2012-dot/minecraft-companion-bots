# Companheiros Minecraft – Versão **Bedrock**

**Roda na memória do celular via Termux.**

### Aviso importante (leia)

Esta versão usa `bedrock-protocol`.  
É a base mais estável que existe hoje para Bedrock, mas ainda é **experimental**.

O que funciona razoavelmente:
- Conectar em mundos LAN (offline)
- Chat
- Comandos básicos de seguir / guardar / parar
- Interface web no celular

O que ainda é limitado ou instável:
- Pathfinding avançado
- Coleta automática de recursos
- Farm, craft, domesticar, etc.

A versão **Java** (pasta principal do repositório) continua sendo bem superior.

---

## Como instalar no Android (Termux)

```bash
termux-setup-storage
pkg update -y
pkg install -y nodejs git
cd /sdcard
git clone https://github.com/arthur2012-dot/minecraft-companion-bots.git minecraft-companion
cd minecraft-companion/bedrock
npm install
node src/web-server.js
```

Depois abra no Chrome:
```
http://localhost:3000
```

---

## Configuração para Bedrock LAN

1. Abra o Minecraft Bedrock no celular ou PC.
2. Vá em **Configurações → Multijogador** e ative **Partida de rede de área local**.
3. Entre no mundo.
4. Descubra o IP do dispositivo que está hosteando:
   - Se for o **mesmo celular**: use `127.0.0.1`
   - Se for outro dispositivo na mesma Wi-Fi: use o IP local (ex: `192.168.1.15`)
5. Porta padrão do Bedrock: **19132**
6. Na interface web:
   - Host = o IP acima
   - Porta = 19132
   - Seu nome no jogo

---

## Comandos disponíveis (versão atual)

| Botão     | Situação no Bedrock          |
|-----------|------------------------------|
| Seguir    | Básico / experimental        |
| Guardar   | Básico                       |
| Atacar    | Muito limitado               |
| Explorar  | Limitado                     |
| Parar     | Funciona                     |
| Chat      | Funciona                     |

---

## Dicas

- Comece com **apenas 1 bot**.
- Bedrock consome mais recursos que Java em alguns casos.
- Se não conectar, tente mudar a versão no `config.json` (ex: `"1.21.50"`, `"1.21.90"`, etc.).
- Mundos LAN do Bedrock às vezes são mais instáveis para bots do que servidores dedicados (BDS).

---

Feito para o Senhor Arthur.  
Versão Bedrock experimental – a de Java continua sendo a recomendada para experiência completa.
