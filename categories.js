// ripped from https://github.com/powercord-community/betterfriends/blob/master/modules/FavoriteFriendChannel.js just taken out the parts I don't plan to need
const { inject } = require('powercord/injector');
const { React, getModule } = require('powercord/webpack');

const FavoriteFriends = require('./Components/channels');

module.exports = async function () {
	const _this = this;
	const ConnectedPrivateChannelsList = await getModule(m => m.default && m.default.displayName === 'ConnectedPrivateChannelsList');
	const channelStore = await getModule(['getChannel', 'getDMFromUserId']);
	const classes = {
		...(await getModule(['channel', 'closeButton'])),
		...(await getModule(['avatar', 'muted', 'selected'])),
		...(await getModule(['privateChannelsHeaderContainer'])),
	};

	// Patch DM list
	inject('pindms-direct-messages', ConnectedPrivateChannelsList, 'default', (_, res) => {
		//if (!this.settings.get('showFavorite', true)) return res;
		res.props.privateChannelIds = res.props.privateChannelIds.filter(c => {
			const channel = channelStore.getChannel(c);
			return channel.type !== 1 || !this.categories.filter(cat => cat.ids.includes(channel.recipients[0])).length > 0;
		});

		if (this.categoryInstance) this.categoryInstance.forceUpdate();

		res.props.children = [
			// Previous elements
			...res.props.children,
			// Favorite Friends
			() =>
				this.categories.map(category =>
					React.createElement(FavoriteFriends, {
						classes,
						category,
						selectedChannelId: res.props.selectedChannelId,
						_this,
					})
				),
		];

		return res;
	});
	ConnectedPrivateChannelsList.default.displayName = 'ConnectedPrivateChannelsList';
};
