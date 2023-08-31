import { Pull } from "src/APIUtil";
import { useApp } from "src/QBREaderView";
import { TFile } from "obsidian";
import * as React from "react";
import {SubjectSelector} from "./SubjectSelector";
import {useState} from "react";
import TossupDisplay from "./TossupDisplay";
import {QBReaderSettings} from "../../main";
import {difficulties, difficulty} from "../Difficulties";

export type Tossup = {
	question:string,
	answer:string,
	rawAnswer:string,
	category: string,
	subcat: string,
	setName: string,
	difficulty: number,
}

export const QBReaderMainComponent = (props: {settings:QBReaderSettings}) => {

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

	const handleDiffChange = (val:boolean, diff:difficulty) => {
		if(val) {
			activeDifficulties.push(diff.level)

			setActiveDifficulties([...activeDifficulties])
		} else {
			setActiveDifficulties(activeDifficulties.filter(ele => diff.level !== ele))
		}
	}

	const pullQuestions = () => {

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

    return <div
		onKeyDown={(e) => {
			if (e.key === "Enter") {
				pullQuestions();
			}
		}}
		tabIndex={0}
		className={"main-container"}
		>

		<h1>{file.basename} QB Reader Import</h1>

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

			<SubjectSelector settings={props.settings} active={catSelectActive} upliftActiveCategories={setActiveCategories} upliftActiveSubcats={setActiveSubcats}/>
		</div>
		<div>
			{
				questions.map(e => <TossupDisplay key={e.question} tossup={e} file={file}/>)
			}
		</div>

    </div>
}
