const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule, React } = require('powercord/webpack');
const Settings = require('./Components/settings');
/* settings stucture 
  [
    {
      name: "Besties",
      ids: ['75648745454556','78564676']
    },
    {
      name: "gays",
      ids: ['5646676576567', '785676465345']
    }
  ]
*/
module.exports = class pinDMs extends Plugin {
	startPlugin() {
		this.categories = this.settings.get('categories', []);
		this.contextMenus = ['DMUserContextMenu', 'GuildChannelUserContextMenu', 'UserGenericContextMenu', 'GroupDMUserContextMenu'];
		if (!this.categories) {
			this.settings.set('categories', []);
		}

		for (const module of this.contextMenus) {
			this._injectContextMenu(module);
		}

		powercord.api.settings.registerSettings(this.entityID, {
			category: this.entityID,
			label: 'Pin DMs',
			render: Settings,
		});

		require('./categories').bind(this)();
	}

	_injectContextMenu(moduleName) {
		const Menu = getModule(['MenuItem'], false);
		const UserContextMenu = getModule(m => m.default?.displayName === moduleName, false);
		const { getFriendIDs } = getModule(['getRelationships'], false);

		const isFriend = id => {
			const friendIDs = getFriendIDs();
			return friendIDs.includes(id);
		};
		const isInCategory = (categoryName, userId) => this.categories.find(cat => cat.name === categoryName).ids.includes(userId);
		const getCategoriesNotIn = userId => this.categories.filter(cat => !cat.ids.includes(userId));
		const getCategoriesIn = userId => this.categories.filter(cat => cat.ids.includes(userId));

		inject(`pindms-${moduleName}`, UserContextMenu, 'default', ([{ user }], res) => {
			if (isFriend(user.id)) {
				const addFriendToCat = React.createElement(Menu.MenuItem, {
					id: 'pindms-AddFriend',
					label: 'Add to a category',
					children: getCategoriesNotIn(user.id).map(category =>
						React.createElement(Menu.MenuItem, {
							id: `pinsdms-${category.name}CategoryAdd`,
							label: category.name,
							action: () => {
								if (isInCategory(category.name, user.id)) return;
								const idx = this.categories.findIndex(c => c.name === category.name); // for some reason when mapping and have (category, idx) idx was off by 1
								this.categories[idx].ids.push(user.id);
								this.settings.set('categories', this.categories);
								if (this.categoryInstance) this.categoryInstance.forceUpdate();
							},
						})
					),
				});

				const removeFriendFromCat = React.createElement(Menu.MenuItem, {
					id: 'pinsdms-RemoveFriend',
					label: 'Remove from a category',
					children: getCategoriesIn(user.id).map(category =>
						React.createElement(Menu.MenuItem, {
							id: `pindms-${category.name}CategoryRemove`,
							label: category.name,
							action: () => {
								if (!isInCategory(category.name, user.id)) return;
								const idx = this.categories.findIndex(c => c.name === category.name); // for some reason when mapping and have (category, idx) idx was off by 1
								const userIndex = this.categories[idx].ids.findIndex(a => a === user.id);
								this.categories[idx].ids.splice(userIndex, 1);
								this.settings.set('categories', this.categories);
								if (this.categoryInstance) this.categoryInstance.forceUpdate();
							},
						})
					),
				});

				const userContextMenuItems = res.props.children.props.children;
				const group = userContextMenuItems.find(
					child => Array.isArray(child.props?.children) && child.props.children.find(ch => ch?.props?.id === 'block')
				);

				if (group) {
					group.props.children.push(addFriendToCat);
					group.props.children.push(removeFriendFromCat);
				} else {
					userContextMenuItems.push(React.createElement(Menu.MenuGroup, null, addFriendToCat));
					userContextMenuItems.push(React.createElement(Menu.MenuGroup, null, removeFriendFromCat));
				}
			}
			return res;
		});
		UserContextMenu.default.displayName = moduleName;
	}

	pluginWillUnload() {
		uninject('pindms-direct-messages');
		for (const moduleName of this.contextMenus) uninject(`pindms-${moduleName}`);
		powercord.api.settings.unregisterSettings(this.entityID);
	}
};
