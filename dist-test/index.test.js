"use strict";
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
const DependencyChecker_1 = require("./service/DependencyChecker");
describe('Check Build Dependencies', () => {
    test('should return true on most recent diffs', () => __awaiter(void 0, void 0, void 0, function* () {
        const fPath = './src/__mocks__/mock_root/';
        const fName = 'task.json';
        const oName = 'previous.json';
        const dchecker = new DependencyChecker_1.DependencyChecker(fName, fPath, oName);
        const diff = yield dchecker.gitChange();
        expect(diff).toEqual(true);
    }));
    test('should have 3 directories', () => __awaiter(void 0, void 0, void 0, function* () {
        const fPath = './src/__mocks__/mock_root/';
        const fName = 'project.assets.json';
        const oName = 'previous.json';
        const dchecker = new DependencyChecker_1.DependencyChecker(fName, fPath, oName);
        const dirList = yield dchecker.searchDir(fPath);
        expect(dchecker.dirPathList.length).toEqual(3);
    }));
    test('should contain 3 items in hash list and change be false', () => __awaiter(void 0, void 0, void 0, function* () {
        const fPath = './src/__mocks__/mock_root';
        const fName = 'project.assets.json';
        const oName = 'previous.json';
        const dchecker = new DependencyChecker_1.DependencyChecker(fName, fPath, oName);
        const filesHashes = yield dchecker.getFileHashes();
        const depResult = yield dchecker.hashMatch(filesHashes);
        expect(filesHashes.length).toEqual(3);
        expect(depResult.dependenciesChanged).toEqual(false);
    }));
});
