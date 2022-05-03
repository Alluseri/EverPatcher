const fs = require('fs');

var __PATCHES = null;

console.log("/json patcher by Nekoseri/");
console.log("Reading patches...");
__PATCHES = JSON.parse(fs.readFileSync("__PATCHES.json", "utf8").toString());

function setByChain(content, chain, set) {
	var byref = content;
	while (chain.length > 1) {
		byref = byref[chain.shift()];
	}
	byref[chain.shift()] = set;
	return content;
}
function getByChain(content, chain) {
	var byref = content;
	while (chain.length > 1) {
		byref = byref[chain.shift()];
	}
	return byref[chain.shift()];
}
function fi(og, res) {
	if (typeof(res) == "string") {
		var sx = res.split(":");
		return og.find((x)=>x[sx[0]]==sx[1]);
	} else return og[res < 0 ? (og.length + res) : res];
}
function runRecursivePatches(content, patch, chain) {
	for (var xk in patch) {
		let chcl = chain.map((x)=>x);
		chcl.push(xk);
		if (patch[xk].constructor.name == "Object") {
			runRecursivePatches(content, patch[xk], chcl);
		} else if (patch[xk].constructor.name == "Array") {
			var resx = patch[xk];
			if (resx[0] == "set") {
				setByChain(content, chcl, resx[1]);
				console.log(">> Applied singular 'set' patch to "+xk);
			} else {
				var og = getByChain(content, chcl);
				for (var res_ in resx) {
					var res = resx[res_];
					switch (res[0]) {
					case "injectPush":
						var sym = fi(og, res[1]);
						var rt = res[2];
						for (var pk in rt) {
							var rtx = rt[pk];
							for (var pkx in rtx) {
								sym[pk].push(rtx[pkx]);
							}
						}
						break;
					case "injectDelete":
						var entireObject = fi(og, res[1]);
						var toDelete = res[2];
						for (var key in toDelete) {
							var targetArray = entireObject[key];
							for (var js in toDelete[key]) {
								for (var x in targetArray) {
									if (targetArray[x] == toDelete[key][js]) targetArray.splice(x, 1);
								}
							}
						}
						break;
					case "delete":
						delete (fi(og, res[1])[res[2]]);
						break;
					case "push":
						for (var x__ in res[1]) {
							og.push(res[1][x__]);
						}
						break;
					case "set":
						var sym = fi(og, res[1]);
						var rt = res[2];
						for (var pk in rt) {
							sym[pk] = rt[pk];
						}
						break;
					}
					console.log(">> Applied '"+res[0]+"' patch to "+xk);
				}
			}
		}
	}
}

for (var file in __PATCHES) {
	var patches = __PATCHES[file];
	if (!file.endsWith(".json")) file = file + ".json";
	try {
		var fileJsonContent = JSON.parse(fs.readFileSync(file, "utf8").toString());
		console.log("> Imported "+file+" successfully.");
	} catch { continue; }
	var backupFileName = "UNPATCHED_"+file;
	fs.writeFileSync(backupFileName, JSON.stringify(fileJsonContent, null, "\t"));
	runRecursivePatches(fileJsonContent, patches, []);
	console.log(">>> Patched "+file+" successfully, saving...");
	fs.writeFileSync(file, JSON.stringify(fileJsonContent, null, "\t"));
}
