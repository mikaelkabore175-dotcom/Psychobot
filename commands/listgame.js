// commands/listgame.js
module.exports = {
    name: 'listgame',
    description: 'Affiche le menu interactif des jeux disponibles',
    run: async ({ sock, msg, replyWithTag }) => {
        const from = msg.key.remoteJid;
        const sections = [
            {
                title: "Jeux disponibles",
                rows: [
                    { title: "Mot à Compléter", description: "Devinez le mot lettre par lettre", rowId: "!motgame" },
                    { title: "Action ou Vérité", description: "Choisissez Action ou Vérité", rowId: "!actionverite" },
                    { title: "Coin", description: "Lance une pièce (commande: !coin)", rowId: "!coin" },
                    { title: "Dice", description: "Lance un dé (commande: !dice)", rowId: "!dice" }
                ]
            }
        ];
        await sock.sendMessage(from, {
            text: "🎮 Choisissez le jeu que vous voulez lancer :",
            footer: "Bot Games",
            buttonText: "Voir les jeux",
            sections
        });
    }
};