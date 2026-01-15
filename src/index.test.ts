import * as path from 'path';
import * as fs from 'fs';
import { DependencyChecker } from './service/DependencyChecker';

describe('Check Build Dependencies', () => {
    test('should return true on most recent diffs', async () => {
        const fPath = './src/__mocks__/mock_root/';
        const fName = 'task.json';
        const oName = 'previous.json';
        const dchecker = new DependencyChecker(fName, fPath, oName);
        const diff = await dchecker.gitChange();
        expect(diff).toEqual(true);
    });

    test('should have 3 directories', async() => {
        const fPath = './src/__mocks__/mock_root/';
        const fName = 'project.assets.json';
        const oName = 'previous.json';
        const dchecker = new DependencyChecker(fName, fPath, oName);
        const dirList = await dchecker.searchDir(fPath);
        expect(dchecker.dirPathList.length).toEqual(3);
    });

    test('should contain 3 items in hash list and change be false', async() => {
        const fPath = './src/__mocks__/mock_root';
        const fName = 'project.assets.json';
        const oName = 'previous.json';
        const dchecker = new DependencyChecker(fName, fPath, oName);
        const filesHashes = await dchecker.getFileHashes();
        const depResult = await dchecker.hashMatch(filesHashes);
        expect(filesHashes.length).toEqual(3);
        expect(depResult.dependenciesChanged).toEqual(false);
    });

});