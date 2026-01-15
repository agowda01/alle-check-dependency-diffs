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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const artifact_1 = __importDefault(require("@actions/artifact"));
const DependencyChecker_1 = require("./service/DependencyChecker");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const filePath = core.getInput('project-root-directory', { required: true });
            const fileName = core.getInput('packages-file-name', { required: true });
            const outputName = core.getInput('output-file-name', { required: false }) || 'previous.json';
            const dependencyStatus = new DependencyChecker_1.DependencyChecker(fileName, filePath, outputName);
            const checkGit = core.getBooleanInput('check-git', { required: false });
            const checkDirectoryFiles = core.getBooleanInput('check-directory-files', { required: false });
            if (checkGit) {
                core.info('Checking git for package file changes...');
                const gitResult = yield dependencyStatus.gitChange();
                core.setOutput('dependency-changed', gitResult.toString());
                core.exportVariable('DEPENDENCY_CHANGED', gitResult.toString());
                core.info(`Success: dependency-changed output set to ${gitResult}`);
            }
            else if (checkDirectoryFiles) {
                core.info('Checking directory files for package changes...');
                const filesHashes = yield dependencyStatus.getFileHashes();
                const depResult = yield dependencyStatus.hashMatch(filesHashes);
                core.setOutput('dependency-changed', depResult.dependenciesChanged.toString());
                core.setOutput('hash-record-path', depResult.hashRecordPath);
                core.exportVariable('DEPENDENCY_CHANGED', depResult.dependenciesChanged.toString());
                core.info(`Success: dependency-changed output set to ${depResult.dependenciesChanged}`);
                if (fs.existsSync(depResult.hashRecordPath)) {
                    const artifactName = 'dependency-checker-hashes';
                    const files = [depResult.hashRecordPath];
                    const rootDirectory = path.dirname(depResult.hashRecordPath);
                    yield artifact_1.default.uploadArtifact(artifactName, files, rootDirectory);
                    core.info(`Success: artifact uploaded to ${artifactName}`);
                }
            }
            else {
                core.warning('Neither check-git nor check-directory-files was set to true. Skipping dependency check.');
                core.setOutput('dependency-changed', 'false');
            }
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(`Action failed: ${error.message}`);
            }
            else {
                core.setFailed(`Action failed: ${error}`);
            }
        }
    });
}
run();
