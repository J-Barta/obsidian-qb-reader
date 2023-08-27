import {App, Plugin, PluginSettingTab, Setting} from 'obsidian';
import * as React from "react";
import { QBREaderView, QB_READER_VIEW_TYPE } from "QBREaderView";
import {categories} from "./react-components/Categories";
export const AppContext = React.createContext<App | undefined>(undefined);

//TODO: Parse out unnecessary whitespace
//TODO: Allow config of all configurable things in the search
//TODO: Settings for cloze format
//TODO: Make UI not look crappy (switch to semantic)
//TODO: Bonus-ing?
//TODO: make settings tab not just a giant list:(
//TODO: Allow enter key to search

export interface QBReaderSettings {
	activeCats: string[];
	activeSubcats: string[];
}

const DEFAULT_SETTINGS: Partial<QBReaderSettings> = {
	activeCats: categories.map(e => e.name),
	activeSubcats: categories.reduce((acc:string[], e) => {
		acc.push(...e.subcats)
		return acc
	}, [])
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
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

class SampleSettingTab extends PluginSettingTab {
	plugin: QBReaderPlugin;

	constructor(app: App, plugin: QBReaderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		categories.forEach(e => {
				new Setting(containerEl)
					.setName(e.name)
					.addToggle(toggle => toggle
						.setValue(this.plugin.settings.activeCats.includes(e.name))
						.onChange(async (value) => {
							if(value) {
								this.plugin.settings.activeCats.push(e.name)
								this.plugin.settings.activeSubcats.push(...e.subcats)
							} else {
								this.plugin.settings.activeCats = this.plugin.settings.activeCats.filter(ele => {
									return ele !== e.name
								})

								this.plugin.settings.activeSubcats = this.plugin.settings.activeSubcats.filter(ele => {
									return !e.subcats.includes(ele)
								})
							}
							await this.plugin.saveSettings()
						})
					)

				e.subcats.forEach(sub => {
					new Setting(containerEl)
						.setName(sub)
						.addToggle(toggle => toggle
							.setDisabled(!this.plugin.settings.activeCats.includes(e.name))
							.setValue(this.plugin.settings.activeSubcats.includes(sub))
							.onChange(async (value) => {
								console.log("trying to change sub")
								if(value) {
									this.plugin.settings.activeSubcats.push(sub)
								} else {
									this.plugin.settings.activeSubcats = this.plugin.settings.activeSubcats.filter(ele => {
										return ele !== e.name
									})
								}
								await this.plugin.saveSettings()
							})
						)
				})
		})

	}
}