import { recipes, runRecipe } from "./recipes.mjs";
console.log(
	JSON.stringify(
		recipes.map((recipe) => ({ title: recipe.title, ...runRecipe(recipe) })),
		null,
		2,
	),
);
