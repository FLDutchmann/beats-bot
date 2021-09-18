const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection, createAudioResource } = require('@discordjs/voice');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('List the queued songs'),
	async execute(interaction) {
		const channel = interaction.member.voice.channel;
		let connection = getVoiceConnection(channel.guild.id);
        if(!connection) {
            await interaction.reply('Not currently playing');
            return;
        }
        
        let str = "";

        for(let i = 0; i < 10; i++){
            if(i >= connection.queue.length) break;
            str += `${i+1}) ${connection.queue[i]} \n`
        }

        await interaction.reply(str);
	},
};
