"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyChecker = void 0;
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const util = __importStar(require("util"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const execPromise = util.promisify(child_process_1.exec);
class DependencyChecker {
    constructor(_fileName, _rootPath, _outputFile) {
        this.dirPathList = [];
        this.fileName = _fileName;
        this.rootPath = _rootPath;
        this.outputFile = _outputFile;
    }
    gitChange() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let fileChanged;
                let fileTracked;
                console.log(`Checking branch for ${this.fileName} in git...`);
                const gitTree = yield execPromise(`cd ${this.rootPath} && git ls-tree -r HEAD --name-only`);
                console.log("Files in " + this.rootPath + " tracked by git:\n" + gitTree.stdout);
                fileTracked = gitTree.stdout.includes(this.fileName);
                if (gitTree.stderr.length > 0) {
                    throw `stderr: ${gitTree.stderr}`;
                }
                if (fileTracked) {
                    console.log(`Checking if ${this.fileName} was modified...`);
                    const modifiedFiles = yield execPromise(`cd ${this.rootPath} && git diff HEAD HEAD~ --name-only`);
                    console.log("Files modified by this PR:\n" + modifiedFiles.stdout);
                    fileChanged = modifiedFiles.stdout.includes(this.fileName);
                    if (modifiedFiles.stderr.length > 0) {
                        throw `stderr: ${modifiedFiles.stderr}`;
                    }
                    if (fileChanged) {
                        console.log(`File ${this.fileName} has been modified.`);
                    }
                    else {
                        console.log(`File ${this.fileName} has not been modified.`);
                    }
                }
                else {
                    console.log(`File ${this.fileName} is not tracked by git.`);
                    fileChanged = true;
                }
                return fileChanged;
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    getFileHashes() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.searchDir(this.rootPath);
            const hashList = [];
            for (const assetFilePath of this.dirPathList) {
                const hValue = yield this.hashFile(assetFilePath);
                hashList.push(hValue);
            }
            return hashList;
        });
    }
    searchDir(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let dirs = yield fs.promises.readdir(dirPath);
            if (dirs.includes(this.fileName)) {
                const assetPath = path.resolve(dirPath, this.fileName);
                this.dirPathList.push(assetPath);
            }
            for (const dir of dirs) {
                const fileResolvedPath = path.resolve(dirPath, dir);
                const fileStat = yield fs.promises.stat(fileResolvedPath);
                if (fileStat.isDirectory()) {
                    yield this.searchDir(fileResolvedPath);
                }
            }
        });
    }
    hashFile(packagePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = crypto.createHash('sha1');
            const fileData = yield fs.promises.readFile(packagePath);
            hash.update(fileData.toString());
            const hashValue = hash.digest('base64');
            return hashValue;
        });
    }
    hashMatch(hashValues) {
        return __awaiter(this, void 0, void 0, function* () {
            const previousPackageHashesPath = path.resolve(this.rootPath, this.outputFile);
            const previousPackageHashes = yield fs.promises.readFile(previousPackageHashesPath).catch(err => { return '[]'; });
            const oldHashValues = JSON.parse(previousPackageHashes.toString());
            let hashMatch;
            for (const hsh of hashValues) {
                hashMatch = oldHashValues.includes(hsh);
                if (!hashMatch)
                    break;
            }
            const newHashData = JSON.stringify(hashValues);
            yield this.writeFile(previousPackageHashesPath, newHashData);
            const depRecord = {
                hashRecordPath: previousPackageHashesPath,
                dependenciesChanged: !hashMatch
            };
            return depRecord;
        });
    }
    writeFile(pth, dt) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.promises.writeFile(pth, dt).then(() => console.log(`file written to ${pth}`)).catch(err => console.log(err));
        });
    }
}
exports.DependencyChecker = DependencyChecker;
