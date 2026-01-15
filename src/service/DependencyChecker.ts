import { IDependencyRecord } from '../interfaces/IDependencyRecord'
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as util from 'util';
import * as path from 'path';
import { exec } from 'child_process';
const execPromise = util.promisify(exec);

export class DependencyChecker {
    public fileName: string;
    public rootPath: string;
    public outputFile: string;
    public dirPathList: string[] = [];

    constructor(_fileName: string, _rootPath: string, _outputFile: string){
        this.fileName = _fileName;
        this.rootPath = _rootPath;
        this.outputFile = _outputFile;
    }

    async gitChange(): Promise<boolean> {
        try{
            let fileChanged:boolean;
            let fileTracked:boolean;

            console.log(`Checking branch for ${this.fileName} in git...`)
                
            const gitTree = await execPromise(`cd ${this.rootPath} && git ls-tree -r HEAD --name-only`);

            console.log("Files in " + this.rootPath + " tracked by git:\n" + gitTree.stdout);

            fileTracked = gitTree.stdout.includes(this.fileName);

            if (gitTree.stderr.length > 0)
            {
                throw `stderr: ${gitTree.stderr}`;
            }

            if (fileTracked){
                console.log(`Checking if ${this.fileName} was modified...`)

                const modifiedFiles = await execPromise(`cd ${this.rootPath} && git diff HEAD HEAD~ --name-only`);

                console.log("Files modified by this PR:\n" + modifiedFiles.stdout)

                fileChanged = modifiedFiles.stdout.includes(this.fileName);

                if (modifiedFiles.stderr.length > 0)
                {
                    throw `stderr: ${modifiedFiles.stderr}`;
                }

                if (fileChanged) {
                    console.log(`File ${this.fileName} has been modified.`)
                } else {
                    console.log(`File ${this.fileName} has not been modified.`)
                }
            } else {
                console.log(`File ${this.fileName} is not tracked by git.`)
                fileChanged = true;
            }

            return fileChanged

        } catch (error){
                console.error(error);
            }
    }

    async getFileHashes(): Promise<string[]> {
        await this.searchDir(this.rootPath);
        const hashList: string[] = [];
        for (const assetFilePath of this.dirPathList) {
            const hValue = await this.hashFile(assetFilePath);
            hashList.push(hValue);
        }
        return hashList;
    }

    async searchDir(dirPath:string) {
        let dirs = await fs.promises.readdir(dirPath);
        if (dirs.includes(this.fileName)) {
            const assetPath = path.resolve(dirPath, this.fileName);
            this.dirPathList.push(assetPath); 
        }
        for (const dir of dirs){
            const fileResolvedPath = path.resolve(dirPath, dir);
            const fileStat = await fs.promises.stat(fileResolvedPath);
            if (fileStat.isDirectory())
            {
                await this.searchDir(fileResolvedPath);
            }
        }
    }

    async hashFile(packagePath: string): Promise<string> {
        const hash = crypto.createHash('sha1');
        const fileData = await fs.promises.readFile(packagePath);
        hash.update(fileData.toString());
        const hashValue = hash.digest('base64');
        return hashValue;
    }

    async hashMatch(hashValues: string[]): Promise<IDependencyRecord> {
        const previousPackageHashesPath = path.resolve(this.rootPath, this.outputFile);
        const previousPackageHashes = await fs.promises.readFile(previousPackageHashesPath).catch(err => {return '[]';});
        const oldHashValues = JSON.parse(previousPackageHashes.toString());

        // Sort both arrays for consistent comparison
        const sortedNewHashes = [...hashValues].sort();
        const sortedOldHashes = [...oldHashValues].sort();

        // Check if arrays have same length and all elements match
        let hashMatch = sortedNewHashes.length === sortedOldHashes.length;
        if (hashMatch) {
            for (let i = 0; i < sortedNewHashes.length; i++) {
                if (sortedNewHashes[i] !== sortedOldHashes[i]) {
                    hashMatch = false;
                    break;
                }
            }
        }

        const newHashData = JSON.stringify(hashValues);
        await this.writeFile(previousPackageHashesPath, newHashData);
        const depRecord: IDependencyRecord = {
            hashRecordPath: previousPackageHashesPath,
            dependenciesChanged: !hashMatch
        }
        return depRecord;
    }

    async writeFile(pth:string, dt:string) {
        await fs.promises.writeFile(pth, dt).then(() => console.log(`file written to ${pth}`)).catch(err => console.log(err))
    }

}