import {App, Plugin, PluginSettingTab, Setting} from 'obsidian';
import * as React from "react";
import { QBREaderView, QB_READER_VIEW_TYPE } from "src/QBREaderView";
import {categories} from "./src/Categories";
export const AppContext = React.createContext<App | undefined>(undefined);

//TODO: Parse out unnecessary whitespace
//TODO: Allow config of all configurable things in the search
//TODO: Settings for cloze format
//TODO: Bonus-ing?
//TODO: Jump to top button
//TODO: Show loading icon when loading questions
//TODO: Part of speech parsing to determine if you should add an extra word to the "pronoun"
//TODO: Ctrl + F (scrapped for now)
//TODO: Collapsable categories

export interface QBReaderSettings {
	activeCats: string[];
	disableCatColors: boolean;
}

const DEFAULT_SETTINGS: Partial<QBReaderSettings> = {
	activeCats: categories.map(e => e.name),
	disableCatColors: false
}

export default class QBReaderPlugin extends Plugin {
	settings: QBReaderSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			QB_READER_VIEW_TYPE,
			(leaf) => new QBREaderView(leaf, this.settings)
		)


		//The command to open the modal
		this.addCommand({
			id: "qb-reader",
			name: "QB Reader",
			checkCallback: (checking:boolean) => {

				if(!checking) {
					this.activateView()
				}

				return true;
			}
		})


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new QBReaderSettingsTab(this.app, this));
	}

	onunload() {

	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(QB_READER_VIEW_TYPE);
	
		await this.app.workspace.getLeaf('split', 'vertical').setViewState({
			type: QB_READER_VIEW_TYPE,
			active: true,
		});
	
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(QB_READER_VIEW_TYPE)[0]
		);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class QBReaderSettingsTab extends PluginSettingTab {
	plugin: QBReaderPlugin;

	constructor(app: App, plugin: QBReaderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Disable Category Colors")
			.setTooltip("For themes that make colored text hard to read")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.disableCatColors)
				.onChange(async (value) => {
					this.plugin.settings.disableCatColors = value;

					await this.plugin.saveSettings();
				})
			)

		categories.forEach(e => {
				new Setting(containerEl)
					.setName(e.name)
					.addToggle(toggle => toggle
						.setValue(this.plugin.settings.activeCats.includes(e.name))
						.onChange(async (value) => {
							if(value) {
								this.plugin.settings.activeCats.push(e.name)
							} else {
								this.plugin.settings.activeCats = this.plugin.settings.activeCats.filter(ele => {
									return ele !== e.name
								})
							}
							await this.plugin.saveSettings()
						})
					)
		})

	}
}
