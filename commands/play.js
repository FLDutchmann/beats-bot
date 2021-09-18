const { join } = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, NoSubscriberBehavior, createAudioResource, VoiceConnectionStatus, AudioPlayerStatus  } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');

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
		.addStringOption(option => option.setName('name').setDescription('Name or url of the song to play from youtube').setRequired(true)),
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
			
			connection.subscribe(player);
		}
		const player = connection.player;
		
		const name = interaction.options.getString(`name`);
		let url = "";
		await interaction.deferReply();
		if(!name.includes('youtube.com/')) {
			//Search Youtube for song
			const response = await ytsr(name);
			url = response['items'].filter((item) => item.type == 'video')[0].url;
			console.log(url);

		} else {
			//Assume the name is a url
			url = name;
		}

		connection.queue.push(url);

		if(player.state.status == AudioPlayerStatus.Idle) {
			await playQueued(channel.guild.id);
			await interaction.editReply(`🎵 Playing ${url} 🎵`);
		} else {
			await interaction.editReply(`Added ${url} to the queue`);
		}
	},
};
