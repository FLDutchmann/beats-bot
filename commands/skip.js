const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection, createAudioResource } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip the current song'),
	async execute(interaction) {
		const channel = interaction.member.voice.channel;
		let connection = getVoiceConnection(channel.guild.id);
        if(!connection) {
            return;
        }
        const player = connection.player;
        player.stop();
        await interaction.reply(`Skipping Song`);
	},
};
