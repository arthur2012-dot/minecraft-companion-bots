# Companheiros Minecraft (Android + Termux)

**Bots inteligentes que rodam 100% na memória do seu celular.**

Conecte 1 a 4 companheiros em qualquer mundo Minecraft Java Edition aberto para LAN.  
Eles seguem você, guardam, coletam recursos, exploram, atacam mobs e muito mais.

---

## Como funciona

- Os bots usam a biblioteca **Mineflayer** (Node.js).
- Roda dentro do **Termux** no Android → usa a RAM e o processador do celular.
- Interface amigável web (abra no Chrome do próprio celular).
- Funciona offline (só precisa da rede local / LAN).

---

## Instalação no Android (Termux)

### 1. Instale o Termux
- Baixe o Termux pela **F-Droid** (recomendado) ou GitHub:  
  https://f-droid.org/packages/com.termux/

### 2. Permissão de armazenamento
Abra o Termux e digite:
```bash
termux-setup-storage
```
Aceite a permissão.

### 3. Instale Node.js e baixe o projeto
```bash
pkg update -y
pkg install -y nodejs git
cd /sdcard
git clone https://github.com/arthur2012-dot/minecraft-companion-bots.git minecraft-companion
cd minecraft-companion
npm install
```

### 4. Inicie os bots
```bash
node src/web-server.js
```

Você verá:
```
=== Interface Web pronta ===
Abra no Chrome do celular: http://localhost:3000
```

### 5. Abra a interface
No Chrome do Android digite:
```
http://localhost:3000
```

Pronto! Agora você tem a tela de controle amigável.

---

## Como conectar ao seu mundo

1. No Minecraft Java (PC ou PojavLauncher no celular) abra o mundo.
2. Pressione **Esc → Open to LAN**.
3. Anote a **porta** que aparece no chat (ex: 54321).
4. Na interface web do celular:
   - Vá em **Config**
   - Host: `127.0.0.1` (se Minecraft também estiver no celular) ou o IP local do PC (ex: `192.168.1.10`)
   - Porta: a que apareceu no chat
   - Seu nome no jogo
5. Volte em **Início**, escolha um bot e clique em **Ligar**.

Os bots entram no mundo usando a memória do celular.

---

## Comandos disponíveis

| Botão          | O que faz                          |
|----------------|------------------------------------|
| Seguir         | Segue o jogador dono               |
| Guardar        | Fica na área e ataca mobs          |
| Coletar Madeira| Coleta troncos próximos            |
| Explorar       | Anda aleatoriamente pela área      |
| Atacar         | Ataca o mob mais próximo           |
| Dormir         | Procura cama e dorme               |
| Parar          | Cancela a tarefa atual             |

Você também pode digitar no chat do jogo:
- `!follow` ou `me seguir`
- `!guard`
- `!stop`

---

## Adicionar / Gerenciar comandos depois

Os comandos ficam em `src/bot-manager.js`.  
É fácil adicionar novos (farm, pescar, domesticar, craftar ferramentas, etc.).

A interface web já está preparada para receber novos botões.

---

## Dicas importantes

- Quanto mais bots ao mesmo tempo, mais memória o celular usa. Comece com 1 ou 2.
- Em celulares mais fracos, use apenas 1 bot.
- Se o Minecraft estiver no PC, o celular e o PC precisam estar na **mesma rede Wi-Fi**.
- Host = IP local do PC (descubra com `ipconfig` no Windows ou `ifconfig` no Linux/Mac).

---

## Estrutura do projeto

```
minecraft-companion-bots/
├── src/
│   ├── bot-manager.js    ← cérebro dos bots
│   └── web-server.js     ← interface + API
├── android/
│   ├── web-ui/           ← tela amigável
│   ├── install.sh
│   └── start.sh
├── data/                 ← config e histórico (criado automaticamente)
├── package.json
└── README.md
```

---

## Licença

MIT – faça o que quiser.

Feito para o Senhor Arthur.
Bots que tornam o Minecraft offline mais vivo, rodando direto na memória do celular.
