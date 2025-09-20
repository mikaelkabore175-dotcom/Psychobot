// commands/motgame.js
module.exports = {
    name: 'motgame',
    description: 'Devinez le mot lettre par lettre',
    run: async ({ sock, msg, replyWithTag }) => {
        const words = ["chat", "ordinateur", "javascript", "whatsapp", "bot", "afrique"];
        let game = {
            word: words[Math.floor(Math.random() * words.length)],
            revealed: [],
            players: [],
            scores: {},
            guesses: new Set(),
            active: true,
            turnIndex: 0,
            turnTimer: null
        };
        game.revealed = Array(game.word.length).fill("_");
        const sender = msg.key.participant || msg.key.remoteJid;

        game.players.push(sender);
        game.scores[sender] = 0;

        await replyWithTag(sock, msg.key.remoteJid, msg, `🎮 Partie lancée !\nMot : ${game.revealed.join(" ")}\nInvitez d'autres joueurs avec !invite @numéro`);

        const nextTurn = async () => {
            game.turnIndex = (game.turnIndex + 1) % game.players.length;
            const playerJid = game.players[game.turnIndex];
            await sock.sendMessage(playerJid, { text: `🎯 C'est ton tour ! 20s pour proposer une lettre avec !guess <lettre>\nMot : ${game.revealed.join(" ")}` });
            if (game.turnTimer) clearTimeout(game.turnTimer);
            game.turnTimer = setTimeout(async () => {
                await sock.sendMessage(playerJid, { text: `⏰ Temps écoulé ! Tour suivant.` });
                nextTurn();
            }, 20000);
        };

        global.motGame = game;
        nextTurn();
    }
};