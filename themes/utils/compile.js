var fs = require("fs");
var path = require("path");
var less = require("less");

var themeFolders = ["../android", "../ios", "../blackberry", "../holodark", "../windows", "../custom"];

var commonFolders = ["../common/transitions"];

var batchQueue = [];
var batchIndex = 0;
var processProgress = 0; 

themeFolders.forEach(function(folder){ 
	batchQueue.push(function(){
		processFolder(folder, true);
	});
});

commonFolders.forEach(function(folder){ 
	batchQueue.push(function(){
		processFolder(folder, false);
	});
});

batch();

///////////////////////////////////////////////////////////////////////////////////////////////////

function batch(){
	if(batchIndex < batchQueue.length){
		batchQueue[batchIndex]();
		batchIndex++;
	}
}

function beginProcess(){
	processProgress++;
}
function endProcess(){
	processProgress--;
	if (processProgress == 0){
		batch();
	}
}

function processFolder(folder, usingCommonSubstitution){
	var folderFiles = getLessFiles(folder),
		theme = folder.replace(/.*\//, "");
	
	if(usingCommonSubstitution){
		var commonFiles = getLessFiles("../common");
		var outputFile;
		commonFiles.array.forEach(function(commonFile){
			var themeFile = folderFiles.dic[commonFiles.dic[commonFile]];
			if(themeFile){
				// If there is a .less file in the theme folder, use it. 
				outputFile = themeFile.replace(".less", ".css");
				applyLess(theme, themeFile, null, outputFile);
			}else{
				// Otherwise, fall back to the .less file which is in 'common'.
				var fileName = commonFiles.dic[commonFile];
				outputFile = folder + "/" + fileName.replace(".less", ".css");
				// dui.mobile mirroring support
				if(fileName.indexOf("_rtl") == -1){ 
					applyLess(theme, commonFile, '@import "' + folder + '/variables.less";', outputFile);
				}else{
					applyLess(theme, commonFile, '@import "' + folder + '/variables_rtl.less";', outputFile);
				}
			}
		});
	}else{
		folderFiles.array.forEach(function(file){
			applyLess(theme, file, null, file.replace(".less", ".css"));
		});
	}
}

function applyLess(theme, file, prependText, outputFile){
	beginProcess();
	console.log("compiling:", file);
	
	var parser = new(less.Parser)({paths: [path.dirname(file)], filename: file, optimization: 1});
	var lessContent = fs.readFileSync(file, "utf-8");

	if(prependText){
		lessContent = prependText + lessContent;
	}

	// If theme name is mentioned in the less file, substitute it.  Used by ExampleWidget for testing.
	lessContent = lessContent.replace(/{{theme}}/g, theme);

	parser.parse(lessContent, function(error, tree){
		if(error){
			less.writeError(error);
			process.exit(1);
		}

		console.log("writing:", outputFile);
		var fd = fs.openSync(outputFile, "w");
		fs.write(fd, tree.toCSS({compress: false}), 0, "utf-8", function(f){
			fs.close(fd);
			endProcess();
		});
	});
}

function getLessFiles(folder){ 
	var filesMap = {};
	var filesArray = fs.readdirSync(folder);
	filesArray = filesArray.filter(function(file){
		return file && /\.less$/.test(file) && !/variables\.less$/.test(file) && !/css3\.less$/.test(file) 
		&& !/variables_rtl\.less$/.test(file);
	});
	
	filesArray = filesArray.map(function(file){
			filesMap[file] = folder + "/" + file;
			filesMap[folder + "/" + file] = file;
			return filesMap[file]; 
	});
	
	return {array: filesArray, dic: filesMap};
}
