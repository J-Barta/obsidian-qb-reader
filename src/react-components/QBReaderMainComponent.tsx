import { Pull } from "src/APIUtil";
import {QBREaderView, useApp} from "src/QBREaderView";
import { TFile } from "obsidian";
import * as React from "react";
import {SubjectSelector} from "./SubjectSelector";
import {useEffect, useRef, useState} from "react";
import TossupDisplay from "./TossupDisplay";
import {QBReaderSettings} from "../../main";
import {difficulties, difficulty} from "../Difficulties";
import {ClipLoader} from "react-spinners";
import {useIsVisible} from "../IntersectionHook";
import {SearchContext} from "./context";
import {c} from "./helpers";
import { t } from 'src/lang/helpers';
import {Icon} from "./Icon/Icon";

export type Tossup = {
	question:string,
	answer:string,
	rawAnswer:string,
	category: string,
	subcat: string,
	setName: string,
	difficulty: number,
}

export const QBReaderMainComponent = (props: {settings:QBReaderSettings, view:QBREaderView}) => {

    const {workspace} = useApp()!;

	const [questionQuery, setQuestionQuery] = useState("");

	const [activeCategories, setActiveCategories] = useState<string[]>(props.settings.activeCats)
	const [activeSubcats, setActiveSubcats] = useState<string[]>([])
	const [catSelectActive, setCatSelectActive] = useState(false)

	const [activeDifficulties, setActiveDifficulties] = useState<number[]>([])
	const [diffDropdownActive, setDiffDropdownActive] = useState(false)

	const [searchType, setSearchType] = useState("all")

    const [questions, setQuestions] = React.useState<Tossup[]>([]);

    const file:TFile = workspace.getActiveFile()!;

	const [loading, setLoading] = useState(false)

	const titleRef = useRef(null)
	const isTitleVisible = useIsVisible(titleRef)

	const handleDiffChange = (val:boolean, diff:difficulty) => {
		if(val) {
			activeDifficulties.push(diff.level)

			setActiveDifficulties([...activeDifficulties])
		} else {
			setActiveDifficulties(activeDifficulties.filter(ele => diff.level !== ele))
		}
	}

	const pullQuestions = () => {

		setLoading(true)
		setQuestions([])

		updateCatSelect(false)
		updateDiffSelector(false)

		const diffsToUse = activeDifficulties.length > 0 ? activeDifficulties : difficulties.map(e => e.level)

		Pull("query", [
				{key: "queryString", val: questionQuery},
				{key: "searchType", val: searchType},
				{key: "categories", val: activeCategories.reduce((acc, e) => acc+","+e, "")},
				{key: "subcategories", val: activeSubcats.reduce((acc, e) => acc+","+e, "")},
				{key: "difficulties", val: diffsToUse.reduce((acc, e) => acc+","+e, "")}
			], (data) => {
				const questionContent:Tossup[] = data.tossups.questionArray.map((e:any):Tossup => {
					return {
						question: e.question,
						answer: e.formatted_answer,
						rawAnswer: e.answer,
						category: e.category,
						subcat: e.subcategory,
						setName: e.setName,
						difficulty: e.difficulty,
					}
				});

				setQuestions(questionContent);

				setLoading(false)
			}
		)
	}

	const updateDiffSelector = (val:boolean) => {
		setDiffDropdownActive(val)

		if(val) setCatSelectActive(false)
	}

	const updateCatSelect = (val:boolean) => {
		setCatSelectActive(val)

		if(val) setDiffDropdownActive(false)
	}

	//Search stuff

	const searchRef = useRef<HTMLInputElement>(null);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [isSearching, setIsSearching] = useState<boolean>(false);
	const [debouncedSearchQuery, setDebouncedSearchQuery] =
		useState<string>('');

	useEffect(() => {
		const onSearchHotkey = (e: string) => {

			if (e === 'editor:open-search') {
				setIsSearching((val) => !val);
			}
		};

		props.view.emitter.on('hotkey', onSearchHotkey);

		return () => {
			props.view.emitter.off('hotkey', onSearchHotkey);
		};
	}, [props.view]);

	useEffect(() => {
		if (isSearching) {
			searchRef.current?.focus();
		}
	}, [isSearching]);

	useEffect(() => {
		const win = props.view.getWindow();
		const trimmed = searchQuery.trim();
		let id: number;

		if (trimmed) {
			id = win.setTimeout(() => {
				setDebouncedSearchQuery(trimmed);
			}, 250);
		} else {
			setDebouncedSearchQuery('');
		}

		return () => {
			win.clearTimeout(id);
		};
	}, [searchQuery, props.view]);


    return <SearchContext.Provider
		value={
			debouncedSearchQuery
				? debouncedSearchQuery.toLocaleLowerCase()
				: null
		}
	>

		{isSearching && (
			<div className={c('search-wrapper')}>
				<input
					ref={searchRef}
					value={searchQuery}
					onChange={(e) => {
						setSearchQuery((e.target as HTMLInputElement).value);
					}}
					onKeyDown={(e) => {
						if (e.key === 'Escape') {
							setSearchQuery('');
							setDebouncedSearchQuery('');
							(e.target as HTMLInputElement).blur();
							setIsSearching(false);
						}
					}}
					type="text"
					className={c('filter-input')}
					placeholder={t('Search...')}
				/>
				<a
					className={`${c('search-cancel-button')} clickable-icon`}
					onClick={() => {
						setSearchQuery('');
						setDebouncedSearchQuery('');
						setIsSearching(false);
					}}
					aria-label={t('Cancel')}
				>
					<Icon name="lucide-x" />
				</a>
			</div>
		)}

		<div
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					pullQuestions();
				}
			}}
			tabIndex={0}
			className={"main-container"}
			>

			<h1 id={"title-text"} ref={titleRef}>{file.basename} QB Reader Import</h1>

			<div className={"input-container"}>

				<input
					className={"query"}
					spellCheck={false}
					type={"text"}
					placeholder={"Search Query"}
					value={questionQuery}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						setQuestionQuery(event.target.value)
					}}
				/>

				<div className={"input-row"}>
					<select
						className={"dropdown"}
						onChange={(e) => setSearchType(e.target.value)}
						value={searchType}
					>
						<option value={"all"}>All Text</option>
						<option value={"question"}>Question</option>
						<option value={"answer"}>Answer</option>
					</select>

					<div className={"difficulty-container"}>

						<button
							className={`toggle-button ${diffDropdownActive ? "mod-cta" : ""}`}
							onClick={() => updateDiffSelector(!diffDropdownActive)}
						>
							Difficulties
						</button>

						<div className={"difficulty-dropdown " + (!diffDropdownActive ? "diff-drop-inactive" : "")} >
							{
								difficulties.map(e => {
									const active = activeDifficulties.includes(e.level);
									return <div
										className={"difficulty-selector " + (active ? "diff-item-active" : "") }
										onClick={() => handleDiffChange(!active, e)}
										key={e.name}
									>
											<input
												type={"checkbox"}
												checked={active}
												readOnly={true}
											/>
										<p className={"difficulty-text"}>{e.level}: {e.name}</p>
									</div>
								})
							}
						</div>
						<button
							onClick={() => updateCatSelect(!catSelectActive)}
							className={"toggle-button " + (catSelectActive ? " mod-cta " : " ")}
						>
							Categories
						</button>

						<button className={"mod-cta"} onClick={pullQuestions}>Search</button>

					</div>
				</div>

				<div className={"loading-container"}>
					<ClipLoader color={"var(--interactive-accent)"} size={75} loading={loading}/>
				</div>

				<SubjectSelector settings={props.settings} active={catSelectActive} upliftActiveCategories={setActiveCategories} upliftActiveSubcats={setActiveSubcats}/>
			</div>
			<div>
				{
					questions.map(e => <TossupDisplay key={e.question} tossup={e} file={file}/>)
				}
			</div>

			<button
				className={`top-scroll-button ${isTitleVisible ? "scroll-button-inactive" : ""}`}
				onClick={() => document.getElementById("title-text")?.scrollIntoView({ behavior: "smooth"})}
			>
				<h1>Scroll To Top</h1>
			</button>
		</div>

	</SearchContext.Provider>
}



