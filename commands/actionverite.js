// commands/actionverite.js
module.exports = {
    name: 'actionverite',
    description: 'Choisissez Action ou Vérité',
    run: async ({ sock, msg, replyWithTag }) => {
        const truths = [
            "Quelle est ta plus grande peur ?",
            "As-tu déjà menti à un ami proche ?",
            "Quel est ton secret le plus embarrassant ?"
        ];
        const actions = [
            "Fais 10 pompes",
            "Chante une chanson pendant 30 secondes",
            "Danse comme un robot pendant 15 secondes"
        ];
        let game = {
            admin: msg.key.participant || msg.key.remoteJid,
            players: [],
            active: true,
            lastPlayer: null
        };
        global.avGame = game;
        await replyWithTag(sock, msg.key.remoteJid, msg, "🎲 Jeu Action ou Vérité lancé !\nTous les membres peuvent rejoindre avec !join");
    }
};