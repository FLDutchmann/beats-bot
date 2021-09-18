const { join } = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, NoSubscriberBehavior, createAudioResource, VoiceConnectionStatus, AudioPlayerStatus  } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

function playQueued(guildId) {
	const connection = getVoiceConnection(guildId);
	if(!connection) return;
	console.log(connection.queue.length);
	if(connection.queue.length != 0) {
		const url = connection.queue.shift();
		let resource = createAudioResource( ytdl(url) );
		connection.player.play(resource);
		return url;
	}
	return null;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play a song!')
		.addStringOption(option => option.setName('url').setDescription('The youtube URL for your song.').setRequired(true)),
	async execute(interaction) {
		const channel = interaction.member.voice.channel;

		let connection = getVoiceConnection(channel.guild.id);
		if(!connection) {
			connection = joinVoiceChannel({	
				channelId: channel.id,
				guildId: channel.guild.id,
				adapterCreator: channel.guild.voiceAdapterCreator,
			});

			connection.queue = [];
		
			connection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
				console.log('Connection is in the Ready state!');
			});
			connection.on(VoiceConnectionStatus.Connecting, (oldState, newState) => {
				console.log('Connection is in the Connecting state!');
			});
			connection.on(VoiceConnectionStatus.Disconnected, (oldState, newState) => {
				console.log('Connection is in the Disconnected state!');
				connection.destroy();
			});
			connection.on(VoiceConnectionStatus.Signalling, (oldState, newState) => {
				console.log('Connection is in the Signalling state!');
			});
			
			connection.on(VoiceConnectionStatus.Destroyed, (oldState, newState) => {
				console.log('Connection has been destroyed!');
			});
			
			
			const player = createAudioPlayer({
				behaviors: {
					noSubscriber: NoSubscriberBehavior.Pause,
				},
			});

			player.on(AudioPlayerStatus.Playing, (oldState, newState) => {
				console.log('Audio player is in the Playing state!');
			});
			player.on(AudioPlayerStatus.Idle, (oldState, newState) => {
				console.log('Audio player is in the Idle state!');
			});
			player.on('error', error => {
				console.error('Error:', error.message);
			});

			
			player.on(AudioPlayerStatus.Idle, (oldState, newState) => {
				const url = playQueued(channel.guild.id);
				if(url) interaction.channel.send({content: `🎵 Playing ${url} 🎵`});				
			});
			connection.player = player;
			
		}
		const player = connection.player;

		const subscription = connection.subscribe(player);
		
		const url = interaction.options.getString(`url`);
		connection.queue.push(url);

		if(player.state.status == AudioPlayerStatus.Idle) {
			await playQueued(channel.guild.id);
			await interaction.reply(`🎵 Playing ${url} 🎵`);
		} else {
			await interaction.reply(`Added ${url} to the queue`);
		}
	},
};
