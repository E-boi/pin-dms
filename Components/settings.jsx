const { React, getModule } = require('powercord/webpack');
const { Category } = require('powercord/components/settings');
const TextInput = require('./TextInputWithButton');

const Button = getModule(m => m.ButtonLink, false).default;

module.exports = class pinDMsSettings extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = { category0Opened: false };
	}

	render() {
		const { getSetting, updateSetting } = this.props;
		const categories = getSetting('categories', []);
		return (
			<Category
				name="Categories names"
				description="This is where you could add/remove categories"
				opened={this.state.category0Opened}
				onChange={() => this.setState({ category0Opened: !this.state.category0Opened })}
			>
				<div>
					{categories.map((category, idx) => (
						<TextInput
							type="text"
							placeholder="Enter category name"
							defaultValue={category.name}
							buttonText="Remove"
							buttonIcon="fal fa-minus"
							onChange={val => {
								categories[idx].name = val;
								updateSetting('categories', categories);
							}}
							buttonOnClick={() => {
								categories.splice(idx, 1);
								updateSetting('categories', categories);
							}}
						/>
					))}
					<Button
						onClick={() => {
							categories.push({ name: 'New Category', ids: [] });
							updateSetting('categories', categories);
						}}
					>
						<span>Add category</span>
					</Button>
				</div>
			</Category>
		);
	}
};
