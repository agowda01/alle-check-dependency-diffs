import * as core from '@actions/core';
import artifact from '@actions/artifact';
import { DependencyChecker } from './service/DependencyChecker';
import * as path from 'path';
import * as fs from 'fs';


async function run(){
    try {
        const filePath = core.getInput('project-root-directory', { required: true });
        const fileName = core.getInput('packages-file-name', { required: true });
        const outputName = core.getInput('output-file-name', { required: false }) || 'previous.json';
        const dependencyStatus = new DependencyChecker(fileName, filePath, outputName);

        const checkGit = core.getBooleanInput('check-git', { required: false });
        const checkDirectoryFiles = core.getBooleanInput('check-directory-files', { required: false });

        if (checkGit) {
            core.info('Checking git for package file changes...');
            const gitResult = await dependencyStatus.gitChange();
            core.setOutput('dependency-changed', gitResult.toString());
            core.exportVariable('DEPENDENCY_CHANGED', gitResult.toString());
            core.info(`Success: dependency-changed output set to ${gitResult}`);
        }
        else if (checkDirectoryFiles) {
            core.info('Checking directory files for package changes...');
            const filesHashes = await dependencyStatus.getFileHashes();
            const depResult = await dependencyStatus.hashMatch(filesHashes);

            core.setOutput('dependency-changed', depResult.dependenciesChanged.toString());
            core.setOutput('hash-record-path', depResult.hashRecordPath);
            core.exportVariable('DEPENDENCY_CHANGED', depResult.dependenciesChanged.toString());

            core.info(`Success: dependency-changed output set to ${depResult.dependenciesChanged}`);

            // Upload artifact with hash file
            if (fs.existsSync(depResult.hashRecordPath)) {
                const artifactName = 'dependency-checker-hashes';
                const files = [depResult.hashRecordPath];
                const rootDirectory = path.dirname(depResult.hashRecordPath);

                await artifact.uploadArtifact(artifactName, files, rootDirectory);
                core.info(`Success: artifact uploaded to ${artifactName}`);
            }
        }
        else {
            core.warning('Neither check-git nor check-directory-files was set to true. Skipping dependency check.');
            core.setOutput('dependency-changed', 'false');
        }
    }
    catch(error){
        if (error instanceof Error) {
            core.setFailed(`Action failed: ${error.message}`);
        } else {
            core.setFailed(`Action failed: ${error}`);
        }
    }
}

run();