import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output, argv } from 'node:process';
import { createHash } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import fs from 'node:fs';
import os from 'node:os';
import zlib from 'node:zlib';

function color(str, color, bold) {
  const Reset = "\x1b[0m"
  const Bright = "\x1b[1m"
  const Dim = "\x1b[2m"
  const Underscore = "\x1b[4m"
  const Blink = "\x1b[5m"
  const Reverse = "\x1b[7m"
  const Hidden = "\x1b[8m"

  const FgBlack = "\x1b[30m"
  const FgRed = "\x1b[31m"
  const FgGreen = "\x1b[32m"
  const FgYellow = "\x1b[33m"
  const FgBlue = "\x1b[34m"
  const FgMagenta = "\x1b[35m"
  const FgCyan = "\x1b[36m"
  const FgWhite = "\x1b[37m"
  const FgGray = "\x1b[90m"

  const BgBlack = "\x1b[40m"
  const BgRed = "\x1b[41m"
  const BgGreen = "\x1b[42m"
  const BgYellow = "\x1b[43m"
  const BgBlue = "\x1b[44m"
  const BgMagenta = "\x1b[45m"
  const BgCyan = "\x1b[46m"
  const BgWhite = "\x1b[47m"
  const BgGray = "\x1b[100m"

  const res = (c) => `${c}${bold ? Bright : ''}${str}${Reset}`;

  switch(color) {
    case 'Bright': return res(Bright);
    case 'Dim' : return res(Dim);
    case 'Underscore' : return res(Underscore);
    case 'Blink' : return res(Blink);
    case 'Reverse' : return res(Reverse);
    case 'Hidden' : return res(Hidden);

    case 'FgBlack' : return res(FgBlack, bold);
    case 'FgRed' : return res(FgRed, bold);
    case 'FgGreen' : return res(FgGreen, bold);
    case 'FgYellow' : return res(FgYellow, bold);
    case 'FgBlue' : return res(FgBlue, bold);
    case 'FgMagenta' : return res(FgMagenta, bold);
    case 'FgCyan' : return res(FgCyan, bold);
    case 'FgWhite' : return res(FgWhite, bold);
    case 'FgGray' : return res(FgGray, bold);

    case 'BgBlack' : return res(BgBlack, bold);
    case 'BgRed' : return res(BgRed, bold);
    case 'BgGreen' : return res(BgGreen, bold);
    case 'BgYellow' : return res(BgYellow, bold);
    case 'BgBlue' : return res(BgBlue, bold);
    case 'BgMagenta' : return res(BgMagenta, bold);
    case 'BgCyan' : return res(BgCyan, bold);
    case 'BgWhite' : return res(BgWhite, bold);
    case 'BgGray' : return res(BgGray, bold);
  }
  return str;
}

let currentDir = os.homedir();
const sp = (process.platform === 'win32') ? '\\' : '/';


async function ls(dir = currentDir) {
  const fulldir = (dir === currentDir || !dir) ? dir : getFullDir(dir);
  if(fulldir === null) return;
  const content = await readdir(fulldir, { withFileTypes: true })
  const maxLength = Math.max(...content.map(x => x.name.length));

  const directories = content.filter(x => x.isDirectory())
  const files = content.filter(x => !x.isDirectory())

  const showInConsole = (files) => {
    for(const file of files) {
      const isDir = file.isDirectory();

      const gap = ' '.repeat(maxLength - file.name.length);
      const fileName = (isDir ?
                        color(file.name, 'FgGreen', true) :
                        color(file.name, 'FgGray', false)) + gap;

      const Dir = isDir ? color(`dir${sp}`, 'FgBlue') : color('file', 'FgGray');
      console.log(fileName, Dir);
    }
  }

  showInConsole(directories)
  showInConsole(files)
  console.log(`You are now on ${currentDir}`)
}

function getFullDir(dir) {
  const dirtree = currentDir.split(sp);
  const path = dir.split(sp);

  while(path[path.length - 1] === '') path.pop();

  let pathExists = true;
  for(let i of path) {
    const possibleDir = dirtree.join(sp) + `${sp}${i}`
    if(i === '..') dirtree.pop();
    else if(i === '.') continue;
    else if(fs.existsSync(possibleDir)) {
      if(fs.statSync(possibleDir).isFile()) {
        console.log(`"${possibleDir}" is a file`);
        pathExists = false;
        break;
      } else dirtree.push(i);
    } else {
      console.log(`"${dirtree.join(sp)}${sp}${i}" no such file or directory`);
      console.log('Invalid Input');
      pathExists = false;
      break;
    }
  }

  if(pathExists) return dirtree.join(sp);
  else return null;
}

function getFullPath(filepath) {
  const lastIndex = filepath.lastIndexOf(sp)

  const fulldir = (lastIndex !== -1) ? getFullDir(filepath.slice(0, lastIndex)) : currentDir;

  if(fulldir === null) {
    console.log(`"${fulldir}" no such path`);
    console.log('Invalid Input');
    return null;
  }

  const fullpath = (lastIndex !== -1) ?
        fulldir + `${sp}${filepath.slice(lastIndex)}` :
        fulldir + `${sp}${filepath}`;

  return fullpath;
}

function cd(dir) {
  const finalPath = getFullDir(dir);
  if(finalPath) currentDir = finalPath;
}

async function cat(filepath) {
  const fullpath = getFullPath(filepath);
  if(fullpath === null) return;

  if(!fs.statSync(fullpath).isFile()) {
    console.log(`"${fullpath}" is not a file`);
    console.log('Invalid Input');
    return;
  }

  const file = fs.createReadStream(fullpath);
  file.setEncoding('utf8');
  for await(const chunk of file) console.log(chunk);
}

function add(filename) {
  if(filename.indexOf(sp) !== -1) {
    console.log('filename cannot include slashes');
    console.log('Invalid Input');
    return;
  }
  fs.writeFile(currentDir + `${sp}${filename}`, '', ()=>{});
}

function rn(old_filename, new_filename) {
  const fullpath = getFullPath(old_filename);
  const fulldir = fullpath.slice(0, fullpath.lastIndexOf(sp));
  fs.rename(fullpath, `${fulldir}${sp}${new_filename}`, () => {});
}

function rm(filepath) {
  const fullpath = getFullPath(filepath);
  if(fullpath === null) return;
  fs.unlink(fullpath, () => {});
}

async function cp(filepath, newdir) {
  const fullpath = getFullPath(filepath);
  if(fullpath === null) return;

  const fulldir = getFullDir(newdir);
  if(fulldir === null) return;

  const filename = fullpath.slice(fullpath.lastIndexOf(sp));

  const file = fs.createReadStream(fullpath);
  file.setEncoding('utf8');

  const newfullpath = `${fulldir}${sp}${filename}`;
  fs.writeFile(newfullpath, '', () => {});
  const newfile = fs.createWriteStream(newfullpath)

  for await(const chunk of file) newfile.write(chunk);
}

async function mv(filepath, newdir) {
  await cp(filepath, newdir);
  rm(filepath);
}

function osInfo(option) {
  switch (option) {
    case '--EOL': console.log(os.EOL); break;
    case '--cpus': console.log(os.cpus()); break;
    case '--homedir': console.log(os.homedir()); break;
    case '--username': console.log(os.userInfo().username); break;
    case '--architecture': console.log(os.arch()); break;
    default:
      condole.log(`"${option}" no such option`);
      conosle.log('Invalid input');
      break;
  }
}

async function hash(filepath) {
  const fullpath = getFullPath(filepath)
  if(fullpath === null) return;

  const hsh = createHash('sha256');
  const file = fs.createReadStream(fullpath);
  for await(const chunk of file) hsh.update(chunk);
  console.log(hsh.digest('hex'));
}

function compress(filepath, destination) {
  const fullpath = getFullPath(filepath);
  const fulldest = getFullDir(destination);
  if(fullpath === null || fulldest === null) return;

  const compression = zlib.createBrotliCompress();
  const file = fs.createReadStream(fullpath);

  const filename = filepath.indexOf(sp) !== -1 ?
        fullpath.slice(fullpath.lastIndexOf(sp)) :
        filepath;

  const result = fs.createWriteStream(fulldest + sp + filename + '.br');

  file.pipe(compression).pipe(result);
}

function decompress(filepath, destination) {
  if(filepath.slice(-3) !== '.br') {
    console.log('file does not exist, is a directory or is not brotli compressed');
    console.log('a brotli compressed file should have a ".br" file extension');
    console.log('Invalid input');
    return;
  }

  const fullpath = getFullPath(filepath);
  const fulldest = getFullDir(destination);
  if(fullpath === null || fulldest === null) return;

  const file = fs.createReadStream(fullpath);
  const decompression = zlib.createBrotliDecompress();
  const lastIndex = filepath.lastIndexOf(sp);

  const filename = lastIndex !== -1 ?
        filepath.slice(lastIndex, filepath.length - 3) :
        filepath.slice(0, filepath.length - 3);

  const result = fs.createWriteStream(fulldest + sp + filename);
  file.pipe(decompression).pipe(result);
}

async function main() {
  const rl = readline.createInterface({ input, output });
  const userName = argv[2].slice(11)

  console.log(`Welcome to the File Manager ${userName}`)

  let userInput = ''
  while(userInput !== 'exit') {
    const r = (text) => color(text, 'FgRed', true);
    const w = (text) => color(text, 'FgWhite', true);
    const g = (text) => color(text, 'FgGreen', true);
    userInput = await rl.question(
      `| ${color(currentDir, 'FgYellow', true)} |\n| ${g(os.userInfo().username)} | ${r(os.hostname)} |: `
    );
    const cmd = userInput.split(' ');
    switch (cmd[0]) {
      case 'exit': break;
      case 'clear': console.clear(); break;
      case 'ls': await ls(cmd[1]); break;
      case 'cd': cd(cmd[1]); break;
      case 'up': cd(`..${sp}`); break;
      case 'cat': await cat(cmd[1]); break;
      case 'add': add(cmd[1]); break;
      case 'rm': rm(cmd[1]); break;
      case 'rn': rn(cmd[1], cmd[2]); break;
      case 'cp': await cp(cmd[1], cmd[2]); break;
      case 'mv': await mv(cmd[1], cmd[2]); break;
      case 'os': osInfo(cmd[1]); break;
      case 'hash': await hash(cmd[1]); break;
      case 'compress': compress(cmd[1], cmd[2]); break;
      case 'decompress': decompress(cmd[1], cmd[2]); break;
      default:
        console.log(`"${cmd[0]}" command not found`);
        console.log('Invalid input');
        break;
    }
  }

  const goodbye = () => {
    console.log(`Thank you for using File Manager, ${userName}, goodbye!`);
  }
  process.on('exit', goodbye);
  process.on('SIGINT', goodbye);

  rl.close()
} main()
